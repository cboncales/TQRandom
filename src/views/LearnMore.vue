<script setup>
import AppLayout from "@/components/layout/AppLayout.vue";
</script>

<template>
    <AppLayout>
      <section class="py-20 bg-gray-200">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 class="text-4xl font-bold text-gray-900 mb-8 text-center">
            Learn More About TQ Random
          </h1>
  
          <!-- What is TQ Random -->
          <div class="bg-white p-8 rounded-2xl shadow mb-10">
            <h2 class="text-2xl font-semibold text-gray-800 mb-4">What is TQ Random?</h2>
            <p class="text-gray-700 leading-relaxed">
              TQ Random is a simple and efficient tool built for instructors who want to
              streamline test preparation. It helps you manage questions, import files,
              and generate multiple randomized versions of a test in just a few clicks.
            </p>
          </div>
  
          <!-- Why Use It -->
          <div class="bg-white p-8 rounded-2xl shadow mb-10">
            <h2 class="text-2xl font-semibold text-gray-800 mb-4">Why Instructors Use It</h2>
            <ul class="list-disc ml-6 text-gray-700 space-y-2">
              <li>Reduces cheating by producing multiple test versions</li>
              <li>Saves time with automatic shuffling and formatting</li>
              <li>Supports DOCX and PDF for easy uploading</li>
              <li>No need to rewrite questions manually every semester</li>
              <li>Designed with a clean and simple interface for easy use</li>
            </ul>
          </div>
  
          <!-- How It Works -->
          <div class="bg-white p-8 rounded-2xl shadow mb-10">
            <h2 class="text-2xl font-semibold text-gray-800 mb-4">How It Works</h2>
            <ol class="list-decimal ml-6 text-gray-700 space-y-2">
              <li>Create a test in your dashboard</li>
              <li>Add questions manually or upload a WORD/PDF file</li>
              <li>The system extracts the questions and answer choices</li>
              <li>Select how many versions you want (e.g., 20 or 50)</li>
              <li>TQ Random shuffles the questions and choices automatically</li>
              <li>Download the randomized test papers</li>
            </ol>
          </div>
  
          <!-- Key Features -->
          <div class="bg-white p-8 rounded-2xl shadow mb-10">
            <h2 class="text-2xl font-semibold text-gray-800 mb-4">Key Features</h2>
            <ul class="list-disc ml-6 text-gray-700 space-y-2">
              <li>Manual question creation</li>
              <li>Automatic extraction from DOCX and PDF files</li>
              <li>Randomizes question order and answer choices</li>
              <li>Generates multiple clean versions instantly</li>
              <li>Downloadable and printer-ready output</li>
            </ul>
          </div>
  
          <!-- Who Can Use It -->
          <div class="bg-white p-8 rounded-2xl shadow mb-10">
            <h2 class="text-2xl font-semibold text-gray-800 mb-4">Who Can Use TQ Random?</h2>
            <p class="text-gray-700 leading-relaxed">
              This tool is created for university instructors, faculty members,
              and teachers handling quizzes, midterms, finals, or any classroom
              assessments that require multiple test versions.
            </p>
          </div>
  
          <!-- Security -->
          <div class="bg-white p-8 rounded-2xl shadow mb-10">
            <h2 class="text-2xl font-semibold text-gray-800 mb-4">Security & Privacy</h2>
            <ul class="list-disc ml-6 text-gray-700 space-y-2">
              <li>Only test content is stored — no student data required</li>
              <li>Your data is handled securely through Supabase</li>
              <li>You can delete your tests anytime</li>
            </ul>
          </div>
        </div>
      </section>
    </AppLayout>
  </template>

  <style scoped>
  </style>
  