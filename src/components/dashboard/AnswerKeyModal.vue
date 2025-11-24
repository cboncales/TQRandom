<script setup>
import { ref, watch } from 'vue';
import { useTestStore } from '@/stores/testStore';

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

const emit = defineEmits(['close']);

const testStore = useTestStore();
const answerKeyData = ref(null);
const isLoadingAnswerKey = ref(false);

const loadAnswerKey = async () => {
  if (!props.versionId) {
    answerKeyData.value = null;
    return;
  }

  isLoadingAnswerKey.value = true;
  answerKeyData.value = null;

  try {
    const result = await testStore.getVersionAnswerKey(props.versionId);

    if (result.error) {
      alert(`Failed to load answer key: ${result.error}`);
      emit('close');
      return;
    }

    answerKeyData.value = result.data;
  } catch (error) {
    console.error('Answer key error:', error);
    alert(`An error occurred: ${error.message}`);
    emit('close');
  } finally {
    isLoadingAnswerKey.value = false;
  }
};

// Watch for modal open and versionId changes
watch(
  () => [props.isOpen, props.versionId],
  ([isOpen, versionId]) => {
    if (isOpen && versionId) {
      loadAnswerKey();
    } else if (!isOpen) {
      answerKeyData.value = null;
    }
  },
  { immediate: true }
);

const handleClose = () => {
  emit('close');
};
</script>

<template>
  <!-- Answer Key Modal -->
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-opacity-95 backdrop-blur-sm overflow-hidden h-full w-full z-50 flex items-center justify-center p-4"
    @click="handleClose"
    data-aos="fade-up"
    data-aos-delay="300"
  >
    <div
      class="relative w-full max-w-2xl bg-white border border-gray-300 rounded-lg shadow-lg flex flex-col max-h-[calc(100vh-2rem)]"
      @click.stop
    >
      <!-- Header (Fixed) -->
      <div class="flex justify-between items-center px-6 pt-6 pb-4 shrink-0">
        <div>
          <h2 class="text-xl md:text-2xl lg:text-2xl font-bold text-gray-900">
            Answer Key
          </h2>
          <p v-if="answerKeyData" class="text-sm text-gray-600 mt-1">
            Version {{ answerKeyData.version_number }}
          </p>
        </div>
        <button
          @click="handleClose"
          class="text-gray-400 hover:text-gray-600 transition-colors"
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

      <!-- Scrollable Content -->
      <div class="overflow-y-auto flex-1 px-6 py-4">
        <!-- Loading State -->
        <div
          v-if="isLoadingAnswerKey"
          class="flex flex-col items-center justify-center py-12"
        >
          <svg
            class="animate-spin h-12 w-12 text-green-600 mb-4"
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
          <p class="text-gray-600">Loading answer key...</p>
        </div>

        <!-- Answer Key Content -->
        <div v-else-if="answerKeyData && answerKeyData.answer_key">
          <div
            v-if="answerKeyData.answer_key.length === 0"
            class="text-center py-8 text-gray-500"
          >
            <svg
              class="mx-auto h-12 w-12 text-gray-400 mb-3"
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
            <p>No answer key available for this version.</p>
            <p class="text-sm mt-1">
              Make sure correct answers are set for the test questions.
            </p>
          </div>

          <!-- Answer Key Grid -->
          <div
            v-else
            class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
          >
            <div
              v-for="answer in answerKeyData.answer_key"
              :key="answer.question_number"
              class="bg-green-50 border border-green-200 rounded-lg p-3 text-center"
            >
              <div
                class="text-xl md:text-2xl lg:text-2xl font-bold text-green-700"
              >
                {{ answer.question_number }}.{{ answer.answer }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer (Fixed) -->
      <div class="px-6 pt-4 pb-6 flex justify-end shrink-0">
        <button
          @click="handleClose"
          class="bg-gray-600 text-white hover:bg-gray-700 px-6 py-2 rounded-md text-sm font-medium transition-colors duration-200"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</template>

