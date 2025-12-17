<script setup>
import AppLayout from "@/components/layout/AppLayout.vue";
import CreateTOSModal from "@/components/tos/CreateTOSModal.vue";
import EditTOSModal from "@/components/tos/EditTOSModal.vue";
import DeleteTOSConfirmationModal from "@/components/tos/DeleteTOSConfirmationModal.vue";
import TOSDetailModal from "@/components/tos/TOSDetailModal.vue";
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import api from "@/services/api";

const router = useRouter();

const tosTemplates = ref([]);
const isLoading = ref(true);
const errorMessage = ref("");
const searchQuery = ref("");
const showCreateModal = ref(false);
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const showDetailModal = ref(false);
const selectedTemplate = ref(null);
const deleteTemplateId = ref(null);

// Filtered templates based on search
const filteredTemplates = computed(() => {
  if (!searchQuery.value.trim()) {
    return tosTemplates.value;
  }

  const query = searchQuery.value.toLowerCase();
  return tosTemplates.value.filter(template => {
    return (
      template.template_name.toLowerCase().includes(query) ||
      (template.subject && template.subject.toLowerCase().includes(query)) ||
      (template.grade_level && template.grade_level.toLowerCase().includes(query))
    );
  });
});

// Load TOS templates
const loadTemplates = async () => {
  try {
    isLoading.value = true;
    errorMessage.value = "";
    const result = await api.tosApi.getUserTOSTemplates();
    if (result.error) {
      throw new Error(result.error);
    }
    tosTemplates.value = result.data || [];
  } catch (error) {
    console.error("Error loading TOS templates:", error);
    errorMessage.value = "Failed to load TOS templates";
  } finally {
    isLoading.value = false;
  }
};

// Open create modal
const openCreateModal = () => {
  showCreateModal.value = true;
};

// Close create modal
const closeCreateModal = () => {
  showCreateModal.value = false;
};

// Handle template created
const handleTemplateCreated = async () => {
  closeCreateModal();
  await loadTemplates();
};

// Open detail modal
const openDetailModal = (template) => {
  selectedTemplate.value = template;
  showDetailModal.value = true;
};

// Close detail modal
const closeDetailModal = () => {
  showDetailModal.value = false;
  selectedTemplate.value = null;
};

// Open edit modal
const openEditModal = (template, event) => {
  event.stopPropagation();
  selectedTemplate.value = template;
  showEditModal.value = true;
};

// Close edit modal
const closeEditModal = () => {
  showEditModal.value = false;
  selectedTemplate.value = null;
};

// Handle template updated
const handleTemplateUpdated = async () => {
  closeEditModal();
  await loadTemplates();
};

// Confirm delete
const confirmDelete = (templateId, event) => {
  event.stopPropagation();
  deleteTemplateId.value = templateId;
  showDeleteModal.value = true;
};

// Cancel delete
const cancelDelete = () => {
  showDeleteModal.value = false;
  deleteTemplateId.value = null;
};

// Handle delete confirmed
const handleDeleteConfirmed = async (templateId) => {
  try {
    const result = await api.tosApi.deleteTOSTemplate(templateId);
    if (result.error) {
      throw new Error(result.error);
    }
    await loadTemplates();
    cancelDelete();
  } catch (error) {
    console.error("Error deleting TOS template:", error);
    alert("Failed to delete TOS template");
  }
};

// View template details
const viewTemplate = (template) => {
  router.push({ name: "tos-detail", params: { id: template.id } });
};

// Get cognitive level summary
const getCognitiveSummary = (template) => {
  const levels = [
    { key: 'percentage_remembering', label: 'Remembering' },
    { key: 'percentage_understanding', label: 'Understanding' },
    { key: 'percentage_applying', label: 'Applying' },
    { key: 'percentage_analyzing', label: 'Analyzing' },
    { key: 'percentage_evaluating', label: 'Evaluating' },
    { key: 'percentage_creating', label: 'Creating' }
  ];

  return levels
    .filter(level => template[level.key] > 0)
    .map(level => `${level.label}: ${template[level.key]}%`)
    .join(', ');
};

onMounted(() => {
  loadTemplates();
});
</script>

<template>
  <AppLayout>
    <div class="min-h-screen bg-gray-200 dark:bg-gray-900">
      <!-- Header -->
      <div class="bg-white dark:bg-gray-800 shadow">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="py-6">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div class="flex items-center">
                <button
                  @click="router.push('/dashboard')"
                  class="mr-4 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
                  title="Back to Dashboard"
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
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <div>
                  <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                    Table of Specifications
                  </h1>
                  <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Create and manage reusable TOS templates for your tests
                  </p>
                </div>
              </div>
              <button
                @click="openCreateModal"
                class="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm"
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Create TOS Template
              </button>
            </div>

            <!-- Search Bar -->
            <div class="mt-6">
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
                  placeholder="Search TOS templates by name, subject, or grade level..."
                  class="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Error Message -->
        <div
          v-if="errorMessage"
          class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6"
        >
          <div class="flex">
            <svg
              class="h-5 w-5 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p class="ml-3 text-sm text-red-700 dark:text-red-400">
              {{ errorMessage }}
            </p>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="flex items-center justify-center py-12">
          <div class="flex items-center space-x-2">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span class="text-gray-600 dark:text-gray-400">Loading templates...</span>
          </div>
        </div>

        <!-- Empty State -->
        <div
          v-else-if="tosTemplates.length === 0"
          class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center"
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
          <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            No TOS Templates Yet
          </h3>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Create your first Table of Specifications template to start generating structured tests.
          </p>
          <button
            @click="openCreateModal"
            class="mt-6 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create Your First TOS
          </button>
        </div>

        <!-- Templates Grid -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="template in filteredTemplates"
            :key="template.id"
            @click="openDetailModal(template)"
            class="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden border border-gray-200 dark:border-gray-700 cursor-pointer transform hover:scale-[1.02]"
          >
            <!-- Card Header -->
            <div class="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <h3 class="text-lg font-semibold text-white truncate">
                {{ template.template_name }}
              </h3>
              <div class="mt-2 flex flex-wrap gap-2">
                <span
                  v-if="template.subject"
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white"
                >
                  📚 {{ template.subject }}
                </span>
                <span
                  v-if="template.grade_level"
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white"
                >
                  🎓 {{ template.grade_level }}
                </span>
              </div>
            </div>

            <!-- Card Body -->
            <div class="px-6 py-4">
              <p
                v-if="template.description"
                class="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 min-h-[60px]"
              >
                {{ template.description }}
              </p>
              <p
                v-else
                class="text-sm text-gray-400 dark:text-gray-500 italic min-h-[60px]"
              >
                No description provided
              </p>
              
              <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div class="flex items-center justify-between text-sm">
                  <span class="text-gray-600 dark:text-gray-400">
                    📝 {{ template.total_items }} Items
                  </span>
                  <span class="text-gray-600 dark:text-gray-400">
                    📚 {{ template.tos_template_topics?.length || 0 }} Topics
                  </span>
                </div>
              </div>
            </div>

            <!-- Card Footer -->
            <div class="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
              <div class="flex items-center justify-between">
                <span class="text-xs text-gray-500 dark:text-gray-400">
                  {{ new Date(template.created_at).toLocaleDateString() }}
                </span>
                <div class="flex items-center space-x-2">
                  <button
                    @click="(e) => openEditModal(template, e)"
                    class="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors duration-200"
                    title="Edit"
                  >
                    <svg
                      class="w-5 h-5"
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
                  </button>
                  <button
                    @click="(e) => confirmDelete(template.id, e)"
                    class="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                    title="Delete"
                  >
                    <svg
                      class="w-5 h-5"
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
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- No Search Results -->
        <div
          v-if="!isLoading && filteredTemplates.length === 0 && searchQuery"
          class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center"
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
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            No templates found
          </h3>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Try adjusting your search query
          </p>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <CreateTOSModal
      :is-open="showCreateModal"
      @close="closeCreateModal"
      @template-created="handleTemplateCreated"
    />

    <EditTOSModal
      :is-open="showEditModal"
      :template="selectedTemplate"
      @close="closeEditModal"
      @template-updated="handleTemplateUpdated"
    />

    <DeleteTOSConfirmationModal
      :is-open="showDeleteModal"
      :template-id="deleteTemplateId"
      @close="cancelDelete"
      @confirm="handleDeleteConfirmed"
    />

    <TOSDetailModal
      :is-open="showDetailModal"
      :template="selectedTemplate"
      @close="closeDetailModal"
    />
  </AppLayout>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
