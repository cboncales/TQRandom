<script setup>
import { ref, watch } from 'vue';
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
  pendingQuestions: {
    type: Array,
    default: () => [],
  },
  extractedImages: {
    type: Array,
    default: () => [],
  },
  answerKeyMap: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(['close', 'save-complete']);

const testStore = useTestStore();
const imageAssignments = ref({}); // { questionIndex: imageUrl }
const answerChoiceImageAssignments = ref({}); // { `${questionIndex}-${choiceIndex}`: imageUrl }
const imageAssignmentTab = ref('questions'); // 'questions' or 'answerChoices'
const isUploadingFile = ref(false);
const uploadProgress = ref(0);

// Initialize assignments from already-assigned images when modal opens
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    imageAssignments.value = {};
    answerChoiceImageAssignments.value = {};
    imageAssignmentTab.value = 'questions';

    // Initialize assignments from already-assigned images
    props.pendingQuestions.forEach((q, idx) => {
      if (q.question_image?.url) {
        imageAssignments.value[idx] = q.question_image.url;
      }
    });
  }
});

// Image assignment functions
const assignImageToQuestion = (questionIndex, imageUrl) => {
  if (imageAssignments.value[questionIndex] === imageUrl) {
    // Unassign if clicking the same image
    delete imageAssignments.value[questionIndex];
  } else {
    imageAssignments.value[questionIndex] = imageUrl;
  }
};

const getAssignedImage = (questionIndex) => {
  return imageAssignments.value[questionIndex] || null;
};

const clearAssignment = (questionIndex) => {
  delete imageAssignments.value[questionIndex];
};

// Answer choice image assignment functions
const assignImageToAnswerChoice = (questionIndex, choiceIndex, imageUrl) => {
  const key = `${questionIndex}-${choiceIndex}`;
  if (answerChoiceImageAssignments.value[key] === imageUrl) {
    // Unassign if clicking the same image
    delete answerChoiceImageAssignments.value[key];
  } else {
    answerChoiceImageAssignments.value[key] = imageUrl;
  }
};

const getAssignedAnswerChoiceImage = (questionIndex, choiceIndex) => {
  const key = `${questionIndex}-${choiceIndex}`;
  return answerChoiceImageAssignments.value[key] || null;
};

const clearAnswerChoiceAssignment = (questionIndex, choiceIndex) => {
  const key = `${questionIndex}-${choiceIndex}`;
  delete answerChoiceImageAssignments.value[key];
};

const closeModal = () => {
  if (!isUploadingFile.value) {
    emit('close');
  }
};

const saveQuestionsWithImages = async () => {
  isUploadingFile.value = true;
  uploadProgress.value = 0;

  try {
    const answerKeyMap = props.answerKeyMap;

    let successCount = 0;
    let failCount = 0;
    let answerSetCount = 0;
    const createdQuestions = [];

    // PHASE 1: Create all questions (0-60% progress)
    for (let i = 0; i < props.pendingQuestions.length; i++) {
      uploadProgress.value = Math.round(
        ((i + 1) / props.pendingQuestions.length) * 60
      );

      const parsed = props.pendingQuestions[i];
      const questionNumber = i + 1;

      // Get manually assigned image or use auto-assigned
      const assignedImageUrl =
        imageAssignments.value[i] || parsed.question_image?.url || null;

      // Convert answer_choices with manually assigned images
      const answerChoices = parsed.answer_choices.map((choice, choiceIdx) => {
        // Check for manually assigned answer choice image
        const manuallyAssignedImage = getAssignedAnswerChoiceImage(
          i,
          choiceIdx
        );

        return {
          text: typeof choice === 'string' ? choice : choice.text,
          imageUrl:
            manuallyAssignedImage ||
            (typeof choice === 'object' ? choice.image?.url : null),
        };
      });

      // Create the question with assigned image
      const createResult = await testStore.createQuestion(
        props.testId,
        parsed.question_text,
        answerChoices,
        assignedImageUrl
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
                }
              }
            }
          }
        }
      }
    }

    // Emit save complete event
    emit('save-complete', {
      successCount,
      failCount,
      answerSetCount,
    });
    emit('close');

    // Show summary
    let message = `Upload complete!\n\n`;
    message += `Questions created: ${successCount}\n`;
    if (failCount > 0) message += `Failed: ${failCount}\n`;
    if (answerSetCount > 0) message += `Correct answers set: ${answerSetCount}`;

    alert(message);
  } catch (error) {
    console.error('Error saving questions:', error);
    alert(`Error: ${error.message}`);
  } finally {
    isUploadingFile.value = false;
    uploadProgress.value = 0;
  }
};
</script>

<template>
  <!-- Image Assignment Modal -->
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-opacity-95 backdrop-blur-sm z-50 h-full w-full overflow-y-auto"
    aria-labelledby="modal-title"
    role="dialog"
    aria-modal="true"
  >
    <div class="flex items-center justify-center min-h-screen p-4">
      <div
        class="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        <!-- Header -->
        <div
          class="px-6 py-4 border-gray-400 flex justify-between items-center bg-linear-to-r from-blue-600 dark:from-blue-900 to-blue-700 dark:to-blue-900 shrink-0"
        >
          <div>
            <h3
              class="text-md md:text-xl lg:text-xl font-semibold text-white dark:text-gray-100"
            >
              Assign Images to Questions
            </h3>
            <p class="text-xs md:text-sm lg:text-sm text-blue-100 dark:text-blue-100 mt-1">
              Click on an image to assign it to a question. Click again to
              unassign.
            </p>
          </div>
          <button
            @click="closeModal"
            class="text-white hover:text-gray-200 transition-colors"
          >
            <svg
              class="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-6">
          <!-- Extracted Images -->
          <div class="mb-6">
            <h4
              class="text-md md:text-lg lg:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3"
            >
              Extracted Images ({{ extractedImages.length }})
            </h4>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div
                v-for="(image, idx) in extractedImages"
                :key="idx"
                class="border-2 rounded-lg p-2 hover:shadow-md transition-shadow"
                :class="
                  Object.values(imageAssignments).includes(image.url) ||
                  Object.values(answerChoiceImageAssignments).includes(
                    image.url
                  )
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300'
                "
              >
                <img
                  :src="image.url"
                  :alt="`Image ${idx + 1}`"
                  class="w-full h-32 object-contain rounded"
                />
                <p class="text-xs text-center mt-1 text-gray-600 dark:text-gray-100">
                  Image {{ idx + 1 }}
                  <span
                    v-if="
                      Object.values(imageAssignments).includes(image.url) ||
                      Object.values(answerChoiceImageAssignments).includes(
                        image.url
                      )
                    "
                    class="text-green-600 font-semibold"
                  >
                    ✓ Assigned
                  </span>
                </p>
              </div>
            </div>
          </div>

          <!-- Tabs -->
          <div class="mb-6 border-gray-200">
            <nav class="-mb-px flex space-x-8">
              <button
                @click="imageAssignmentTab = 'questions'"
                class="border-b-2 py-3 px-1 text-sm font-medium transition-colors"
                :class="
                  imageAssignmentTab === 'questions'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 dark:text-gray-100 hover:text-gray-700 hover:border-gray-300'
                "
              >
                Questions
              </button>
              <button
                @click="imageAssignmentTab = 'answerChoices'"
                class="border-b-2 py-3 px-1 text-sm font-medium transition-colors"
                :class="
                  imageAssignmentTab === 'answerChoices'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 dark:text-gray-100 hover:text-gray-700 hover:border-gray-300'
                "
              >
                Answer Choices
              </button>
            </nav>
          </div>

          <!-- Questions Tab Content -->
          <div v-if="imageAssignmentTab === 'questions'">
            <h4
              class="text-md md:text-lg lg:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3"
            >
              Assign Images to Questions ({{ pendingQuestions.length }})
            </h4>
            <div class="space-y-4">
              <div
                v-for="(question, qIdx) in pendingQuestions"
                :key="qIdx"
                class="border border-gray-300 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900 hover:shadow-md transition-shadow"
              >
                <div class="flex items-start gap-4">
                  <!-- Question Number -->
                  <div class="shrink-0">
                    <span
                      class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-semibold text-sm"
                    >
                      {{ qIdx + 1 }}
                    </span>
                  </div>

                  <!-- Question Text -->
                  <div class="flex-1">
                    <p class="text-gray-900 dark:text-gray-100 font-medium">
                      {{ question.question_text.substring(0, 100)
                      }}{{
                        question.question_text.length > 100 ? '...' : ''
                      }}
                    </p>

                    <!-- Assigned Image Preview -->
                    <div v-if="getAssignedImage(qIdx)" class="mt-3">
                      <div class="relative inline-block">
                        <img
                          :src="getAssignedImage(qIdx)"
                          alt="Assigned image"
                          class="h-24 w-auto rounded border-2 border-green-500"
                        />
                        <button
                          @click="clearAssignment(qIdx)"
                          class="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                        >
                          <svg
                            class="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <!-- Image Selector -->
                    <div class="mt-3">
                      <label
                        class="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-2"
                      >
                        Select image:
                      </label>
                      <div class="flex flex-wrap gap-2">
                        <button
                          v-for="(image, imgIdx) in extractedImages"
                          :key="imgIdx"
                          @click="assignImageToQuestion(qIdx, image.url)"
                          class="relative border-2 rounded p-1 hover:shadow-md transition-all"
                          :class="
                            getAssignedImage(qIdx) === image.url
                              ? 'border-green-500 bg-green-50 ring-2 ring-green-500'
                              : 'border-gray-300 hover:border-blue-400'
                          "
                        >
                          <img
                            :src="image.url"
                            :alt="`Image ${imgIdx + 1}`"
                            class="h-16 w-auto rounded"
                          />
                          <span
                            v-if="getAssignedImage(qIdx) === image.url"
                            class="absolute -top-1 -right-1 bg-green-500 text-white rounded-full p-0.5"
                          >
                            <svg
                              class="w-3 h-3"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fill-rule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clip-rule="evenodd"
                              />
                            </svg>
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Answer Choices Tab Content -->
          <div v-if="imageAssignmentTab === 'answerChoices'">
            <h4
              class="text-md md:text-lg lg:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3"
            >
              Assign Images to Answer Choices
            </h4>
            <div class="space-y-6">
              <div
                v-for="(question, qIdx) in pendingQuestions"
                :key="qIdx"
                class="border border-gray-300 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900"
              >
                <!-- Question Header -->
                <div
                  class="flex items-start gap-3 mb-4 pb-3 border-gray-200"
                >
                  <span
                    class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-semibold text-sm shrink-0"
                  >
                    {{ qIdx + 1 }}
                  </span>
                  <p class="text-gray-900 dark:text-gray-100 font-medium text-sm">
                    {{ question.question_text.substring(0, 80)
                    }}{{ question.question_text.length > 80 ? '...' : '' }}
                  </p>
                </div>

                <!-- Answer Choices -->
                <div class="space-y-3">
                  <div
                    v-for="(choice, choiceIdx) in question.answer_choices"
                    :key="choiceIdx"
                    class="pl-4"
                  >
                    <div class="flex items-start gap-3">
                      <span
                        class="text-sm font-semibold text-gray-600 dark:text-gray-100 shrink-0 mt-1"
                      >
                        {{ String.fromCharCode(65 + choiceIdx) }}.
                      </span>
                      <div class="flex-1">
                        <p class="text-sm text-gray-800 dark:text-gray-100 mb-2">
                          {{
                            typeof choice === 'string'
                              ? choice
                              : choice.text
                          }}
                        </p>

                        <!-- Assigned Image Preview -->
                        <div
                          v-if="
                            getAssignedAnswerChoiceImage(qIdx, choiceIdx)
                          "
                          class="mb-2"
                        >
                          <div class="relative inline-block">
                            <img
                              :src="
                                getAssignedAnswerChoiceImage(
                                  qIdx,
                                  choiceIdx
                                )
                              "
                              alt="Assigned choice image"
                              class="h-20 w-auto rounded border-2 border-green-500"
                            />
                            <button
                              @click="
                                clearAnswerChoiceAssignment(qIdx, choiceIdx)
                              "
                              class="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-0.5 hover:bg-red-700"
                            >
                              <svg
                                class="w-2.5 h-2.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  stroke-width="2"
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>

                        <!-- Image Selector -->
                        <div class="flex flex-wrap gap-2">
                          <button
                            v-for="(image, imgIdx) in extractedImages"
                            :key="imgIdx"
                            @click="
                              assignImageToAnswerChoice(
                                qIdx,
                                choiceIdx,
                                image.url
                              )
                            "
                            class="relative border-2 rounded p-1 hover:shadow-md transition-all"
                            :class="
                              getAssignedAnswerChoiceImage(
                                qIdx,
                                choiceIdx
                              ) === image.url
                                ? 'border-green-500 bg-green-50 ring-2 ring-green-500'
                                : 'border-gray-300 hover:border-blue-400'
                            "
                          >
                            <img
                              :src="image.url"
                              :alt="`Image ${imgIdx + 1}`"
                              class="h-14 w-auto rounded"
                            />
                            <span
                              v-if="
                                getAssignedAnswerChoiceImage(
                                  qIdx,
                                  choiceIdx
                                ) === image.url
                              "
                              class="absolute -top-1 -right-1 bg-green-500 text-white rounded-full p-0.5"
                            >
                              <svg
                                class="w-2.5 h-2.5"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fill-rule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clip-rule="evenodd"
                                />
                              </svg>
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div
          class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex flex-col md:flex-row md:justify-between md:items-center lg:flex-row lg:justify-between lg:items-center shrink-0"
        >
          <div class="text-sm text-gray-600 dark:text-gray-100 mb-3 md:mb-0 lg:mb-0">
            <span class="text-xs sm:font-medium">Questions:</span>
            {{ Object.keys(imageAssignments).length }}/{{
              pendingQuestions.length
            }}
            | <span class="text-xs sm:font-medium">Answer Choices:</span>
            {{ Object.keys(answerChoiceImageAssignments).length }}
          </div>
          <div class="flex gap-3">
            <button
              type="button"
              @click="closeModal"
              class="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-xs md:text-sm lg:text-sm font-medium text-gray-700 dark:text-gray-100 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="button"
              @click="saveQuestionsWithImages"
              :disabled="isUploadingFile"
              class="px-6 py-2 border border-transparent rounded-md shadow-sm text-xs md:text-sm lg:text-sm font-medium text-white dark:text-gray-100 bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed flex items-center"
            >
              <svg
                v-if="isUploadingFile"
                class="animate-spin -ml-1 mr-2 h-4 w-4 text-white dark:text-gray-100"
                xmlns="http://www.w3.org/2000/svg"
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
              {{
                isUploadingFile
                  ? `Saving... ${uploadProgress}%`
                  : 'Save All Questions'
              }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

