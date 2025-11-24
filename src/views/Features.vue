<script setup>
import AppLayout from "@/components/layout/AppLayout.vue";
</script>

<template>
  <AppLayout>
    <section class="bg-[#ebe6e7] dark:bg-gray-900 min-h-screen py-20 px-6">
      <div class="max-w-6xl mx-auto" data-aos="fade-up" data-aos-delay="300">
        <h1 class="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-6">
          Detailed Features
        </h1>

        <p class="text-gray-600 dark:text-gray-100 text-lg mb-12">
          Explore the full capabilities of TQRandom designed to simplify test
          creation, enhance fairness, and save valuable time for instructors.
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <!-- Feature Block -->
          <div class="p-6 bg-white dark:bg-gray-800 shadow-md rounded-xl">
            <h2 class="text-2xl font-semibold text-[#1e2939] dark:text-gray-100 mb-3">
              🔄 Automatic Randomization
            </h2>
            <p class="text-gray-600 dark:text-gray-100">
              Generate multiple unique test versions instantly with high-quality
              shuffle algorithms.
            </p>
          </div>

          <div class="p-6 bg-white dark:bg-gray-800 shadow-md rounded-xl">
            <h2 class="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-3">
              📥 Import Questions
            </h2>
            <p class="text-gray-600 dark:text-gray-100">
              Upload questions from text, CSV, or your internal repository with
              quick parsing.
            </p>
          </div>

          <div class="p-6 bg-white dark:bg-gray-800 shadow-md rounded-xl">
            <h2 class="text-2xl font-semibold text-[#1e2939] dark:text-gray-100 mb-3">
              🖨️ Export & Print Ready
            </h2>
            <p class="text-gray-600 dark:text-gray-100">
              Export polished, formatted test papers in DOCX or PDF ready for
              distribution.
            </p>
          </div>

          <div class="p-6 bg-white dark:bg-gray-800 shadow-md rounded-xl">
            <h2 class="text-2xl font-semibold text-[#1e2939] dark:text-gray-100 mb-3">
              🛡️ Fair & Secure Assessments
            </h2>
            <p class="text-gray-600 dark:text-gray-100">
              Ensure integrity with unique randomized versions per student.
            </p>
          </div>
        </div>
      </div>
    </section>
  </AppLayout>
</template>
