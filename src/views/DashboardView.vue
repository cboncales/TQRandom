<script setup>
import AppLayout from "@/components/layout/AppLayout.vue";
import TestList from "@/components/dashboard/TestList.vue";
import CreateTestModal from "@/components/dashboard/CreateTestModal.vue";
import { ref, onMounted, watch } from "vue";
import { useTestStore } from "@/stores/testStore";

const testStore = useTestStore();

const showCreateModal = ref(false);
const tests = ref([]);
const filteredTests = ref([]);
const searchQuery = ref("");
const isLoading = ref(true);
const errorMessage = ref("");
const isDeletingTest = ref(false);
const deletingTestTitle = ref("");

// Stats
const totalQuestions = ref(0);
const totalVersions = ref(0);
const testsWithQuestions = ref(0);

const openCreateModal = () => {
  showCreateModal.value = true;
};

const closeCreateModal = () => {
  showCreateModal.value = false;
};

const handleTestCreated = (newTest) => {
  tests.value.unshift({
    ...newTest,
    questionCount: 0, // TODO: Get actual question count
  });
  closeCreateModal();
};

const handleTestDeleted = async (testId) => {
  try {
    // Find the test to get its title
    const test = tests.value.find(t => t.id === testId);
    deletingTestTitle.value = test ? test.title : "Test";
    
    // Show progress modal
    isDeletingTest.value = true;
    
    const result = await testStore.deleteTest(testId);

    if (result.error) {
      isDeletingTest.value = false;
      alert(`Error deleting test: ${result.error}`);
    } else {
      tests.value = tests.value.filter((test) => test.id !== testId);
      filterTests(); // Update filtered tests
      
      // Keep modal visible briefly to show success
      setTimeout(() => {
        isDeletingTest.value = false;
      }, 500);
    }
  } catch (error) {
    isDeletingTest.value = false;
    alert("An unexpected error occurred while deleting the test.");
    console.error("Delete test error:", error);
  }
};

const handleTestUpdated = async () => {
  // Reload tests to get updated data
  await loadTests();
};

const filterTests = () => {
  const query = searchQuery.value.toLowerCase().trim();
  
  if (!query) {
    filteredTests.value = tests.value;
  } else {
    filteredTests.value = tests.value.filter(test => 
      test.title.toLowerCase().includes(query) ||
      (test.description && test.description.toLowerCase().includes(query))
    );
  }
};

const handleSearch = () => {
  filterTests();
};

const loadTests = async () => {
  try {
    isLoading.value = true;
    errorMessage.value = "";

    const result = await testStore.getUserTests();

    if (result.error) {
      errorMessage.value = result.error;
    } else {
      // Transform the database data to match UI expectations
      tests.value = result.data.map((test) => ({
        ...test,
        subject: test.description?.split(" - ")[0] || "General", // Extract subject from description
        description: test.description?.includes(" - ")
          ? test.description.split(" - ").slice(1).join(" - ")
          : test.description || "",
        questionCount: 0, // Will be calculated below
        versionCount: 0, // Will be calculated below
        createdAt: new Date(test.created_at).toLocaleDateString(),
      }));
      
      // Calculate stats for all tests
      let questionsCount = 0;
      let versionsCount = 0;
      let testsWithQuestionsCount = 0;
      
      for (const test of tests.value) {
        // Get question count for each test
        const questionsResult = await testStore.getTestQuestions(test.id);
        if (questionsResult.data) {
          test.questionCount = questionsResult.data.length;
          questionsCount += questionsResult.data.length;
          if (questionsResult.data.length > 0) {
            testsWithQuestionsCount++;
          }
        }
        
        // Get version count for each test
        const versionsResult = await testStore.getTestVersions(test.id);
        if (versionsResult.data) {
          test.versionCount = versionsResult.data.length;
          versionsCount += versionsResult.data.length;
        }
      }
      
      // Update stats
      totalQuestions.value = questionsCount;
      totalVersions.value = versionsCount;
      testsWithQuestions.value = testsWithQuestionsCount;
      
      // Initialize filtered tests
      filteredTests.value = tests.value;
    }
  } catch (error) {
    errorMessage.value = "Failed to load tests. Please try again.";
    console.error("Load tests error:", error);
  } finally {
    isLoading.value = false;
  }
};

// Watch search query and filter automatically (letter by letter)
watch(searchQuery, () => {
  filterTests();
});

onMounted(() => {
  loadTests();
});
</script>

<template>
  <AppLayout>
    <div class="min-h-screen bg-gray-200">
      <!-- Dashboard Header -->
      <div class="bg-white shadow">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="py-6">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between">
              <div class="mb-4 md:mb-0">
                <h1 class="text-2xl font-bold text-gray-900">
                  Test Management Dashboard
                </h1>
                <p class="mt-1 text-sm text-gray-600">
                  Create and manage your tests
                </p>
              </div>
              <button
                @click="openCreateModal"
                class="bg-blue-500 text-white shadow hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center"
              >
                <svg
                  class="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Create New Test Questionnaire
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Dashboard Stats -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-white overflow-hidden shadow rounded-lg">
            <div class="p-5">
              <div class="flex items-center">
                <div class="shrink-0">
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
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-500 truncate">
                      Total Tests
                    </dt>
                    <dd class="text-lg font-medium text-gray-900">
                      {{ tests.length }}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white overflow-hidden shadow rounded-lg">
            <div class="p-5">
              <div class="flex items-center">
                <div class="shrink-0">
                  <svg
                    class="h-6 w-6 text-purple-600"
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
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-500 truncate">
                      Total Questions
                    </dt>
                    <dd class="text-lg font-medium text-gray-900">
                      {{ totalQuestions }}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white overflow-hidden shadow rounded-lg">
            <div class="p-5">
              <div class="flex items-center">
                <div class="shrink-0">
                  <svg
                    class="h-6 w-6 text-orange-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                    />
                  </svg>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-500 truncate">
                      Total Randomized Versions
                    </dt>
                    <dd class="text-lg font-medium text-gray-900">
                      {{ totalVersions }}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white overflow-hidden shadow rounded-lg">
            <div class="p-5">
              <div class="flex items-center">
                <div class="shrink-0">
                  <svg
                    class="h-6 w-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-500 truncate">
                      Tests with Questions
                    </dt>
                    <dd class="text-lg font-medium text-gray-900">
                      {{ testsWithQuestions }}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Search Bar -->
        <div v-if="!isLoading" class="mb-6 flex justify-start">
          <div class="w-full max-w-md">
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  class="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search tests by title or description..."
                class="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              <div
                v-if="searchQuery"
                class="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <button
                  @click="searchQuery = ''"
                  class="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    class="h-5 w-5"
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
            </div>
            <p v-if="searchQuery" class="mt-2 text-sm text-gray-600">
              Showing {{ filteredTests.length }} of {{ tests.length }} tests
            </p>
          </div>
        </div>

        <!-- Error Message -->
        <div
          v-if="errorMessage"
          class="bg-red-50 border border-red-200 rounded-lg p-6 mb-8"
        >
          <div class="flex">
            <div class="shrink-0">
              <svg
                class="h-5 w-5 text-red-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm text-red-800">{{ errorMessage }}</p>
              <button
                @click="loadTests"
                class="mt-2 text-sm text-red-600 hover:text-red-500 underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="flex items-center justify-center py-12">
          <div class="flex items-center space-x-2">
            <svg
              class="animate-spin h-5 w-5 text-blue-600"
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
            <span class="text-gray-600">Loading your tests...</span>
          </div>
        </div>

        <!-- Test List -->
        <TestList
          v-if="!isLoading"
          :tests="filteredTests"
          @test-deleted="handleTestDeleted"
          @test-updated="handleTestUpdated"
        />
        
        <!-- No Results Message -->
        <div
          v-if="!isLoading && searchQuery && filteredTests.length === 0"
          class="bg-white rounded-lg shadow p-8 text-center"
        >
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
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">No tests found</h3>
          <p class="mt-1 text-sm text-gray-500">
            No tests match your search "{{ searchQuery }}"
          </p>
          <button
            @click="searchQuery = ''"
            class="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Clear search
          </button>
        </div>
      </div>

      <!-- Create Test Modal -->
      <CreateTestModal
        :is-open="showCreateModal"
        @close="closeCreateModal"
        @test-created="handleTestCreated"
      />

      <!-- Deleting Test Progress Modal -->
      <div
        v-if="isDeletingTest"
        class="fixed inset-0 z-60 overflow-y-auto"
        aria-labelledby="deletion-progress-modal"
        role="dialog"
        aria-modal="true"
      >
        <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <!-- Background overlay - non-clickable -->
          <div class="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" aria-hidden="true"></div>

          <!-- Center modal -->
          <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

          <div class="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full sm:p-6">
            <div>
              <!-- Spinner Icon -->
              <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
                <svg
                  class="animate-spin h-10 w-10 text-red-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              
              <!-- Title -->
              <div class="mt-4 text-center">
                <h3 class="text-lg leading-6 font-medium text-gray-900">
                  Deleting Test
                </h3>
                <div class="mt-2">
                  <p class="text-sm font-medium text-gray-700">
                    "{{ deletingTestTitle }}"
                  </p>
                </div>
              </div>

              <!-- Info Message -->
              <div class="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                <p class="text-sm text-red-800">
                  Please wait while the system deletes the test and all related data (questions, answer choices, versions)...
                </p>
                <p class="text-xs text-red-600 mt-2">
                  This may take a moment for tests with many versions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
/* Additional styles if needed */
</style>
