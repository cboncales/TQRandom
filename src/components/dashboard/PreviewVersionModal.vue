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
const previewVersion = ref(null);
const isLoadingPreview = ref(false);

const loadVersion = async () => {
  if (!props.versionId) {
    previewVersion.value = null;
    return;
  }

  isLoadingPreview.value = true;
  previewVersion.value = null;

  try {
    const result = await testStore.getVersion(props.versionId);

    if (result.error) {
      alert(`Failed to load version: ${result.error}`);
      emit('close');
      return;
    }

    previewVersion.value = result.data;
  } catch (error) {
    console.error('Preview error:', error);
    alert(`An error occurred: ${error.message}`);
    emit('close');
  } finally {
    isLoadingPreview.value = false;
  }
};

// Watch for modal open and versionId changes
watch(
  () => [props.isOpen, props.versionId],
  ([isOpen, versionId]) => {
    if (isOpen && versionId) {
      loadVersion();
    } else if (!isOpen) {
      previewVersion.value = null;
    }
  },
  { immediate: true }
);

const handleClose = () => {
  emit('close');
};
</script>

<template>
  <!-- Preview Version Modal -->
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-opacity-95 backdrop-blur-sm overflow-hidden h-full w-full z-50 flex items-center justify-center p-4"
    @click="handleClose"
    data-aos="fade-up"
    data-aos-delay="300"
  >
    <div
      class="relative w-full max-w-4xl bg-white border border-gray-300 rounded-lg shadow-lg flex flex-col max-h-[calc(100vh-2rem)]"
      @click.stop
    >
      <!-- Header (Fixed) -->
      <div class="flex justify-between items-center px-6 pt-6 pb-4 shrink-0">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">
            {{ previewVersion?.test_title || 'Loading...' }}
          </h2>
          <p class="text-xs md:text-sm lg:text-sm text-gray-600 mt-1">
            Version {{ previewVersion?.version_number }} •
            {{ previewVersion?.questions?.length || 0 }} questions • Generated
            {{
              previewVersion
                ? new Date(previewVersion.created_at).toLocaleDateString()
                : ''
            }}
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
          v-if="isLoadingPreview"
          class="flex flex-col items-center justify-center py-12"
        >
          <svg
            class="animate-spin h-12 w-12 text-purple-600 mb-4"
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
          <p class="text-gray-600">Loading version preview...</p>
        </div>

        <!-- Content -->
        <div v-else-if="previewVersion" class="space-y-6">
          <div
            v-for="(question, qIndex) in previewVersion.questions"
            :key="question.question_id"
            class="bg-gray-50 rounded-lg p-5 border border-gray-200"
          >
            <!-- Question -->
            <div class="mb-4">
              <div class="flex items-start">
                <span
                  class="shrink-0 inline-flex items-center justify-center h-8 w-8 rounded-full bg-purple-100 text-purple-800 text-sm font-medium mr-3"
                >
                  {{ question.question_number }}
                </span>
                <p class="text-lg text-gray-900 font-medium">
                  {{ question.question_text }}
                </p>
              </div>

              <!-- Question Image -->
              <div v-if="question.question_image_url" class="ml-11 mt-3">
                <img
                  :src="question.question_image_url"
                  alt="Question image"
                  class="max-w-md h-auto rounded-lg border border-gray-300 shadow-sm"
                />
              </div>
            </div>

            <!-- Answer Choices -->
            <div class="ml-11 space-y-2">
              <div
                v-for="(choice, cIndex) in question.answer_choices"
                :key="choice.id"
                class="p-3 rounded-md bg-white border border-gray-200"
              >
                <div class="flex items-start">
                  <span
                    class="shrink-0 font-medium text-gray-700 mr-3 min-w-[24px]"
                  >
                    {{ String.fromCharCode(65 + cIndex) }}.
                  </span>
                  <div class="flex-1">
                    <p class="text-gray-800">{{ choice.text }}</p>

                    <!-- Answer Choice Image -->
                    <div v-if="choice.image_url" class="mt-2">
                      <img
                        :src="choice.image_url"
                        alt="Answer choice image"
                        class="max-w-xs h-auto rounded border border-gray-300"
                      />
                    </div>
                  </div>
                </div>
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

