<script setup>
import AppLayout from "@/components/layout/AppLayout.vue";
</script>
<template>
    <AppLayout>
      <section class="py-20 bg-gray-200">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 class="text-4xl font-bold text-gray-900 mb-8 text-center">
            About TQ Random
          </h1>
  
          <!-- Overview -->
          <div class="bg-white p-8 rounded-2xl shadow mb-10">
            <h2 class="text-2xl font-semibold text-gray-800 mb-4">Overview</h2>
            <p class="text-gray-700 leading-relaxed">
              TQ Random is a web application created to help instructors easily
              prepare randomized test questionnaires. It was built with one goal in
              mind: to reduce cheating and save time by generating multiple clean,
              shuffled versions of tests for classroom assessments.
            </p>
          </div>
  
          <!-- Purpose -->
          <div class="bg-white p-8 rounded-2xl shadow mb-10">
            <h2 class="text-2xl font-semibold text-gray-800 mb-4">Purpose of the Project</h2>
            <p class="text-gray-700 leading-relaxed">
              This project was developed as part of an academic requirement for an IT
              student and designed specifically for university instructors. It aims to
              simplify the process of managing test questions, importing content from
              documents, and generating randomized test versions without manual work.
            </p>
          </div>
  
          <!-- Technology Stack -->
          <div class="bg-white p-8 rounded-2xl shadow mb-10">
            <h2 class="text-2xl font-semibold text-gray-800 mb-4">Technology Stack</h2>
            <ul class="list-disc ml-6 text-gray-700 space-y-2">
              <li><strong>Frontend:</strong> Vue.js + TailwindCSS</li>
              <li><strong>Backend:</strong> Express.js</li>
              <li><strong>Database & Auth:</strong> Supabase</li>
              <li><strong>Document Processing:</strong> Custom extraction for PDF/DOCX</li>
            </ul>
          </div>
  
          <!-- Mission -->
          <div class="bg-white p-8 rounded-2xl shadow mb-10">
            <h2 class="text-2xl font-semibold text-gray-800 mb-4">Our Mission</h2>
            <p class="text-gray-700 leading-relaxed">
              Our mission is to provide instructors with a fast, reliable, and secure
              way to prepare multiple test versions. By reducing repetitive tasks and
              enhancing exam fairness, TQ Random supports better classroom management
              and more effective assessment preparation.
            </p>
          </div>
  
          <!-- Developer Info (Optional) -->
          <div class="bg-white p-8 rounded-2xl shadow mb-10">
            <h2 class="text-2xl font-semibold text-gray-800 mb-4">About the Developer</h2>
            <p class="text-gray-700 leading-relaxed">
              TQ Random was developed by two 4th-year BSIT student from Caraga State
              University as part of a continuous learning journey in full-stack
              development, web applications, and educational tools. The project reflects
              the goal of building practical systems that help real users in academic
              settings.
            </p>
          </div>
        </div>
      </section>
    </AppLayout>
  </template>
  
  <style scoped>
  </style>