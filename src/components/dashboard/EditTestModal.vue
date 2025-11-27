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

// Identification image states (per-part)
const currentIdentificationImageUrls = ref([]);
const partIdentificationImages = ref([]); // Array of {file, preview, changed} objects

// Parts states
const numberOfParts = ref(0);
const partDescriptions = ref([]);
const partDirections = ref([]);
const generalDirections = ref("");

// Store original for change detection
let originalSnapshot = {};

// Watch for changes in numberOfParts
watch(numberOfParts, (newValue) => {
  const num = parseInt(newValue) || 0;
  if (num > 0) {
    if (num > partDescriptions.value.length) {
      for (let i = partDescriptions.value.length; i < num; i++) {
        partDescriptions.value.push("");
        partDirections.value.push("");
        partIdentificationImages.value.push({ file: null, preview: null, changed: false });
      }
    } else if (num < partDescriptions.value.length) {
      partDescriptions.value = partDescriptions.value.slice(0, num);
      partDirections.value = partDirections.value.slice(0, num);
      partIdentificationImages.value = partIdentificationImages.value.slice(0, num);
      currentIdentificationImageUrls.value = currentIdentificationImageUrls.value.slice(0, num);
    }
  } else {
    partDescriptions.value = [];
    partDirections.value = [];
    partIdentificationImages.value = [];
    currentIdentificationImageUrls.value = [];
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
        preview: e.target.result,
        changed: true
      };
    };
    reader.readAsDataURL(file);
  }
};

const removeIdentificationImage = (partIndex) => {
  partIdentificationImages.value[partIndex] = {
    file: null,
    preview: null,
    changed: true
  };
  currentIdentificationImageUrls.value[partIndex] = null;
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

      // Load parts data
      numberOfParts.value = test.number_of_parts || 0;
      partDescriptions.value = test.part_descriptions ? [...test.part_descriptions] : [];
      
      // Load directions data
      if (test.directions && Array.isArray(test.directions)) {
        if (test.number_of_parts > 0) {
          partDirections.value = [...test.directions];
        } else {
          generalDirections.value = test.directions[0] || "";
        }
      } else {
        partDirections.value = [];
        generalDirections.value = "";
      }

      // Load existing logo
      currentLogoUrl.value = test.header_logo_url || null;
      logoPreview.value = test.header_logo_url || null;
      logoFile.value = null;
      logoChanged.value = false;

      // Load existing identification images (per-part)
      currentIdentificationImageUrls.value = test.identification_image_urls ? [...test.identification_image_urls] : [];
      partIdentificationImages.value = [];
      
      // Initialize identification images for each part
      const numParts = test.number_of_parts || 0;
      for (let i = 0; i < numParts; i++) {
        const existingUrl = currentIdentificationImageUrls.value[i] || null;
        partIdentificationImages.value.push({
          file: null,
          preview: existingUrl,
          changed: false
        });
      }

      originalSnapshot = {
        ...form.value,
        header_logo_url: test.header_logo_url,
        identification_image_urls: test.identification_image_urls ? [...test.identification_image_urls] : [],
        number_of_parts: test.number_of_parts || 0,
        part_descriptions: test.part_descriptions ? [...test.part_descriptions] : [],
        directions: test.directions ? [...test.directions] : [],
      };
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
  const partsChanged = 
    numberOfParts.value !== originalSnapshot.number_of_parts ||
    JSON.stringify(partDescriptions.value) !== JSON.stringify(originalSnapshot.part_descriptions);
  
  const directionsChanged = 
    (numberOfParts.value > 0 
      ? JSON.stringify(partDirections.value) !== JSON.stringify(originalSnapshot.directions)
      : generalDirections.value !== (originalSnapshot.directions?.[0] || ""));
    
  return (
    form.value.title !== originalSnapshot.title ||
    form.value.description !== originalSnapshot.description ||
    logoChanged.value ||
    partsChanged ||
    directionsChanged
  );
};

// Submit update
const handleSave = async () => {
  if (!form.value.title.trim()) {
    errorMessage.value = "Test title is required.";
    return;
  }

  // Validate parts
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
      number_of_parts: numParts,
      part_descriptions: partDescriptions.value,
      directions: numParts > 0 ? partDirections.value : [generalDirections.value],
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

    // Upload new identification images if changed (per-part)
    const identificationImageUrls = [...currentIdentificationImageUrls.value];
    for (let i = 0; i < numParts; i++) {
      const partImage = partIdentificationImages.value[i];
      if (partImage?.changed) {
        if (partImage.file) {
          const uploadResult = await imageApi.uploadImage(partImage.file);
          if (uploadResult.error) {
            throw new Error(`Identification image ${i + 1} upload failed: ${uploadResult.error}`);
          }
          identificationImageUrls[i] = uploadResult.data.imageUrl;
        } else {
          // Image was removed
          identificationImageUrls[i] = null;
        }
      }
    }
    updates.identification_image_urls = identificationImageUrls;

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
    class="fixed inset-0 bg-opacity-90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    @click="closeModal"
    data-aos="fade-up"
    data-aos-delay="300"
  >
    <!-- MODAL CARD -->
    <div
      class="relative bg-white dark:bg-gray-900 w-full max-w-xs md:max-w-lg lg:max-w-lg rounded-lg shadow-lg border border-gray-400 max-h-[90vh] overflow-y-auto"
      @click.stop
    >
      <!-- Modal inner content with padding -->
      <div class="p-6">
      <!-- HEADER -->
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-100">Edit Test</h2>
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

      <!-- LOADING -->
      <div v-if="isLoading" class="text-center py-6">
        <div class="flex justify-center items-center space-x-2">
          <span
            class="animate-spin h-5 w-5 border-2 border-t-transparent rounded-full"
          ></span>
          <span class="text-gray-600 dark:text-gray-100">Loading test...</span>
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
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-100"
              >Test Title *</label
            >
            <input
              v-model="form.title"
              type="text"
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs md:text-sm lg:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
              :disabled="isSaving"
            />
          </div>

          <!-- Description -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-100"
              >Description</label
            >
            <textarea
              v-model="form.description"
              rows="3"
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs md:text-sm lg:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
              :disabled="isSaving"
            ></textarea>
          </div>

          <!-- Number of Parts -->
          <div>
            <label
              for="edit-number-of-parts"
              class="block text-sm font-medium text-gray-700 dark:text-gray-100"
            >
              Number of Parts (Optional)
            </label>
            <input
              id="edit-number-of-parts"
              v-model.number="numberOfParts"
              type="number"
              min="0"
              max="10"
              :disabled="isSaving"
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs md:text-sm lg:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="e.g., 2, 3, 4..."
            />
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-300">
              Specify how many parts this test has (leave 0 for no parts)
            </p>
          </div>

          <!-- General Directions (Only shown when numberOfParts is 0) -->
          <div v-if="numberOfParts === 0">
            <label
              for="edit-general-directions"
              class="block text-sm font-medium text-gray-700 dark:text-gray-100"
            >
              Test Directions (Optional)
            </label>
            <textarea
              id="edit-general-directions"
              v-model="generalDirections"
              rows="3"
              :disabled="isSaving"
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs md:text-sm lg:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="e.g., Directions: Choose the letter of the correct answer. Write your answer on the space provided."
            ></textarea>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-300">
              General directions for the entire test
            </p>
          </div>

          <!-- Part Descriptions and Directions (Dynamic) -->
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
                  :disabled="isSaving"
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
                  :disabled="isSaving"
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
                        :disabled="isSaving"
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
                    :disabled="isSaving"
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
                  :disabled="isSaving || isUploadingLogo"
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
              :disabled="isSaving || isUploadingLogo"
              class="block w-full text-sm text-gray-500 dark:text-gray-100 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-300">
              PNG, JPG, GIF up to 2MB. Will be displayed at the top of exam
              documents.
            </p>
          </div>
        </div>

        <!-- FOOTER -->
        <div class="flex justify-end space-x-3 mt-6">
          <button
            @click="closeModal"
            class="bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-100 hover:bg-gray-400 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 disabled:cursor-not-allowed"
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
  </div>
</template>

<style scoped>
/* Custom scrollbar for modal content */
.overflow-y-auto {
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
}

.overflow-y-auto::-webkit-scrollbar {
  width: 8px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 4px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.7);
}
</style>