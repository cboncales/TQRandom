<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import EditTestModal from "./EditTestModal.vue";
import DeleteConfirmationModal from "./DeleteConfirmationModal.vue";

const props = defineProps({
  tests: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(["test-deleted", "test-updated"]);

const router = useRouter();
const showDeleteConfirm = ref(false);
const deleteTestId = ref(null);
const isEditOpen = ref(false);
const selectedTestId = ref(null);

const editTest = (testId) => {
  selectedTestId.value = testId;
  isEditOpen.value = true;
};

const refreshTests = () => {
  emit("test-updated");
};

const manageQuestions = (testId) => {
  router.push({ name: "question-management", params: { id: testId } });
};

const confirmDelete = (testId) => {
  deleteTestId.value = testId;
  showDeleteConfirm.value = true;
};

const handleDeleteConfirm = (testId) => {
  emit("test-deleted", testId);
  cancelDelete();
};

const cancelDelete = () => {
  showDeleteConfirm.value = false;
  deleteTestId.value = null;
};

const getStatusColor = (status) => {
  return status === "active"
    ? "bg-green-100 text-green-800"
    : "bg-yellow-100 text-yellow-800";
};
</script>

<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-900 shadow rounded-lg px-4 py-5 sm:px-6">
      <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
        Your Test Questionnaires
      </h3>
      <p class="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-300">
        Manage your test collection and questions
      </p>
    </div>

    <!-- Test Cards -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
      <div
        v-for="test in tests"
        :key="test.id"
        class="bg-white dark:bg-gray-900 shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200"
      >
        <div class="p-6">
          <!-- Header with Title and Status -->
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1 min-w-0 mr-4">
              <h4 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {{ test.title }}
              </h4>
              <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {{ test.description }}
              </p>
            </div>
            <span
              :class="[
                'px-3 py-1 text-xs font-semibold rounded-full shrink-0',
                getStatusColor(test.status),
              ]"
            >
              {{ test.status }}
            </span>
          </div>

          <!-- Test Info Cards -->
          <div class="grid grid-cols-2 gap-3 mb-4">
            <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <div class="flex items-center">
                <svg
                  class="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p class="text-xs text-gray-600 dark:text-gray-400">Questions</p>
                  <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {{ test.questionCount }}
                  </p>
                </div>
              </div>
            </div>

            <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <div class="flex items-center">
                <svg
                  class="h-5 w-5 text-gray-600 dark:text-gray-400 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <div>
                  <p class="text-xs text-gray-600 dark:text-gray-400">Created</p>
                  <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {{ test.createdAt }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center gap-2">
            <button
              @click="manageQuestions(test.id)"
              class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center shadow-sm"
            >
              <svg
                class="w-4 h-4 mr-2"
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
              Manage Questions
            </button>

            <button
              @click="editTest(test.id)"
              class="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center"
              title="Edit test details"
            >
              <svg
                class="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit
            </button>

            <button
              @click="confirmDelete(test.id)"
              class="bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center"
              title="Delete test"
            >
              <svg
                class="w-4 h-4 mr-2"
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
              Delete
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-if="tests.length === 0"
        class="bg-white dark:bg-gray-900 shadow rounded-lg p-12 text-center"
      >
        <svg
          class="mx-auto h-16 w-16 text-gray-400"
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
        <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">No tests yet</h3>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Get started by creating your first test questionnaire.
        </p>
      </div>
    </div>
  </div>

  <!-- Delete Confirmation Modal -->
  <DeleteConfirmationModal
    :isOpen="showDeleteConfirm"
    :itemId="deleteTestId"
    title="Delete Test"
    message="Are you sure you want to delete this test? This action cannot be undone."
    @close="cancelDelete"
    @confirm="handleDeleteConfirm"
  />

  <!-- Edit Test Modal -->
  <EditTestModal
    :isOpen="isEditOpen"
    :testId="selectedTestId"
    @close="isEditOpen = false"
    @updated="refreshTests"
  />
</template>

<style scoped>
/* Additional styles if needed */
</style>
