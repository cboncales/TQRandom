<script setup>
import AppLayout from "@/components/layout/AppLayout.vue";
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { authApi } from "@/services/api";

const router = useRouter();
const route = useRoute();

const newPassword = ref("");
const confirmPassword = ref("");
const isLoading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");
const accessToken = ref("");

onMounted(() => {
  // Extract access token from URL hash (Supabase sends it this way)
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const token = hashParams.get('access_token');
  
  if (!token) {
    errorMessage.value = "Invalid or expired reset link. Please request a new password reset.";
  } else {
    accessToken.value = token;
  }
});

const handleResetPassword = async () => {
  errorMessage.value = "";
  successMessage.value = "";

  // Validation
  if (!newPassword.value) {
    errorMessage.value = "Password is required";
    return;
  }

  if (newPassword.value.length < 6) {
    errorMessage.value = "Password must be at least 6 characters long";
    return;
  }

  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = "Passwords do not match";
    return;
  }

  if (!accessToken.value) {
    errorMessage.value = "Invalid reset link. Please request a new password reset.";
    return;
  }

  isLoading.value = true;

  try {
    const result = await authApi.confirmPasswordReset(accessToken.value, newPassword.value);

    if (result.error) {
      errorMessage.value = result.error;
    } else {
      successMessage.value = "Password reset successfully! Redirecting to login...";
      // Redirect to login after successful reset
      setTimeout(() => {
        router.push({ name: "login" });
      }, 2000);
    }
  } catch (error) {
    errorMessage.value = "An unexpected error occurred. Please try again.";
    console.error("Reset password error:", error);
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <AppLayout>
    <div
      class="min-h-screen flex items-center justify-center bg-gray-200 py-12 px-4 sm:px-6 lg:px-8"
    >
      <div class="max-w-md w-full bg-gray-50 rounded-2xl shadow-lg p-8 space-y-8">
        <div class="max-w-md w-full space-y-8">
          <div>
            <div
              class="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-600"
            >
              <svg
                class="h-6 w-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
            </div>
            <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Reset your password
            </h2>
            <p class="mt-2 text-center text-sm text-gray-600">
              Enter your new password below
            </p>
          </div>

          <!-- Error Message -->
          <div
            v-if="errorMessage"
            class="bg-red-50 border border-red-200 rounded-md p-4"
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

          <!-- Success Message -->
          <div
            v-if="successMessage"
            class="bg-green-50 border border-green-200 rounded-md p-4"
          >
            <div class="flex">
              <div class="shrink-0">
                <svg
                  class="h-5 w-5 text-green-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
              <div class="ml-3">
                <p class="text-sm text-green-800">{{ successMessage }}</p>
              </div>
            </div>
          </div>

          <form v-if="accessToken" class="mt-8 space-y-6" @submit.prevent="handleResetPassword">
            <div class="rounded-md shadow-sm space-y-4">
              <div>
                <label
                  for="new-password"
                  class="block text-sm font-medium text-gray-700"
                >
                  New Password
                </label>
                <input
                  id="new-password"
                  v-model="newPassword"
                  name="new-password"
                  type="password"
                  autocomplete="new-password"
                  required
                  :disabled="isLoading"
                  class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Enter your new password"
                />
                <p class="mt-1 text-xs text-gray-500">
                  Must be at least 6 characters long
                </p>
              </div>
              <div>
                <label
                  for="confirm-password"
                  class="block text-sm font-medium text-gray-700"
                >
                  Confirm New Password
                </label>
                <input
                  id="confirm-password"
                  v-model="confirmPassword"
                  name="confirm-password"
                  type="password"
                  autocomplete="new-password"
                  required
                  :disabled="isLoading"
                  class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Confirm your new password"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                :disabled="isLoading || !accessToken"
                class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <span
                  v-if="isLoading"
                  class="absolute left-0 inset-y-0 flex items-center pl-3"
                >
                  <svg
                    class="h-5 w-5 text-blue-300 animate-spin"
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
                </span>
                {{ isLoading ? "Resetting..." : "Reset Password" }}
              </button>
            </div>

            <div class="text-center">
              <router-link
                to="/login"
                class="font-medium text-blue-600 hover:text-blue-500"
              >
                Back to Login
              </router-link>
            </div>
          </form>

          <!-- If no token, show error and link back to login -->
          <div v-else class="text-center space-y-4">
            <p class="text-sm text-gray-600">
              This reset link is invalid or has expired.
            </p>
            <router-link
              to="/login"
              class="inline-block font-medium text-blue-600 hover:text-blue-500"
            >
              Return to Login
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
/* Custom styles if needed */
</style>

