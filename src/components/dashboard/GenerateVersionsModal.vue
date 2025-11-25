<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  totalQuestions: {
    type: Number,
    default: 0,
  },
  isGenerating: {
    type: Boolean,
    default: false,
  },
  numberOfParts: {
    type: Number,
    default: 0,
  },
});

const emit = defineEmits(['close', 'generate']);

const versionCount = ref(1);
const questionsPerVersion = ref(50);

// Reset values when modal opens
watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      versionCount.value = 1;
      questionsPerVersion.value = props.totalQuestions;
    }
  }
);

// Update questionsPerVersion when totalQuestions changes
watch(
  () => props.totalQuestions,
  (newTotal) => {
    if (newTotal > 0) {
      questionsPerVersion.value = Math.min(questionsPerVersion.value, newTotal);
    }
  }
);

const handleGenerate = () => {
  if (versionCount.value < 1 || versionCount.value > 100) {
    alert('Please enter a version count between 1 and 100');
    return;
  }

  if (
    questionsPerVersion.value < 1 ||
    questionsPerVersion.value > props.totalQuestions
  ) {
    alert(
      `Please enter questions per version between 1 and ${props.totalQuestions}`
    );
    return;
  }

  emit('generate', {
    versionCount: versionCount.value,
    questionsPerVersion: questionsPerVersion.value,
  });
};

const handleClose = () => {
  if (!props.isGenerating) {
    emit('close');
  }
};
</script>

<template>
  <!-- Generate Versions Modal -->
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 overflow-y-auto"
    aria-labelledby="modal-title"
    role="dialog"
    aria-modal="true"
  >
    <div
      class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0"
    >
      <!-- Background overlay -->
      <div
        class="fixed inset-0 bg-opacity-95 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
        @click="handleClose"
      ></div>

      <!-- Center modal -->
      <span
        class="hidden sm:inline-block sm:align-middle sm:h-screen"
        aria-hidden="true"
        >&#8203;</span
      >

      <div
        class="relative z-10 inline-block align-bottom bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6"
        data-aos="fade-up"
        data-aos-delay="300"
      >
        <div>
          <div
            class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-purple-100"
          >
            <svg
              class="h-6 w-6 text-gray-800"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>
          <div class="mt-3 text-center sm:mt-5">
            <h3
              class="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100"
              id="modal-title"
            >
              Generate Randomized Versions
            </h3>
            <div class="mt-2">
              <p class="text-sm text-gray-500 dark:text-gray-100">
                Create randomized test versions using the Fisher-Yates shuffle
                algorithm.
              </p>
            </div>
          </div>
        </div>

        <div class="mt-5 space-y-4">
          <!-- Number of Versions -->
          <div>
            <label
              for="versionCount"
              class="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-1"
            >
              Number of Versions
            </label>
            <input
              type="number"
              id="versionCount"
              v-model.number="versionCount"
              min="1"
              max="100"
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm px-3 py-2 border"
            />
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-100">
              Generate between 1 and 100 randomized versions
            </p>
          </div>

          <!-- Questions per Version -->
          <div>
            <label
              for="questionsPerVersion"
              class="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-1"
            >
              Questions per Version
            </label>
            <input
              type="number"
              id="questionsPerVersion"
              v-model.number="questionsPerVersion"
              :min="1"
              :max="totalQuestions"
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm px-3 py-2 border"
            />
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-100">
              Available questions: {{ totalQuestions }}
            </p>
          </div>

          <!-- Shuffle Info -->
          <div v-if="numberOfParts > 0" class="bg-indigo-50 dark:bg-gray-900 border border-indigo-200 dark:border-indigo-700 rounded-md p-4">
            <div class="flex">
              <svg
                class="h-5 w-5 text-indigo-400 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div class="text-sm text-indigo-700">
                <p class="font-medium">Part-Based Shuffling</p>
                <p class="mt-1 text-xs">
                  Questions will be shuffled within each part ({{ numberOfParts }} part{{ numberOfParts > 1 ? 's' : '' }}) to maintain test structure.
                </p>
              </div>
            </div>
          </div>

          <!-- Algorithm Info -->
          <div class="bg-blue-50 dark:bg-gray-900 border border-blue-200 dark:border-blue-700 rounded-md p-4">
            <div class="flex">
              <svg
                class="h-5 w-5 text-blue-400 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div class="text-sm text-blue-700">
                <p class="font-medium">Fisher-Yates Algorithm</p>
                <p class="mt-1 text-xs">
                  Each version will have questions in a unique randomized order
                  with equal probability distribution.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div
          class="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense"
        >
          <button
            type="button"
            @click="handleGenerate"
            :disabled="isGenerating"
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-gray-800 dark:bg-gray-800 text-sm md:text-base lg:text-base font-medium text-white hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:col-start-2 sm:text-sm disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
          >
            <svg
              v-if="isGenerating"
              class="animate-spin -ml-1 mr-2 h-4 w-4 text-white dark:text-gray-100"
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
            {{ isGenerating ? 'Generating...' : 'Generate' }}
          </button>
          <button
            type="button"
            @click="handleClose"
            :disabled="isGenerating"
            class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-sm md:text-base lg:text-base font-medium text-gray-700 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

