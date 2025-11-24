<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from "vue";
import AppLayout from "@/components/layout/AppLayout.vue";
import { useRouter } from "vue-router";

const router = useRouter();

// Existing navigation function
const navigateTo = (routeName) => {
  router.push({ name: routeName });
};

// --- Carousel Logic ---
const currentSlide = ref(0);
const slideCount = 2; // Matches the number of slides in the template
let autoAdvanceInterval = null;

// Computed property to determine the CSS translation for the carousel track
const offset = computed(() => {
  return `-${currentSlide.value * 100}%`;
});

const nextSlide = () => {
  currentSlide.value = (currentSlide.value + 1) % slideCount;
};

const prevSlide = () => {
  currentSlide.value = (currentSlide.value - 1 + slideCount) % slideCount;
};

const goToSlide = (index) => {
  currentSlide.value = index;
};

/**
 * @function stopAutoAdvance
 * Stops the automatic carousel sliding by clearing the interval.
 * This function is used on mouseover to pause the slideshow.
 */
const stopAutoAdvance = () => {
  if (autoAdvanceInterval) {
    clearInterval(autoAdvanceInterval);
    autoAdvanceInterval = null; // Set to null after clearing
  }
};

/**
 * @function startAutoAdvance
 * Starts the automatic carousel sliding. Clears any existing interval first.
 */
const startAutoAdvance = () => {
  // Ensure any existing interval is stopped before starting a new one
  stopAutoAdvance();
  // Auto-advance every 6 seconds (6000ms)
  autoAdvanceInterval = setInterval(nextSlide, 6000);
};

const resetAutoAdvance = () => {
  startAutoAdvance(); // Restarts the interval, preventing it from immediately advancing on manual click
};

// Start and clean up the auto-advance interval
onMounted(() => {
  startAutoAdvance();
});

onBeforeUnmount(() => {
  stopAutoAdvance(); // Use the dedicated stop function for cleanup
});
</script>

<template>
  <AppLayout>
    <!-- HERO CAROUSEL SECTION -->
    <!-- Background: Dark Blue #1e2939 -->
    <section class="w-full bg-[#1e2939] text-white relative overflow-hidden">
      <!-- Subtle background pattern/overlay for visual interest -->
      <div
        class="absolute inset-0 opacity-10"
        style="
          background-image: radial-gradient(#374151 1px, transparent 1px);
          background-size: 20px 20px;
        "
      ></div>

      <div
        class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-12 relative z-10"
      >
        <div
          class="overflow-hidden w-full"
          @mouseover="stopAutoAdvance"
          @mouseleave="startAutoAdvance"
        >
          <!-- Carousel Track: Uses computed 'offset' for sliding -->
          <div
            class="carousel-track"
            :style="{ transform: 'translateX(' + offset + ')' }"
          >
            <!-- SLIDE 1: Main Pitch & Value Proposition -->
            <div class="carousel-slide">
              <div
                class="text-center lg:text-left lg:flex lg:items-center lg:justify-between"
              >
                <!-- Content -->
                <div class="lg:w-7/12">
                  <!-- Accent Text: Blue #155dfc -->
                  <span
                    class="text-[#155dfc] uppercase tracking-widest text-sm font-medium mb-3 block"
                  >
                    Assessment, Simplified
                  </span>
                  <h1
                    class="text-4xl sm:text-5xl md:text-7xl font-extrabold mb-6 leading-tight"
                  >
                    <!-- Gradient Text: #193cb8 to #155dfc -->
                    <span
                      class="bg-clip-text text-transparent"
                      style="
                        background-image: linear-gradient(
                          to right,
                          #193cb8,
                          #155dfc
                        );
                      "
                    >
                      TQRandom:
                    </span>
                    <br class="hidden sm:inline" />
                    Fair Tests, Zero Effort.
                  </h1>
                  <!-- Text Color: Off-White #ebe6e7 -->
                  <p class="text-xl md:text-2xl mb-10 text-[#ebe6e7]">
                    Instantly generate multiple, unique, and randomized test
                    versions. Boosting integrity while cutting your workload.
                  </p>
                  <div
                    class="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center lg:justify-start"
                  >
                    <!-- Primary Button: Background Blue #155dfc, Hover #193cb8 -->
                    <button
                      @click="navigateTo('register')"
                      class="bg-[#155dfc] text-white hover:bg-[#193cb8] font-semibold py-4 px-10 rounded-xl shadow-lg shadow-[#155dfc]/50 transition-all duration-300 transform hover:scale-105"
                    >
                      Start Generating Tests
                    </button>
                    <!-- Secondary Button: Border Accent, Text Off-White, Hover Dark Blue #193cb8 -->
                    <button
                      @click="navigateTo('learn-more')"
                      class="border-2 border-[#155dfc] text-[#ebe6e7] hover:bg-[#193cb8] hover:border-[#193cb8] font-semibold py-4 px-10 rounded-xl transition-colors duration-300 transform hover:text-white"
                    >
                      How It Works
                    </button>
                  </div>
                </div>

                <!-- Visual Placeholder (Example of randomization) -->
                <!-- Background: Dark Blue #1e2939, Border: Blue #155dfc -->
                <div class="hidden lg:block lg:w-4/12 mt-12 lg:mt-0">
                  <div
                    class="relative p-6 bg-[#1e2939] rounded-2xl shadow-2xl border border-[#155dfc]/50"
                  >
                    <!-- Accent Text: Blue #155dfc -->
                    <p class="text-sm font-mono text-[#155dfc] mb-4">
                      Randomization Process:
                    </p>
                    <div class="space-y-3">
                      <!-- Highlight Bar: Blue #155dfc -->
                      <div
                        class="h-4 bg-[#155dfc] rounded-full w-4/5 animate-pulse"
                      ></div>
                      <div class="h-4 bg-gray-600 rounded-full w-2/3"></div>
                      <!-- Highlight Bar: Blue #155dfc -->
                      <div
                        class="h-4 bg-[#155dfc] rounded-full w-5/6 animate-pulse"
                      ></div>
                      <div class="h-4 bg-gray-600 rounded-full w-3/4"></div>
                    </div>
                    <p class="text-xs text-gray-500 mt-4 text-right">
                      Four unique versions generated.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- SLIDE 2: Focus on Problem Solving (Instructor/Student focus) -->
            <div class="carousel-slide">
              <div
                class="text-center lg:text-left lg:flex lg:items-center lg:justify-between"
              >
                <!-- Content -->
                <div class="lg:w-7/12">
                  <!-- Accent Text: Blue #155dfc -->
                  <span
                    class="text-[#155dfc] uppercase tracking-widest text-sm font-medium mb-3 block"
                  >
                    For University Instructors
                  </span>
                  <h1
                    class="text-5xl md:text-7xl font-extrabold mb-6 leading-tight"
                  >
                    <!-- Shortened heading -->

                    Secure Exams &

                    <br class="hidden sm:inline" />

                    <span class="text-[#155dfc]">Effortless</span> Preparation.
                  </h1>
                  <!-- Text Color: Off-White #ebe6e7 -->
                  <p class="text-xl md:text-2xl mb-10 text-[#ebe6e7]">
                    Quickly import existing material and generate unique
                    versions for every student to maximize test integrity and
                    save countless hours of manual work.
                  </p>
                  <div
                    class="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center lg:justify-start"
                  >
                    <!-- Primary Button: Background Blue #155dfc, Hover #193cb8 -->
                    <button
                      @click="navigateTo('register')"
                      class="bg-[#155dfc] text-white hover:bg-[#193cb8] font-semibold py-4 px-10 rounded-xl shadow-lg shadow-[#155dfc]/50 transition-all duration-300 transform hover:scale-105"
                    >
                      Register Your Account
                    </button>
                    <!-- Secondary Button: Border Accent, Text Off-White, Hover Dark Blue #193cb8 -->
                    <button
                      @click="navigateTo('features')"
                      class="border-2 border-[#155dfc] text-[#ebe6e7] hover:bg-[#193cb8] hover:border-[#193cb8] font-semibold py-4 px-10 rounded-xl transition-colors duration-300 transform hover:text-white"
                    >
                      View Detailed Features
                    </button>
                  </div>
                </div>

                <!-- Visual Placeholder (Example of question import) -->
                <!-- Background: Dark Blue #1e2939, Border: Blue #155dfc -->
                <div class="hidden lg:block lg:w-4/12 mt-12 lg:mt-0">
                  <div
                    class="relative p-6 bg-[#1e2939] rounded-2xl shadow-2xl border border-[#155dfc]/50"
                  >
                    <!-- Accent Text: Blue #155dfc -->
                    <p class="text-sm font-mono text-[#155dfc] mb-4">
                      Easy Import:
                    </p>
                    <div class="space-y-3">
                      <div class="flex items-center space-x-2">
                        <svg
                          class="w-6 h-6 text-green-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          ></path>
                        </svg>
                        <div class="h-4 bg-gray-600 rounded-full w-1/2"></div>
                      </div>
                      <div class="flex items-center space-x-2">
                        <svg
                          class="w-6 h-6 text-green-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          ></path>
                        </svg>
                        <div class="h-4 bg-gray-600 rounded-full w-3/4"></div>
                      </div>
                      <div class="flex items-center space-x-2">
                        <svg
                          class="w-6 h-6 text-green-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          ></path>
                        </svg>
                        <div class="h-4 bg-gray-600 rounded-full w-2/5"></div>
                      </div>
                    </div>
                    <p class="text-xs text-gray-500 mt-4 text-right">
                      Content successfully parsed.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Carousel Controls and Indicators -->
        <div class="mt-12 flex justify-center items-center space-x-3">
          <!-- Previous Button -->
          <!-- Background: Dark Blue #1e2939, Hover: Blue #193cb8, Ring: Blue #155dfc -->
          <button
            @click="
              prevSlide();
              resetAutoAdvance();
            "
            aria-label="Previous slide"
            class="p-2 rounded-full text-gray-400 hover:text-white bg-[#1e2939] hover:bg-[#193cb8] transition-colors duration-200 shadow-md focus:outline-none focus:ring-2 focus:ring-[#155dfc]"
          >
            <!-- SVG for Left Arrow -->
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
              ></path>
            </svg>
          </button>

          <!-- Indicators (Dots) -->
          <div class="flex space-x-2">
            <button
              v-for="index in slideCount"
              :key="index"
              @click="
                goToSlide(index - 1);
                resetAutoAdvance();
              "
              :aria-label="'Go to slide ' + index"
              :class="[
                'w-3 h-3 rounded-full transition-all duration-300 focus:outline-none',
                // Active Indicator: Blue #155dfc, Inactive Indicator: Gray #606060 (using gray-600 for contrast)
                index - 1 === currentSlide
                  ? 'bg-[#155dfc] scale-125'
                  : 'bg-gray-600 hover:bg-[#193cb8]',
              ]"
            ></button>
          </div>

          <!-- Next Button -->
          <!-- Background: Dark Blue #1e2939, Hover: Blue #193cb8, Ring: Blue #155dfc -->
          <button
            @click="
              nextSlide();
              resetAutoAdvance();
            "
            aria-label="Next slide"
            class="p-2 rounded-full text-gray-400 hover:text-white bg-[#1e2939] hover:bg-[#193cb8] transition-colors duration-200 shadow-md focus:outline-none focus:ring-2 focus:ring-[#155dfc]"
          >
            <!-- SVG for Right Arrow -->
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              ></path>
            </svg>
          </button>
        </div>
      </div>
    </section>

    <!-- Features Section (updated colors) -->
    <!-- Background: Off-White #ebe6e7 -->
    <section class="py-16 bg-[#ebe6e7]">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12" data-aos="fade-up" data-aos-delay="300">
          <!-- Text Color: Dark Blue #1e2939 -->
          <h2 class="text-3xl md:text-4xl font-bold text-[#1e2939] mb-4">
            Why Choose TQRandom?
          </h2>
          <!-- Text Color: Gray (using gray-600 for contrast) -->
          <p class="text-lg text-gray-600 max-w-2xl mx-auto">
            Our platform provides reliable and secure randomization solutions
            for various applications
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <!-- Feature 1 -->
          <div
            class="text-center p-6 bg-white rounded-lg shadow-lg"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            <!-- Icon Background: Blue #155dfc -->
            <div
              class="w-16 h-16 bg-[#155dfc] rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <svg
                class="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
            </div>
            <!-- Text Color: Dark Blue #1e2939 -->
            <h3 class="text-xl font-semibold text-[#1e2939] mb-2">Reliable</h3>
            <p class="text-gray-600">
              Our system ensures consistent and dependable randomization results
              every time
            </p>
          </div>

          <!-- Feature 2 -->
          <div
            class="text-center p-6 bg-white rounded-lg shadow-lg"
            data-aos="fade-up"
            data-aos-delay="200"
          >
            <!-- Icon Background: Blue #155dfc -->
            <div
              class="w-16 h-16 bg-[#155dfc] rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <svg
                class="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                ></path>
              </svg>
            </div>
            <!-- Text Color: Dark Blue #1e2939 -->
            <h3 class="text-xl font-semibold text-[#1e2939] mb-2">Secure</h3>
            <p class="text-gray-600">
              Advanced security measures protect your data and ensure fair
              randomization
            </p>
          </div>

          <!-- Feature 3 -->
          <div
            class="text-center p-6 bg-white rounded-lg shadow-lg"
            data-aos="fade-up"
            data-aos-delay="300"
          >
            <!-- Icon Background: Blue #155dfc -->
            <div
              class="w-16 h-16 bg-[#155dfc] rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <svg
                class="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                ></path>
              </svg>
            </div>
            <!-- Text Color: Dark Blue #1e2939 -->
            <h3 class="text-xl font-semibold text-[#1e2939] mb-2">Fast</h3>
            <p class="text-gray-600">
              Quick processing and immediate results for all your randomization
              needs
            </p>
          </div>
        </div>
      </div>
    </section>
  </AppLayout>
</template>

<style scoped>
/*
 * Custom styles for the carousel container:
 * These styles define the track and slides necessary for the horizontal sliding effect.
 */
.carousel-track {
  display: flex;
  transition: transform 500ms ease-in-out;
}
.carousel-slide {
  flex-shrink: 0;
  width: 100%;
}
</style>
