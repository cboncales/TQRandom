<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import EditTestModal from "./EditTestModal.vue";

const props = defineProps({
  tests: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(["test-deleted", "test-updated"]);

const router = useRouter();
const showDeleteConfirm = ref(null);
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
  router.push({ name: 'question-management', params: { id: testId } });
};

const confirmDelete = (testId) => {
  showDeleteConfirm.value = testId;
};

const deleteTest = (testId) => {
  emit("test-deleted", testId);
  showDeleteConfirm.value = null;
};

const cancelDelete = () => {
  showDeleteConfirm.value = null;
};

const getStatusColor = (status) => {
  return status === "active"
    ? "bg-green-100 text-green-800"
    : "bg-yellow-100 text-yellow-800";
};
</script>

<template>
  <div class="bg-white shadow overflow-hidden sm:rounded-md">
    <div class="px-4 py-5 sm:px-6">
      <h3 class="text-lg leading-6 font-medium text-gray-900">Your Test Questionnaires</h3>
      <p class="mt-1 max-w-2xl text-sm text-gray-500">
        Manage your test collection and questions
      </p>
    </div>

    <ul class="divide-y divide-gray-200">
      <li v-for="test in tests" :key="test.id" class="px-4 py-4 sm:px-6">
        <!-- Mobile Layout: Stack vertically -->
        <div class="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <!-- Test Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between sm:justify-start sm:space-x-3">
              <div class="flex-1 min-w-0">
                <h4 class="text-lg font-medium text-gray-900 truncate">
                  {{ test.title }}
                </h4>
              </div>
              <span
                :class="[
                  'px-2 inline-flex text-xs leading-5 font-semibold rounded-full shrink-0',
                  getStatusColor(test.status),
                ]"
              >
                {{ test.status }}
              </span>
            </div>

            <p class="mt-2 text-sm text-gray-500">
              {{ test.description }}
            </p>

            <div class="mt-2 flex flex-col sm:flex-row sm:items-center text-sm text-gray-500 space-y-1 sm:space-y-0 sm:space-x-4">
              <span class="flex items-center">
                <svg
                  class="shrink-0 mr-1.5 h-4 w-4"
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
                {{ test.questionCount }} questions
              </span>
              <span class="flex items-center">
                <svg
                  class="shrink-0 mr-1.5 h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 7V3a4 4 0 118 0v4m-4 7h6m-6 0V9a4 4 0 118 0v5"
                  />
                </svg>
                Created {{ test.createdAt }}
              </span>
            </div>
          </div>

          <!-- Action Buttons - Full width on mobile, auto width on desktop -->
          <div class="flex items-center space-x-2 sm:ml-4">
            <!-- Manage Questions Button -->
            <button
              @click="manageQuestions(test.id)"
              class="flex-1 sm:flex-none bg-blue-500 text-white shadow hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center justify-center"
            >
              <svg
                class="w-4 h-4 sm:mr-1"
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
              <span>Questions</span>
            </button>

            <!-- Edit Button -->
            <button
              @click="editTest(test.id)"
              class="p-2 text-blue-600 shadow hover:bg-gray-200 rounded-md transition-colors duration-200"
              title="Edit test"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>

            <!-- Delete Button -->
            <button
              @click="confirmDelete(test.id)"
              class="p-2 text-red-600 shadow hover:bg-gray-200 rounded-md transition-colors duration-200"
              title="Delete test"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </li>

      <li v-if="tests.length === 0" class="px-4 py-8 sm:px-6 text-center">
        <div class="text-gray-500">
          <svg
            class="mx-auto h-12 w-12 text-gray-400"
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
          <h3 class="mt-2 text-sm font-medium text-gray-900">No tests</h3>
          <p class="mt-1 text-sm text-gray-500">
            Get started by creating a new test.
          </p>
        </div>
      </li>
    </ul>
  </div>

  <!-- Delete Confirmation Modal -->
  <div
    v-if="showDeleteConfirm"
    class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
    @click="cancelDelete"
  >
    <div
      class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white"
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
        <h3 class="text-lg font-medium text-gray-900 mt-2">Delete Test</h3>
        <p class="mt-2 text-sm text-gray-500">
          Are you sure you want to delete this test? This action cannot be
          undone.
        </p>
        <div class="mt-4 flex justify-center space-x-3">
          <button
            @click="deleteTest(showDeleteConfirm)"
            class="bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded-md text-sm font-medium"
          >
            Delete
          </button>
          <button
            @click="cancelDelete"
            class="bg-gray-300 text-gray-700 hover:bg-gray-400 px-4 py-2 rounded-md text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>

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
