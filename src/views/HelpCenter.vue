<script setup>
import AppLayout from "@/components/layout/AppLayout.vue";
import { onMounted } from "vue";

onMounted(() => {
  window.scrollTo(0, 0);
});
</script>

<template>
  <AppLayout>
    <section class="py-20 bg-gray-200">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 class="text-4xl font-bold text-gray-800 mb-8 text-center">
          Help Center
        </h1>

        <!-- Help Center Wrapper -->
        <div
          class="bg-white p-8 rounded-2xl shadow mb-10"
          data-aos="fade-up"
          data-aos-delay="300"
        >
          <h2 class="text-2xl font-semibold text-gray-800 mb-4">
            Welcome to the Help Center
          </h2>

          <p class="text-gray-700 leading-relaxed mb-6">
            Here you can find answers to common questions and learn how to use
            TQRandom effectively. If you still need help, you may contact us at
            any time.
          </p>

          <!-- Section: Getting Started -->
          <h3 class="text-xl font-semibold text-gray-800 mb-2">
            1. Getting Started
          </h3>
          <p class="text-gray-700 leading-relaxed mb-4">
            TQRandom allows teachers to generate randomized test questionnaires
            using PDF or DOCX files. To begin, simply upload your test bank and
            customize the number of items needed.
          </p>

          <!-- Section: Uploading Files -->
          <h3 class="text-xl font-semibold text-gray-800 mb-2">
            2. Uploading Files
          </h3>
          <p class="text-gray-700 leading-relaxed mb-4">
            We currently support:
          </p>
          <ul class="list-disc pl-6 text-gray-700 leading-relaxed mb-4">
            <li>PDF files</li>
            <li>DOCX (Microsoft Word) files</li>
          </ul>
          <p class="text-gray-700 leading-relaxed mb-4">
            Make sure your files contain properly formatted questions for best
            results.
          </p>

          <!-- Section: Generating a Questionnaire -->
          <h3 class="text-xl font-semibold text-gray-800 mb-2">
            3. Generating a Questionnaire
          </h3>
          <p class="text-gray-700 leading-relaxed mb-4">
            Select the number of items you want to include. TQRandom will
            randomly pick questions from your uploaded test bank. You can then
            download the generated questionnaire.
          </p>

          <!-- Section: Troubleshooting -->
          <h3 class="text-xl font-semibold text-gray-800 mb-2">
            4. Troubleshooting
          </h3>
          <ul class="list-disc pl-6 text-gray-700 leading-relaxed mb-4">
            <li>
              <strong>File not uploading:</strong> Make sure your file is PDF or
              DOCX format.
            </li>
            <li>
              <strong>Errors during generation:</strong> Ensure your test bank
              has readable questions.
            </li>
            <li>
              <strong>Layout issues:</strong> Try refreshing the page or
              clearing your browser cache.
            </li>
          </ul>

          <!-- Section: Contact Support -->
          <h3 class="text-xl font-semibold text-gray-800 mb-2">
            5. Contact Support
          </h3>
          <p class="text-gray-700 leading-relaxed mb-4">
            If you need assistance or have suggestions, feel free to contact us:
          </p>

          <p class="text-gray-700 leading-relaxed">
            <a
              href="https://mail.google.com/mail/?view=cm&fs=1&to=tqrandom18@gmail.com"
              target="_blank"
              class="text-blue-600 underline"
            >
              tqrandom18@gmail.com
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  </AppLayout>
</template>

<style scoped></style>
