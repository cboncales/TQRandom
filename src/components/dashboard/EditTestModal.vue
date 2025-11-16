<script setup>
import { ref, watch } from "vue";
import { useTestStore } from "@/stores/testStore";

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  testId: { type: [String, Number], required: false, default: null },
});

const emit = defineEmits(["close", "updated"]);

const testStore = useTestStore();

// States
const isLoading = ref(true);
const isSaving = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

// Form
const form = ref({
  title: "",
  description: "",
});

// Store original for change detection
let originalSnapshot = {};

// Load test data
const loadTest = async () => {
  if (!props.testId) return;

  try {
    isLoading.value = true;
    errorMessage.value = "";

    const result = await testStore.getTest(props.testId);

    if (result.error) {
      errorMessage.value = result.error;
    } else {
      const test = result.data;

      form.value = {
        title: test.title,
        description: test.description || "",
      };

      originalSnapshot = { ...form.value };
    }
  } catch (err) {
    console.error(err);
    errorMessage.value = "Failed to load test details.";
  } finally {
    isLoading.value = false;
  }
};

// Reload data every time modal opens
watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      loadTest();
    }
  }
);

// Has changes?
const hasChanges = () => {
  return (
    form.value.title !== originalSnapshot.title ||
    form.value.description !== originalSnapshot.description
  );
};

// Submit update
const handleSave = async () => {
  if (!form.value.title.trim()) {
    errorMessage.value = "Test title is required.";
    return;
  }

  if (!hasChanges()) {
    emit("close");
    return;
  }

  try {
    isSaving.value = true;
    errorMessage.value = "";
    successMessage.value = "";

    const updates = {
      title: form.value.title.trim(),
      description: form.value.description.trim(),
    };

    const result = await testStore.updateTest(props.testId, updates);

    if (result.error) {
      errorMessage.value = result.error;
    } else {
      successMessage.value = "Updated successfully!";
      emit("updated", updates);

      setTimeout(() => emit("close"), 1000);
    }
  } catch (err) {
    errorMessage.value = "Failed to update test.";
  } finally {
    isSaving.value = false;
  }
};

// Close modal
const closeModal = () => {
  emit("close");
};
</script>

<template>
  <!-- BACKDROP -->
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-gray-600 bg-opacity-40 z-50 flex items-start justify-center overflow-y-auto"
    @click="closeModal"
  >
    <!-- MODAL CARD -->
    <div
      class="relative bg-white w-full max-w-xs md:max-w-lg lg:max-w-lg mt-24 p-6 rounded-lg shadow-lg"
      @click.stop
    >
      <!-- HEADER -->
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold text-gray-800">Edit Test</h2>
        <button @click="closeModal" class="text-gray-400 hover:text-gray-600">
          ✕
        </button>
      </div>

      <!-- LOADING -->
      <div v-if="isLoading" class="text-center py-6">
        <div class="flex justify-center items-center space-x-2">
          <span class="animate-spin h-5 w-5 border-2 border-t-transparent rounded-full"></span>
          <span class="text-gray-600">Loading test...</span>
        </div>
      </div>

      <!-- ERROR -->
      <div
        v-if="errorMessage && !isLoading"
        class="bg-red-50 border border-red-200 text-red-700 p-3 rounded mb-4"
      >
        {{ errorMessage }}
      </div>

      <!-- SUCCESS -->
      <div
        v-if="successMessage"
        class="bg-green-50 border border-green-200 text-green-700 p-3 rounded mb-4"
      >
        {{ successMessage }}
      </div>

      <!-- FORM -->
      <div v-if="!isLoading">
        <div class="space-y-4">
          <!-- Title -->
          <div>
            <label class="block text-sm font-medium text-gray-700">Test Title *</label>
            <input
              v-model="form.title"
              type="text"
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs md:text-sm lg:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
              :disabled="isSaving"
            />
          </div>

          <!-- Description -->
          <div>
            <label class="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              v-model="form.description"
              rows="3"
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs md:text-sm lg:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
              :disabled="isSaving"
            ></textarea>
          </div>
        </div>

        <!-- FOOTER -->
        <div class="flex justify-end space-x-3 mt-6">
          <button
            @click="closeModal"
            class="bg-gray-300 text-gray-700 hover:bg-gray-400 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 disabled:cursor-not-allowed"
            :disabled="isSaving"
          >
            Cancel
          </button>
          <button
            @click="handleSave"
            class="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center"
            :disabled="isSaving || !form.title.trim()"
          >
            <span
              v-if="isSaving"
              class="animate-spin w-4 h-4 mr-2 border-2 border-t-transparent rounded-full"
            ></span>
            {{ isSaving ? "Saving..." : "Save Changes" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
