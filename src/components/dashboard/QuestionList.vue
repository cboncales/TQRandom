<script setup>
import { ref, computed } from "vue";
import DeleteConfirmationModal from "./DeleteConfirmationModal.vue";

const props = defineProps({
  questions: {
    type: Array,
    required: true,
  },
  selectedQuestions: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["edit-question", "delete-question", "toggle-selection"]);

const showDeleteConfirm = ref(null);
const deleteQuestionId = ref(null);

const editQuestion = (question) => {
  emit("edit-question", question);
};

const confirmDelete = (questionId) => {
  deleteQuestionId.value = questionId;
  showDeleteConfirm.value = true;
};

const handleDeleteConfirm = (questionId) => {
  emit("delete-question", questionId);
  cancelDelete();
};

const cancelDelete = () => {
  showDeleteConfirm.value = false;
  deleteQuestionId.value = null;
};

const getCorrectAnswers = (options) => {
  return options.filter((option) => option.isCorrect);
};

const isQuestionSelected = (question) => {
  return props.selectedQuestions.some((q) => q.id === question.id);
};

const toggleSelection = (question) => {
  emit("toggle-selection", question);
};
</script>

<template>
  <div class="bg-white shadow overflow-hidden sm:rounded-md">
    <div class="px-4 py-5 sm:px-6">
      <h3 class="text-base sm:text-lg leading-6 font-medium text-gray-900">Questions</h3>
      <p class="mt-1 max-w-2xl text-xs sm:text-sm text-gray-500">
        Manage questions for this test
      </p>
    </div>

    <ul class="divide-y divide-gray-200">
      <li
        v-for="(question, index) in questions"
        :key="question.id"
        class="px-3 sm:px-4 py-4 sm:py-6 transition-colors duration-200"
        :class="isQuestionSelected(question) ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''"
      >
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0">
          <div class="flex-1 min-w-0">
            <!-- Question Number and Text -->
            <div class="flex items-start">
              <!-- Selection Checkbox -->
              <input
                type="checkbox"
                :checked="isQuestionSelected(question)"
                @change="toggleSelection(question)"
                class="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer mt-1.5 mr-2 sm:mr-3"
              />
              <span
                class="shrink-0 inline-flex items-center justify-center h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-blue-100 text-blue-800 text-xs sm:text-sm font-medium mr-2 sm:mr-3"
              >
                {{ index + 1 }}
              </span>
              <div class="flex-1">
                <h4 class="text-sm sm:text-base md:text-lg font-medium text-gray-900 mb-2 sm:mb-3">
                  {{ question.question }}
                </h4>

                <!-- Question Image -->
                <div v-if="question.imageUrl" class="mb-3 sm:mb-4">
                  <img 
                    :src="question.imageUrl" 
                    alt="Question image"
                    class="max-w-full sm:max-w-md h-auto rounded-lg shadow-md border border-gray-200"
                    @error="(e) => e.target.style.display='none'"
                  />
                </div>

                <!-- Question Type Badge -->
                <span
                  class="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mb-2 sm:mb-3"
                >
                  {{ question.type }}
                </span>

                <!-- Multiple Choice Options -->
                <div v-if="question.type === 'multiple-choice'" class="mb-3 sm:mb-4">
                  <h5 class="text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Answer Options:
                  </h5>
                  <div class="space-y-2">
                    <div
                      v-for="option in question.options"
                      :key="option.id"
                      class="flex items-start p-2 rounded border"
                      :class="
                        option.isCorrect
                          ? 'bg-green-50 border-green-200'
                          : 'bg-gray-50 border-gray-200'
                      "
                    >
                      <span
                        class="shrink-0 h-4 w-4 rounded-full mr-3 mt-0.5 flex items-center justify-center"
                        :class="
                          option.isCorrect ? 'bg-green-500' : 'bg-gray-300'
                        "
                      >
                        <svg
                          v-if="option.isCorrect"
                          class="h-3 w-3 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clip-rule="evenodd"
                          />
                        </svg>
                      </span>
                      <div class="flex-1">
                        <span
                          class="text-xs sm:text-sm"
                          :class="
                            option.isCorrect
                              ? 'text-green-800 font-medium'
                              : 'text-gray-700'
                          "
                        >
                          {{ option.text }}
                        </span>
                        <!-- Choice Image -->
                        <img 
                          v-if="option.imageUrl" 
                          :src="option.imageUrl" 
                          alt="Choice image"
                          class="mt-2 max-w-full sm:max-w-xs h-auto rounded-md shadow-sm border border-gray-200"
                          @error="(e) => e.target.style.display='none'"
                        />
                      </div>
                    </div>
                  </div>

                  <!-- Correct Answer Summary -->
                  <div class="mt-3 text-xs sm:text-sm text-gray-600">
                    <strong>Correct answer(s): </strong>
                    <span class="text-green-600 font-medium">
                      {{
                        getCorrectAnswers(question.options)
                          .map((opt) => opt.text)
                          .join(", ")
                      }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center gap-2 sm:ml-4 ml-0 self-end sm:self-start">
            <button
              @click="editQuestion(question)"
              class="p-1.5 sm:p-2 bg-gray-100 text-blue-500 shadow hover:bg-gray-200 rounded-md transition-colors duration-200"
              title="Edit question"
            >
              <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              @click="confirmDelete(question.id)"
              class="p-1.5 sm:p-2 bg-gray-100 text-red-500 shadow hover:bg-gray-200 rounded-md transition-colors duration-200"
              title="Delete question"
            >
              <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </li>

      <!-- Empty State -->
      <li v-if="questions.length === 0" class="px-4 py-8 sm:px-6 text-center">
        <div class="text-gray-500">
          <svg
            class="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400"
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
          <h3 class="mt-2 text-xs sm:text-sm font-medium text-gray-900">No questions</h3>
          <p class="mt-1 text-xs sm:text-sm text-gray-500">
            Get started by adding your first question.
          </p>
        </div>
      </li>
    </ul>
  </div>

  <!-- Delete Confirmation Modal -->
  <DeleteConfirmationModal
    :isOpen="showDeleteConfirm"
    :itemId="deleteQuestionId"
    title="Delete Question"
    message="Are you sure you want to delete this question? This action cannot be undone."
    @close="cancelDelete"
    @confirm="handleDeleteConfirm"
  />
</template>

<style scoped>
/* Additional styles if needed */
</style>
