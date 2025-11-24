<script setup>
const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  itemId: {
    type: [Number, String],
    default: null,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    default: 'Are you sure you want to delete this item? This action cannot be undone.',
  },
});

const emit = defineEmits(['close', 'confirm']);

const handleConfirm = () => {
  emit('confirm', props.itemId);
};

const handleClose = () => {
  emit('close');
};
</script>

<template>
  <!-- Delete Confirmation Modal -->
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-opacity-95 backdrop-blur-sm overflow-y-auto h-full w-full z-50"
    @click="handleClose"
    data-aos="fade-up"
    data-aos-delay="300"
  >
    <div
      class="relative top-20 mx-auto p-4 sm:p-5 border border-gray-300 w-11/12 max-w-sm sm:max-w-md shadow-lg rounded-md bg-white dark:bg-gray-900"
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
        <h3 class="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100 mt-2">
          {{ title }}
        </h3>
        <p class="mt-2 text-xs sm:text-sm text-gray-500 dark:text-gray-300">
          {{ message }}
        </p>
        <div class="mt-4 flex justify-center gap-2 sm:gap-3">
          <button
            @click="handleConfirm"
            class="bg-red-600 text-white dark:text-gray-100 hover:bg-red-700 px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors duration-200"
          >
            Delete
          </button>
          <button
            @click="handleClose"
            class="bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-100 hover:bg-gray-400 px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors duration-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

