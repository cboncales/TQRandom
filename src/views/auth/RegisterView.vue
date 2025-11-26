<script setup>
import AppLayout from "@/components/layout/AppLayout.vue";
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthUserStore } from "@/stores/authUser";
import TermsAndCondition from "@/components/auth/TermsAndCondition.vue";
import PrivacyPolicyModal from "@/components/auth/PrivacyPolicyModal.vue";

const router = useRouter();
const authStore = useAuthUserStore();

const firstName = ref("");
const lastName = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const agreeToTerms = ref(false);
const isLoading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");
const showPassword = ref(false);
const showConfirmPassword = ref(false);

// Toggle password visibility
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

// Toggle confirm password visibility
const toggleConfirmPasswordVisibility = () => {
  showConfirmPassword.value = !showConfirmPassword.value;
};

// Handle registration form submission
const handleRegister = async () => {
  // Clear previous messages
  errorMessage.value = "";
  successMessage.value = "";

  // Validate form
  if (
    !firstName.value.trim() ||
    !lastName.value.trim() ||
    !email.value.trim() ||
    !password.value.trim() ||
    !confirmPassword.value.trim()
  ) {
    errorMessage.value = "Please fill in all required fields";
    return;
  }

  if (!isValidEmail(email.value)) {
    errorMessage.value = "Please enter a valid email address";
    return;
  }

  if (password.value.length < 6) {
    errorMessage.value = "Password must be at least 6 characters long";
    return;
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = "Passwords do not match";
    return;
  }

  if (!agreeToTerms.value) {
    errorMessage.value = "Please agree to the Terms and Conditions";
    return;
  }

  isLoading.value = true;

  try {
    // Capitalize names before sending to Supabase
    const formattedFirstName = capitalizeWords(firstName.value.trim());
    const formattedLastName = capitalizeWords(lastName.value.trim());

    const result = await authStore.register(
      email.value.trim(),
      password.value,
      formattedFirstName,
      formattedLastName
    );

    if (result.error) {
      errorMessage.value = result.error;
    } else {
      successMessage.value = "Account created successfully! Logging you in...";

      // Save credentials before resetting form
      const savedEmail = email.value.trim();
      const savedPassword = password.value;

      // Reset form after successful registration
      resetForm();

      // Auto-login after successful registration
      setTimeout(async () => {
        try {
          const loginResult = await authStore.login(savedEmail, savedPassword);

          if (loginResult.error) {
            // If auto-login fails, just redirect to login with success message
            successMessage.value = "Redirecting to login...";
            setTimeout(() => {
              router.push({ name: "login" });
            }, 1500);
          } else {
            successMessage.value =
              "Registration successful! Redirecting to dashboard...";
            setTimeout(() => {
              router.push({ 
                name: "dashboard",
                query: { isNewUser: 'true' }
              });
            }, 1000);
          }
        } catch (loginError) {
          // If auto-login fails, just redirect to login with success message
          successMessage.value = "Redirecting to login...";
          setTimeout(() => {
            router.push("/login");
          }, 1500);
        }
      }, 1000);
    }
  } catch (error) {
    errorMessage.value = "An unexpected error occurred. Please try again.";
    console.error("Registration error:", error);
  } finally {
    isLoading.value = false;
  }
};

// Handle Google registration
const handleGoogleRegister = async () => {
  errorMessage.value = "";
  isLoading.value = true;

  try {
    const result = await authStore.signInWithGoogle();

    if (result.error) {
      errorMessage.value = result.error;
    }
    // Google OAuth will handle the redirect automatically
  } catch (error) {
    errorMessage.value = "Failed to sign up with Google. Please try again.";
    console.error("Google registration error:", error);
  } finally {
    isLoading.value = false;
  }
};

// Email validation helper
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Reset form function
const resetForm = () => {
  firstName.value = "";
  lastName.value = "";
  email.value = "";
  password.value = "";
  confirmPassword.value = "";
  agreeToTerms.value = false;
  showPassword.value = false;
  showConfirmPassword.value = false;
};

// Password strength indicator
const getPasswordStrength = () => {
  const pass = password.value;
  if (pass.length === 0) return { strength: 0, label: "", color: "" };
  if (pass.length < 6)
    return { strength: 1, label: "Too short", color: "text-red-600" };
  if (pass.length < 8)
    return { strength: 2, label: "Weak", color: "text-orange-600" };
  if (pass.length < 12 && /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(pass))
    return { strength: 3, label: "Good", color: "text-yellow-600" };
  if (
    pass.length >= 12 &&
    /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(pass)
  )
    return { strength: 4, label: "Strong", color: "text-green-600" };
  return { strength: 2, label: "Weak", color: "text-orange-600" };
};

// Capitalize first letter of each word
const capitalizeWords = (str) => {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
    .trim();
};

const showTermsModal = ref(false);
const showPrivacyModal = ref(false);

const openTermsModal = () => (showTermsModal.value = true);
const openPrivacyModal = () => (showPrivacyModal.value = true);
</script>

<template>
  <AppLayout>
    <div
      class="min-h-screen flex items-center justify-center bg-gray-200 dark:bg-gray-800 py-12 px-4 sm:px-6 lg:px-8"
    >
      <div
        class="max-w-md w-full bg-gray-50 dark:bg-gray-900 rounded-2xl shadow-lg p-8 space-y-8"
      >
        <div class="max-w-md w-full space-y-8">
          <div>
            <div
              class="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-600"
            >
              <svg 
                class="text-white h-10 w-10" 
                viewBox="0 0 256 256" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  d="M168,56a8,8,0,0,1,8-8h16V32a8,8,0,0,1,16,0V48h16a8,8,0,0,1,0,16H208V80a8,8,0,0,1-16,0V64H176A8,8,0,0,1,168,56Zm62.56,54.68a103.92,103.92,0,1,1-85.24-85.24,8,8,0,0,1-2.64,15.78A88.07,88.07,0,0,0,40,128a87.62,87.62,0,0,0,22.24,58.41A79.66,79.66,0,0,1,98.3,157.66a48,48,0,1,1,59.4,0,79.66,79.66,0,0,1,36.06,28.75A87.62,87.62,0,0,0,216,128a88.85,88.85,0,0,0-1.22-14.68,8,8,0,1,1,15.78-2.64ZM128,152a32,32,0,1,0-32-32A32,32,0,0,0,128,152Zm0,64a87.57,87.57,0,0,0,53.92-18.5,64,64,0,0,0-107.84,0A87.57,87.57,0,0,0,128,216Z" 
                  fill="currentColor" 
                />
              </svg>
            </div>
            <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-800 dark:text-gray-100">
              Create your account
            </h2>
            <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">
              Or
              <router-link
                to="/login"
                class="font-medium text-blue-600 hover:text-blue-500 underline"
              >
                sign in to your existing account
              </router-link>
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

          <form class="mt-8 space-y-6" @submit.prevent="handleRegister">
            <div class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label
                    for="firstName"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-100"
                    >First name</label
                  >
                  <input
                    id="firstName"
                    v-model="firstName"
                    name="firstName"
                    type="text"
                    autocomplete="given-name"
                    required
                    :disabled="isLoading"
                    @blur="firstName = capitalizeWords(firstName)"
                    class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 dark:bg-gray-800 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label
                    for="lastName"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-100"
                    >Last name</label
                  >
                  <input
                    id="lastName"
                    v-model="lastName"
                    name="lastName"
                    type="text"
                    autocomplete="family-name"
                    required
                    :disabled="isLoading"
                    @blur="lastName = capitalizeWords(lastName)"
                    class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 dark:bg-gray-800 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div>
                <label
                  for="email"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-100"
                  >Email address</label
                >
                <input
                  id="email"
                  v-model="email"
                  name="email"
                  type="email"
                  autocomplete="email"
                  required
                  :disabled="isLoading"
                  class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 dark:bg-gray-800 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label
                  for="password"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-100"
                  >Password</label
                >
                <div class="mt-1 relative">
                  <input
                    id="password"
                    v-model="password"
                    name="password"
                    :type="showPassword ? 'text' : 'password'"
                    autocomplete="new-password"
                    required
                    :disabled="isLoading"
                    class="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 dark:bg-gray-800 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    @click="togglePasswordVisibility"
                    :disabled="isLoading"
                    class="absolute inset-y-0 right-0 pr-3 flex items-center disabled:cursor-not-allowed z-10"
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
                <!-- Password Strength Indicator -->
                <div
                  v-if="password"
                  class="mt-1 text-xs"
                  :class="getPasswordStrength().color"
                >
                  {{ getPasswordStrength().label }}
                </div>
              </div>

              <div>
                <label
                  for="confirmPassword"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-100"
                  >Confirm password</label
                >
                <div class="mt-1 relative">
                  <input
                    id="confirmPassword"
                    v-model="confirmPassword"
                    name="confirmPassword"
                    :type="showConfirmPassword ? 'text' : 'password'"
                    autocomplete="new-password"
                    required
                    :disabled="isLoading"
                    class="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 dark:bg-gray-800 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    @click="toggleConfirmPasswordVisibility"
                    :disabled="isLoading"
                    class="absolute inset-y-0 right-0 pr-3 flex items-center disabled:cursor-not-allowed z-10"
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
                <!-- Password Match Indicator -->
                <div
                  v-if="confirmPassword && password !== confirmPassword"
                  class="mt-1 text-xs text-red-600"
                >
                  Passwords do not match
                </div>
                <div
                  v-else-if="confirmPassword && password === confirmPassword"
                  class="mt-1 text-xs text-green-600"
                >
                  Passwords match
                </div>
              </div>
            </div>
            <!-- Terms Modal -->
            <TermsAndCondition
              v-if="showTermsModal"
              :isOpen="showTermsModal"
              @close="showTermsModal = false"
            />

            <!-- Privacy Policy Modal -->
            <PrivacyPolicyModal
              v-if="showPrivacyModal"
              :isOpen="showPrivacyModal"
              @close="showPrivacyModal = false"
            />

            <div class="flex items-start">
              <input
                id="agree-terms"
                v-model="agreeToTerms"
                name="agree-terms"
                type="checkbox"
                required
                :disabled="isLoading"
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1 disabled:cursor-not-allowed"
              />
              <label for="agree-terms" class="ml-2 block text-sm text-gray-900 dark:text-gray-100">
                I agree to the
                <a
                  href="#"
                  @click.prevent="openTermsModal"
                  class="text-blue-600 hover:text-blue-500 font-medium"
                >
                  Terms and Conditions
                </a>
                and
                <a
                  href="#"
                  @click.prevent="openPrivacyModal"
                  class="text-blue-600 hover:text-blue-500 font-medium"
                  >Privacy Policy</a
                >
              </label>
            </div>

            <div class="space-y-4">
              <button
                type="submit"
                :disabled="isLoading || !agreeToTerms"
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
                {{ isLoading ? "Creating account..." : "Create account" }}
              </button>

              <div class="relative">
                <div class="absolute inset-0 flex items-center">
                  <div class="w-full border-t border-gray-300" />
                </div>
                <div class="relative flex justify-center text-sm">
                  <span class="px-2 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-100"
                    >Or continue with</span
                  >
                </div>
              </div>

              <button
                type="button"
                @click="handleGoogleRegister"
                :disabled="isLoading"
                class="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285f4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34a853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#fbbc05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#ea4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {{ isLoading ? "Loading..." : "Sign up with Google" }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
/* Custom styles if needed */
</style>
