<script setup>
import AppLayout from "@/components/layout/AppLayout.vue";
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { userApi } from "@/services/api";
import { useAuthUserStore } from "@/stores/authUser";

const router = useRouter();
const authStore = useAuthUserStore();

// Profile form
const firstName = ref("");
const lastName = ref("");
const email = ref("");
const isUpdatingProfile = ref(false);
const profileMessage = ref("");
const profileError = ref("");

// Password form
const currentPassword = ref("");
const newPassword = ref("");
const confirmPassword = ref("");
const isUpdatingPassword = ref(false);
const passwordMessage = ref("");
const passwordError = ref("");
const showPassword = ref(false);
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);

// Toggle password visibility
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

// Toggle new password visibility
const toggleNewPasswordVisibility = () => {
  showNewPassword.value = !showNewPassword.value;
};

// Toggle confirm password visibility
const toggleConfirmPasswordVisibility = () => {
  showConfirmPassword.value = !showConfirmPassword.value;
};

onMounted(async () => {
  // Load current user data
  if (authStore.userData) {
    firstName.value =
      authStore.userData.user_metadata?.first_name ||
      authStore.userData.first_name ||
      "";
    lastName.value =
      authStore.userData.user_metadata?.last_name ||
      authStore.userData.last_name ||
      "";
    email.value = authStore.userData.email || "";
  }
});

const handleUpdateProfile = async () => {
  profileMessage.value = "";
  profileError.value = "";

  if (!firstName.value.trim()) {
    profileError.value = "First name is required";
    return;
  }

  isUpdatingProfile.value = true;

  try {
    const result = await userApi.updateProfile(firstName.value, lastName.value);

    if (result.error) {
      profileError.value = result.error;
    } else {
      profileMessage.value = "Profile updated successfully!";
      // Refresh user data
      await authStore.getUserInformation();

      // Clear message after 3 seconds
      setTimeout(() => {
        profileMessage.value = "";
      }, 3000);
    }
  } catch (error) {
    profileError.value = error.message;
  } finally {
    isUpdatingProfile.value = false;
  }
};

const handleUpdatePassword = async () => {
  passwordMessage.value = "";
  passwordError.value = "";

  // Validation
  if (!currentPassword.value) {
    passwordError.value = "Current password is required";
    return;
  }

  if (!newPassword.value) {
    passwordError.value = "New password is required";
    return;
  }

  if (newPassword.value.length < 6) {
    passwordError.value = "New password must be at least 6 characters long";
    return;
  }

  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = "New passwords do not match";
    return;
  }

  if (currentPassword.value === newPassword.value) {
    passwordError.value =
      "New password must be different from current password";
    return;
  }

  isUpdatingPassword.value = true;

  try {
    const result = await userApi.updatePassword(
      currentPassword.value,
      newPassword.value
    );

    if (result.error) {
      passwordError.value = result.error;
    } else {
      passwordMessage.value = "Password updated successfully!";

      // Clear form
      currentPassword.value = "";
      newPassword.value = "";
      confirmPassword.value = "";

      // Clear message after 3 seconds
      setTimeout(() => {
        passwordMessage.value = "";
      }, 3000);
    }
  } catch (error) {
    passwordError.value = error.message;
  } finally {
    isUpdatingPassword.value = false;
  }
};

const goBack = () => {
  router.push({ name: "dashboard" });
};
</script>

<template>
  <AppLayout>
    <div class="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 py-8">
      <div
        class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"
        data-aos="fade-up"
        data-aos-delay="200"
      >
        <!-- Header -->
        <div class="mb-8">
          <button
            @click="goBack"
            class="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <svg
              class="w-4 h-4 mr-1"
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
            Back to Dashboard
          </button>
          <div class="flex items-center space-x-3">
            <div
              class="h-12 w-12 rounded-full bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center"
            >
              <svg
                class="w-6 h-6 text-white"
                viewBox="0 0 256 256"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <div>
              <h1 class="text-3xl font-bold text-gray-800">Account Settings</h1>
              <p class="text-sm text-gray-600">
                Manage your account information and security
              </p>
            </div>
          </div>
        </div>

        <div class="space-y-6">
          <!-- Profile Settings Card -->
          <div
            class="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200"
          >
            <div
              class="bg-linear-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200"
            >
              <div class="flex items-center">
                <div
                  class="h-10 w-10 rounded-lg bg-blue-500 flex items-center justify-center mr-3"
                >
                  <svg
                    class="w-5 h-5 text-white"
                    viewBox="0 0 256 256"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z"
                      fill="currentColor"
                    />
                 </svg>
                </div>
                <div>
                  <h2 class="text-lg font-semibold text-gray-800">
                    Profile Information
                  </h2>
                  <p class="text-sm text-gray-600">
                    Update your personal details
                  </p>
                </div>
              </div>
            </div>

            <form @submit.prevent="handleUpdateProfile" class="p-6">
              <div class="space-y-5">
                <!-- Email (read-only) -->
                <div>
                  <label
                    for="email"
                    class="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Email Address
                  </label>
                  <div class="relative">
                    <div
                      class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                    >
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
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <input
                      type="email"
                      id="email"
                      v-model="email"
                      disabled
                      class="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                  </div>
                  <p class="mt-1.5 text-xs text-gray-500 flex items-center">
                    <svg
                      class="w-3 h-3 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    Email address cannot be changed
                  </p>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <!-- First Name -->
                  <div>
                    <label
                      for="firstName"
                      class="block text-sm font-medium text-gray-700 mb-2"
                    >
                      First Name <span class="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      v-model="firstName"
                      required
                      class="w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      :disabled="isUpdatingProfile"
                    />
                  </div>

                  <!-- Last Name -->
                  <div>
                    <label
                      for="lastName"
                      class="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      v-model="lastName"
                      class="w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      :disabled="isUpdatingProfile"
                    />
                  </div>
                </div>

                <!-- Success Message -->
                <div
                  v-if="profileMessage"
                  class="flex items-start p-4 bg-green-50 border border-green-200 rounded-lg"
                >
                  <svg
                    class="w-5 h-5 text-green-600 mr-3 mt-0.5 shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  <p class="text-sm text-green-800">{{ profileMessage }}</p>
                </div>

                <!-- Error Message -->
                <div
                  v-if="profileError"
                  class="flex items-start p-4 bg-red-50 border border-red-200 rounded-lg"
                >
                  <svg
                    class="w-5 h-5 text-red-600 mr-3 mt-0.5 shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  <p class="text-sm text-red-800">{{ profileError }}</p>
                </div>

                <!-- Submit Button -->
                <div class="pt-2 flex justify-end">
                  <button
                    type="submit"
                    :disabled="isUpdatingProfile"
                    class="inline-flex items-center px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
                  >
                    <svg
                      v-if="isUpdatingProfile"
                      class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
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
                    <span v-if="isUpdatingProfile">Updating...</span>
                    <span v-else>Save Changes</span>
                  </button>
                </div>
              </div>
            </form>
          </div>

          <!-- Password Settings Card -->
          <div
            class="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200"
          >
            <div
              class="bg-linear-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-200"
            >
              <div class="flex items-center">
                <div
                  class="h-10 w-10 rounded-lg bg-blue-500 flex items-center justify-center mr-3"
                >
                  <svg
                    class="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 class="text-lg font-semibold text-gray-800">
                    Security Settings
                  </h2>
                  <p class="text-sm text-gray-600">
                    Update your password to keep your account secure
                  </p>
                </div>
              </div>
            </div>

            <form @submit.prevent="handleUpdatePassword" class="p-6">
              <div class="space-y-5">
                <!-- Current Password -->
                <div>
                  <label
                    for="currentPassword"
                    class="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Current Password <span class="text-red-500">*</span>
                  </label>
                  <div class="relative">
                    <div
                      class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                    >
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
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                    <input
                      :type="showPassword ? 'text' : 'password'"
                      id="currentPassword"
                      v-model="currentPassword"
                      placeholder="Enter your current password"
                      required
                      class="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      :disabled="isUpdatingPassword"
                    />
                    <button
                        type="button"
                        @click="togglePasswordVisibility"
                        :disabled="isUpdatingPassword"
                        class="absolute inset-y-0 right-0 pr-3 flex items-center disabled:cursor-not-allowed"
                        tabindex="-1"
                      >
                        <svg
                          v-if="showPassword"
                          class="h-5 w-5 text-gray-400 hover:text-gray-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                          />
                        </svg>
                        <svg
                          v-else
                          class="h-5 w-5 text-gray-400 hover:text-gray-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </button>
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <!-- New Password -->
                  <div>
                    <label
                      for="newPassword"
                      class="block text-sm font-medium text-gray-700 mb-2"
                    >
                      New Password <span class="text-red-500">*</span>
                    </label>
                    <div class="relative">
                      <input
                        :type="showNewPassword ? 'text' : 'password'"
                        id="newPassword"
                        v-model="newPassword"
                        placeholder="Enter your new password"
                        required
                        class="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                        :disabled="isUpdatingPassword"
                      />
                      <button
                        type="button"
                        @click="toggleNewPasswordVisibility"
                        :disabled="isUpdatingPassword"
                        class="absolute inset-y-0 right-0 pr-3 flex items-center disabled:cursor-not-allowed"
                        tabindex="-1"
                      >
                        <svg
                          v-if="showNewPassword"
                          class="h-5 w-5 text-gray-400 hover:text-gray-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                          />
                        </svg>
                        <svg
                          v-else
                          class="h-5 w-5 text-gray-400 hover:text-gray-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </button>
                    </div>
                    <p class="mt-1.5 text-xs text-gray-500 flex items-center">
                      <svg
                        class="w-3 h-3 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clip-rule="evenodd"
                        />
                      </svg>
                      Minimum 6 characters
                    </p>
                  </div>

                  <!-- Confirm New Password -->
                  <div>
                    <label
                      for="confirmPassword"
                      class="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Confirm Password <span class="text-red-500">*</span>
                    </label>
                    <div class="relative">
                      <input
                        :type="showConfirmPassword ? 'text' : 'password'"
                        id="confirmPassword"
                        placeholder="Confirm your new password"
                        v-model="confirmPassword"
                        required
                        class="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                        :disabled="isUpdatingPassword"
                      />
                      <button
                        type="button"
                        @click="toggleConfirmPasswordVisibility"
                        :disabled="isUpdatingPassword"
                        class="absolute inset-y-0 right-0 pr-3 flex items-center disabled:cursor-not-allowed"
                        tabindex="-1"
                      >
                        <svg
                          v-if="showConfirmPassword"
                          class="h-5 w-5 text-gray-400 hover:text-gray-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                          />
                        </svg>
                        <svg
                          v-else
                          class="h-5 w-5 text-gray-400 hover:text-gray-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Success Message -->
                <div
                  v-if="passwordMessage"
                  class="flex items-start p-4 bg-green-50 border border-green-200 rounded-lg"
                >
                  <svg
                    class="w-5 h-5 text-green-600 mr-3 mt-0.5 shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  <p class="text-sm text-green-800">{{ passwordMessage }}</p>
                </div>

                <!-- Error Message -->
                <div
                  v-if="passwordError"
                  class="flex items-start p-4 bg-red-50 border border-red-200 rounded-lg"
                >
                  <svg
                    class="w-5 h-5 text-red-600 mr-3 mt-0.5 shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  <p class="text-sm text-red-800">{{ passwordError }}</p>
                </div>

                <!-- Submit Button -->
                <div class="pt-2 flex justify-end">
                  <button
                    type="submit"
                    :disabled="isUpdatingPassword"
                    class="inline-flex items-center px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
                  >
                    <svg
                      v-if="isUpdatingPassword"
                      class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
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
                    <span v-if="isUpdatingPassword">Updating...</span>
                    <span v-else>Change Password</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
/* Additional styles if needed */
</style>
