<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthUserStore } from "@/stores/authUser";

const router = useRouter();
const authStore = useAuthUserStore();
const isMenuOpen = ref(false);
const isUserDropdownOpen = ref(false);

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

const toggleUserDropdown = () => {
  isUserDropdownOpen.value = !isUserDropdownOpen.value;
};

const navigateTo = (routeName) => {
  router.push({ name: routeName });
  isMenuOpen.value = false;
  isUserDropdownOpen.value = false;
};

const handleLogout = async () => {
  const result = await authStore.logout();

  if (result.success) {
    router.push({ name: "home" });
  }
  isMenuOpen.value = false;
  isUserDropdownOpen.value = false;
};

// Use computed properties from auth store (reactive)
const isAuthenticated = computed(() => authStore.isAuthenticated);
const userData = computed(() => authStore.userData);

// Check authentication status only once on mount
onMounted(async () => {
  if (!authStore.userData) {
    await authStore.checkAuth();
  }
});

// Computed property to get user's display name from various sources
const userDisplayName = computed(() => {
  if (!userData.value) return "User";

  // Check user_metadata first (updated profile data)
  if (userData.value.user_metadata) {
    if (userData.value.user_metadata.first_name) {
      return userData.value.user_metadata.first_name;
    }
    if (userData.value.user_metadata.full_name) {
      return userData.value.user_metadata.full_name.split(" ")[0];
    }
  }

  // For Google OAuth users: use full_name or name
  if (userData.value.full_name) {
    return userData.value.full_name.split(" ")[0]; // Get first name from full name
  }

  // For regular email/password users: use first_name
  if (userData.value.first_name) {
    return userData.value.first_name;
  }

  // For Google OAuth: use name field
  if (userData.value.name) {
    return userData.value.name.split(" ")[0]; // Get first name from name
  }

  // Fallback to email username
  if (userData.value.email) {
    return userData.value.email.split("@")[0];
  }

  return "User";
});
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gray-50">
    <!-- Navbar -->
    <nav class="bg-gray-800 shadow-lg">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Logo/Brand -->
          <div class="shrink-0 flex items-center">
            <img src="/favicon.png" alt="TQRandom" class="w-8 h-8" />
            <h1 class="text-xl font-bold text-white">TQRandom</h1>
          </div>

          <!-- Desktop Navigation -->
          <div class="hidden md:block">
            <div class="ml-10 flex items-baseline space-x-4">
              <button
                @click="navigateTo('home')"
                class="text-white hover:text-gray-400 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                Home
              </button>

              <!-- Authenticated Navigation -->
              <template v-if="isAuthenticated">
                <button
                  @click="navigateTo('dashboard')"
                  class="text-white hover:text-gray-400 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Dashboard
                </button>

                <!-- User Profile Dropdown -->
                <div class="relative">
                  <button
                    @click="toggleUserDropdown"
                    class="flex items-center text-white hover:text-gray-400 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                  >
                    <svg class="w-4 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {{ userDisplayName }}
                    <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  <!-- Dropdown Menu -->
                  <div
                    v-show="isUserDropdownOpen"
                    class="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50"
                  >
                    <div class="py-1">
                      <button
                        @click="navigateTo('settings')"
                        class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                      >
                        <svg class="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Settings
                      </button>
                      <button
                        @click="handleLogout"
                        class="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                      >
                        <svg class="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              </template>

              <!-- Unauthenticated Navigation -->
              <template v-else>
                <button
                  @click="navigateTo('login')"
                  class="text-white hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Login
                </button>
                <button
                  @click="navigateTo('register')"
                  class="bg-blue-500 text-white hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Get Started
                </button>
              </template>
            </div>
          </div>

          <!-- Mobile menu button -->
          <div class="md:hidden">
            <button
              @click="toggleMenu"
              class="text-white hover:text-gray-300 focus:outline-none focus:text-gray-300"
            >
              <svg
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  v-if="!isMenuOpen"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
                <path
                  v-else
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <!-- Mobile Navigation Menu -->
        <div v-show="isMenuOpen" class="md:hidden">
          <div
            class="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200"
          >
            <button
              @click="navigateTo('home')"
              class="text-white hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors duration-200"
            >
              Home
            </button>

            <!-- Authenticated Mobile Navigation -->
            <template v-if="isAuthenticated">
              <div class="px-3 py-2 text-base font-medium text-white">
                Welcome, {{ userDisplayName }}
              </div>

              <button
                @click="navigateTo('dashboard')"
                class="text-white hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors duration-200"
              >
                Dashboard
              </button>

              <button
                @click="navigateTo('settings')"
                class="text-white hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors duration-200"
              >
                Settings
              </button>

              <button
                @click="handleLogout"
                class="bg-red-600 text-white hover:bg-red-700 block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors duration-200"
              >
                Logout
              </button>
            </template>

            <!-- Unauthenticated Mobile Navigation -->
            <template v-else>
              <button
                @click="navigateTo('login')"
                class="text-white hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors duration-200"
              >
                Login
              </button>
              <button
                @click="navigateTo('register')"
                class="bg-blue-600 text-white hover:bg-blue-700 block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors duration-200"
              >
                Get Started
              </button>
            </template>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="flex-1">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="bg-gray-800 text-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          <!-- Company Info -->
          <div class="md:col-span-2">
            <h3 class="text-lg font-semibold mb-4">TQRandom</h3>
            <p class="text-gray-300 mb-4">
              Your trusted randomization system for efficient and fair
              processes.
            </p>
            <div class="flex space-x-4">
              <!-- Twitter -->
              <a
                href="#"
                class="text-gray-300 hover:text-white transition-colors duration-200"
              >
                <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M24 4.557c-.883.392-1.832.656-2.828.775 
                    1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 
                    1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 
                    0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144
                    -1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229
                    -.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232
                    -2.224.084.626 1.956 2.444 3.379 4.6 
                    3.419-2.07 1.623-4.678 2.348-7.29 
                    2.04 2.179 1.397 4.768 2.212 7.548 
                    2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 
                    1.797-1.562 2.457-2.549z"
                  />
                </svg>
              </a>

              <!-- Facebook (REPLACED middle icon) -->
              <a
                href="#"
                class="text-gray-300 hover:text-white transition-colors duration-200"
              >
                <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M22.675 0h-21.35C.597 0 0 
                    .597 0 1.326v21.348C0 23.403.597 24 
                    1.326 24h11.495v-9.294H9.691v-3.622h3.13V8.413c0-3.1 
                    1.893-4.788 4.659-4.788 1.325 0 2.463.099 
                    2.795.143v3.24l-1.918.001c-1.504 
                    0-1.796.715-1.796 1.763v2.313h3.587l-.467 
                    3.622h-3.12V24h6.116C23.403 24 24 23.403 
                    24 22.674V1.326C24 .597 23.403 0 22.675 0z"
                  />
                </svg>
              </a>

              <!-- LinkedIn -->
              <a
                href="#"
                class="text-gray-300 hover:text-white transition-colors duration-200"
              >
                <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037
                    -1.852-3.037-1.853 0-2.136 1.445-2.136 
                    2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 
                    1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 
                    4.267 5.455v6.286zM5.337 7.433c-1.144 
                    0-2.063-.926-2.063-2.065 0-1.138.92-2.063 
                    2.063-2.063 1.14 0 2.064.925 2.064 
                    2.063 0 1.139-.925 2.065-2.064 
                    2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 
                    0H1.771C.792 0 0 .774 0 1.729v20.542C0 
                    23.227.792 24 1.771 24h20.451C23.2 24 24 
                    23.227 24 22.271V1.729C24 .774 23.2 0 
                    22.222 0h.003z"
                  />
                </svg>
              </a>
            </div>

          </div>

          <!-- Quick Links -->
          <div>
            <h4 class="text-lg font-semibold mb-4">Quick Links</h4>
            <ul class="space-y-2">
              <li>
                <a
                  @click="navigateTo('home')"
                  class="text-gray-300 hover:text-white transition-colors duration-200"
                  >Home</a
                >
              </li>
              <li>
                <a
                  @click="navigateTo('about')"
                  class="text-gray-300 hover:text-white transition-colors duration-200"
                  >About</a
                >
              </li>
              <li>
                <a
                  @click="navigateTo('services')"
                  class="text-gray-300 hover:text-white transition-colors duration-200"
                  >Services</a
                >
              </li>
              <li>
                <a  
                  @click="navigateTo('contact')"
                  class="text-gray-300 hover:text-white transition-colors duration-200"
                  >Contact</a
                >
              </li>
            </ul>
          </div>

          <!-- Support -->
          <div>
            <h4 class="text-lg font-semibold mb-4">Support</h4>
            <ul class="space-y-2">
              <li>
                <a
                  href="#"
                  class="text-gray-300 hover:text-white transition-colors duration-200"
                  >Help Center</a
                >
              </li>
              <li>
                <a
                  href="#"
                  class="text-gray-300 hover:text-white transition-colors duration-200"
                  >Privacy Policy</a
                >
              </li>
              <li>
                <a
                  href="#"
                  class="text-gray-300 hover:text-white transition-colors duration-200"
                  >Terms of Service</a
                >
              </li>
              <li>
                <a
                  href="#"
                  class="text-gray-300 hover:text-white transition-colors duration-200"
                  >FAQ</a
                >
              </li>
            </ul>
          </div>
        </div>

        <!-- Copyright -->
        <div class="border-t border-gray-700 mt-8 pt-8 text-center">
          <p class="text-gray-300">
            &copy; {{ new Date().getFullYear() }} TQRandom. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* Additional custom styles if needed */
</style>
