<script setup>
import { computed } from "vue";

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  template: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["close"]);

const close = () => {
  emit("close");
};

const cognitiveData = computed(() => {
  if (!props.template) return [];
  return [
    { level: 'Remembering', percentage: props.template.percentage_remembering, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-900/30' },
    { level: 'Understanding', percentage: props.template.percentage_understanding, color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-50 dark:bg-green-900/30' },
    { level: 'Applying', percentage: props.template.percentage_applying, color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-50 dark:bg-yellow-900/30' },
    { level: 'Analyzing', percentage: props.template.percentage_analyzing, color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-50 dark:bg-orange-900/30' },
    { level: 'Evaluating', percentage: props.template.percentage_evaluating, color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-50 dark:bg-red-900/30' },
    { level: 'Creating', percentage: props.template.percentage_creating, color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-50 dark:bg-purple-900/30' },
  ];
});

const topics = computed(() => {
  return props.template?.tos_template_topics || [];
});
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-300"
      leave-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-[9999] overflow-y-auto"
        @click.self="close"
      >
        <!-- Backdrop with blur -->
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>

        <!-- Modal -->
        <div class="flex min-h-full items-center justify-center p-4">
          <Transition
            enter-active-class="transition-all duration-300"
            leave-active-class="transition-all duration-200"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
          >
            <div
              v-if="isOpen"
              class="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col"
              @click.stop
            >
              <!-- Header -->
              <div class="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-lg">
                <div class="flex items-center justify-between">
                  <div class="flex-1">
                    <h2 class="text-2xl font-bold text-white">
                      {{ template?.template_name }}
                    </h2>
                    <div class="mt-2 flex flex-wrap gap-2">
                      <span
                        v-if="template?.subject"
                        class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 text-white"
                      >
                        📚 {{ template.subject }}
                      </span>
                      <span
                        v-if="template?.grade_level"
                        class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 text-white"
                      >
                        🎓 {{ template.grade_level }}
                      </span>
                      <span
                        class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 text-white"
                      >
                        📝 {{ template?.total_items }} Items
                      </span>
                    </div>
                  </div>
                  <button
                    @click="close"
                    class="ml-4 p-2 hover:bg-white/10 rounded-lg transition-colors duration-200"
                  >
                    <svg
                      class="w-6 h-6 text-white"
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

              <!-- Body -->
              <div class="flex-1 overflow-y-auto px-6 py-6">
                <!-- Description -->
                <div v-if="template?.description" class="mb-6">
                  <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </h3>
                  <p class="text-gray-600 dark:text-gray-400">
                    {{ template.description }}
                  </p>
                </div>

                <!-- Topics Breakdown -->
                <div v-if="topics.length > 0">
                  <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Topics Breakdown
                  </h3>
                  <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead class="bg-gray-50 dark:bg-gray-900/50">
                        <tr>
                          <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Topic Name
                          </th>
                          <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Items
                          </th>
                          <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            %
                          </th>
                          <th class="px-4 py-3 text-center text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                            <div>R</div>
                            <div class="text-[10px] font-normal text-gray-500 dark:text-gray-400">{{ template?.percentage_remembering }}%</div>
                          </th>
                          <th class="px-4 py-3 text-center text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wider">
                            <div>U</div>
                            <div class="text-[10px] font-normal text-gray-500 dark:text-gray-400">{{ template?.percentage_understanding }}%</div>
                          </th>
                          <th class="px-4 py-3 text-center text-xs font-medium text-yellow-600 dark:text-yellow-400 uppercase tracking-wider">
                            <div>Ap</div>
                            <div class="text-[10px] font-normal text-gray-500 dark:text-gray-400">{{ template?.percentage_applying }}%</div>
                          </th>
                          <th class="px-4 py-3 text-center text-xs font-medium text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                            <div>An</div>
                            <div class="text-[10px] font-normal text-gray-500 dark:text-gray-400">{{ template?.percentage_analyzing }}%</div>
                          </th>
                          <th class="px-4 py-3 text-center text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wider">
                            <div>E</div>
                            <div class="text-[10px] font-normal text-gray-500 dark:text-gray-400">{{ template?.percentage_evaluating }}%</div>
                          </th>
                          <th class="px-4 py-3 text-center text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                            <div>C</div>
                            <div class="text-[10px] font-normal text-gray-500 dark:text-gray-400">{{ template?.percentage_creating }}%</div>
                          </th>
                        </tr>
                      </thead>
                      <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        <tr
                          v-for="(topic, index) in topics"
                          :key="index"
                          class="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        >
                          <td class="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                            {{ topic.topic_name }}
                          </td>
                          <td class="px-4 py-3 text-center">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                              {{ topic.total_items }}
                            </span>
                          </td>
                          <td class="px-4 py-3 text-center text-sm text-gray-600 dark:text-gray-400">
                            {{ topic.percentage }}%
                          </td>
                          <td class="px-4 py-3 text-center text-sm font-semibold text-blue-600 dark:text-blue-400">
                            {{ topic.items_remembering || 0 }}
                          </td>
                          <td class="px-4 py-3 text-center text-sm font-semibold text-green-600 dark:text-green-400">
                            {{ topic.items_understanding || 0 }}
                          </td>
                          <td class="px-4 py-3 text-center text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                            {{ topic.items_applying || 0 }}
                          </td>
                          <td class="px-4 py-3 text-center text-sm font-semibold text-orange-600 dark:text-orange-400">
                            {{ topic.items_analyzing || 0 }}
                          </td>
                          <td class="px-4 py-3 text-center text-sm font-semibold text-red-600 dark:text-red-400">
                            {{ topic.items_evaluating || 0 }}
                          </td>
                          <td class="px-4 py-3 text-center text-sm font-semibold text-purple-600 dark:text-purple-400">
                            {{ topic.items_creating || 0 }}
                          </td>
                        </tr>
                      </tbody>
                      <tfoot class="bg-gray-100 dark:bg-gray-900/70 border-t-2 border-gray-300 dark:border-gray-600">
                        <tr>
                          <td class="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white">
                            TOTAL
                          </td>
                          <td class="px-4 py-3 text-center">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100">
                              {{ template?.total_items }}
                            </span>
                          </td>
                          <td class="px-4 py-3 text-center text-sm font-bold text-gray-900 dark:text-white">
                            100%
                          </td>
                          <td class="px-4 py-3 text-center text-sm font-bold text-blue-700 dark:text-blue-300">
                            {{ topics.reduce((sum, t) => sum + (t.items_remembering || 0), 0) }}
                          </td>
                          <td class="px-4 py-3 text-center text-sm font-bold text-green-700 dark:text-green-300">
                            {{ topics.reduce((sum, t) => sum + (t.items_understanding || 0), 0) }}
                          </td>
                          <td class="px-4 py-3 text-center text-sm font-bold text-yellow-700 dark:text-yellow-300">
                            {{ topics.reduce((sum, t) => sum + (t.items_applying || 0), 0) }}
                          </td>
                          <td class="px-4 py-3 text-center text-sm font-bold text-orange-700 dark:text-orange-300">
                            {{ topics.reduce((sum, t) => sum + (t.items_analyzing || 0), 0) }}
                          </td>
                          <td class="px-4 py-3 text-center text-sm font-bold text-red-700 dark:text-red-300">
                            {{ topics.reduce((sum, t) => sum + (t.items_evaluating || 0), 0) }}
                          </td>
                          <td class="px-4 py-3 text-center text-sm font-bold text-purple-700 dark:text-purple-300">
                            {{ topics.reduce((sum, t) => sum + (t.items_creating || 0), 0) }}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>

              <!-- Footer -->
              <div class="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 rounded-b-lg">
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-500 dark:text-gray-400">
                    Created on {{ template ? new Date(template.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '' }}
                  </span>
                  <button
                    @click="close"
                    class="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
