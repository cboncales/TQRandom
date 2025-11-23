<script setup>
import AppLayout from "@/components/layout/AppLayout.vue";
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthUserStore } from "@/stores/authUser";

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
      class="min-h-screen flex items-center justify-center bg-gray-200 py-12 px-4 sm:px-6 lg:px-8"
    >
      <div
        class="max-w-md w-full bg-gray-50 rounded-2xl shadow-lg p-8 space-y-8"
      >
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
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
            </div>
            <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Create your account
            </h2>
            <p class="mt-2 text-center text-sm text-gray-600">
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
                    class="block text-sm font-medium text-gray-700"
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
                    class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label
                    for="lastName"
                    class="block text-sm font-medium text-gray-700"
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
                    class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div>
                <label
                  for="email"
                  class="block text-sm font-medium text-gray-700"
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
                  class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label
                  for="password"
                  class="block text-sm font-medium text-gray-700"
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
                    class="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                  class="block text-sm font-medium text-gray-700"
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
                    class="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
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
            <div
              v-if="showTermsModal"
              class="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50"
              data-aos="fade-up"
              data-aos-delay="300"
              @click.self="showTermsModal = false"
            >
              <div
                class="bg-white rounded-lg w-11/12 md:w-3/4 lg:w-1/2 max-h-[80vh] overflow-y-auto p-6 relative"
              >
                <!-- Terms and Conditions -->
                <div
                  class="bg-white p-8 rounded-2xl shadow mb-10"
                  data-aos="fade-up"
                  data-aos-delay="300"
                >
                  <h2 class="text-2xl font-semibold text-gray-800 mb-4">
                    Terms of Service
                  </h2>

                  <p class="text-gray-700 leading-relaxed mb-4">
                    <strong>Last updated November 19, 2025</strong>
                  </p>

                  <p class="text-gray-700 leading-relaxed mb-4">
                    These Terms and Conditions (“Terms”) govern your use of the
                    website
                    <strong>tq-random.vercel.app</strong> and the TQRandom web
                    application (“Service”). By accessing or using the Service,
                    you agree to be bound by these Terms. If you do not agree,
                    please discontinue use immediately.
                  </p>

                  <!-- Section: Use of Service -->
                  <h3 class="text-xl font-semibold text-gray-800 mb-2">
                    1. Use of the Service
                  </h3>
                  <p class="text-gray-700 leading-relaxed mb-4">
                    TQRandom is an online tool designed to help instructors
                    generate randomized test questionnaires. You agree to use
                    the Service only for lawful academic or instructional
                    purposes. You must not misuse, reverse-engineer, or attempt
                    to disrupt the functionality of the system.
                  </p>

                  <!-- Section: User Responsibilities -->
                  <h3 class="text-xl font-semibold text-gray-800 mb-2">
                    2. User Responsibilities
                  </h3>
                  <p class="text-gray-700 leading-relaxed mb-4">
                    By using the Service, you agree that:
                  </p>
                  <ul class="list-disc pl-6 text-gray-700 leading-relaxed mb-4">
                    <li>
                      You are responsible for the accuracy and legality of the
                      files you upload.
                    </li>
                    <li>
                      You will not upload malicious, harmful, or illegal
                      content.
                    </li>
                    <li>
                      You will not attempt to access restricted areas of the
                      system.
                    </li>
                    <li>
                      You will not perform actions that could disrupt or damage
                      the Service.
                    </li>
                  </ul>

                  <!-- Section: Intellectual Property -->
                  <h3 class="text-xl font-semibold text-gray-800 mb-2">
                    3. Intellectual Property
                  </h3>
                  <p class="text-gray-700 leading-relaxed mb-4">
                    All features, design elements, code, and content within
                    TQRandom remain the intellectual property of the developers.
                    You may use the Service but do not gain ownership over any
                    part of the platform.
                  </p>

                  <!-- Section: Limitation of Liability -->
                  <h3 class="text-xl font-semibold text-gray-800 mb-2">
                    4. Limitation of Liability
                  </h3>
                  <p class="text-gray-700 leading-relaxed mb-4">
                    TQRandom is provided on an “as-is” and “as-available” basis.
                    We do not guarantee that the Service will be error-free or
                    uninterrupted. Under no circumstances will the developers be
                    held liable for any damages arising from the use or
                    inability to use the Service.
                  </p>

                  <!-- Section: Privacy -->
                  <h3 class="text-xl font-semibold text-gray-800 mb-2">
                    5. Privacy and Data Handling
                  </h3>
                  <p class="text-gray-700 leading-relaxed mb-4">
                    By using the Service, you also agree to our Privacy Policy,
                    which explains how we collect and manage information. Please
                    review it to understand your rights and how your data is
                    handled.
                  </p>

                  <!-- Section: Modifications -->
                  <h3 class="text-xl font-semibold text-gray-800 mb-2">
                    6. Changes to These Terms
                  </h3>
                  <p class="text-gray-700 leading-relaxed mb-4">
                    We may update these Terms from time to time. Updated
                    versions will be posted on this page with a revised “Last
                    Updated” date. Continued use of the Service means you accept
                    any changes made.
                  </p>

                  <!-- Section: Contact -->
                  <h3 class="text-xl font-semibold text-gray-800 mb-2">
                    7. Contact Information
                  </h3>
                  <p class="text-gray-700 leading-relaxed mb-4">
                    For questions or concerns regarding these Terms, you may
                    contact us at:
                  </p>

                  <p class="text-gray-700 leading-relaxed">
                    <a
                      href="mailto:joshuatubo4@gmail.com"
                      class="text-blue-600 underline"
                    >
                      joshuatubo4@gmail.com
                    </a>
                    ,
                    <a
                      href="mailto:clarkboncales115@gmail.com"
                      class="text-blue-600 underline"
                    >
                      clarkboncales115@gmail.com
                    </a>
                  </p>
                </div>
                <button
                  @click="showTermsModal = false"
                  class="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>

            <!-- Privacy Policy Modal -->
            <div
              v-if="showPrivacyModal"
              class="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50"
              @click.self="showPrivacyModal = false"
            >
              <div
                class="bg-white rounded-lg w-11/12 md:w-3/4 lg:w-1/2 max-h-[80vh] overflow-y-auto p-6 relative"
                data-aos="fade-up"
                data-aos-delay="300"
              >
                <section class="py-10 bg-opacity-50 backdrop-blur-sm">
                  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <!-- Privacy Policy -->
                    <div class="bg-white p-8 rounded-2xl shadow mb-10">
                      <h2 class="text-2xl font-semibold text-gray-800 mb-4">
                        Privacy Policy
                      </h2>

                      <p class="text-gray-700 leading-relaxed mb-4">
                        <strong>Last updated November 19, 2025</strong>
                      </p>

                      <p class="text-gray-700 leading-relaxed mb-4">
                        This Privacy Notice for
                        <strong>__________________</strong> ("we," "us," or
                        "our"), describes how and why we might access, collect,
                        store, use, and/or share ("process") your personal
                        information when you use our services ("Services"),
                        including when you:
                      </p>

                      <ul
                        class="list-disc pl-6 text-gray-700 leading-relaxed mb-4"
                      >
                        <li>
                          Visit our website at
                          <strong>tq-random.vercel.app</strong> or any website
                          of ours that links to this Privacy Notice.
                        </li>
                        <li>
                          Use TQRandom. TQRandom is a web application created to
                          help instructors easily prepare randomized test
                          questionnaires. It was built with one goal in mind: to
                          reduce cheating and save time by generating multiple
                          clean, shuffled versions of tests for classroom
                          assessments.
                        </li>
                        <li>
                          Engage with us in other related ways, including any
                          sales, marketing, or events.
                        </li>
                      </ul>

                      <p class="text-gray-700 leading-relaxed mb-4">
                        <strong>Questions or concerns?</strong> Reading this
                        Privacy Notice will help you understand your privacy
                        rights and choices. We are responsible for making
                        decisions about how your personal information is
                        processed. If you do not agree with our policies and
                        practices, please do not use our Services. If you still
                        have any questions or concerns, please contact us at:
                      </p>

                      <p class="text-gray-700 leading-relaxed">
                        <a
                          href="mailto:joshuatubo4@gmail.com"
                          class="text-blue-600 underline"
                        >
                          joshuatubo4@gmail.com
                        </a>
                        ,
                        <a
                          href="mailto:clarkboncales115@gmail.com"
                          class="text-blue-600 underline"
                        >
                          clarkboncales115@gmail.com
                        </a>
                      </p>
                    </div>
                    <!-- Summary of Key Points -->
                    <div class="bg-white p-8 rounded-2xl shadow mb-10">
                      <h2 class="text-2xl font-semibold text-gray-800 mb-4">
                        Summary of Key Points
                      </h2>

                      <p class="text-gray-700 leading-relaxed mb-4">
                        This summary provides key points from our Privacy
                        Notice, but you can find out more details about any of
                        these topics by clicking the linked items below or by
                        using our
                        <a
                          href="#table-of-contents"
                          class="text-blue-600 underline"
                        >
                          table of contents.
                        </a>
                      </p>

                      <p class="text-gray-700 leading-relaxed mb-4">
                        <strong
                          >What personal information do we process?</strong
                        >
                        When you visit, use, or navigate our Services, we may
                        process personal information depending on how you
                        interact with us and the Services, the choices you make,
                        and the products and features you use.
                        <a
                          href="#personal-information"
                          class="text-blue-600 underline"
                        >
                          Learn more about personal information you disclose to
                          us.
                        </a>
                      </p>

                      <p class="text-gray-700 leading-relaxed mb-4">
                        <strong
                          >Do we process any sensitive personal
                          information?</strong
                        >
                        Some of the information may be considered "special" or
                        "sensitive" in certain jurisdictions (e.g., racial or
                        ethnic origins, sexual orientation, religious beliefs).
                        We do <strong>not</strong> process sensitive personal
                        information.
                      </p>

                      <p class="text-gray-700 leading-relaxed mb-4">
                        <strong
                          >Do we collect any information from third
                          parties?</strong
                        >
                        We do not collect any information from third parties.
                      </p>

                      <p class="text-gray-700 leading-relaxed mb-4">
                        <strong>How do we process your information?</strong>
                        We process your information to provide, improve, and
                        administer our Services, communicate with you, ensure
                        security and fraud prevention, and comply with the law.
                        We may also process your information for other purposes
                        with your consent. We process your information only when
                        we have a valid legal reason to do so.
                        <a
                          href="#how-we-process"
                          class="text-blue-600 underline"
                        >
                          Learn more about how we process your information.
                        </a>
                      </p>

                      <p class="text-gray-700 leading-relaxed mb-4">
                        <strong
                          >In what situations and with which parties do we share
                          personal information?</strong
                        >
                        We may share personal information in specific situations
                        and with specific third parties.
                        <a
                          href="#share-information"
                          class="text-blue-600 underline"
                        >
                          Learn more about when and with whom we share your
                          personal information.
                        </a>
                      </p>

                      <p class="text-gray-700 leading-relaxed mb-4">
                        <strong>How do we keep your information safe?</strong>
                        We use organizational and technical measures to protect
                        your information. However, no electronic transmission or
                        storage system is 100% secure, and we cannot guarantee
                        that unauthorized parties will never access your data.
                        <a
                          href="#information-safety"
                          class="text-blue-600 underline"
                        >
                          Learn more about how we keep your information safe.
                        </a>
                      </p>

                      <p class="text-gray-700 leading-relaxed mb-4">
                        <strong>What are your rights?</strong>
                        Privacy laws in your region may give you certain rights
                        regarding your personal information.
                        <a
                          href="#privacy-rights"
                          class="text-blue-600 underline"
                        >
                          Learn more about your privacy rights.
                        </a>
                      </p>

                      <p class="text-gray-700 leading-relaxed mb-4">
                        <strong>How do you exercise your rights?</strong>
                        The easiest way is by visiting
                        <strong>tq-random.vercel.app</strong> or contacting us
                        directly. We will act on your request in accordance with
                        applicable laws.
                      </p>

                      <p class="text-gray-700 leading-relaxed">
                        <strong
                          >Want to learn more about what we do with any
                          information we collect?</strong
                        >
                        <a href="#full-notice" class="text-blue-600 underline">
                          Review the Privacy Notice in full.
                        </a>
                      </p>
                    </div>
                    <!-- TABLE OF CONTENTS -->
                    <div
                      id="table-of-contents"
                      class="bg-white p-8 rounded-2xl shadow mb-10"
                    >
                      <h2 class="text-2xl font-semibold text-gray-800 mb-4">
                        Table of Contents
                      </h2>

                      <ol
                        class="list-decimal pl-6 text-gray-700 space-y-2 leading-relaxed"
                      >
                        <li>
                          <a
                            href="#what-information-we-collect"
                            class="text-blue-600 underline"
                          >
                            WHAT INFORMATION DO WE COLLECT?
                          </a>
                        </li>

                        <li>
                          <a
                            href="#how-we-process-information"
                            class="text-blue-600 underline"
                          >
                            HOW DO WE PROCESS YOUR INFORMATION?
                          </a>
                        </li>

                        <li>
                          <a
                            href="#share-personal-information"
                            class="text-blue-600 underline"
                          >
                            WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL
                            INFORMATION?
                          </a>
                        </li>

                        <li>
                          <a
                            href="#social-logins"
                            class="text-blue-600 underline"
                          >
                            HOW DO WE HANDLE YOUR SOCIAL LOGINS?
                          </a>
                        </li>

                        <li>
                          <a
                            href="#information-retention"
                            class="text-blue-600 underline"
                          >
                            HOW LONG DO WE KEEP YOUR INFORMATION?
                          </a>
                        </li>

                        <li>
                          <a
                            href="#information-safety"
                            class="text-blue-600 underline"
                          >
                            HOW DO WE KEEP YOUR INFORMATION SAFE?
                          </a>
                        </li>

                        <li>
                          <a
                            href="#minors-data"
                            class="text-blue-600 underline"
                          >
                            DO WE COLLECT INFORMATION FROM MINORS?
                          </a>
                        </li>

                        <li>
                          <a
                            href="#privacy-rights"
                            class="text-blue-600 underline"
                          >
                            WHAT ARE YOUR PRIVACY RIGHTS?
                          </a>
                        </li>

                        <li>
                          <a
                            href="#do-not-track"
                            class="text-blue-600 underline"
                          >
                            CONTROLS FOR DO-NOT-TRACK FEATURES
                          </a>
                        </li>

                        <li>
                          <a
                            href="#regional-rights"
                            class="text-blue-600 underline"
                          >
                            DO OTHER REGIONS HAVE SPECIFIC PRIVACY RIGHTS?
                          </a>
                        </li>

                        <li>
                          <a
                            href="#data-handling-questionnaires"
                            class="text-blue-600 underline"
                          >
                            DATA HANDLING OF UPLOADED QUESTIONNAIRES
                          </a>
                        </li>

                        <li>
                          <a
                            href="#student-anonymity"
                            class="text-blue-600 underline"
                          >
                            STUDENT ANONYMITY
                          </a>
                        </li>

                        <li>
                          <a
                            href="#limitations-third-party"
                            class="text-blue-600 underline"
                          >
                            LIMITATIONS ON THIRD-PARTY SHARING
                          </a>
                        </li>

                        <li>
                          <a
                            href="#updates-to-notice"
                            class="text-blue-600 underline"
                          >
                            DO WE MAKE UPDATES TO THIS NOTICE?
                          </a>
                        </li>

                        <li>
                          <a
                            href="#contact-about-notice"
                            class="text-blue-600 underline"
                          >
                            HOW CAN YOU CONTACT US ABOUT THIS NOTICE?
                          </a>
                        </li>

                        <li>
                          <a
                            href="#review-update-delete"
                            class="text-blue-600 underline"
                          >
                            HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE
                            COLLECT FROM YOU?
                          </a>
                        </li>
                      </ol>
                    </div>
                    <!-- 1. WHAT INFORMATION DO WE COLLECT -->
                    <div
                      id="what-information-we-collect"
                      class="bg-white p-8 rounded-2xl shadow mb-10 scroll-mt-24"
                    >
                      <h2
                        class="text-gray-700 leading-relaxed text-2xl font-bold mb-4"
                      >
                        1. WHAT INFORMATION DO WE COLLECT?
                      </h2>

                      <h3
                        class="text-gray-700 leading-relaxed text-lg font-semibold mb-2"
                      >
                        Personal information you disclose to us
                      </h3>

                      <p class="text-gray-700 leading-relaxed mb-4">
                        <strong>In Short:</strong> We collect personal
                        information that you provide to us.
                      </p>

                      <p class="text-gray-700 leading-relaxed mb-4">
                        We collect personal information that you voluntarily
                        provide to us when you register on the Services, express
                        an interest in obtaining information about us or our
                        products and Services, when you participate in
                        activities on the Services, or otherwise when you
                        contact us.
                      </p>

                      <p class="text-gray-700 leading-relaxed mb-4">
                        <strong>Personal Information Provided by You.</strong>
                        The personal information that we collect depends on the
                        context of your interactions with us and the Services,
                        the choices you make, and the products and features you
                        use. The personal information we collect may include the
                        following:
                      </p>

                      <ul class="list-disc pl-5 space-y-1">
                        <li>names</li>
                        <li>phone numbers</li>
                        <li>email addresses</li>
                        <li>usernames</li>
                        <li>passwords</li>
                      </ul>
                      <p class="text-gray-700 leading-relaxed mb-2">
                        <strong>Sensitive Information:</strong> We do not
                        process sensitive information.
                      </p>

                      <p class="text-gray-700 leading-relaxed mb-2">
                        <strong>Social Media Login Data:</strong> We may provide
                        you with the option to register with us using your
                        existing social media account details, like your
                        Facebook, X, or other social media account. If you
                        choose to register in this way, we will collect certain
                        profile information about you from the social media
                        provider, as described in the section called
                        <a href="#social-logins" class="text-blue-600 underline"
                          >"HOW DO WE HANDLE YOUR SOCIAL LOGINS?"</a
                        >.
                      </p>

                      <p class="text-gray-700 leading-relaxed">
                        All personal information that you provide to us must be
                        true, complete, and accurate, and you must notify us of
                        any changes to such personal information.
                      </p>
                    </div>
                    <!-- 2. HOW DO WE PROCESS YOUR INFORMATION? -->
                    <div
                      id="how-we-process-information"
                      class="bg-white p-8 rounded-2xl shadow mb-10 scroll-mt-20"
                    >
                      <h2 class="text-2xl font-semibold text-gray-800 mb-4">
                        2. HOW DO WE PROCESS YOUR INFORMATION?
                      </h2>

                      <p class="text-gray-700 leading-relaxed mb-2">
                        <strong>In Short:</strong> We process your information
                        to provide, improve, and administer our Services,
                        communicate with you, for security and fraud prevention,
                        and to comply with law. We may also process your
                        information for other purposes with your consent.
                      </p>

                      <p class="text-gray-700 leading-relaxed mb-2">
                        We process your personal information for a variety of
                        reasons, depending on how you interact with our
                        Services, including:
                      </p>

                      <ul class="list-disc pl-6 text-gray-700 mb-4">
                        <li>
                          To facilitate account creation and authentication and
                          otherwise manage user accounts.
                        </li>
                        <li>
                          To deliver and facilitate delivery of services to the
                          user.
                        </li>
                        <li>
                          To respond to user inquiries/offer support to users.
                        </li>
                        <li>To send administrative information to you.</li>
                        <li>To request feedback.</li>
                        <li>To protect our Services.</li>
                        <li>
                          To evaluate and improve our Services, products,
                          marketing, and your experience.
                        </li>
                        <li>To identify usage trends.</li>
                      </ul>
                    </div>
                    <!-- 3. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION? -->
                    <div
                      id="share-personal-information"
                      class="bg-white p-8 rounded-2xl shadow mb-10 scroll-mt-20"
                    >
                      <h2 class="text-2xl font-semibold text-gray-800 mb-4">
                        3. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL
                        INFORMATION?
                      </h2>

                      <p class="text-gray-700 leading-relaxed mb-2">
                        <strong>In Short:</strong> We may share information in
                        specific situations described in this section and/or
                        with the following third parties.
                      </p>

                      <p class="text-gray-700 leading-relaxed mb-4">
                        We may need to share your personal information in the
                        following situations:
                      </p>

                      <ul class="list-disc pl-6 text-gray-700 mb-4">
                        <li>
                          <strong>Business Transfers:</strong> We may share or
                          transfer your information in connection with, or
                          during negotiations of, any merger, sale of company
                          assets, financing, or acquisition of all or a portion
                          of our business to another company.
                        </li>
                      </ul>
                    </div>

                    <!-- 4. HOW DO WE HANDLE YOUR SOCIAL LOGINS? -->
                    <div
                      id="social-logins"
                      class="bg-white p-8 rounded-2xl shadow mb-10 scroll-mt-20"
                    >
                      <h2 class="text-2xl font-semibold text-gray-800 mb-4">
                        4. HOW DO WE HANDLE YOUR SOCIAL LOGINS?
                      </h2>

                      <p class="text-gray-700 leading-relaxed mb-2">
                        <strong>In Short:</strong> If you choose to register or
                        log in to our Services using a social media account, we
                        may have access to certain information about you.
                      </p>

                      <p class="text-gray-700 leading-relaxed mb-2">
                        Our Services offer you the ability to register and log
                        in using your third-party social media account details
                        (like your Facebook or X logins). Where you choose to do
                        this, we will receive certain profile information about
                        you from your social media provider.
                      </p>

                      <p class="text-gray-700 leading-relaxed mb-2">
                        The profile information we receive may vary depending on
                        the social media provider concerned, but will often
                        include your name, email address, friends list, and
                        profile picture, as well as other information you choose
                        to make public.
                      </p>

                      <p class="text-gray-700 leading-relaxed">
                        We will use the information we receive only for the
                        purposes described in this Privacy Notice or that are
                        otherwise made clear to you on the relevant Services. We
                        do not control other uses of your personal information
                        by the third-party provider. Please review their privacy
                        notice for details.
                      </p>
                    </div>

                    <!-- 5. HOW LONG DO WE KEEP YOUR INFORMATION? -->
                    <div
                      id="information-retention"
                      class="bg-white p-8 rounded-2xl shadow mb-10 scroll-mt-20"
                    >
                      <h2 class="text-2xl font-semibold text-gray-800 mb-4">
                        5. HOW LONG DO WE KEEP YOUR INFORMATION?
                      </h2>

                      <p class="text-gray-700 leading-relaxed mb-2">
                        <strong>In Short:</strong> We keep your information for
                        as long as necessary to fulfill the purposes outlined in
                        this Privacy Notice unless otherwise required by law.
                      </p>

                      <p class="text-gray-700 leading-relaxed mb-2">
                        We will only keep your personal information for as long
                        as necessary for the purposes set out in this Privacy
                        Notice, unless a longer retention period is required or
                        permitted by law (e.g., tax, accounting, or other legal
                        requirements). No purpose will require us keeping your
                        personal information longer than the period users have
                        an account with us.
                      </p>

                      <p class="text-gray-700 leading-relaxed">
                        When we have no ongoing legitimate business need to
                        process your personal information, we will either delete
                        or anonymize such information, or if not possible (e.g.,
                        stored in backup archives), we will securely store it
                        and isolate it from further processing until deletion is
                        possible.
                      </p>
                    </div>

                    <!-- 6. HOW DO WE KEEP YOUR INFORMATION SAFE? -->
                    <div
                      id="information-safety"
                      class="bg-white p-8 rounded-2xl shadow mb-10 scroll-mt-20"
                    >
                      <h2 class="text-2xl font-semibold text-gray-800 mb-4">
                        6. HOW DO WE KEEP YOUR INFORMATION SAFE?
                      </h2>

                      <p class="text-gray-700 leading-relaxed mb-2">
                        <strong>In Short:</strong> We aim to protect your
                        personal information through a system of organizational
                        and technical security measures.
                      </p>

                      <p class="text-gray-700 leading-relaxed mb-2">
                        We have implemented appropriate and reasonable technical
                        and organizational security measures designed to protect
                        the security of any personal information we process.
                      </p>

                      <p class="text-gray-700 leading-relaxed">
                        Despite our safeguards, no electronic transmission over
                        the Internet or information storage technology can be
                        guaranteed 100% secure, so we cannot promise that
                        hackers, cybercriminals, or other unauthorized parties
                        will not access your information. Transmission to and
                        from our Services is at your own risk. Access the
                        Services only in a secure environment.
                      </p>
                    </div>
                    <!-- 7. DO WE COLLECT INFORMATION FROM MINORS? -->
                    <div
                      id="minors-data"
                      class="bg-white p-8 rounded-2xl shadow mb-10 scroll-mt-20"
                    >
                      <h2 class="text-2xl font-semibold text-gray-800 mb-4">
                        7. DO WE COLLECT INFORMATION FROM MINORS?
                      </h2>

                      <p class="text-gray-700 leading-relaxed">
                        <strong>In Short:</strong> We do not knowingly collect
                        data from or market to minors.
                      </p>
                    </div>

                    <!-- 8. WHAT ARE YOUR PRIVACY RIGHTS? -->
                    <div
                      id="privacy-rights"
                      class="bg-white p-8 rounded-2xl shadow mb-10 scroll-mt-20"
                    >
                      <h2 class="text-2xl font-semibold text-gray-800 mb-4">
                        8. WHAT ARE YOUR PRIVACY RIGHTS?
                      </h2>

                      <p class="text-gray-700 leading-relaxed mb-2">
                        <strong>In Short:</strong> You may review, change, or
                        terminate your account at any time, depending on your
                        country, province, or state of residence.
                      </p>

                      <p class="text-gray-700 leading-relaxed">
                        <strong>Withdrawing your consent:</strong> If we are
                        relying on your consent to process your personal
                        information (express and/or implied depending on the
                        law), you have the right to withdraw your consent at any
                        time. You can withdraw your consent by contacting us
                        using the details provided in the section
                        <a
                          href="#contact-about-notice"
                          class="text-blue-600 underline"
                          >"HOW CAN YOU CONTACT US ABOUT THIS NOTICE?"</a
                        >below.
                      </p>

                      <p class="text-gray-700 leading-relaxed">
                        Please note that withdrawing consent will not affect the
                        lawfulness of the processing prior to withdrawal, nor
                        will it affect processing conducted on other lawful
                        grounds.
                      </p>
                    </div>
                    <!-- 9. CONTROLS FOR DO-NOT-TRACK FEATURES -->
                    <div
                      id="do-not-track"
                      class="bg-white p-8 rounded-2xl shadow mb-10 scroll-mt-20"
                    >
                      <h2 class="text-2xl font-semibold text-gray-800 mb-4">
                        9. CONTROLS FOR DO-NOT-TRACK FEATURES
                      </h2>

                      <p class="text-gray-700 leading-relaxed">
                        Most web browsers and some mobile operating systems and
                        mobile applications include a Do-Not-Track ("DNT")
                        feature or setting you can activate to signal your
                        privacy preference not to have data about your online
                        browsing activities monitored and collected.
                      </p>

                      <p class="text-gray-700 leading-relaxed mb-2">
                        No uniform technology standard for recognizing and
                        implementing DNT signals has been finalized. As such, we
                        do not currently respond to DNT browser signals or any
                        other mechanism that automatically communicates your
                        choice not to be tracked online. If a standard for
                        online tracking is adopted that we must follow in the
                        future, we will inform you about that practice in a
                        revised version of this Privacy Notice.
                      </p>
                    </div>

                    <!-- 10. DO OTHER REGIONS HAVE SPECIFIC PRIVACY RIGHTS? -->
                    <div
                      id="regional-privacy-rights"
                      class="bg-white p-8 rounded-2xl shadow mb-10 scroll-mt-20"
                    >
                      <h2 class="text-2xl font-semibold text-gray-800 mb-4">
                        10. DO OTHER REGIONS HAVE SPECIFIC PRIVACY RIGHTS?
                      </h2>

                      <p class="text-gray-700 leading-relaxed mb-2">
                        <strong>In Short:</strong> You may have additional
                        rights based on the country you reside in.
                      </p>

                      <p class="text-gray-700 leading-relaxed mb-2">
                        <strong>Philippines:</strong> We collect and process
                        your personal information in accordance with the
                        obligations and conditions set by the Data Privacy Act
                        of 2012 (Republic Act No. 10173) and its implementing
                        rules and regulations. This Privacy Notice satisfies the
                        notice requirements defined in the Data Privacy Act.
                      </p>

                      <ul class="list-disc pl-6 text-gray-700 mb-4">
                        <li>
                          Offer you the products or services that you want
                        </li>
                        <li>Respond to or help with your requests</li>
                        <li>Manage your account with us</li>
                        <li>Confirm your identity and protect your account</li>
                      </ul>

                      <p class="text-gray-700 leading-relaxed">
                        You can request access or correction of your personal
                        information by contacting us using the section
                        <a
                          href="#review-update-delete"
                          class="text-blue-600 underline"
                          >"HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE
                          COLLECT FROM YOU?"</a
                        >. If you believe we are unlawfully processing your
                        personal information, you have the right to submit a
                        complaint regarding a breach of the Data Privacy Act to
                        the National Privacy Commission (NPC) of the
                        Philippines.
                      </p>
                    </div>

                    <!-- 11. DATA HANDLING OF UPLOADED QUESTIONNAIRES -->
                    <div
                      id="data-handling"
                      class="bg-white p-8 rounded-2xl shadow mb-10 scroll-mt-20"
                    >
                      <h2 class="text-2xl font-semibold text-gray-800 mb-4">
                        11. DATA HANDLING OF UPLOADED QUESTIONNAIRES
                      </h2>

                      <p class="text-gray-700 leading-relaxed">
                        All test questionnaires, questions, and answer files
                        uploaded by teachers are securely stored in the TQRandom
                        database (Supabase). This data is used only to generate
                        randomized test versions and is not shared with
                        unauthorized third parties. Uploaded files are encrypted
                        and protected with access controls to prevent
                        unauthorized access.
                      </p>
                    </div>

                    <!-- 12. STUDENT ANONYMITY -->
                    <div
                      id="student-anonymity"
                      class="bg-white p-8 rounded-2xl shadow mb-10 scroll-mt-20"
                    >
                      <h2 class="text-2xl font-semibold text-gray-800 mb-4">
                        12. STUDENT ANONYMITY
                      </h2>

                      <p class="text-gray-700 leading-relaxed">
                        TQRandom does not collect or store any personally
                        identifiable information of students. All student data
                        remains anonymous, ensuring privacy and preventing
                        tracking of individual student performance. Only the
                        system-generated test responses are recorded for
                        operational purposes, without linking them to personal
                        identifiers.
                      </p>
                    </div>

                    <!-- 13. LIMITATIONS ON THIRD-PARTY SHARING -->
                    <div
                      id="third-party-sharing"
                      class="bg-white p-8 rounded-2xl shadow mb-10 scroll-mt-20"
                    >
                      <h2 class="text-2xl font-semibold text-gray-800 mb-4">
                        13. LIMITATIONS ON THIRD-PARTY SHARING
                      </h2>

                      <p class="text-gray-700 leading-relaxed">
                        TQRandom will not sell, rent, or trade user information
                        to advertisers or unrelated third parties. Personal and
                        questionnaire data may only be shared with trusted
                        service providers for system operations, maintenance, or
                        legal compliance. All shared data is subject to strict
                        confidentiality and security measures.
                      </p>
                    </div>

                    <!-- 14. DO WE MAKE UPDATES TO THIS NOTICE? -->
                    <div
                      id="updates-notice"
                      class="bg-white p-8 rounded-2xl shadow mb-10 scroll-mt-20"
                    >
                      <h2 class="text-2xl font-semibold text-gray-800 mb-4">
                        14. DO WE MAKE UPDATES TO THIS NOTICE?
                      </h2>

                      <p class="text-gray-700 leading-relaxed mb-2">
                        <strong>In Short:</strong> Yes, we will update this
                        notice as necessary to stay compliant with relevant
                        laws.
                      </p>

                      <p class="text-gray-700 leading-relaxed">
                        We may update this Privacy Notice from time to time. The
                        updated version will be indicated by an updated
                        "Revised" date at the top of this Privacy Notice. If we
                        make material changes to this Privacy Notice, we may
                        notify you either by prominently posting a notice of
                        such changes or by directly sending you a notification.
                        We encourage you to review this Privacy Notice
                        frequently to be informed of how we are protecting your
                        information.
                      </p>
                    </div>

                    <!-- 15. HOW CAN YOU CONTACT US ABOUT THIS NOTICE? -->
                    <div
                      id="contact-about-notice"
                      class="bg-white p-8 rounded-2xl shadow mb-10 scroll-mt-20"
                    >
                      <h2 class="text-2xl font-semibold text-gray-800 mb-4">
                        15. HOW CAN YOU CONTACT US ABOUT THIS NOTICE?
                      </h2>

                      <p class="text-gray-700 leading-relaxed mb-2">
                        If you have questions or comments about this notice, you
                        may email us at
                        <a
                          href="mailto:clarkboncales115@gmail.com"
                          class="text-blue-600 underline"
                          >clarkboncales115@gmail.com</a
                        >,
                        <a
                          href="mailto:joshuatubo4@gmail.com"
                          class="text-blue-600 underline"
                          >joshuatubo4@gmail.com</a
                        >
                        or contact us by post at:
                      </p>

                      <p class="text-gray-700 leading-relaxed">
                        Ampayon<br />
                        Butuan City, Agusan del Norte 8600<br />
                        Philippines
                      </p>
                    </div>

                    <!-- 16. HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU? -->
                    <div
                      id="review-update-delete"
                      class="bg-white p-8 rounded-2xl shadow mb-10 scroll-mt-20"
                    >
                      <h2 class="text-2xl font-semibold text-gray-800 mb-4">
                        16. HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE
                        COLLECT FROM YOU?
                      </h2>

                      <p class="text-gray-700 leading-relaxed mb-2">
                        Based on the applicable laws of your country, you may
                        have the right to request access to the personal
                        information we collect from you, details about how we
                        have processed it, correct inaccuracies, or delete your
                        personal information. You may also have the right to
                        withdraw your consent to our processing of your personal
                        information. These rights may be limited in some
                        circumstances by applicable law.
                      </p>

                      <p class="text-gray-700 leading-relaxed">
                        To request to review, update, or delete your personal
                        information, please visit:
                        <a
                          href="https://tq-random.vercel.app"
                          class="text-blue-600 underline"
                          >tq-random.vercel.app</a
                        >.
                      </p>
                    </div>
                  </div>
                </section>
                <button
                  @click="showPrivacyModal = false"
                  class="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>

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
              <label for="agree-terms" class="ml-2 block text-sm text-gray-900">
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
                <span
                  v-else
                  class="absolute left-0 inset-y-0 flex items-center pl-3"
                >
                  <svg
                    class="h-5 w-5 text-blue-500 group-hover:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                    />
                  </svg>
                </span>
                {{ isLoading ? "Creating account..." : "Create account" }}
              </button>

              <div class="relative">
                <div class="absolute inset-0 flex items-center">
                  <div class="w-full border-t border-gray-300" />
                </div>
                <div class="relative flex justify-center text-sm">
                  <span class="px-2 bg-gray-50 text-gray-500"
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
