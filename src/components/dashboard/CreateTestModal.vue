<script setup>
import { ref } from "vue";
import { useTestStore } from "@/stores/testStore";
import { imageApi } from "@/services/api";

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["close", "test-created"]);

const testStore = useTestStore();

const title = ref("");
const description = ref("");
const logoFile = ref(null);
const logoPreview = ref(null);
const isLoading = ref(false);
const isUploadingLogo = ref(false);
const errorMessage = ref("");

// Logo upload handlers
const handleLogoUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      errorMessage.value = "Logo file size must be less than 2MB";
      return;
    }
    logoFile.value = file;
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
};

const handleSubmit = async () => {
  if (!title.value.trim()) {
    errorMessage.value = "Please fill in the title";
    return;
  }

  isLoading.value = true;
  errorMessage.value = "";

  try {
    let logoUrl = null;
    
    // Upload logo if provided
    if (logoFile.value) {
      isUploadingLogo.value = true;
      const uploadResult = await imageApi.uploadImage(logoFile.value);
      if (uploadResult.error) {
        throw new Error(`Logo upload failed: ${uploadResult.error}`);
      }
      logoUrl = uploadResult.data.imageUrl;
      isUploadingLogo.value = false;
    }

    const result = await testStore.createTest(
      title.value, 
      description.value.trim(),
      logoUrl
    );

    if (result.error) {
      errorMessage.value = result.error;
    } else {
      emit("test-created", {
        ...result.data,
        questionCount: 0,
      });
      resetForm();
    }
  } catch (error) {
    errorMessage.value = error.message || "An unexpected error occurred. Please try again.";
    console.error("Create test error:", error);
  } finally {
    isLoading.value = false;
    isUploadingLogo.value = false;
  }
};

const resetForm = () => {
  title.value = "";
  description.value = "";
  logoFile.value = null;
  logoPreview.value = null;
  errorMessage.value = "";
};

const closeModal = () => {
  resetForm();
  emit("close");
};
</script>

<template>
  <!-- Modal backdrop -->
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
    @click="closeModal"
  >
    <!-- Modal content -->
    <div
      class="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white"
      @click.stop
    >
      <!-- Close button -->
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-medium text-gray-900">Create New Test</h3>
        <button @click="closeModal" class="text-gray-400 hover:text-gray-600">
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- Error Message -->
      <div
        v-if="errorMessage"
        class="bg-red-50 border border-red-200 rounded-md p-4 mb-4"
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
          </div>
        </div>
      </div>

      <!-- Modal body -->
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Test Title -->
        <div>
          <label
            for="test-title"
            class="block text-sm font-medium text-gray-700"
          >
            Test Title *
          </label>
          <input
            id="test-title"
            v-model="title"
            type="text"
            required
            :disabled="isLoading"
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="Enter test title"
          />
        </div>

        <!-- Description -->
        <div>
          <label
            for="test-description"
            class="block text-sm font-medium text-gray-700"
          >
            Description
          </label>
          <textarea
            id="test-description"
            v-model="description"
            rows="3"
            :disabled="isLoading"
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="Enter test description (optional)"
          />
          <p class="mt-1 text-xs text-gray-500">
            Provide a brief description of what this test covers
          </p>
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
                :disabled="isLoading || isUploadingLogo"
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
            :disabled="isLoading || isUploadingLogo"
            class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <p class="mt-1 text-xs text-gray-500">
            PNG, JPG, GIF up to 2MB. Will be displayed at the top of exam documents.
          </p>
        </div>

        <!-- Form Actions -->
        <div class="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            @click="closeModal"
            :disabled="isLoading"
            class="bg-gray-300 text-gray-700 hover:bg-gray-400 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center"
            :disabled="!title.trim() || isLoading"
            :class="{
              'opacity-50 cursor-not-allowed':
                !title.trim() || isLoading,
            }"
          >
            <span v-if="isLoading" class="w-4 h-4 mr-2 animate-spin">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24">
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
            </span>
            <svg
              v-else
              class="w-4 h-4 mr-2"
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
            {{ isLoading ? "Creating..." : "Create Test" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
/* Additional styles if needed */
</style>
