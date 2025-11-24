<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  downloadType: {
    type: String,
    default: 'all', // 'all', 'selected', or 'single'
  },
  selectedCount: {
    type: Number,
    default: 0,
  },
  isDownloading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['close', 'confirm']);

const selectedFormat = ref('pdf'); // 'pdf' or 'docx'

// Reset format when modal opens
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    selectedFormat.value = 'pdf';
  }
});

const handleConfirm = () => {
  emit('confirm', selectedFormat.value);
};

const handleClose = () => {
  if (!props.isDownloading) {
    emit('close');
  }
};

const getDownloadDescription = () => {
  if (props.downloadType === 'all') {
    return 'all versions';
  } else if (props.downloadType === 'selected') {
    return `${props.selectedCount} selected version${props.selectedCount > 1 ? 's' : ''}`;
  } else {
    return 'this version';
  }
};
</script>

<template>
  <!-- Download Format Selection Modal -->
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
        class="relative z-10 inline-block align-bottom bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6"
        data-aos="fade-up"
        data-aos-delay="300"
      >
        <div>
          <div
            class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100"
          >
            <svg
              class="h-6 w-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </div>
          <div class="mt-3 text-center sm:mt-5">
            <h3
              class="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100"
              id="modal-title"
            >
              Select Download Format
            </h3>
            <div class="mt-2">
              <p class="text-xs md:text-sm lg:text-sm text-gray-500 dark:text-gray-100">
                Choose the file format for downloading {{ getDownloadDescription() }}.
              </p>
            </div>
            <div class="mt-6 space-y-3">
              <!-- PDF Option -->
              <label
                class="relative flex cursor-pointer rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm focus:outline-none hover:border-blue-500"
                :class="
                  selectedFormat === 'pdf'
                    ? 'border-blue-600 ring-2 ring-blue-600'
                    : ''
                "
              >
                <input
                  type="radio"
                  name="download-format"
                  value="pdf"
                  v-model="selectedFormat"
                  class="sr-only"
                />
                <div class="flex flex-1 items-center">
                  <div class="flex items-center">
                    <svg
                      class="h-8 w-8 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                    <div class="ml-3 text-left">
                      <span class="block text-sm font-medium text-gray-900 dark:text-gray-100"
                        >PDF Format</span
                      >
                      <span class="block text-xs text-gray-500 dark:text-gray-100"
                        >Portable Document Format - Universal
                        compatibility</span
                      >
                    </div>
                  </div>
                </div>
                <svg
                  v-if="selectedFormat === 'pdf'"
                  class="h-5 w-5 text-blue-600 shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clip-rule="evenodd"
                  />
                </svg>
              </label>

              <!-- Word Option -->
              <label
                class="relative flex cursor-pointer rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm focus:outline-none hover:border-blue-500"
                :class="
                  selectedFormat === 'docx'
                    ? 'border-blue-600 ring-2 ring-blue-600'
                    : ''
                "
              >
                <input
                  type="radio"
                  name="download-format"
                  value="docx"
                  v-model="selectedFormat"
                  class="sr-only"
                />
                <div class="flex flex-1 items-center">
                  <div class="flex items-center">
                    <svg
                      class="h-8 w-8 text-blue-600"
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
                    <div class="ml-3 text-left">
                      <span class="block text-sm font-medium text-gray-900 dark:text-gray-100"
                        >Word Format (DOCX)</span
                      >
                      <span class="block text-xs text-gray-500 dark:text-gray-100"
                        >Editable document - Microsoft Word compatible</span
                      >
                    </div>
                  </div>
                </div>
                <svg
                  v-if="selectedFormat === 'docx'"
                  class="h-5 w-5 text-blue-600 shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clip-rule="evenodd"
                  />
                </svg>
              </label>
            </div>
          </div>
        </div>
        <div
          class="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense"
        >
          <button
            type="button"
            @click="handleConfirm"
            :disabled="isDownloading"
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-sm md:text-base lg:text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <svg
              v-if="isDownloading"
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
            {{ isDownloading ? 'Downloading...' : 'Download' }}
          </button>
          <button
            type="button"
            @click="handleClose"
            :disabled="isDownloading"
            class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-sm md:text-base lg:text-base font-medium text-gray-700 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

