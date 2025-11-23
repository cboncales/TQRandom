<script setup>
const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  versionId: {
    type: Number,
    default: null,
  },
});

const emit = defineEmits(['close', 'confirm']);

const handleConfirm = () => {
  emit('confirm', props.versionId);
};

const handleClose = () => {
  emit('close');
};
</script>

<template>
  <!-- Delete Version Confirmation Modal -->
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-opacity-95 backdrop-blur-sm overflow-y-auto h-full w-full z-50"
    @click="handleClose"
    data-aos="fade-up"
    data-aos-delay="300"
  >
    <div
      class="relative top-50 mx-auto p-5 border border-gray-300 w-80 md:w-96 lg:w-96 shadow-lg rounded-md bg-white"
      @click.stop
    >
      <div class="mt-3 text-center">
        <div
          class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100"
        >
          <svg
            class="h-6 w-6 text-red-600"
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
        <h3 class="text-lg font-medium text-gray-900 mt-2">
          Delete Test Version
        </h3>
        <p class="mt-2 text-sm text-gray-500">
          Are you sure you want to delete this randomized version? This action
          cannot be undone.
        </p>
        <div class="mt-4 flex justify-center space-x-3">
          <button
            @click="handleConfirm"
            class="bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded-md text-sm font-medium"
          >
            Delete
          </button>
          <button
            @click="handleClose"
            class="bg-gray-300 text-gray-700 hover:bg-gray-400 px-4 py-2 rounded-md text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

