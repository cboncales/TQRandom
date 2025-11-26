<script setup>
import { ref, computed, watch } from "vue";

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  isGenerating: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["close", "generate"]);

// Form state
const testTitle = ref("");
const topic = ref("");
const numberOfQuestions = ref(10);
const questionTypes = ref([]); // Used when numberOfParts is 0
const numberOfParts = ref(0);
const partQuestionTypes = ref([]); // Array of question types per part
const partQuestionCounts = ref([]); // Array of question counts per part
const uploadedFile = ref(null);
const fileName = ref("");
const errorMessage = ref("");

// Available question types
const availableQuestionTypes = [
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "true_false", label: "True or False" },
  { value: "identification", label: "Identification" },
  { value: "fill_in_the_blank", label: "Fill in the Blank" },
  { value: "essay", label: "Essay" },
];

// Watch for changes in numberOfParts to initialize arrays
watch(numberOfParts, (newValue, oldValue) => {
  const num = parseInt(newValue) || 0;
  if (num > 0) {
    // Calculate questions per part
    const questionsPerPart = Math.floor(numberOfQuestions.value / num);
    const remainder = numberOfQuestions.value % num;
    
    // Initialize arrays for each part
    if (num > partQuestionTypes.value.length) {
      for (let i = partQuestionTypes.value.length; i < num; i++) {
        partQuestionTypes.value.push("");
        // Distribute remainder to first few parts
        const count = i < remainder ? questionsPerPart + 1 : questionsPerPart;
        partQuestionCounts.value.push(count);
      }
    } else if (num < partQuestionTypes.value.length) {
      partQuestionTypes.value = partQuestionTypes.value.slice(0, num);
      partQuestionCounts.value = partQuestionCounts.value.slice(0, num);
    }
  } else {
    partQuestionTypes.value = [];
    partQuestionCounts.value = [];
  }
});

// Watch for changes in numberOfQuestions to redistribute when parts exist
watch(numberOfQuestions, (newValue) => {
  const num = parseInt(numberOfParts.value) || 0;
  if (num > 0 && newValue > 0) {
    // Recalculate and redistribute questions per part
    const questionsPerPart = Math.floor(newValue / num);
    const remainder = newValue % num;
    
    for (let i = 0; i < num; i++) {
      const count = i < remainder ? questionsPerPart + 1 : questionsPerPart;
      partQuestionCounts.value[i] = count;
    }
  }
});

// Distribute questions evenly across parts
const distributeQuestionsEvenly = () => {
  const num = parseInt(numberOfParts.value) || 0;
  if (num > 0) {
    const total = numberOfQuestions.value;
    const questionsPerPart = Math.floor(total / num);
    const remainder = total % num;
    
    for (let i = 0; i < num; i++) {
      const count = i < remainder ? questionsPerPart + 1 : questionsPerPart;
      partQuestionCounts.value[i] = count;
    }
  }
};

// Handle part question count change with auto-adjustment
const handlePartQuestionChange = (partIndex, newValue) => {
  const num = parseInt(numberOfParts.value) || 0;
  const maxTotal = parseInt(numberOfQuestions.value) || 0;
  
  if (num <= 1) {
    // Only one part, just cap at max
    partQuestionCounts.value[partIndex] = Math.min(newValue, maxTotal);
    return;
  }
  
  // Calculate current total excluding the changed part
  let otherPartsTotal = 0;
  for (let i = 0; i < num; i++) {
    if (i !== partIndex) {
      otherPartsTotal += parseInt(partQuestionCounts.value[i]) || 0;
    }
  }
  
  // Calculate maximum allowed for this part
  const maxForThisPart = maxTotal - (num - 1); // Reserve at least 1 for each other part
  const cappedValue = Math.min(Math.max(1, newValue), maxForThisPart);
  
  // Set the new value
  partQuestionCounts.value[partIndex] = cappedValue;
  
  // Calculate remaining questions to distribute
  const remaining = maxTotal - cappedValue;
  
  if (remaining < num - 1) {
    // Not enough to give 1 to each other part, cap this part further
    partQuestionCounts.value[partIndex] = maxTotal - (num - 1);
    // Distribute 1 to each other part
    for (let i = 0; i < num; i++) {
      if (i !== partIndex) {
        partQuestionCounts.value[i] = 1;
      }
    }
    return;
  }
  
  // Distribute remaining among other parts
  const otherParts = num - 1;
  const baseAmount = Math.floor(remaining / otherParts);
  const remainder = remaining % otherParts;
  
  let otherPartIndex = 0;
  for (let i = 0; i < num; i++) {
    if (i !== partIndex) {
      const amount = otherPartIndex < remainder ? baseAmount + 1 : baseAmount;
      partQuestionCounts.value[i] = amount;
      otherPartIndex++;
    }
  }
};

// File size limit (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Handle file upload
const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    // Check file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];
    
    if (!allowedTypes.includes(file.type)) {
      errorMessage.value = "Only PDF, DOC, DOCX, and TXT files are allowed";
      return;
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      errorMessage.value = "File size must be less than 10MB";
      return;
    }

    uploadedFile.value = file;
    fileName.value = file.name;
    errorMessage.value = "";
  }
};

// Remove uploaded file
const removeFile = () => {
  uploadedFile.value = null;
  fileName.value = "";
  // Reset the file input
  const fileInput = document.getElementById("topic-file");
  if (fileInput) fileInput.value = "";
};

// Toggle question type selection
const toggleQuestionType = (type) => {
  const index = questionTypes.value.indexOf(type);
  if (index > -1) {
    questionTypes.value.splice(index, 1);
  } else {
    questionTypes.value.push(type);
  }
};

// Validation
const isFormValid = computed(() => {
  const basicValid = testTitle.value.trim() &&
    (topic.value.trim() || uploadedFile.value) &&
    numberOfQuestions.value > 0;
  
  if (numberOfParts.value > 0) {
    // For parts: check that all parts have question types selected
    const allPartsHaveTypes = partQuestionTypes.value.every(type => type !== "");
    const allPartsHaveCounts = partQuestionCounts.value.every(count => count > 0);
    return basicValid && allPartsHaveTypes && allPartsHaveCounts;
  } else {
    // For no parts: check that at least one question type is selected
    return basicValid && questionTypes.value.length > 0;
  }
});

// Calculate total questions from parts
const totalQuestionsFromParts = computed(() => {
  if (numberOfParts.value > 0) {
    return partQuestionCounts.value.reduce((sum, count) => sum + (parseInt(count) || 0), 0);
  }
  return numberOfQuestions.value;
});

// Handle form submission
const handleGenerate = () => {
  if (!isFormValid.value) {
    errorMessage.value = "Please fill in all required fields";
    return;
  }

  if (numberOfParts.value < 0 || numberOfParts.value > 10) {
    errorMessage.value = "Number of parts must be between 0 and 10";
    return;
  }

  errorMessage.value = "";
  
  // Prepare data based on whether parts are used
  const generateData = {
    testTitle: testTitle.value.trim(),
    topic: topic.value.trim(),
    numberOfQuestions: numberOfParts.value > 0 ? totalQuestionsFromParts.value : numberOfQuestions.value,
    numberOfParts: numberOfParts.value,
    file: uploadedFile.value,
  };

  if (numberOfParts.value > 0) {
    // Include per-part data
    generateData.parts = partQuestionTypes.value.map((type, index) => ({
      partNumber: index + 1,
      questionType: type,
      questionCount: partQuestionCounts.value[index]
    }));
  } else {
    // Include general question types
    generateData.questionTypes = questionTypes.value;
  }
  
  emit("generate", generateData);
};

// Reset form
const resetForm = () => {
  testTitle.value = "";
  topic.value = "";
  numberOfQuestions.value = 10;
  questionTypes.value = [];
  numberOfParts.value = 0;
  partQuestionTypes.value = [];
  partQuestionCounts.value = [];
  uploadedFile.value = null;
  fileName.value = "";
  errorMessage.value = "";
};

// Close modal
const closeModal = () => {
  resetForm();
  emit("close");
};
</script>

<template>
  <!-- Modal backdrop -->
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-opacity-95 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-start justify-center p-4"
    @click.self="closeModal"
  >
    <!-- Modal content -->
    <div
      class="relative my-8 mx-auto p-6 border border-gray-300 dark:border-gray-700 w-full max-w-2xl shadow-2xl rounded-xl bg-white dark:bg-gray-900"
      @click.stop
    >
      <!-- Modal header -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <svg
              class="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <div>
            <h3 class="text-xl font-bold text-gray-900 dark:text-white">
              AI Test Generator
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Generate questions using AI
            </p>
          </div>
        </div>
        <button
          type="button"
          @click="closeModal"
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
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
      </div>

      <!-- Error message -->
      <div
        v-if="errorMessage"
        class="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
      >
        <div class="flex items-start">
          <svg
            class="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clip-rule="evenodd"
            />
          </svg>
          <p class="ml-3 text-sm text-red-800 dark:text-red-300">{{ errorMessage }}</p>
        </div>
      </div>

      <!-- Modal body -->
      <form @submit.prevent="handleGenerate" class="space-y-5">
        <!-- Test Title -->
        <div>
          <label
            for="test-title"
            class="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2"
          >
            Test Title <span class="text-red-500">*</span>
          </label>
          <input
            id="test-title"
            v-model="testTitle"
            type="text"
            required
            :disabled="props.isGenerating"
            class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent sm:text-sm disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            placeholder="e.g., Science Quiz for Grade 10"
          />
        </div>

        <!-- Topic (Text) -->
        <div>
          <label
            for="topic"
            class="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2"
          >
            Topic <span class="text-red-500">*</span>
          </label>
          <textarea
            id="topic"
            v-model="topic"
            rows="3"
            :disabled="props.isGenerating || !!uploadedFile"
            class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent sm:text-sm disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            placeholder="e.g., Photosynthesis, Cell Division, Ecosystems..."
          />
          <p class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
            Describe the topic or provide context for question generation
          </p>
        </div>

        <!-- File Upload (Optional alternative to topic) -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
            Or Upload Topic File (Optional)
          </label>
          
          <!-- File preview -->
          <div v-if="fileName" class="mb-3 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg flex items-center justify-between">
            <div class="flex items-center gap-2 min-w-0">
              <svg
                class="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0"
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
              <span class="text-sm text-purple-900 dark:text-purple-100 truncate">{{ fileName }}</span>
            </div>
            <button
              type="button"
              @click="removeFile"
              :disabled="props.isGenerating"
              class="flex-shrink-0 ml-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <label
            class="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            :class="{ 'opacity-50 cursor-not-allowed': props.isGenerating || !!topic.trim() }"
          >
            <div class="flex flex-col items-center justify-center pt-5 pb-6">
              <svg
                class="w-10 h-10 mb-3 text-gray-400"
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
              <p class="mb-2 text-sm text-gray-500 dark:text-gray-400">
                <span class="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                PDF, DOC, DOCX, TXT (MAX. 10MB)
              </p>
            </div>
            <input
              id="topic-file"
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              @change="handleFileUpload"
              :disabled="props.isGenerating || !!topic.trim()"
              class="hidden"
            />
          </label>
          <p class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
            Upload a document containing the topic material
          </p>
        </div>

        <!-- Number of Questions & Parts (Grid) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Number of Questions (Only shown when no parts) -->
          <div v-if="numberOfParts === 0">
            <label
              for="num-questions"
              class="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2"
            >
              Number of Questions <span class="text-red-500">*</span>
            </label>
            <input
              id="num-questions"
              v-model.number="numberOfQuestions"
              type="number"
              min="1"
              max="100"
              required
              :disabled="props.isGenerating"
              class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent sm:text-sm disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>

          <!-- Number of Parts -->
          <div :class="numberOfParts === 0 ? '' : 'sm:col-span-2'">
            <label
              for="num-parts"
              class="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2"
            >
              Number of Parts
            </label>
            <input
              id="num-parts"
              v-model.number="numberOfParts"
              type="number"
              min="0"
              max="10"
              :disabled="props.isGenerating"
              class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent sm:text-sm disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
            <p class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              0 for single part, or specify how many parts (1-10)
            </p>
          </div>
        </div>

        <!-- Total Questions Input (shown when numberOfParts > 0) -->
        <div v-if="numberOfParts > 0" class="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <div class="flex flex-col sm:flex-row sm:items-end gap-3">
            <div class="flex-1">
              <label
                for="total-questions"
                class="block text-sm font-semibold text-purple-900 dark:text-purple-100 mb-2"
              >
                Total Questions <span class="text-red-500">*</span>
              </label>
              <input
                id="total-questions"
                v-model.number="numberOfQuestions"
                type="number"
                min="1"
                max="100"
                :disabled="props.isGenerating"
                class="w-full px-4 py-2.5 border border-purple-300 dark:border-purple-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent sm:text-sm disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
              <p class="mt-1.5 text-xs text-purple-700 dark:text-purple-300">
                Specify total questions to distribute across parts
              </p>
            </div>
            <button
              type="button"
              @click="distributeQuestionsEvenly"
              :disabled="props.isGenerating"
              class="shrink-0 px-4 py-2.5 text-sm font-semibold text-purple-700 dark:text-purple-300 bg-white dark:bg-gray-800 border border-purple-300 dark:border-purple-600 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/30 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg class="w-5 h-5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Distribute Evenly
            </button>
          </div>
        </div>

        <!-- Per-Part Configuration (shown when numberOfParts > 0) -->
        <div v-if="numberOfParts > 0" class="space-y-4">
          <div class="flex items-center justify-between">
            <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-200">
              Configure Each Part
            </h4>
            <span class="text-xs text-gray-500 dark:text-gray-400">
              Adjust questions per part as needed
            </span>
          </div>
          <div
            v-for="(partType, index) in partQuestionTypes"
            :key="index"
            class="p-4 border-2 rounded-lg space-y-3 transition-all"
            :class="partQuestionTypes[index] && partQuestionCounts[index] > 0 
              ? 'border-purple-300 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-900/20' 
              : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'"
          >
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-full bg-purple-600 dark:bg-purple-500 flex items-center justify-center text-white font-bold text-sm">
                  {{ index + 1 }}
                </div>
                <span class="text-sm font-bold text-gray-900 dark:text-gray-100">
                  Part {{ ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][index] || (index + 1) }}
                </span>
              </div>
              <div v-if="partQuestionCounts[index] > 0" class="px-3 py-1 bg-purple-100 dark:bg-purple-900/40 rounded-full">
                <span class="text-xs font-semibold text-purple-700 dark:text-purple-300">
                  {{ partQuestionCounts[index] }} {{ partQuestionCounts[index] === 1 ? 'question' : 'questions' }}
                </span>
              </div>
            </div>

            <!-- Question Type Selection -->
            <div>
              <label
                :for="`part-${index}-type`"
                class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2"
              >
                Question Type <span class="text-red-500">*</span>
              </label>
              <select
                :id="`part-${index}-type`"
                v-model="partQuestionTypes[index]"
                :disabled="props.isGenerating"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="" disabled>Select question type</option>
                <option
                  v-for="type in availableQuestionTypes"
                  :key="type.value"
                  :value="type.value"
                >
                  {{ type.label }}
                </option>
              </select>
            </div>

            <!-- Question Count -->
            <div>
              <label
                :for="`part-${index}-count`"
                class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2"
              >
                Number of Questions <span class="text-red-500">*</span>
              </label>
              <div class="flex items-center gap-2">
                <div class="flex-1">
                  <input
                    :id="`part-${index}-count`"
                    :value="partQuestionCounts[index]"
                    @input="(e) => handlePartQuestionChange(index, parseInt(e.target.value) || 1)"
                    type="number"
                    min="1"
                    :max="numberOfQuestions - (numberOfParts - 1)"
                    :disabled="props.isGenerating"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                  <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Max: {{ numberOfQuestions - (numberOfParts - 1) }} (others auto-adjust)
                  </p>
                </div>
                <div class="shrink-0 text-xs font-medium text-gray-600 dark:text-gray-400 min-w-[3rem] text-right">
                  / {{ numberOfQuestions }}
                </div>
              </div>
            </div>
          </div>

          <!-- Total Questions Display with Progress Bar -->
          <div class="space-y-3">
            <div class="p-4 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 border border-purple-300 dark:border-purple-700 rounded-lg">
              <div class="flex items-center justify-between mb-2">
                <div>
                  <p class="text-sm font-semibold text-purple-900 dark:text-purple-100">
                    Total Questions: {{ totalQuestionsFromParts }} / {{ numberOfQuestions }}
                  </p>
                  <p class="text-xs text-purple-700 dark:text-purple-300 mt-1">
                    {{ totalQuestionsFromParts === numberOfQuestions ? '✓ Perfect! Matches target' : totalQuestionsFromParts > numberOfQuestions ? '⚠ Exceeds target' : `⚠ ${numberOfQuestions - totalQuestionsFromParts} remaining` }}
                  </p>
                </div>
                <div v-if="totalQuestionsFromParts === numberOfQuestions" class="shrink-0">
                  <span class="px-3 py-1 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-full text-xs font-medium text-green-800 dark:text-green-300 flex items-center gap-1">
                    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                    </svg>
                    Ready
                  </span>
                </div>
              </div>
              
              <!-- Progress bar -->
              <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div 
                  class="h-full transition-all duration-300 rounded-full"
                  :class="totalQuestionsFromParts === numberOfQuestions ? 'bg-green-500' : totalQuestionsFromParts > numberOfQuestions ? 'bg-red-500' : 'bg-purple-500'"
                  :style="{ width: `${Math.min((totalQuestionsFromParts / numberOfQuestions) * 100, 100)}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Question Types (Only shown when no parts) -->
        <div v-if="numberOfParts === 0">
          <label class="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
            Question Types <span class="text-red-500">*</span>
          </label>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label
              v-for="type in availableQuestionTypes"
              :key="type.value"
              class="relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md"
              :class="
                questionTypes.includes(type.value)
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
              "
            >
              <input
                type="checkbox"
                :value="type.value"
                :checked="questionTypes.includes(type.value)"
                @change="toggleQuestionType(type.value)"
                :disabled="props.isGenerating"
                class="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 disabled:opacity-50"
              />
              <span
                class="ml-3 text-sm font-medium"
                :class="
                  questionTypes.includes(type.value)
                    ? 'text-purple-900 dark:text-purple-100'
                    : 'text-gray-700 dark:text-gray-300'
                "
              >
                {{ type.label }}
              </span>
            </label>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            @click="closeModal"
            :disabled="props.isGenerating"
            class="w-full sm:w-auto px-6 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="!isFormValid || props.isGenerating"
            class="w-full sm:w-auto px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
          >
            <span v-if="!props.isGenerating" class="flex items-center justify-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              Generate Questions
            </span>
            <span v-else class="flex items-center justify-center gap-2">
              <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating, please wait...
            </span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
/* Custom scrollbar for modal content */
@media (max-height: 768px) {
  .overflow-y-auto {
    scrollbar-width: thin;
    scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
  }

  .overflow-y-auto::-webkit-scrollbar {
    width: 6px;
  }

  .overflow-y-auto::-webkit-scrollbar-track {
    background: transparent;
  }

  .overflow-y-auto::-webkit-scrollbar-thumb {
    background-color: rgba(156, 163, 175, 0.5);
    border-radius: 3px;
  }
}
</style>
