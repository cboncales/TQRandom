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
          Frequently Asked Questions (FAQ)
        </h1>

        <!-- FAQ Container -->
        <div
          class="bg-white p-8 rounded-2xl shadow mb-10"
          data-aos="fade-up"
          data-aos-delay="300"
        >
          <h2 class="text-2xl font-semibold text-gray-800 mb-6">
            TQRandom FAQ
          </h2>

          <!-- FAQ Items -->
          <!-- Question 1 -->
          <h3 class="text-xl font-semibold text-gray-800 mb-2">
            1. What is TQRandom?
          </h3>
          <p class="text-gray-700 leading-relaxed mb-6">
            TQRandom is a web application designed to help instructors generate
            randomized test questionnaires. It creates shuffled versions of test
            items to reduce cheating and save preparation time.
          </p>

          <!-- Question 2 -->
          <h3 class="text-xl font-semibold text-gray-800 mb-2">
            2. Is TQRandom free to use?
          </h3>
          <p class="text-gray-700 leading-relaxed mb-6">
            Yes, TQRandom is completely free to use. All features, including
            file upload and test randomization, are accessible without payment.
          </p>

          <!-- Question 3 -->
          <h3 class="text-xl font-semibold text-gray-800 mb-2">
            3. What file types does TQRandom support?
          </h3>
          <p class="text-gray-700 leading-relaxed mb-6">
            TQRandom currently supports <strong>.pdf</strong> and
            <strong>.docx</strong> files for input. This ensures compatibility
            with commonly used test formats.
          </p>

          <!-- Question 4 -->
          <h3 class="text-xl font-semibold text-gray-800 mb-2">
            4. Does TQRandom store my uploaded files?
          </h3>
          <p class="text-gray-700 leading-relaxed mb-6">
            No. Your uploaded files are processed temporarily to generate the
            randomized test, but they are not permanently stored in our system.
          </p>

          <!-- Question 5 -->
          <h3 class="text-xl font-semibold text-gray-800 mb-2">
            5. Is my data secure?
          </h3>
          <p class="text-gray-700 leading-relaxed mb-6">
            Yes. TQRandom follows essential security practices and processes
            files only to fulfill the randomization function. We do not collect,
            store, share, or sell uploaded content.
          </p>

          <!-- Question 6 -->
          <h3 class="text-xl font-semibold text-gray-800 mb-2">
            6. Who is TQRandom for?
          </h3>
          <p class="text-gray-700 leading-relaxed mb-6">
            TQRandom is primarily designed for instructors, teachers, and
            educators who create test questionnaires for classrooms or
            assessments.
          </p>

          <!-- Question 7 -->
          <h3 class="text-xl font-semibold text-gray-800 mb-2">
            7. Can I use TQRandom on mobile?
          </h3>
          <p class="text-gray-700 leading-relaxed mb-6">
            Yes. TQRandom is fully responsive and works on mobile devices,
            tablets, and desktops for convenient access.
          </p>

          <!-- Question 8 -->
          <h3 class="text-xl font-semibold text-gray-800 mb-2">
            8. How can I contact the developers?
          </h3>
          <p class="text-gray-700 leading-relaxed mb-4">
            You can reach the developer team for support or inquiries at:
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
