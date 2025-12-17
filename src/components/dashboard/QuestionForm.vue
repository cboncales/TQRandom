<script setup>
import { ref, watch } from "vue";
import { imageApi } from "@/services/api";
import { useMathRenderer } from "@/composables/useMathRenderer";

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  editingQuestion: {
    type: Object,
    default: null,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  testParts: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["close", "question-saved"]);

const errorMessage = ref("");
const isUploadingImage = ref(false);
const showDeleteOptionConfirm = ref(null);

// Initialize math renderer
const { renderMath } = useMathRenderer();

// Form data
const questionText = ref("");
const questionType = ref("Multiple Choice");
const questionPart = ref(null); // Now stores part number (1, 2, 3) instead of text
const questionImageUrl = ref(null);
const questionImageFile = ref(null);
const options = ref([
  { id: 1, text: "", isCorrect: false, imageUrl: null, imageFile: null },
  { id: 2, text: "", isCorrect: false, imageUrl: null, imageFile: null },
  { id: 3, text: "", isCorrect: false, imageUrl: null, imageFile: null },
  { id: 4, text: "", isCorrect: false, imageUrl: null, imageFile: null },
]);

// Predefined question types
const questionTypes = [
  "Multiple Choice",
  "True or False",
  "Identification",
  "Essay",
  "Fill in the Blank",
  "Problem Solving",
  "Enumeration"
];

// Initialize options based on question type
const initializeOptionsForType = (type) => {
  switch (type) {
    case "Multiple Choice":
      return [
        { id: 1, text: "", isCorrect: false, imageUrl: null, imageFile: null },
        { id: 2, text: "", isCorrect: false, imageUrl: null, imageFile: null },
        { id: 3, text: "", isCorrect: false, imageUrl: null, imageFile: null },
        { id: 4, text: "", isCorrect: false, imageUrl: null, imageFile: null },
      ];
    case "True or False":
      return [
        { id: 1, text: "True", isCorrect: false, imageUrl: null, imageFile: null },
        { id: 2, text: "False", isCorrect: false, imageUrl: null, imageFile: null },
      ];
    case "Identification":
    case "Fill in the Blank":
    case "Essay":
    case "Problem Solving":
    case "Enumeration":
      return [
        { id: 1, text: "", isCorrect: true, imageUrl: null, imageFile: null },
      ];
    case "Matching Type":
      return [
        { id: 1, text: "", isCorrect: false, matchAnswer: "", imageUrl: null, imageFile: null },
        { id: 2, text: "", isCorrect: false, matchAnswer: "", imageUrl: null, imageFile: null },
        { id: 3, text: "", isCorrect: false, matchAnswer: "", imageUrl: null, imageFile: null },
        { id: 4, text: "", isCorrect: false, matchAnswer: "", imageUrl: null, imageFile: null },
      ];
    default:
      return [
        { id: 1, text: "", isCorrect: false, imageUrl: null, imageFile: null },
        { id: 2, text: "", isCorrect: false, imageUrl: null, imageFile: null },
        { id: 3, text: "", isCorrect: false, imageUrl: null, imageFile: null },
        { id: 4, text: "", isCorrect: false, imageUrl: null, imageFile: null },
      ];
  }
};

// Reset form function
const resetForm = () => {
  questionText.value = "";
  questionType.value = "Multiple Choice";
  // Set default part: if test has parts, default to Part 1, otherwise null
  questionPart.value = (props.testParts && props.testParts.length > 0) ? 1 : null;
  questionImageUrl.value = null;
  questionImageFile.value = null;
  options.value = initializeOptionsForType("Multiple Choice");
  errorMessage.value = "";
};

// Watch for question type changes to adjust options
watch(questionType, (newType) => {
  // Only reset options if changing to a different type structure
  const currentStructure = options.value.length;
  const newStructure = initializeOptionsForType(newType).length;
  
  if (currentStructure !== newStructure) {
    options.value = initializeOptionsForType(newType);
  } else if (newType === "True or False") {
    // Special handling for True/False to ensure correct labels
    options.value = [
      { ...options.value[0], text: "True" },
      { ...options.value[1], text: "False" },
    ];
  }
});

// Watch for editing question changes
watch(
  () => props.editingQuestion,
  (newQuestion) => {
    if (newQuestion) {
      questionText.value = newQuestion.question;
      questionType.value = newQuestion.type || "Multiple Choice";
      questionPart.value = newQuestion.part || null; // Part is now integer or null
      questionImageUrl.value = newQuestion.imageUrl || null;
      options.value = newQuestion.options.map((opt) => {
        const mappedOption = {
          ...opt,
          imageUrl: opt.imageUrl || null,
          imageFile: null,
        };
        
        // Preserve matchAnswer for Matching Type
        if (newQuestion.type === "Matching Type") {
          mappedOption.matchAnswer = opt.matchAnswer || "";
        }
        
        return mappedOption;
      });
    } else {
      resetForm();
    }
  },
  { immediate: true }
);

// Watch for modal opening (when isOpen becomes true) to reset form for new questions
watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen && !props.editingQuestion) {
      // Modal opened for new question (not editing), reset the form
      resetForm();
    }
  }
);

const addOption = () => {
  const newId = Math.max(...options.value.map((o) => o.id)) + 1;
  const newOption = {
    id: newId,
    text: "",
    isCorrect: false,
    imageUrl: null,
    imageFile: null,
  };
  
  // Add matchAnswer field for Matching Type
  if (questionType.value === "Matching Type") {
    newOption.matchAnswer = "";
  }
  
  options.value.push(newOption);
};

const confirmRemoveOption = (optionId) => {
  showDeleteOptionConfirm.value = optionId;
};

const removeOption = (optionId) => {
  if (options.value.length > 2) {
    options.value = options.value.filter((option) => option.id !== optionId);
  }
  showDeleteOptionConfirm.value = null;
};

const cancelDeleteOption = () => {
  showDeleteOptionConfirm.value = null;
};

const toggleCorrectAnswer = (optionId) => {
  options.value = options.value.map((o) => ({
    ...o,
    isCorrect: o.id === optionId, // only this option becomes true
  }));
};


// Image handling functions
const handleQuestionImageUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    questionImageFile.value = file;
    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      questionImageUrl.value = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};

const removeQuestionImage = () => {
  questionImageUrl.value = null;
  questionImageFile.value = null;
};

const handleOptionImageUpload = (event, optionId) => {
  const file = event.target.files[0];
  if (file) {
    const option = options.value.find((o) => o.id === optionId);
    if (option) {
      option.imageFile = file;
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        option.imageUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }
};

const removeOptionImage = (optionId) => {
  const option = options.value.find((o) => o.id === optionId);
  if (option) {
    option.imageUrl = null;
    option.imageFile = null;
  }
};

const uploadImageToServer = async (file) => {
  if (!file) return null;

  const result = await imageApi.uploadImage(file);
  if (result.error) {
    throw new Error(result.error);
  }
  return result.data.imageUrl;
};

const handleSubmit = async () => {
  // Clear previous errors
  errorMessage.value = "";

  // Validation
  if (!questionText.value.trim()) {
    errorMessage.value = "Please enter a question";
    return;
  }

  const filledOptions = options.value.filter((opt) => opt.text.trim());
  
  // Validate options based on question type
  if (questionType.value === "Multiple Choice") {
    if (filledOptions.length < 2) {
      errorMessage.value = "Please provide at least 2 answer options for Multiple Choice questions";
      return;
    }
  } else if (questionType.value === "True or False") {
    if (filledOptions.length !== 2) {
      errorMessage.value = "True or False questions must have exactly 2 options";
      return;
    }
  } else if (["Identification", "Essay", "Fill in the Blank", "Problem Solving", "Enumeration"].includes(questionType.value)) {
    if (filledOptions.length < 1) {
      errorMessage.value = "Please provide an answer for this question type";
      return;
    }
  } else if (questionType.value === "Matching Type") {
    if (filledOptions.length < 2) {
      errorMessage.value = "Please provide at least 2 items";
      return;
    }
    // Check if all items have matchAnswer filled
    const hasEmptyMatch = filledOptions.some((opt) => !opt.matchAnswer || !opt.matchAnswer.trim());
    if (hasEmptyMatch) {
      errorMessage.value = "Please provide answers for all items in Column B";
      return;
    }
  }

  // Validate correct answers are marked (except for Matching Type)
  if (questionType.value !== "Matching Type") {
    const correctAnswers = filledOptions.filter((opt) => opt.isCorrect);
    if (correctAnswers.length === 0) {
      errorMessage.value = "Please mark at least one correct answer";
      return;
    }
  }

  try {
    isUploadingImage.value = true;

    // Upload question image if new file selected
    let uploadedQuestionImageUrl = questionImageUrl.value;
    if (questionImageFile.value) {
      uploadedQuestionImageUrl = await uploadImageToServer(
        questionImageFile.value
      );
    }

    // Upload option images if new files selected
    const processedOptions = await Promise.all(
      options.value
        .filter((opt) => opt.text.trim())
        .map(async (opt) => {
          let uploadedImageUrl = opt.imageUrl;

          // Only upload if there's a new file (not just an existing URL)
          if (opt.imageFile) {
            uploadedImageUrl = await uploadImageToServer(opt.imageFile);
          }

          const processedOption = {
            id: opt.id,
            text: opt.text,
            isCorrect: opt.isCorrect,
            imageUrl: uploadedImageUrl,
          };
          
          // Include matchAnswer for Matching Type
          if (questionType.value === "Matching Type") {
            processedOption.matchAnswer = opt.matchAnswer;
          }
          
          return processedOption;
        })
    );

    // Prepare question data
    const questionData = {
      question: questionText.value.trim(),
      type: questionType.value,
      part: questionPart.value, // Part is already an integer or null
      imageUrl: uploadedQuestionImageUrl,
      options: processedOptions,
    };

    emit("question-saved", questionData);
  } catch (error) {
    console.error("Error uploading images:", error);
    errorMessage.value = `Failed to upload images: ${error.message}`;
  } finally {
    isUploadingImage.value = false;
  }
};

const closeModal = () => {
  emit("close");
};

const hasCorrectAnswer = () => {
  return options.value.some((opt) => opt.isCorrect && opt.text.trim());
};
</script>

<template>
  <!-- Modal backdrop -->
  <div
    v-if="isOpen"
    class="fixed inset-0 g-opacity-95 backdrop-blur-sm overflow-hidden h-full w-full z-50 flex items-center justify-center p-4"
    @click="closeModal"
    data-aos="fade-up"
    data-aos-delay="300"
  >
    <!-- Modal content -->
    <div
      class="relative w-full max-w-2xl bg-white dark:bg-gray-900 border border-gray-400 dark:border-gray-700 rounded-lg shadow-lg flex flex-col max-h-[calc(100vh-2rem)]"
      @click.stop
    >
      <div class="overflow-y-auto flex-1 p-5">
        <!-- Header -->
        <div class="flex justify-between items-center mb-4 sm:mb-6">
          <h3 class="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100">
            {{ props.editingQuestion ? "Edit Question" : "Add New Question" }}
          </h3>
          <button
            @click="closeModal"
            :disabled="props.isLoading"
            class="text-gray-400 dark:text-gray-100 hover:text-gray-600 disabled:cursor-not-allowed"
          >
            <svg
              class="w-5 h-5 sm:w-6 sm:h-6"
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

        <!-- Error Message -->
        <div
          v-if="errorMessage"
          class="bg-red-50 border border-red-200 rounded-md p-3 sm:p-4 mb-4 sm:mb-6"
        >
          <div class="flex">
            <div class="shrink-0">
              <svg
                class="h-4 w-4 sm:h-5 sm:w-5 text-red-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-xs sm:text-sm text-red-800">{{ errorMessage }}</p>
            </div>
          </div>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="space-y-4 sm:space-y-6">
          <!-- Question Text -->
          <div>
            <label
              for="question-text"
              class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-100 mb-2"
            >
              Question Text *
            </label>
            <textarea
              id="question-text"
              v-model="questionText"
              rows="3"
              required
              :disabled="props.isLoading"
              class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
              placeholder="Enter your question here..."
            ></textarea>
          </div>

          <!-- Question Type and Part Row -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Question Type -->
            <div>
              <label
                for="question-type"
                class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-100 mb-2"
              >
                Question Type *
              </label>
              <select
                id="question-type"
                v-model="questionType"
                required
                :disabled="props.isLoading"
                class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
              >
                <option v-for="type in questionTypes" :key="type" :value="type" class="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                  {{ type }}
                </option>
              </select>
            </div>

            <!-- Question Part (Radio Buttons) - Only show if test has parts -->
            <div v-if="testParts && testParts.length > 0">
              <label
                class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-100 mb-3"
              >
                Assign to Part *
              </label>
              <div class="space-y-2">
                <!-- Option: Each Part -->
                <label
                  v-for="(partDesc, index) in testParts"
                  :key="index"
                  class="flex items-start cursor-pointer p-2 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  :class="questionPart === (index + 1) ? 'bg-blue-50 dark:bg-blue-900 border-blue-300 dark:border-blue-700' : 'border-gray-300 dark:border-gray-700'"
                >
                  <input
                    type="radio"
                    :value="index + 1"
                    v-model="questionPart"
                    :disabled="props.isLoading"
                    class="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span class="ml-3 text-sm text-gray-700 dark:text-gray-100">
                    <span class="font-medium">Part {{ index + 1 }}</span>
                    <span class="block text-xs text-gray-500 dark:text-gray-400">{{ partDesc }}</span>
                  </span>
                </label>
              </div>
            </div>
          </div>

          <!-- Question Image Upload -->
          <div>
            <label
              class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-100 mb-2"
            >
              Question Image (Optional)
            </label>
            <div v-if="questionImageUrl" class="mb-2 sm:mb-3">
              <div class="relative inline-block">
                <img
                  :src="questionImageUrl"
                  alt="Question preview"
                  class="max-w-full sm:max-w-md h-auto rounded-lg border border-gray-300"
                />
                <button
                  type="button"
                  @click="removeQuestionImage"
                  class="absolute top-1 right-1 sm:top-2 sm:right-2 bg-red-600 text-white dark:text-gray-100 rounded-full p-1 hover:bg-red-700"
                >
                  <svg
                    class="w-3 h-3 sm:w-4 sm:h-4"
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
            <input
              type="file"
              accept="image/*"
              @change="handleQuestionImageUpload"
              :disabled="props.isLoading || isUploadingImage"
              class="block w-full text-xs sm:text-sm text-gray-500 dark:text-gray-300 file:mr-2 sm:file:mr-4 file:py-1.5 sm:file:py-2 file:px-3 sm:file:px-4 file:rounded-md file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-300">PNG, JPG, GIF up to 5MB</p>
          </div>

          <!-- Multiple Choice Options -->
          <div v-if="questionType === 'Multiple Choice'">
            <div
              class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 mb-3 sm:mb-4"
            >
              <h4 class="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-100">
                Answer Options
              </h4>
              <button
                type="button"
                @click="addOption"
                class="bg-blue-600 text-white hover:bg-blue-700 px-2.5 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-medium transition-colors duration-200 flex items-center justify-center"
              >
                <svg
                  class="w-3 h-3 sm:w-4 sm:h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Add Option
              </button>
            </div>

            <div class="space-y-3 sm:space-y-4">
              <div
                v-for="(option, index) in options"
                :key="option.id"
                class="p-2 sm:p-3 border rounded-lg"
                :class="
                  option.isCorrect
                    ? 'bg-green-50 border-green-200 dark:bg-green-900 dark:border-green-700'
                    : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                "
              >
                <!-- Option Header with controls -->
                <div
                  class="flex flex-col sm:flex-row sm:items-center gap-2 mb-2"
                >
                  <div class="flex items-center gap-2 flex-1">
                    <!-- Option Letter -->
                    <span
                      class="shrink-0 h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs sm:text-sm font-medium"
                    >
                      {{ String.fromCharCode(65 + index) }}
                    </span>

                    <!-- Option Input -->
                    <input
                      v-model="option.text"
                      type="text"
                      class="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
                      :placeholder="`Option ${String.fromCharCode(65 + index)}`"
                    />
                  </div>

                  <div class="flex items-center gap-2 sm:gap-3 ml-8 sm:ml-0">
                    <!-- Correct Answer Checkbox -->
                    <label class="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        :checked="option.isCorrect"
                        @change="toggleCorrectAnswer(option.id)"
                        class="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <span
                        class="ml-1.5 sm:ml-2 text-xs sm:text-sm text-gray-700 dark:text-gray-100"
                        >Correct</span
                      >
                    </label>

                    <!-- Remove Button -->
                    <button
                      v-if="options.length > 2"
                      type="button"
                      @click="confirmRemoveOption(option.id)"
                      class="text-red-600 hover:text-red-800"
                    >
                      <svg
                        class="w-4 h-4 sm:w-5 sm:h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                <!-- Option Image Upload -->
                <div class="ml-8 sm:ml-11 mt-2">
                  <div v-if="option.imageUrl" class="mb-2">
                    <div class="relative inline-block">
                      <img
                        :src="option.imageUrl"
                        alt="Option preview"
                        class="max-w-full sm:max-w-xs h-auto rounded-md border border-gray-300"
                      />
                      <button
                        type="button"
                        @click="removeOptionImage(option.id)"
                        class="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
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
                  <input
                    type="file"
                    accept="image/*"
                    @change="(e) => handleOptionImageUpload(e, option.id)"
                    class="block w-full text-xs text-gray-500 dark:text-gray-300 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- True or False Options -->
          <div v-else-if="questionType === 'True or False'">
            <h4 class="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-100 mb-3 sm:mb-4">
              Correct Answer
            </h4>
            <div class="space-y-2">
              <label
                v-for="option in options"
                :key="option.id"
                class="flex items-center p-3 border rounded-lg cursor-pointer transition-colors"
                :class="
                  option.isCorrect
                    ? 'bg-green-50 border-green-200 dark:bg-green-900 dark:border-green-700'
                    : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                "
              >
                <input
                  type="radio"
                  :checked="option.isCorrect"
                  @change="toggleCorrectAnswer(option.id)"
                  class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                />
                <span class="ml-3 text-sm font-medium text-gray-700 dark:text-gray-100">
                  {{ option.text }}
                </span>
              </label>
            </div>
          </div>

          <!-- Identification Answer -->
          <div v-else-if="questionType === 'Identification'">
            <h4 class="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-100 mb-3 sm:mb-4">
              Correct Answer
            </h4>
            <input
              v-model="options[0].text"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              placeholder="Enter the correct answer"
            />
          </div>

          <!-- Fill in the Blank Answer -->
          <div v-else-if="questionType === 'Fill in the Blank'">
            <h4 class="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-100 mb-3 sm:mb-4">
              Correct Answer
            </h4>
            <input
              v-model="options[0].text"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              placeholder="Enter the correct answer to fill in the blank"
            />
          </div>

          <!-- Essay Answer -->
          <div v-else-if="questionType === 'Essay'">
            <h4 class="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-100 mb-3 sm:mb-4">
              Sample Answer / Key Points
            </h4>
            <textarea
              v-model="options[0].text"
              rows="4"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              placeholder="Enter sample answer or key points for grading"
            ></textarea>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Provide a sample answer or key points that should be included in the essay response.
            </p>
          </div>

          <!-- Problem Solving Answer -->
          <div v-else-if="questionType === 'Problem Solving'">
            <h4 class="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-100 mb-3 sm:mb-4">
              Solution / Answer Key
            </h4>
            <textarea
              v-model="options[0].text"
              rows="6"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 font-mono"
              placeholder="Enter the complete solution with steps and final answer"
            ></textarea>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Provide the step-by-step solution and final answer. Students will show their work on the test.
            </p>
          </div>

          <!-- Enumeration Answer -->
          <div v-else-if="questionType === 'Enumeration'">
            <h4 class="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-100 mb-3 sm:mb-4">
              Correct Answers (one per line)
            </h4>
            <textarea
              v-model="options[0].text"
              rows="5"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              placeholder="Enter each answer on a new line:&#10;Answer 1&#10;Answer 2&#10;Answer 3"
            ></textarea>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              List all acceptable answers, one per line. Students must enumerate these items.
            </p>
          </div>

          <!-- Matching Type -->
          <div v-else-if="questionType === 'Matching Type'">
            <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 mb-3 sm:mb-4">
              <h4 class="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-100">
                Column A (Questions) & Column B (Answers)
              </h4>
              <button
                type="button"
                @click="addOption"
                class="bg-blue-600 text-white hover:bg-blue-700 px-2.5 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-medium transition-colors duration-200 flex items-center justify-center"
              >
                <svg class="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Pair
              </button>
            </div>

            <div class="space-y-3 sm:space-y-4">
              <div v-for="(option, index) in options" :key="option.id" class="p-2 sm:p-3 border rounded-lg bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <!-- Column A (Question) -->
                  <div>
                    <label class="block text-xs font-medium text-gray-700 dark:text-gray-100 mb-1">
                      {{ index + 1 }}. Column A
                    </label>
                    <textarea
                      v-model="option.text"
                      rows="3"
                      class="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 resize-y"
                      :placeholder="`Item ${index + 1}`"
                    ></textarea>
                  </div>

                  <!-- Column B (Answer) -->
                  <div>
                    <label class="block text-xs font-medium text-gray-700 dark:text-gray-100 mb-1">
                      {{ String.fromCharCode(97 + index) }}. Column B (Correct Match)
                    </label>
                    <textarea
                      v-model="option.matchAnswer"
                      rows="3"
                      class="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 resize-y"
                      :placeholder="`Answer ${String.fromCharCode(97 + index)}`"
                    ></textarea>
                  </div>
                </div>

                <!-- Remove Button -->
                <button
                  v-if="options.length > 2"
                  type="button"
                  @click="confirmRemoveOption(option.id)"
                  class="mt-2 text-red-600 hover:text-red-800 text-xs flex items-center"
                >
                  <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Remove Pair
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      <!-- Form Actions (Fixed Footer) -->
      <div
        class="flex justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 pb-4 sm:pb-5 px-4 sm:px-5 border-t bg-white dark:bg-gray-900 shrink-0"
      >
        <button
          type="button"
          @click="closeModal"
          :disabled="props.isLoading"
          class="bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-100 hover:bg-gray-400 px-4 sm:px-6 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors duration-200 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          type="submit"
          @click="handleSubmit"
          :disabled="props.isLoading || isUploadingImage"
          class="bg-blue-600 text-white hover:bg-blue-700 px-4 sm:px-6 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors duration-200 flex items-center disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <span
            v-if="props.isLoading || isUploadingImage"
            class="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 animate-spin"
          >
            <svg
              class="w-3.5 h-3.5 sm:w-4 sm:h-4"
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
          </span>
          <svg
            v-else
            class="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span class="hidden xs:inline">{{
            isUploadingImage
              ? "Uploading images..."
              : props.isLoading
              ? editingQuestion
                ? "Updating..."
                : "Saving..."
              : editingQuestion
              ? "Update Question"
              : "Save Question"
          }}</span>
          <span class="xs:hidden">{{
            isUploadingImage || props.isLoading
              ? "..."
              : editingQuestion
              ? "Update"
              : "Save"
          }}</span>
        </button>
      </div>
    </div>
  </div>

  <!-- Delete Option Confirmation Modal -->
  <div
    v-if="showDeleteOptionConfirm"
    class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-60"
    @click="cancelDeleteOption"
  >
    <div
      class="relative top-20 mx-auto p-4 sm:p-5 border w-11/12 max-w-sm sm:max-w-md shadow-lg rounded-md bg-white"
      @click.stop
    >
      <div class="mt-3 text-center">
        <div
          class="mx-auto flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-red-100"
        >
          <svg
            class="h-5 w-5 sm:h-6 sm:w-6 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.084 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h3 class="text-base sm:text-lg font-medium text-gray-900 mt-2">
          Delete Answer Option
        </h3>
        <p class="mt-2 text-xs sm:text-sm text-gray-500">
          Are you sure you want to delete this answer option? This action cannot
          be undone.
        </p>
        <div class="mt-4 flex justify-center gap-2 sm:gap-3">
          <button
            @click="removeOption(showDeleteOptionConfirm)"
            class="bg-red-600 text-white hover:bg-red-700 px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium"
          >
            Delete
          </button>
          <button
            @click="cancelDeleteOption"
            class="bg-gray-300 text-gray-700 hover:bg-gray-400 px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Additional styles if needed */
</style>
