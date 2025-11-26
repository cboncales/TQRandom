<script setup>
import AppLayout from "@/components/layout/AppLayout.vue";
</script>
<template>
  <AppLayout>
    <section class="py-20 bg-gray-200 dark:bg-gray-900">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 class="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-8 text-center">
          About TQRandom
        </h1>

        <!-- Overview -->
        <div
          class="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow mb-10"
          data-aos="fade-up"
          data-aos-delay="300"
        >
          <h2 class="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Overview</h2>
          <p class="text-gray-700 dark:text-gray-100 leading-relaxed">
            TQRandom is a web application created to help teachers easily
            prepare randomized test questionnaires. It was built with one goal
            in mind: to reduce cheating and save time by generating multiple
            clean, shuffled versions of tests for classroom assessments.
          </p>
        </div>

        <!-- Purpose -->
        <div
          class="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow mb-10"
          data-aos="fade-up"
          data-aos-delay="300"
        >
          <h2 class="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
            Purpose of the Project
          </h2>
          <p class="text-gray-700 dark:text-gray-100 leading-relaxed">
            This project was developed as part of an academic requirement for an
            IT student and designed specifically for teachers. It
            aims to simplify the process of managing test questions, importing
            content from documents, and generating randomized test versions
            without manual work.
          </p>
        </div>

        <!-- Technology Stack -->
        <div
          class="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow mb-10"
          data-aos="fade-up"
          data-aos-delay="300"
        >
          <h2 class="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
            Technology Stack
          </h2>
          <ul class="list-disc ml-6 text-gray-700 dark:text-gray-100 space-y-2">
            <li><strong>Frontend:</strong> Vue.js + TailwindCSS</li>
            <li><strong>Backend:</strong> Express.js</li>
            <li><strong>Database & Auth:</strong> Supabase</li>
            <li>
              <strong>Document Processing:</strong> Mammoth, pdf-parse,
              pdfjs-dist, sharp
            </li>
          </ul>
        </div>

        <!-- Mission -->
        <div
          class="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow mb-10"
          data-aos="fade-up"
          data-aos-delay="300"
        >
          <h2 class="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Our Mission</h2>
          <p class="text-gray-700 dark:text-gray-100 leading-relaxed">
            Our mission is to provide teachers with a fast, reliable, and
            secure way to prepare multiple test versions. By reducing repetitive
            tasks and enhancing exam fairness, TQ Random supports better
            classroom management and more effective assessment preparation.
          </p>
        </div>

        <!-- Developer Info (Optional) -->
        <div
          class="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow mb-10"
          data-aos="fade-up"
          data-aos-delay="300"
        >
          <h2 class="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
            About the Developer
          </h2>
          <p class="text-gray-700 dark:text-gray-100 leading-relaxed">
            TQRandom was developed by two 4th-year BSIT student from Caraga
            State University as part of a continuous learning journey in
            full-stack development, web applications, and educational tools. The
            project reflects the goal of building practical systems that help
            real users in academic settings.
          </p>
        </div>
      </div>
    </section>
  </AppLayout>
</template>

<style scoped></style>
