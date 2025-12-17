<script setup>
import { ref, computed, watch } from "vue";
import api from "@/services/api";

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["close", "template-created"]);

// Form data
const currentStep = ref(1);
const totalSteps = 3;
const templateName = ref("");
const subject = ref("");
const gradeLevel = ref("");
const description = ref("");
const totalItems = ref(50);

// Cognitive levels
const cognitivePercentages = ref({
  remembering: 20,
  understanding: 20,
  applying: 20,
  analyzing: 20,
  evaluating: 10,
  creating: 10,
});

// Topics
const topics = ref([]);
const newTopicName = ref("");
const newTopicItems = ref(10);
const editingTopicIndex = ref(null);
const tempCognitiveLevels = ref({
  remembering: 0,
  understanding: 0,
  applying: 0,
  analyzing: 0,
  evaluating: 0,
  creating: 0
});

// Validation
const errors = ref({});
const isSaving = ref(false);

// Computed
const totalPercentage = computed(() => {
  return Object.values(cognitivePercentages.value).reduce((sum, val) => sum + val, 0);
});

const topicsItemsTotal = computed(() => {
  return topics.value.reduce((sum, topic) => sum + parseInt(topic.total_items || 0), 0);
});

const isStep1Valid = computed(() => {
  return templateName.value.trim() && totalItems.value > 0;
});

const isStep2Valid = computed(() => {
  return Math.abs(totalPercentage.value - 100) < 0.01;
});

const isStep3Valid = computed(() => {
  if (topics.value.length === 0 || topicsItemsTotal.value !== totalItems.value) {
    return false;
  }
  
  // Check that each topic's cognitive levels sum equals its total items
  return topics.value.every(topic => getCognitiveItemsTotal(topic) === topic.total_items);
});

// Watch for modal open/close
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    resetForm();
  }
});

// Reset form
const resetForm = () => {
  currentStep.value = 1;
  templateName.value = "";
  subject.value = "";
  gradeLevel.value = "";
  description.value = "";
  totalItems.value = 50;
  cognitivePercentages.value = {
    remembering: 20,
    understanding: 20,
    applying: 20,
    analyzing: 20,
    evaluating: 10,
    creating: 10,
  };
  topics.value = [];
  errors.value = {};
  isSaving.value = false;
};

// Navigation
const nextStep = () => {
  if (currentStep.value === 1 && !isStep1Valid.value) {
    errors.value.step1 = "Please fill in all required fields";
    return;
  }
  if (currentStep.value === 2 && !isStep2Valid.value) {
    errors.value.step2 = "Cognitive levels must sum to 100%";
    return;
  }
  errors.value = {};
  if (currentStep.value < totalSteps) {
    currentStep.value++;
  }
};

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
};

// Topics management
const addTopic = () => {
  if (!newTopicName.value.trim()) {
    return;
  }

  const topicItems = parseInt(newTopicItems.value) || 0;
  const topicPercentage = totalItems.value > 0 ? (topicItems / totalItems.value) * 100 : 0;

  // Initialize with suggested distribution based on Step 2 percentages
  // Use floor to avoid exceeding total when rounding
  const levels = ['remembering', 'understanding', 'applying', 'analyzing', 'evaluating', 'creating'];
  let allocated = 0;
  const cognitiveItems = {};
  
  levels.forEach((level, idx) => {
    if (idx === levels.length - 1) {
      cognitiveItems[`items_${level}`] = topicItems - allocated;
    } else {
      const items = Math.floor(topicItems * (cognitivePercentages.value[level] / 100));
      cognitiveItems[`items_${level}`] = items;
      allocated += items;
    }
  });

  const topicData = {
    topic_name: newTopicName.value.trim(),
    num_sessions: 1, // Keep for backward compatibility
    percentage: parseFloat(topicPercentage.toFixed(2)),
    total_items: topicItems,
    ...cognitiveItems,
    isExpanded: true, // Auto-expand for editing cognitive levels
  };

  topics.value.push(topicData);
  
  // Reset inputs
  newTopicName.value = "";
  newTopicItems.value = 10;
};

const toggleTopicExpanded = (index) => {
  topics.value[index].isExpanded = !topics.value[index].isExpanded;
};

const updateTopicCognitiveLevels = (index, level, value) => {
  const numValue = parseInt(value) || 0;
  topics.value[index][`items_${level}`] = numValue;
};

const getCognitiveItemsTotal = (topic) => {
  return (
    (topic.items_remembering || 0) +
    (topic.items_understanding || 0) +
    (topic.items_applying || 0) +
    (topic.items_analyzing || 0) +
    (topic.items_evaluating || 0) +
    (topic.items_creating || 0)
  );
};

const removeTopic = (index) => {
  topics.value.splice(index, 1);
};

// Auto-distribute items evenly
const autoDistributeItems = () => {
  if (topics.value.length === 0) return;
  
  const count = topics.value.length;
  const itemsPerTopic = Math.floor(totalItems.value / count);
  const remainder = totalItems.value % count;

  topics.value.forEach((topic, index) => {
    const topicItems = index < remainder ? itemsPerTopic + 1 : itemsPerTopic;
    topic.total_items = topicItems;
    topic.percentage = parseFloat(((topicItems / totalItems.value) * 100).toFixed(2));
    
    // Recalculate items per cognitive level based on Step 2 distribution
    // Use floor to avoid exceeding total
    const levels = ['remembering', 'understanding', 'applying', 'analyzing', 'evaluating', 'creating'];
    let allocated = 0;
    
    levels.forEach((level, idx) => {
      if (idx === levels.length - 1) {
        topic[`items_${level}`] = topicItems - allocated;
      } else {
        const items = Math.floor(topicItems * (cognitivePercentages.value[level] / 100));
        topic[`items_${level}`] = items;
        allocated += items;
      }
    });
  });
};

// Auto-distribute cognitive levels for a specific topic
const autoDistributeTopicCognitive = (index) => {
  const topic = topics.value[index];
  const totalItems = topic.total_items;
  
  // Use floor for all items to avoid exceeding total
  const levels = ['remembering', 'understanding', 'applying', 'analyzing', 'evaluating', 'creating'];
  let allocated = 0;
  
  levels.forEach((level, idx) => {
    if (idx === levels.length - 1) {
      // Last level gets the remainder
      topic[`items_${level}`] = totalItems - allocated;
    } else {
      const items = Math.floor(totalItems * (cognitivePercentages.value[level] / 100));
      topic[`items_${level}`] = items;
      allocated += items;
    }
  });
};

// Save template
const saveTemplate = async () => {
  if (!isStep3Valid.value) {
    errors.value.step3 = "Each topic must have cognitive levels that sum to its total items, and all topics must sum to " + totalItems.value + " total items";
    return;
  }

  isSaving.value = true;
  errors.value = {};

  try {
    const templateData = {
      template_name: templateName.value.trim(),
      description: description.value.trim() || null,
      subject: subject.value.trim() || null,
      grade_level: gradeLevel.value.trim() || null,
      total_items: parseInt(totalItems.value),
      percentage_remembering: cognitivePercentages.value.remembering,
      percentage_understanding: cognitivePercentages.value.understanding,
      percentage_applying: cognitivePercentages.value.applying,
      percentage_analyzing: cognitivePercentages.value.analyzing,
      percentage_evaluating: cognitivePercentages.value.evaluating,
      percentage_creating: cognitivePercentages.value.creating,
      topics: topics.value,
    };

    const result = await api.tosApi.createTOSTemplate(templateData);
    if (result.error) {
      throw new Error(result.error);
    }
    emit("template-created");
  } catch (error) {
    console.error("Error creating TOS template:", error);
    errors.value.save = error.message || "Failed to create TOS template";
  } finally {
    isSaving.value = false;
  }
};

const close = () => {
  emit("close");
};
</script>

<template>
  <Teleport to="body">
    <transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-[9999] overflow-y-auto"
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
      >
        <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <!-- Background overlay -->
          <div
            class="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 transition-opacity"
            aria-hidden="true"
            @click="close"
          ></div>

          <!-- Center modal -->
          <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

          <div
            class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full relative z-10"
          >
          <!-- Header -->
          <div class="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-xl font-semibold text-white">
                  Create Table of Specifications
                </h3>
                <p class="mt-1 text-sm text-blue-100">
                  Step {{ currentStep }} of {{ totalSteps }}
                </p>
              </div>
              <button
                @click="close"
                class="text-white hover:text-blue-100 transition-colors duration-200"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <!-- Progress Bar -->
            <div class="mt-4 bg-blue-800 rounded-full h-2">
              <div
                class="bg-white rounded-full h-2 transition-all duration-300"
                :style="{ width: `${(currentStep / totalSteps) * 100}%` }"
              ></div>
            </div>
          </div>

          <!-- Body -->
          <div class="px-6 py-6 max-h-[60vh] overflow-y-auto">
            <!-- Step 1: Basic Information -->
            <div v-show="currentStep === 1">
              <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Basic Information
              </h4>
              
              <div class="space-y-4">
                <!-- Template Name -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Template Name <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="templateName"
                    type="text"
                    placeholder="e.g., Algebra TOS - 1st Quarter"
                    class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <!-- Subject -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Subject
                  </label>
                  <input
                    v-model="subject"
                    type="text"
                    placeholder="e.g., Mathematics, Science, English"
                    class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <!-- Grade Level -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Grade Level
                  </label>
                  <select
                    v-model="gradeLevel"
                    class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select grade level</option>
                    <option value="Grade 7">Grade 7</option>
                    <option value="Grade 8">Grade 8</option>
                    <option value="Grade 9">Grade 9</option>
                    <option value="Grade 10">Grade 10</option>
                    <option value="Grade 11">Grade 11</option>
                    <option value="Grade 12">Grade 12</option>
                    <option value="College">College</option>
                  </select>
                </div>

                <!-- Total Items -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Total Test Items <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model.number="totalItems"
                    type="number"
                    min="1"
                    max="200"
                    placeholder="50"
                    class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Total number of questions in the test
                  </p>
                </div>

                <!-- Description -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    v-model="description"
                    rows="3"
                    placeholder="Brief description of this TOS template..."
                    class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  ></textarea>
                </div>
              </div>

              <div v-if="errors.step1" class="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p class="text-sm text-red-600 dark:text-red-400">{{ errors.step1 }}</p>
              </div>
            </div>

            <!-- Step 2: Cognitive Levels (Bloom's Taxonomy) -->
            <div v-show="currentStep === 2">
              <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Cognitive Levels Distribution
              </h4>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Based on Bloom's Taxonomy. Percentages must total 100%.
              </p>

              <div class="space-y-4">
                <!-- Remembering -->
                <div class="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                  <div class="flex items-center justify-between mb-2">
                    <div>
                      <label class="block text-sm font-medium text-gray-900 dark:text-white">
                        Remembering
                      </label>
                      <p class="text-xs text-gray-500 dark:text-gray-400">
                        Recall facts, terms, basic concepts
                      </p>
                    </div>
                    <span class="text-lg font-semibold text-blue-600">
                      {{ cognitivePercentages.remembering }}%
                    </span>
                  </div>
                  <input
                    v-model.number="cognitivePercentages.remembering"
                    type="range"
                    min="0"
                    max="100"
                    class="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>

                <!-- Understanding -->
                <div class="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                  <div class="flex items-center justify-between mb-2">
                    <div>
                      <label class="block text-sm font-medium text-gray-900 dark:text-white">
                        Understanding
                      </label>
                      <p class="text-xs text-gray-500 dark:text-gray-400">
                        Explain ideas, comprehend meanings
                      </p>
                    </div>
                    <span class="text-lg font-semibold text-green-600">
                      {{ cognitivePercentages.understanding }}%
                    </span>
                  </div>
                  <input
                    v-model.number="cognitivePercentages.understanding"
                    type="range"
                    min="0"
                    max="100"
                    class="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-green-600"
                  />
                </div>

                <!-- Applying -->
                <div class="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                  <div class="flex items-center justify-between mb-2">
                    <div>
                      <label class="block text-sm font-medium text-gray-900 dark:text-white">
                        Applying
                      </label>
                      <p class="text-xs text-gray-500 dark:text-gray-400">
                        Use information in new situations
                      </p>
                    </div>
                    <span class="text-lg font-semibold text-yellow-600">
                      {{ cognitivePercentages.applying }}%
                    </span>
                  </div>
                  <input
                    v-model.number="cognitivePercentages.applying"
                    type="range"
                    min="0"
                    max="100"
                    class="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-yellow-600"
                  />
                </div>

                <!-- Analyzing -->
                <div class="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                  <div class="flex items-center justify-between mb-2">
                    <div>
                      <label class="block text-sm font-medium text-gray-900 dark:text-white">
                        Analyzing
                      </label>
                      <p class="text-xs text-gray-500 dark:text-gray-400">
                        Break down information, identify relationships
                      </p>
                    </div>
                    <span class="text-lg font-semibold text-orange-600">
                      {{ cognitivePercentages.analyzing }}%
                    </span>
                  </div>
                  <input
                    v-model.number="cognitivePercentages.analyzing"
                    type="range"
                    min="0"
                    max="100"
                    class="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-orange-600"
                  />
                </div>

                <!-- Evaluating -->
                <div class="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                  <div class="flex items-center justify-between mb-2">
                    <div>
                      <label class="block text-sm font-medium text-gray-900 dark:text-white">
                        Evaluating
                      </label>
                      <p class="text-xs text-gray-500 dark:text-gray-400">
                        Make judgments, critique ideas
                      </p>
                    </div>
                    <span class="text-lg font-semibold text-red-600">
                      {{ cognitivePercentages.evaluating }}%
                    </span>
                  </div>
                  <input
                    v-model.number="cognitivePercentages.evaluating"
                    type="range"
                    min="0"
                    max="100"
                    class="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-red-600"
                  />
                </div>

                <!-- Creating -->
                <div class="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                  <div class="flex items-center justify-between mb-2">
                    <div>
                      <label class="block text-sm font-medium text-gray-900 dark:text-white">
                        Creating
                      </label>
                      <p class="text-xs text-gray-500 dark:text-gray-400">
                        Produce new work, design solutions
                      </p>
                    </div>
                    <span class="text-lg font-semibold text-purple-600">
                      {{ cognitivePercentages.creating }}%
                    </span>
                  </div>
                  <input
                    v-model.number="cognitivePercentages.creating"
                    type="range"
                    min="0"
                    max="100"
                    class="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                </div>

                <!-- Total -->
                <div class="mt-4 p-4 rounded-lg" :class="totalPercentage === 100 ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'">
                  <div class="flex items-center justify-between">
                    <span class="text-sm font-medium" :class="totalPercentage === 100 ? 'text-green-700 dark:text-green-400' : 'text-yellow-700 dark:text-yellow-400'">
                      Total Percentage
                    </span>
                    <span class="text-2xl font-bold" :class="totalPercentage === 100 ? 'text-green-700 dark:text-green-400' : 'text-yellow-700 dark:text-yellow-400'">
                      {{ totalPercentage }}%
                    </span>
                  </div>
                  <p v-if="totalPercentage !== 100" class="mt-1 text-xs text-yellow-600 dark:text-yellow-400">
                    Adjust sliders to reach exactly 100%
                  </p>
                </div>
              </div>

              <div v-if="errors.step2" class="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p class="text-sm text-red-600 dark:text-red-400">{{ errors.step2 }}</p>
              </div>
            </div>

            <!-- Step 3: Topics Breakdown -->
            <div v-show="currentStep === 3">
              <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Topics Breakdown
              </h4>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Add topics covered in the test. Total percentages must equal 100%.
              </p>

              <!-- Add Topic Form -->
              <div class="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg mb-4">
                <h5 class="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Add New Topic
                </h5>
                <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div class="md:col-span-3">
                    <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Topic Name
                    </label>
                    <input
                      v-model="newTopicName"
                      type="text"
                      placeholder="e.g., Linear Equations, Cell Division"
                      class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      @keyup.enter="addTopic"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Number of Items
                    </label>
                    <input
                      v-model.number="newTopicItems"
                      type="number"
                      min="1"
                      :max="totalItems"
                      placeholder="10"
                      class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Specify how many test questions should be generated for this topic. Total items across all topics must equal {{ totalItems }}.
                </p>
                <div class="mt-3 flex gap-2">
                  <button
                    @click="addTopic"
                    class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                  >
                    <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Add Topic
                  </button>
                  <button
                    v-if="topics.length > 0"
                    @click="autoDistributeItems"
                    class="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                    title="Distribute items evenly across all topics"
                  >
                    Auto-Distribute Items
                  </button>
                </div>
              </div>

              <!-- Topics List -->
              <div v-if="topics.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
                <svg class="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <p class="text-sm">No topics added yet</p>
              </div>

              <div v-else class="space-y-3 max-h-96 overflow-y-auto">
                <div
                  v-for="(topic, index) in topics"
                  :key="index"
                  class="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
                >
                  <div class="p-4">
                    <div class="flex items-start justify-between">
                      <div class="flex-1">
                        <div class="flex items-center gap-3 mb-2">
                          <button
                            @click="toggleTopicExpanded(index)"
                            class="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                          >
                            <svg class="w-4 h-4 transition-transform" :class="{ 'rotate-90': topic.isExpanded }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                          <h5 class="font-medium text-gray-900 dark:text-white">
                            {{ topic.topic_name }}
                          </h5>
                          <span class="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-semibold rounded-full">
                            {{ topic.total_items }} items
                          </span>
                          <span class="px-2 py-1 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs rounded-full">
                            {{ topic.percentage }}%
                          </span>
                        </div>
                        <div class="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                          <div class="flex flex-wrap gap-2 mt-1 ml-9">
                            <span v-if="topic.items_remembering > 0" class="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                              Remembering: {{ topic.items_remembering }}
                            </span>
                            <span v-if="topic.items_understanding > 0" class="px-2 py-0.5 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
                              Understanding: {{ topic.items_understanding }}
                            </span>
                            <span v-if="topic.items_applying > 0" class="px-2 py-0.5 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded">
                              Applying: {{ topic.items_applying }}
                            </span>
                            <span v-if="topic.items_analyzing > 0" class="px-2 py-0.5 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded">
                              Analyzing: {{ topic.items_analyzing }}
                            </span>
                            <span v-if="topic.items_evaluating > 0" class="px-2 py-0.5 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded">
                              Evaluating: {{ topic.items_evaluating }}
                            </span>
                            <span v-if="topic.items_creating > 0" class="px-2 py-0.5 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                              Creating: {{ topic.items_creating }}
                            </span>
                          </div>
                          <!-- Validation warning -->
                          <div v-if="getCognitiveItemsTotal(topic) !== topic.total_items" class="ml-9 mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                            <p class="text-xs text-yellow-700 dark:text-yellow-400">
                              ⚠️ Cognitive items ({{ getCognitiveItemsTotal(topic) }}) must equal total items ({{ topic.total_items }})
                            </p>
                          </div>
                        </div>
                      </div>
                      <button
                        @click="removeTopic(index)"
                        class="ml-2 p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors duration-200"
                      >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <!-- Cognitive Levels Assignment (Expandable) -->
                  <div v-if="topic.isExpanded" class="border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 p-4">
                    <div class="flex items-center justify-between mb-3">
                      <h6 class="text-sm font-medium text-gray-900 dark:text-white">
                        Assign Cognitive Levels
                      </h6>
                      <button
                        @click="autoDistributeTopicCognitive(index)"
                        class="text-xs px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                        title="Auto-distribute based on Step 2 percentages"
                      >
                        Auto-Fill
                      </button>
                    </div>
                    <p class="text-xs text-gray-600 dark:text-gray-400 mb-3">
                      Specify how many items for each cognitive level (Bloom's Taxonomy).
                    </p>
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div>
                        <label class="block text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
                          Remembering
                        </label>
                        <input
                          :value="topic.items_remembering"
                          @input="updateTopicCognitiveLevels(index, 'remembering', $event.target.value)"
                          type="number"
                          min="0"
                          :max="topic.total_items"
                          class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-green-700 dark:text-green-300 mb-1">
                          Understanding
                        </label>
                        <input
                          :value="topic.items_understanding"
                          @input="updateTopicCognitiveLevels(index, 'understanding', $event.target.value)"
                          type="number"
                          min="0"
                          :max="topic.total_items"
                          class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-yellow-700 dark:text-yellow-300 mb-1">
                          Applying
                        </label>
                        <input
                          :value="topic.items_applying"
                          @input="updateTopicCognitiveLevels(index, 'applying', $event.target.value)"
                          type="number"
                          min="0"
                          :max="topic.total_items"
                          class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500"
                        />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-orange-700 dark:text-orange-300 mb-1">
                          Analyzing
                        </label>
                        <input
                          :value="topic.items_analyzing"
                          @input="updateTopicCognitiveLevels(index, 'analyzing', $event.target.value)"
                          type="number"
                          min="0"
                          :max="topic.total_items"
                          class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-red-700 dark:text-red-300 mb-1">
                          Evaluating
                        </label>
                        <input
                          :value="topic.items_evaluating"
                          @input="updateTopicCognitiveLevels(index, 'evaluating', $event.target.value)"
                          type="number"
                          min="0"
                          :max="topic.total_items"
                          class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-purple-700 dark:text-purple-300 mb-1">
                          Creating
                        </label>
                        <input
                          :value="topic.items_creating"
                          @input="updateTopicCognitiveLevels(index, 'creating', $event.target.value)"
                          type="number"
                          min="0"
                          :max="topic.total_items"
                          class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Total Items -->
              <div v-if="topics.length > 0" class="mt-4 p-4 rounded-lg" :class="topicsItemsTotal === totalItems ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium" :class="topicsItemsTotal === totalItems ? 'text-green-700 dark:text-green-400' : 'text-yellow-700 dark:text-yellow-400'">
                    Total Items Across Topics
                  </span>
                  <span class="text-2xl font-bold" :class="topicsItemsTotal === totalItems ? 'text-green-700 dark:text-green-400' : 'text-yellow-700 dark:text-yellow-400'">
                    {{ topicsItemsTotal }} / {{ totalItems }}
                  </span>
                </div>
                <p v-if="topicsItemsTotal !== totalItems" class="mt-1 text-xs text-yellow-600 dark:text-yellow-400">
                  {{ topicsItemsTotal < totalItems ? `Add ${totalItems - topicsItemsTotal} more items` : `Remove ${topicsItemsTotal - totalItems} items` }} to match total test items
                </p>
              </div>

              <div v-if="errors.step3" class="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p class="text-sm text-red-600 dark:text-red-400">{{ errors.step3 }}</p>
              </div>
              <div v-if="errors.save" class="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p class="text-sm text-red-600 dark:text-red-400">{{ errors.save }}</p>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 flex items-center justify-between">
            <button
              v-if="currentStep > 1"
              @click="prevStep"
              class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
            >
              <svg class="w-5 h-5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>
            <div v-else></div>

            <div class="flex items-center gap-2">
              <button
                @click="close"
                class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                v-if="currentStep < totalSteps"
                @click="nextStep"
                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
              >
                Next
                <svg class="w-5 h-5 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                v-else
                @click="saveTemplate"
                :disabled="isSaving || !isStep3Valid"
                class="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200 flex items-center"
              >
                <svg v-if="isSaving" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ isSaving ? 'Creating...' : 'Create Template' }}
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
