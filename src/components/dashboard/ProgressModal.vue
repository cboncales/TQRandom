<script setup>
import { computed } from 'vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    default: '',
  },
  current: {
    type: Number,
    default: 0,
  },
  total: {
    type: Number,
    default: 0,
  },
  type: {
    type: String,
    default: 'generation', // 'generation' (blue) or 'deletion' (red)
    validator: (value) => ['generation', 'deletion'].includes(value),
  },
  infoText: {
    type: String,
    default: '',
  },
});

const progressPercentage = computed(() => {
  if (props.total === 0) return 0;
  return Math.round((props.current / props.total) * 100);
});

const colorClasses = computed(() => {
  if (props.type === 'deletion') {
    return {
      spinnerBg: 'bg-red-100',
      spinnerColor: 'text-red-600',
      progressBar: 'bg-red-600',
    };
  }
  return {
    spinnerBg: 'bg-blue-100',
    spinnerColor: 'text-blue-600',
    progressBar: 'bg-blue-600',
  };
});

const defaultInfoText = computed(() => {
  if (props.infoText) return props.infoText;
  
  if (props.type === 'deletion') {
    if (props.title.includes('Question')) {
      return 'Please wait while we delete the selected questions...';
    }
    return 'Please wait while we delete the selected versions...';
  }
  return 'Please wait while we generate your randomized versions...';
});
</script>

<template>
  <!-- Progress Modal -->
  <div
    v-if="isOpen && total > 0"
    class="fixed inset-0 z-60 overflow-y-auto"
    aria-labelledby="progress-modal"
    role="dialog"
    aria-modal="true"
  >
    <div
      class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0"
    >
      <!-- Background overlay - non-clickable -->
      <div
        class="fixed inset-0 bg-opacity-95 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
      ></div>

      <!-- Center modal -->
      <span
        class="hidden sm:inline-block sm:align-middle sm:h-screen"
        aria-hidden="true"
        >&#8203;</span
      >

      <div
        class="relative inline-block align-bottom bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full sm:p-6"
        data-aos="fade-up"
        data-aos-delay="300"
      >
        <div>
          <!-- Spinner Icon -->
          <div
            :class="[
              'mx-auto flex items-center justify-center h-16 w-16 rounded-full',
              colorClasses.spinnerBg,
            ]"
          >
            <svg
              :class="['animate-spin h-10 w-10', colorClasses.spinnerColor]"
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
          </div>

          <!-- Title -->
          <div class="mt-4 text-center">
            <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
              {{ title }}
            </h3>
            <div class="mt-2">
              <p class="text-sm text-gray-600 dark:text-gray-100">
                {{ message }}
              </p>
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="mt-4">
            <div class="flex justify-between text-xs text-gray-600 dark:text-gray-100 mb-1">
              <span>Progress</span>
              <span>{{ current }} / {{ total }}</span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2.5">
              <div
                :class="[
                  'h-2.5 rounded-full transition-all duration-300',
                  colorClasses.progressBar,
                ]"
                :style="{ width: `${progressPercentage}%` }"
              ></div>
            </div>
          </div>

          <!-- Info text -->
          <div class="mt-4 text-center">
            <p class="text-xs text-gray-500 dark:text-gray-100">
              {{ defaultInfoText }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

