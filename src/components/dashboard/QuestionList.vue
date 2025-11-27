<script setup>
import { ref, computed } from "vue";
import DeleteConfirmationModal from "./DeleteConfirmationModal.vue";
import { useMathRenderer } from "@/composables/useMathRenderer";

const props = defineProps({
  questions: {
    type: Array,
    required: true,
  },
  selectedQuestions: {
    type: Array,
    default: () => [],
  },
  partDescriptions: {
    type: Array,
    default: () => [],
  },
  directions: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["edit-question", "delete-question", "toggle-selection"]);

const showDeleteConfirm = ref(null);
const deleteQuestionId = ref(null);

// Initialize math renderer
const { renderMath } = useMathRenderer();

// Helper function to get part description by part number
const getPartDescription = (partNumber) => {
  if (!partNumber || !props.partDescriptions || props.partDescriptions.length === 0) {
    return null;
  }
  const index = partNumber - 1; // Part numbers are 1-indexed
  return props.partDescriptions[index] || null;
};

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

// Group questions by part for organized display
const groupedQuestions = computed(() => {
  if (!props.partDescriptions || props.partDescriptions.length === 0) {
    // No parts defined, return all questions in a single group
    return [{
      part: null,
      description: null,
      direction: props.directions && props.directions.length > 0 ? props.directions[0] : null,
      questions: props.questions
    }];
  }

  // Create groups for each part
  const groups = [];
  
  // Add a group for each defined part
  for (let i = 0; i < props.partDescriptions.length; i++) {
    const partNumber = i + 1;
    const questionsInPart = props.questions.filter(q => q.part === partNumber);
    
    if (questionsInPart.length > 0) {
      groups.push({
        part: partNumber,
        description: props.partDescriptions[i],
        direction: props.directions && props.directions[i] ? props.directions[i] : null,
        questions: questionsInPart
      });
    }
  }

  // Add questions without parts at the end (if any)
  const questionsWithoutPart = props.questions.filter(q => !q.part || q.part === null);
  if (questionsWithoutPart.length > 0) {
    groups.push({
      part: null,
      description: 'Unassigned Questions',
      direction: null,
      questions: questionsWithoutPart
    });
  }

  return groups;
});
</script>

<template>
  <div class="bg-white dark:bg-gray-900 shadow overflow-hidden sm:rounded-md">
    <div class="px-4 py-5 sm:px-6">
      <h3 class="text-base sm:text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">Questions</h3>
      <p class="mt-1 max-w-2xl text-xs sm:text-sm text-gray-500 dark:text-gray-300">
        Manage questions for this test
      </p>
    </div>

    <!-- Loop through grouped questions by part -->
    <div v-for="(group, groupIndex) in groupedQuestions" :key="groupIndex">
      <!-- Direction displayed at top when no parts -->
      <div v-if="!group.part && group.direction && !group.description" class="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700">
        <p class="text-sm text-gray-700 dark:text-gray-300 italic">
          {{ group.direction }}
        </p>
      </div>

      <!-- Part Header -->
      <div v-if="group.part" class="bg-indigo-50 dark:bg-indigo-900 px-4 py-3 border-t-2 border-indigo-300 dark:border-indigo-600">
        <h4 class="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">
          {{ group.description }}
        </h4>
        <!-- Direction for this part -->
        <p v-if="group.direction" class="mt-2 text-sm text-gray-700 dark:text-gray-300 italic">
          {{ group.direction }}
        </p>
      </div>
      <!-- Unassigned Questions Header (if any) -->
      <div v-else-if="group.description" class="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-t-2 border-gray-300 dark:border-gray-600">
        <h4 class="text-base sm:text-lg font-bold text-gray-700 dark:text-gray-200">
          {{ group.description }}
        </h4>
      </div>

      <!-- Questions in this part -->
      <ul class="divide-y divide-gray-200">
        <li
          v-for="(question, index) in group.questions"
          :key="question.id"
          class="px-3 sm:px-4 py-4 sm:py-6 transition-colors duration-200"
          :class="isQuestionSelected(question) ? 'bg-blue-50 border-l-4 border-l-blue-500 dark:bg-gray-700 dark:border-l-blue-800' : ''"
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
                <h4 class="text-sm sm:text-base md:text-lg font-medium text-gray-900 dark:text-gray-100 mb-2 sm:mb-3" v-html="renderMath(question.question)">
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
                  class="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100 mb-2 sm:mb-3"
                >
                  {{ question.type }}
                </span>

                <!-- Multiple Choice Options -->
                <div v-if="question.type === 'Multiple Choice'" class="mb-3 sm:mb-4">
                  <h5 class="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-100 mb-2">
                    Answer Options:
                  </h5>
                  <div class="space-y-2">
                    <div
                      v-for="(option, optIndex) in question.options"
                      :key="option.id"
                      class="flex items-start p-2 rounded border"
                      :class="
                        option.isCorrect
                          ? 'bg-green-50 border-green-200 dark:bg-green-900 dark:border-green-700'
                          : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                      "
                    >
                      <span class="shrink-0 font-medium mr-2 text-gray-600 dark:text-gray-300">
                        {{ String.fromCharCode(65 + optIndex) }}.
                      </span>
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
                              ? 'text-green-800 font-medium dark:text-green-100'
                              : 'text-gray-700 dark:text-gray-100'
                          "
                          v-html="renderMath(option.text)"
                        >
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
                  <div class="mt-3 text-xs sm:text-sm text-gray-600 dark:text-gray-100">
                    <strong>Correct answer: </strong>
                    <span class="text-green-600 font-medium dark:text-green-400" v-html="renderMath(getCorrectAnswers(question.options)
                          .map((opt, idx) => {
                            const optIndex = question.options.findIndex(o => o.id === opt.id);
                            return String.fromCharCode(65 + optIndex) + '. ' + opt.text;
                          })
                          .join(', '))">
                    </span>
                  </div>
                </div>

                <!-- True or False Answer -->
                <div v-else-if="question.type === 'True or False'" class="mb-3 sm:mb-4">
                  <div class="p-3 rounded-lg bg-green-50 border border-green-200 dark:bg-green-900 dark:border-green-700">
                    <h5 class="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-100 mb-1">
                      Correct Answer:
                    </h5>
                    <span class="text-sm sm:text-base font-semibold text-green-700 dark:text-green-300" v-html="renderMath(getCorrectAnswers(question.options)[0]?.text || 'Not specified')">
                    </span>
                  </div>
                </div>

                <!-- Identification Answer -->
                <div v-else-if="question.type === 'Identification'" class="mb-3 sm:mb-4">
                  <div class="p-3 rounded-lg bg-green-50 border border-green-200 dark:bg-green-900 dark:border-green-700">
                    <h5 class="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-100 mb-1">
                      Correct Answer:
                    </h5>
                    <span class="text-sm sm:text-base font-semibold text-green-700 dark:text-green-300" v-html="renderMath(getCorrectAnswers(question.options)[0]?.text || 'Not specified')">
                    </span>
                  </div>
                </div>

                <!-- Fill in the Blank Answer -->
                <div v-else-if="question.type === 'Fill in the Blank'" class="mb-3 sm:mb-4">
                  <div class="p-3 rounded-lg bg-green-50 border border-green-200 dark:bg-green-900 dark:border-green-700">
                    <h5 class="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-100 mb-1">
                      Correct Answer:
                    </h5>
                    <span class="text-sm sm:text-base font-semibold text-green-700 dark:text-green-300" v-html="renderMath(getCorrectAnswers(question.options)[0]?.text || 'Not specified')">
                    </span>
                  </div>
                </div>

                <!-- Essay Answer (if provided) -->
                <div v-else-if="question.type === 'Essay' && question.options && question.options.length > 0" class="mb-3 sm:mb-4">
                  <div class="p-3 rounded-lg bg-green-50 border border-green-200 dark:bg-green-900 dark:border-green-700">
                    <h5 class="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-100 mb-1">
                      Sample Answer / Key Points:
                    </h5>
                    <p class="text-xs sm:text-sm text-green-800 dark:text-green-200 whitespace-pre-wrap" v-html="renderMath(question.options[0]?.text || 'No sample answer provided')">
                    </p>
                  </div>
                </div>

                <!-- Matching Type -->
                <div v-else-if="question.type === 'Matching Type'" class="mb-3 sm:mb-4">
                  <div class="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900 dark:to-pink-900 border border-purple-200 dark:border-purple-700">
                    <!-- Headers -->
                    <div class="grid grid-cols-2 gap-4 mb-3 pb-2 border-b-2 border-purple-300 dark:border-purple-600">
                      <h5 class="text-xs sm:text-sm font-bold text-purple-800 dark:text-purple-200">
                        Column A – Questions/Terms
                      </h5>
                      <h5 class="text-xs sm:text-sm font-bold text-purple-800 dark:text-purple-200">
                        Column B – Choices
                      </h5>
                    </div>

                    <!-- Items Grid -->
                    <div class="grid grid-cols-2 gap-4 mb-4">
                      <!-- Column A Items -->
                      <div class="space-y-2">
                        <div
                          v-for="(option, index) in question.options"
                          :key="'a-' + option.id"
                          class="flex items-start gap-2"
                        >
                          <span class="font-semibold text-purple-700 dark:text-purple-300 shrink-0">{{ index + 1 }}.</span>
                          <span class="text-xs sm:text-sm text-gray-800 dark:text-gray-200 border-b border-dotted border-purple-300 dark:border-purple-600 flex-1" v-html="renderMath(option.text)">
                          </span>
                        </div>
                      </div>

                      <!-- Column B Items -->
                      <div class="space-y-2">
                        <div
                          v-for="(option, index) in question.options"
                          :key="'b-' + option.id"
                          class="flex items-start gap-2"
                        >
                          <span class="font-semibold text-purple-700 dark:text-purple-300 shrink-0">{{ String.fromCharCode(97 + index) }}.</span>
                          <span class="text-xs sm:text-sm text-gray-800 dark:text-gray-200" v-html="renderMath(option.matchAnswer || '')">
                          </span>
                        </div>
                      </div>
                    </div>

                    <!-- Answer Key -->
                    <div class="pt-3 border-t border-purple-300 dark:border-purple-600">
                      <h6 class="text-xs font-semibold text-purple-700 dark:text-purple-300 mb-2">Answer Key:</h6>
                      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        <div
                          v-for="(option, index) in question.options"
                          :key="'key-' + option.id"
                          class="text-xs bg-white dark:bg-gray-800 px-2 py-1 rounded border border-purple-200 dark:border-purple-700"
                        >
                          <span class="font-semibold text-purple-700 dark:text-purple-300">{{ index + 1 }}</span>
                          <span class="text-gray-600 dark:text-gray-400 mx-1">=</span>
                          <span class="font-semibold text-purple-700 dark:text-purple-300">{{ String.fromCharCode(97 + index) }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Remove old part badge - now shown as headers -->
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center gap-2 sm:ml-4 ml-0 self-end sm:self-start">
            <button
              @click="editQuestion(question)"
              class="p-1.5 sm:p-2 bg-gray-100 text-blue-500 shadow hover:bg-gray-200 dark:bg-gray-800 dark:text-blue-400 rounded-md transition-colors duration-200"
              title="Edit question"
            >
              <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              @click="confirmDelete(question.id)"
              class="p-1.5 sm:p-2 bg-gray-100 text-red-500 shadow hover:bg-gray-200 dark:bg-gray-800 dark:text-red-400 rounded-md transition-colors duration-200"
              title="Delete question"
            >
              <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </li>
    </ul>
  </div>
  
  <!-- Empty State (shown when no questions at all) -->
  <div v-if="questions.length === 0" class="px-4 py-8 sm:px-6 text-center bg-white dark:bg-gray-900">
    <div class="text-gray-500 dark:text-gray-100">
      <svg
        class="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400 dark:text-gray-100"
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
      <h3 class="mt-2 text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">No questions</h3>
      <p class="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-100">
        Get started by adding your first question.
      </p>
    </div>
  </div>

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
