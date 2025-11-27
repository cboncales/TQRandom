<script setup>
import { ref, watch } from 'vue';
import { uploadApi } from '@/services/api';
import { useTestStore } from '@/stores/testStore';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  testId: {
    type: Number,
    required: true,
  },
});

const emit = defineEmits(['close', 'upload-complete', 'images-extracted']);

const testStore = useTestStore();
const selectedFile = ref(null);
const isUploadingFile = ref(false);
const uploadProgress = ref(0);
const answerKeyText = ref('');

// Reset form when modal opens/closes
watch(() => props.isOpen, (isOpen) => {
  if (!isOpen) {
    selectedFile.value = null;
    answerKeyText.value = '';
    uploadProgress.value = 0;
  }
});

const handleFileSelect = (event) => {
  const file = event.target.files[0];
  if (file) {
    selectedFile.value = file;
  }
};

/**
 * Parse answer key text into a map of question number to answer letter
 * Format: "1. A" or "1) A" or "1 A"
 */
const parseAnswerKey = (text) => {
  const answerMap = {};
  if (!text || !text.trim()) {
    return answerMap;
  }

  const lines = text.split('\n');
  const pattern = /^(\d+)[\.\):\s]+([A-H])\s*$/i;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const match = trimmed.match(pattern);
    if (match) {
      const questionNumber = parseInt(match[1]);
      const answerLetter = match[2].toUpperCase();
      answerMap[questionNumber] = answerLetter;
    }
  }

  return answerMap;
};

const handleFileUpload = async () => {
  if (!selectedFile.value) {
    return;
  }

  isUploadingFile.value = true;
  uploadProgress.value = 0;

  try {
    // Parse answer key if provided
    const answerKeyMap = parseAnswerKey(answerKeyText.value);

    // Upload and parse the document
    const result = await uploadApi.uploadDocument(selectedFile.value);

    if (result.error) {
      alert(`Upload failed: ${result.error}`);
      isUploadingFile.value = false;
      return;
    }

    const parsedQuestions = result.data.data;
    const stats = result.data.stats;

    // Check if images were extracted
    if (stats.total_images > 0) {
      // Emit event with parsed data and images for image assignment modal
      emit('images-extracted', {
        questions: parsedQuestions,
        images: result.data.images || [],
        answerKeyMap: answerKeyMap,
      });
      emit('close');
      return;
    }

    // No images - proceed with normal upload
    let successCount = 0;
    let failCount = 0;
    let answerSetCount = 0;
    const createdQuestions = [];

    // PHASE 1: Create all questions (0-60% progress)
    for (let i = 0; i < parsedQuestions.length; i++) {
      uploadProgress.value = Math.round(
        ((i + 1) / parsedQuestions.length) * 60
      );

      const parsed = parsedQuestions[i];
      const questionNumber = i + 1;

      // Convert answer_choices array to the format expected by createQuestion
      const answerChoices = parsed.answer_choices.map((choice) => ({
        text: typeof choice === 'string' ? choice : choice.text,
        imageUrl: typeof choice === 'object' ? choice.image?.url : null,
      }));

      // Extract question image URL if present
      const questionImageUrl = parsed.question_image?.url || null;

      // Create the question (with optional image)
      const createResult = await testStore.createQuestion(
        props.testId,
        parsed.question_text,
        answerChoices,
        questionImageUrl
      );

      if (createResult.error) {
        console.error(
          `Failed to create question ${questionNumber}:`,
          createResult.error
        );
        failCount++;
      } else {
        successCount++;
        createdQuestions.push({
          questionId: createResult.data.id,
          questionNumber: questionNumber,
          correctAnswerLetter: answerKeyMap[questionNumber],
        });
      }
    }

    // PHASE 2: Set correct answers (60-100% progress)
    if (createdQuestions.length > 0 && Object.keys(answerKeyMap).length > 0) {
      uploadProgress.value = 65;

      // Fetch all questions once
      const questionsResult = await testStore.getTestQuestions(props.testId, true);

      if (questionsResult.data) {
        for (let i = 0; i < createdQuestions.length; i++) {
          uploadProgress.value = Math.round(
            65 + ((i + 1) / createdQuestions.length) * 35
          );

          const { questionId, questionNumber, correctAnswerLetter } =
            createdQuestions[i];

          if (correctAnswerLetter) {
            const createdQuestion = questionsResult.data.find(
              (q) => q.id === questionId
            );

            if (createdQuestion && createdQuestion.answer_choices) {
              const choiceIndex =
                correctAnswerLetter.charCodeAt(0) - 'A'.charCodeAt(0);
              const correctChoice = createdQuestion.answer_choices[choiceIndex];

              if (correctChoice) {
                const answerResult = await testStore.storeCorrectAnswer(
                  questionId,
                  correctChoice.id,
                  props.testId
                );
                if (!answerResult.error) {
                  answerSetCount++;
                  console.log(
                    `Set correct answer for Q${questionNumber}: ${correctAnswerLetter}`
                  );
                }
              }
            }
          }
        }
      }
    }

    // Emit upload complete event
    emit('upload-complete', {
      successCount,
      failCount,
      answerSetCount,
    });
    emit('close');

    // Show summary
    let message = `Upload complete!\n\nSuccessfully added: ${successCount} questions`;
    if (failCount > 0) {
      message += `\nFailed: ${failCount} questions`;
    }
    if (answerSetCount > 0) {
      message += `\nCorrect answers set: ${answerSetCount}`;
    }
    alert(message);
  } catch (error) {
    console.error('Upload error:', error);
    alert(`An error occurred during upload: ${error.message}`);
  } finally {
    isUploadingFile.value = false;
    uploadProgress.value = 0;
  }
};

const closeModal = () => {
  if (!isUploadingFile.value) {
    emit('close');
  }
};
</script>

<template>
  <!-- Upload Document Modal -->
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
    aria-labelledby="modal-title"
    role="dialog"
    aria-modal="true"
  >
    <!-- Background overlay -->
    <div
      class="fixed inset-0 bg-opacity-95 backdrop-blur-sm transition-opacity"
      aria-hidden="true"
      @click="closeModal"
    ></div>

    <!-- Modal content -->
    <div
      class="relative z-10 bg-white dark:bg-gray-900 border border-gray-400 dark:border-gray-700 rounded-lg w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto"
      data-aos="fade-up"
      data-aos-delay="300"
    >
      <!-- Close button -->
      <button
        type="button"
        @click="closeModal"
        :disabled="isUploadingFile"
        class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      <!-- Modal inner content with padding -->
      <div class="px-4 pt-5 pb-4 sm:p-6">
        <div>
          <div
            class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100"
          >
            <svg
              class="h-6 w-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          <div class="mt-3 text-center sm:mt-5">
            <h3
              class="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100"
              id="modal-title"
            >
              Upload Document
            </h3>
            <div class="mt-2 space-y-3">
              <p class="text-sm text-gray-500 dark:text-gray-100">
                Upload a PDF or Word document to extract questions
                automatically.
              </p>

              <!-- Format Instructions -->
              <div
                class="bg-gray-50 border border-gray-200 dark:bg-gray-900 dark:border-gray-700 rounded-md p-4 text-left"
              >
                <p class="text-sm font-semibold text-green-800 dark:text-green-100 mb-2">
                  Required Format:
                </p>
                <div class="space-y-2 text-xs text-green-700 dark:text-green-100">
                  <div>
                    <p class="font-medium mb-1">
                      Questions must be numbered:
                    </p>
                    <div
                      class="bg-white dark:bg-gray-800 rounded px-3 py-2 font-mono text-gray-700 dark:text-gray-100"
                    >
                      1. What is the capital of France?<br />
                      2. What is 2 + 2?
                    </div>
                  </div>
                  <div>
                    <p class="font-medium mb-1">
                      Answer choices must use letters:
                    </p>
                    <div
                      class="bg-white dark:bg-gray-800 rounded px-3 py-2 font-mono text-gray-700 dark:text-gray-100"
                    >
                      A. Paris<br />
                      B. London<br />
                      C. Berlin<br />
                      D. Madrid
                    </div>
                  </div>
                  <div class="bg-green-100 dark:bg-green-900 rounded px-3 py-2">
                    <p class="font-semibold">Tips:</p>
                    <ul class="mt-1 space-y-1 list-disc list-inside">
                      <li>Use <strong>1., 2., 3.</strong> for questions</li>
                      <li>
                        Use <strong>A., B., C., D.</strong> for answers
                      </li>
                      <li>
                        Images extraction for
                        <strong>Word files only</strong>
                      </li>
                    </ul>
                  </div>
                  <div
                    class="bg-yellow-50 border border-yellow-200 rounded px-3 py-2 mt-2"
                  >
                    <p class="text-xs text-yellow-800">
                      <strong>Note:</strong> PDF image extraction is
                      temporarily unavailable. Please use Word files (.doc,
                      .docx) for documents with images.
                    </p>
                  </div>
                </div>
              </div>

              <!-- File Types -->
              <div
                class="bg-blue-50 border border-blue-200 rounded-md p-3 text-left"
              >
                <p class="text-xs font-semibold text-blue-800 mb-1">
                  Supported Files:
                </p>
                <p class="text-xs text-blue-700">
                  <strong>PDF</strong> (.pdf) or
                  <strong>Word</strong> (.doc, .docx) - Max 10MB
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-5">
          <!-- File Upload Area -->
          <div
            class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
          >
            <input
              type="file"
              @change="handleFileSelect"
              accept=".pdf,.doc,.docx"
              class="hidden"
              id="fileInput"
            />
            <label for="fileInput" class="cursor-pointer">
              <svg
                class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-100"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <div class="mt-2">
                <span
                  class="text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  Click to upload
                </span>
                <span class="text-sm text-gray-500 dark:text-gray-100"> or drag and drop</span>
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-100 mt-1">
                PDF, DOC, DOCX up to 10MB
              </p>
            </label>
          </div>

          <!-- Selected File Display -->
          <div v-if="selectedFile" class="mt-4 p-3 bg-gray-50 rounded-md">
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <svg
                  class="h-5 w-5 text-gray-400 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span class="text-sm text-gray-900">{{
                  selectedFile.name
                }}</span>
              </div>
              <button
                @click="selectedFile = null"
                class="text-red-600 hover:text-red-700"
              >
                <svg
                  class="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clip-rule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>

          <!-- Answer Key Input -->
          <div class="mt-5">
            <label
              for="answerKey"
              class="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-2"
            >
              Answer Key (Optional)
              <span class="text-xs font-normal text-gray-500 dark:text-gray-100 ml-1">
                - Paste answer key to automatically set correct answers
              </span>
            </label>
            <textarea
              id="answerKey"
              v-model="answerKeyText"
              rows="6"
              placeholder="1. A&#10;2. C&#10;3. A&#10;4. C&#10;5. C&#10;..."
              class="block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 text-sm focus:border-green-500 focus:ring-green-500 font-mono"
              :disabled="isUploadingFile"
            ></textarea>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-100">
              <svg
                class="inline w-3 h-3 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clip-rule="evenodd"
                />
              </svg>
              Format: "1. A" or "1) A" (one per line). Letters A-H
              supported.
            </p>
          </div>
        </div>

        <!-- Upload Progress -->
        <div v-if="isUploadingFile" class="mt-5">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-100"
              >Processing...</span
            >
            <span class="text-sm font-medium text-gray-700 dark:text-gray-100"
              >{{ uploadProgress }}%</span
            >
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2.5">
            <div
              class="bg-green-600 h-2.5 rounded-full transition-all duration-300"
              :style="{ width: uploadProgress + '%' }"
            ></div>
          </div>
          <p class="mt-2 text-xs text-gray-500 dark:text-gray-100 text-center">
            Uploading and adding questions to your test...
          </p>
        </div>

        <div
          class="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense"
        >
          <button
            type="button"
            @click="handleFileUpload"
            :disabled="!selectedFile || isUploadingFile"
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:col-start-2 sm:text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <svg
              v-if="isUploadingFile"
              class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            {{ isUploadingFile ? 'Processing...' : 'Upload & Extract' }}
          </button>
          <button
            type="button"
            @click="closeModal"
            :disabled="isUploadingFile"
            class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom scrollbar for modal content */
.overflow-y-auto {
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
}

.overflow-y-auto::-webkit-scrollbar {
  width: 8px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 4px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.7);
}
</style>
