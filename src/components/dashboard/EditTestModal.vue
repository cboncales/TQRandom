<script setup>
import { ref, watch } from "vue";
import { useTestStore } from "@/stores/testStore";
import { imageApi } from "@/services/api";

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  testId: { type: [String, Number], required: false, default: null },
});

const emit = defineEmits(["close", "updated"]);

const testStore = useTestStore();

// States
const isLoading = ref(true);
const isSaving = ref(false);
const isUploadingLogo = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

// Form
const form = ref({
  title: "",
  description: "",
});

// Logo states
const currentLogoUrl = ref(null);
const logoFile = ref(null);
const logoPreview = ref(null);
const logoChanged = ref(false);

// Store original for change detection
let originalSnapshot = {};

// Logo upload handlers
const handleLogoUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      errorMessage.value = "Logo file size must be less than 2MB";
      return;
    }
    logoFile.value = file;
    logoChanged.value = true;
    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      logoPreview.value = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};

const removeLogo = () => {
  logoFile.value = null;
  logoPreview.value = null;
  currentLogoUrl.value = null;
  logoChanged.value = true;
};

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

      // Load existing logo
      currentLogoUrl.value = test.header_logo_url || null;
      logoPreview.value = test.header_logo_url || null;
      logoFile.value = null;
      logoChanged.value = false;

      originalSnapshot = { ...form.value, header_logo_url: test.header_logo_url };
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
    form.value.description !== originalSnapshot.description ||
    logoChanged.value
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

    // Upload new logo if changed
    if (logoChanged.value) {
      if (logoFile.value) {
        isUploadingLogo.value = true;
        const uploadResult = await imageApi.uploadImage(logoFile.value);
        if (uploadResult.error) {
          throw new Error(`Logo upload failed: ${uploadResult.error}`);
        }
        updates.header_logo_url = uploadResult.data.imageUrl;
        isUploadingLogo.value = false;
      } else {
        // Logo was removed
        updates.header_logo_url = null;
      }
    }

    const result = await testStore.updateTest(props.testId, updates);

    if (result.error) {
      errorMessage.value = result.error;
    } else {
      successMessage.value = "Updated successfully!";
      emit("updated", updates);

      setTimeout(() => emit("close"), 1000);
    }
  } catch (err) {
    errorMessage.value = err.message || "Failed to update test.";
  } finally {
    isSaving.value = false;
    isUploadingLogo.value = false;
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

          <!-- Header Logo Upload -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Header Logo (Optional)
            </label>
            <div v-if="logoPreview" class="mb-3">
              <div class="relative inline-block">
                <img 
                  :src="logoPreview" 
                  alt="Logo preview"
                  class="h-24 w-auto rounded-lg border-2 border-gray-300"
                />
                <button
                  type="button"
                  @click="removeLogo"
                  :disabled="isSaving || isUploadingLogo"
                  class="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 disabled:opacity-50"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>
            <input
              type="file"
              accept="image/*"
              @change="handleLogoUpload"
              :disabled="isSaving || isUploadingLogo"
              class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p class="mt-1 text-xs text-gray-500">
              PNG, JPG, GIF up to 2MB. Will be displayed at the top of exam documents.
            </p>
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
