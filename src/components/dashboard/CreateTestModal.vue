<script setup>
import { ref, watch } from "vue";
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
const numberOfParts = ref(0);
const partDescriptions = ref([]);
const partDirections = ref([]);
const partIdentificationImages = ref([]); // Array of {file, preview} objects
const generalDirections = ref("");
const isLoading = ref(false);
const isUploadingLogo = ref(false);
const errorMessage = ref("");

// Watch for changes in numberOfParts to initialize/adjust partDescriptions and partDirections arrays
watch(numberOfParts, (newValue) => {
  const num = parseInt(newValue) || 0;
  if (num > 0) {
    // Add or remove part descriptions, directions, and identification images to match the number
    if (num > partDescriptions.value.length) {
      // Add new empty descriptions, directions, and identification images
      for (let i = partDescriptions.value.length; i < num; i++) {
        partDescriptions.value.push("");
        partDirections.value.push("");
        partIdentificationImages.value.push({ file: null, preview: null });
      }
    } else if (num < partDescriptions.value.length) {
      // Remove excess descriptions, directions, and identification images
      partDescriptions.value = partDescriptions.value.slice(0, num);
      partDirections.value = partDirections.value.slice(0, num);
      partIdentificationImages.value = partIdentificationImages.value.slice(0, num);
    }
  } else {
    // Clear all descriptions, directions, and identification images if no parts
    partDescriptions.value = [];
    partDirections.value = [];
    partIdentificationImages.value = [];
  }
});

// Logo upload handlers
const handleLogoUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    if (file.size > 2 * 1024 * 1024) {
      // 2MB limit
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

// Identification image upload handlers (per-part)
const handleIdentificationImageUpload = (partIndex, event) => {
  const file = event.target.files[0];
  if (file) {
    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      errorMessage.value = "Identification image file size must be less than 5MB";
      return;
    }
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      partIdentificationImages.value[partIndex] = {
        file: file,
        preview: e.target.result
      };
    };
    reader.readAsDataURL(file);
  }
};

const removeIdentificationImage = (partIndex) => {
  partIdentificationImages.value[partIndex] = { file: null, preview: null };
};

const handleSubmit = async () => {
  if (!title.value.trim()) {
    errorMessage.value = "Please fill in the title";
    return;
  }

  // Validate parts if specified
  const numParts = parseInt(numberOfParts.value) || 0;
  if (numParts > 0) {
    const emptyDescriptions = partDescriptions.value.filter(d => !d.trim());
    if (emptyDescriptions.length > 0) {
      errorMessage.value = "Please fill in all part descriptions";
      return;
    }
    const emptyDirections = partDirections.value.filter(d => !d.trim());
    if (emptyDirections.length > 0) {
      errorMessage.value = "Please fill in all part directions";
      return;
    }
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

    // Upload identification images for each part
    const identificationImageUrls = [];
    for (let i = 0; i < numParts; i++) {
      if (partIdentificationImages.value[i]?.file) {
        const uploadResult = await imageApi.uploadImage(partIdentificationImages.value[i].file);
        if (uploadResult.error) {
          throw new Error(`Identification image ${i + 1} upload failed: ${uploadResult.error}`);
        }
        identificationImageUrls.push(uploadResult.data.imageUrl);
      } else {
        identificationImageUrls.push(null);
      }
    }

    const result = await testStore.createTest(
      title.value,
      description.value.trim(),
      logoUrl,
      numParts,
      partDescriptions.value,
      numParts > 0 ? partDirections.value : [generalDirections.value],
      identificationImageUrls
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
    errorMessage.value =
      error.message || "An unexpected error occurred. Please try again.";
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
  numberOfParts.value = 0;
  partDescriptions.value = [];
  partDirections.value = [];
  partIdentificationImages.value = [];
  generalDirections.value = "";
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
    class="fixed inset-0 bg-opacity-95 backdrop-blur-sm overflow-y-auto h-full w-full z-50"
    @click="closeModal"
    data-aos="fade-up"
    data-aos-delay="300"
  >
    <!-- Modal content -->
    <div
      class="relative mt-12 mx-auto mb-16 p-5 border border-gray-400 w-full max-w-md shadow-lg rounded-md bg-white dark:bg-gray-900"
      @click.stop
    >
      <!-- Close button -->
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">Create New Test</h3>
        <button @click="closeModal" class="text-gray-400 dark:text-gray-100 hover:text-gray-600">
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
            class="block text-sm font-medium text-gray-700 dark:text-gray-100"
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
            class="block text-sm font-medium text-gray-700 dark:text-gray-100"
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
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-300">
            Provide a brief description of what this test covers
          </p>
        </div>

        <!-- Number of Parts -->
        <div>
          <label
            for="number-of-parts"
            class="block text-sm font-medium text-gray-700 dark:text-gray-100"
          >
            Number of Parts (Optional)
          </label>
          <input
            id="number-of-parts"
            v-model.number="numberOfParts"
            type="number"
            min="0"
            max="10"
            :disabled="isLoading"
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="e.g., 2, 3, 4..."
          />
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-300">
            Specify how many parts this test has (leave 0 for no parts)
          </p>
        </div>

        <!-- General Directions (Only shown when numberOfParts is 0) -->
        <div v-if="numberOfParts === 0">
          <label
            for="general-directions"
            class="block text-sm font-medium text-gray-700 dark:text-gray-100"
          >
            Test Directions (Optional)
          </label>
          <textarea
            id="general-directions"
            v-model="generalDirections"
            rows="3"
            :disabled="isLoading"
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="e.g., Directions: Choose the letter of the correct answer. Write your answer on the space provided."
          ></textarea>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-300">
            General directions for the entire test
          </p>
        </div>

        <!-- Part Descriptions and Directions (Dynamic based on numberOfParts) -->
        <div v-if="numberOfParts > 0" class="space-y-4">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-100">
            Part Descriptions and Directions
          </h4>
          <div
            v-for="(desc, index) in partDescriptions"
            :key="index"
            class="p-4 border border-gray-200 rounded-lg space-y-3 bg-gray-50 dark:bg-gray-800"
          >
            <div class="flex items-start gap-2">
              <span class="shrink-0 mt-2 w-16 text-sm font-semibold text-gray-700 dark:text-gray-200">
                Part {{ index + 1 }}:
              </span>
              <input
                v-model="partDescriptions[index]"
                type="text"
                :disabled="isLoading"
                class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed bg-white dark:bg-gray-900"
                :placeholder="`e.g., Part ${['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][index] || (index + 1)}. Identify the following...`"
              />
            </div>
            <div class="flex items-start gap-2">
              <span class="shrink-0 mt-2 w-16 text-xs font-medium text-gray-600 dark:text-gray-300">
                Directions:
              </span>
              <textarea
                v-model="partDirections[index]"
                rows="2"
                :disabled="isLoading"
                class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed bg-white dark:bg-gray-900"
                :placeholder="`e.g., Directions: Identify what is being asked. Choose your answers from the box. Write your answer on the space provided.`"
              ></textarea>
            </div>
            
            <!-- Identification Image Upload (Per Part) -->
            <div class="flex items-start gap-2 mt-3">
              <span class="shrink-0 w-16 text-xs font-medium text-gray-600 dark:text-gray-300">
                Image:
              </span>
              <div class="flex-1">
                <div v-if="partIdentificationImages[index]?.preview" class="mb-2">
                  <div class="relative inline-block">
                    <img
                      :src="partIdentificationImages[index].preview"
                      alt="Identification image preview"
                      class="max-w-full h-auto rounded-lg border-2 border-gray-300"
                    />
                    <button
                      type="button"
                      @click="removeIdentificationImage(index)"
                      :disabled="isLoading"
                      class="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 disabled:opacity-50"
                    >
                      <svg
                        class="w-4 h-4"
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
                <input
                  type="file"
                  accept="image/*"
                  @change="(event) => handleIdentificationImageUpload(index, event)"
                  :disabled="isLoading"
                  class="block text-sm text-gray-500 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-300">PNG, JPG, GIF up to 5MB (Optional)</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Header Logo Upload -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-2">
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
                <svg
                  class="w-4 h-4"
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
          <input
            type="file"
            accept="image/*"
            @change="handleLogoUpload"
            :disabled="isLoading || isUploadingLogo"
            class="block w-full text-sm text-gray-500 dark:text-gray-100 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-300">
            PNG, JPG, GIF up to 2MB. Will be displayed at the top of exam
            documents.
          </p>
        </div>

        <!-- Form Actions -->
        <div class="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            @click="closeModal"
            :disabled="isLoading"
            class="bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-100 hover:bg-gray-400 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center"
            :disabled="!title.trim() || isLoading"
            :class="{
              'opacity-50 cursor-not-allowed': !title.trim() || isLoading,
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
