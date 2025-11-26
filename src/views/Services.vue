<script setup>
import AppLayout from "@/components/layout/AppLayout.vue";
</script>
<template>
  <AppLayout>
    <section class="py-20 bg-gray-200 dark:bg-gray-900">
      <div
        class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8"
        data-aos="fade-up"
        data-aos-delay="200"
      >
        <h1 class="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-10 text-center">
          Our Services
        </h1>

        <!-- Service 1: Question Management -->
        <div
          class="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow mb-10"
          data-aos="fade-up"
          data-aos-delay="200"
        >
          <h2 class="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
            Question Management
          </h2>
          <p class="text-gray-700 dark:text-gray-100 leading-relaxed mb-4">
            Create and organize your test questions with our simple interface.
            Add multiple choices, mark the correct answer, and update or delete
            items anytime. Everything is designed to help teachers prepare
            tests faster and more efficiently.
          </p>
          <ul class="list-disc ml-6 text-gray-700 dark:text-gray-100 space-y-2">
            <li>Manual question creation</li>
            <li>Organized layout for easy editing</li>
            <li>Support for multiple-choice questions</li>
          </ul>
        </div>

        <!-- Service 2: File Upload & Extraction -->
        <div
          class="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow mb-10"
          data-aos="fade-up"
          data-aos-delay="200"
        >
          <h2 class="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
            File Upload & Extraction
          </h2>
          <p class="text-gray-700 dark:text-gray-100 leading-relaxed mb-4">
            Save time by uploading your DOCX or PDF files. The system
            automatically extracts questions and answer choices from your
            documents. This makes it easier for teachers who already have
            prepared questionnaires.
          </p>
          <ul class="list-disc ml-6 text-gray-700 dark:text-gray-100 space-y-2">
            <li>Supports PDF and Word documents</li>
            <li>Clean and accurate text extraction</li>
            <li>Automatic arrangement of questions and choices</li>
          </ul>
        </div>

        <!-- Service 3: Randomization Engine -->
        <div
          class="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow mb-10"
          data-aos="fade-up"
          data-aos-delay="200"
        >
          <h2 class="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
            Randomization Engine
          </h2>
          <p class="text-gray-700 dark:text-gray-100 leading-relaxed mb-4">
            TQ Random automatically shuffles the questions and their answer
            choices to produce multiple unique versions of the same test. Ideal
            for reducing classroom cheating and creating fair assessments.
          </p>
          <ul class="list-disc ml-6 text-gray-700 dark:text-gray-100 space-y-2">
            <li>Randomizes question order</li>
            <li>Randomizes answer choices</li>
            <li>Generates 10, 20, 50, or more versions instantly</li>
          </ul>
        </div>

        <!-- Service 4: Test Generation & Export -->
        <div
          class="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow mb-10"
          data-aos="fade-up"
          data-aos-delay="200"
        >
          <h2 class="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
            Test Generation & Export
          </h2>
          <p class="text-gray-700 dark:text-gray-100 leading-relaxed mb-4">
            After randomizing, you can download each test version in a clean,
            printable format. Perfect for exams, quizzes, and practice tests.
          </p>
          <ul class="list-disc ml-6 text-gray-700 dark:text-gray-100 space-y-2">
            <li>Ready-to-print test versions</li>
            <li>Organized formatting for readability</li>
            <li>Bulk download support for multiple versions</li>
          </ul>
        </div>

        <!-- Service 5: Secure Storage & Management -->
        <div
          class="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow mb-10"
          data-aos="fade-up"
          data-aos-delay="200"
        >
          <h2 class="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
            Secure Storage & Management
          </h2>
          <p class="text-gray-700 dark:text-gray-100 leading-relaxed mb-4">
            All your tests and questions are stored securely using Supabase. You
            have full control—edit, update, or delete your content anytime.
          </p>
          <ul class="list-disc ml-6 text-gray-700 dark:text-gray-100 space-y-2">
            <li>Secure Supabase storage</li>
            <li>Only teachers can access their own tests</li>
            <li>Data can be deleted anytime for privacy</li>
          </ul>
        </div>
      </div>
    </section>
  </AppLayout>
</template>
<style scoped></style>
