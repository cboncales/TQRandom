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

onMounted(async () => {
  // Load current user data
  if (authStore.userData) {
    firstName.value = authStore.userData.user_metadata?.first_name || authStore.userData.first_name || "";
    lastName.value = authStore.userData.user_metadata?.last_name || authStore.userData.last_name || "";
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
    passwordError.value = "New password must be different from current password";
    return;
  }

  isUpdatingPassword.value = true;

  try {
    const result = await userApi.updatePassword(currentPassword.value, newPassword.value);

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
  router.push({ name: 'dashboard' });
};
</script>

<template>
  <AppLayout>
    <div class="min-h-screen bg-gray-200 py-8">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="mb-8">
          <button
            @click="goBack"
            class="flex items-center text-gray-600 hover:text-gray-900 mb-4"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Dashboard
          </button>
          <h1 class="text-3xl font-bold text-gray-900">Account Settings</h1>
          <p class="mt-2 text-sm text-gray-600">
            Manage your account information and security settings
          </p>
        </div>

        <!-- Profile Settings Card -->
        <div class="bg-white shadow rounded-lg p-6 mb-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-6">
            Profile Information
          </h2>

          <form @submit.prevent="handleUpdateProfile" class="space-y-4">
            <!-- Email (read-only) -->
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                v-model="email"
                disabled
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p class="mt-1 text-xs text-gray-500">
                Email cannot be changed
              </p>
            </div>

            <!-- First Name -->
            <div>
              <label for="firstName" class="block text-sm font-medium text-gray-700 mb-1">
                First Name <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="firstName"
                v-model="firstName"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                :disabled="isUpdatingProfile"
              />
            </div>

            <!-- Last Name -->
            <div>
              <label for="lastName" class="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                v-model="lastName"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                :disabled="isUpdatingProfile"
              />
            </div>

            <!-- Success Message -->
            <div v-if="profileMessage" class="p-3 bg-green-50 border border-green-200 rounded-md">
              <p class="text-sm text-green-800">{{ profileMessage }}</p>
            </div>

            <!-- Error Message -->
            <div v-if="profileError" class="p-3 bg-red-50 border border-red-200 rounded-md">
              <p class="text-sm text-red-800">{{ profileError }}</p>
            </div>

            <!-- Submit Button -->
            <div class="pt-2">
              <button
                type="submit"
                :disabled="isUpdatingProfile"
                class="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <span v-if="isUpdatingProfile">Updating...</span>
                <span v-else>Update Profile</span>
              </button>
            </div>
          </form>
        </div>

        <!-- Password Settings Card -->
        <div class="bg-white shadow rounded-lg p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-6">
            Change Password
          </h2>

          <form @submit.prevent="handleUpdatePassword" class="space-y-4">
            <!-- Current Password -->
            <div>
              <label for="currentPassword" class="block text-sm font-medium text-gray-700 mb-1">
                Current Password <span class="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="currentPassword"
                v-model="currentPassword"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                :disabled="isUpdatingPassword"
              />
            </div>

            <!-- New Password -->
            <div>
              <label for="newPassword" class="block text-sm font-medium text-gray-700 mb-1">
                New Password <span class="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="newPassword"
                v-model="newPassword"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                :disabled="isUpdatingPassword"
              />
              <p class="mt-1 text-xs text-gray-500">
                Must be at least 6 characters long
              </p>
            </div>

            <!-- Confirm New Password -->
            <div>
              <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password <span class="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="confirmPassword"
                v-model="confirmPassword"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                :disabled="isUpdatingPassword"
              />
            </div>

            <!-- Success Message -->
            <div v-if="passwordMessage" class="p-3 bg-green-50 border border-green-200 rounded-md">
              <p class="text-sm text-green-800">{{ passwordMessage }}</p>
            </div>

            <!-- Error Message -->
            <div v-if="passwordError" class="p-3 bg-red-50 border border-red-200 rounded-md">
              <p class="text-sm text-red-800">{{ passwordError }}</p>
            </div>

            <!-- Submit Button -->
            <div class="pt-2">
              <button
                type="submit"
                :disabled="isUpdatingPassword"
                class="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <span v-if="isUpdatingPassword">Updating...</span>
                <span v-else>Change Password</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
/* Additional styles if needed */
</style>

