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
        <h1 class="text-4xl font-bold text-gray-900 mb-8 text-center">
          Terms of Service
        </h1>

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
            These Terms and Conditions (“Terms”) govern your use of the website
            <strong>tq-random.vercel.app</strong> and the TQRandom web
            application (“Service”). By accessing or using the Service, you
            agree to be bound by these Terms. If you do not agree, please
            discontinue use immediately.
          </p>

          <!-- Section: Use of Service -->
          <h3 class="text-xl font-semibold text-gray-800 mb-2">
            1. Use of the Service
          </h3>
          <p class="text-gray-700 leading-relaxed mb-4">
            TQRandom is an online tool designed to help instructors generate
            randomized test questionnaires. You agree to use the Service only
            for lawful academic or instructional purposes. You must not misuse,
            reverse-engineer, or attempt to disrupt the functionality of the
            system.
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
              You are responsible for the accuracy and legality of the files you
              upload.
            </li>
            <li>You will not upload malicious, harmful, or illegal content.</li>
            <li>
              You will not attempt to access restricted areas of the system.
            </li>
            <li>
              You will not perform actions that could disrupt or damage the
              Service.
            </li>
          </ul>

          <!-- Section: Intellectual Property -->
          <h3 class="text-xl font-semibold text-gray-800 mb-2">
            3. Intellectual Property
          </h3>
          <p class="text-gray-700 leading-relaxed mb-4">
            All features, design elements, code, and content within TQRandom
            remain the intellectual property of the developers. You may use the
            Service but do not gain ownership over any part of the platform.
          </p>

          <!-- Section: Limitation of Liability -->
          <h3 class="text-xl font-semibold text-gray-800 mb-2">
            4. Limitation of Liability
          </h3>
          <p class="text-gray-700 leading-relaxed mb-4">
            TQRandom is provided on an “as-is” and “as-available” basis. We do
            not guarantee that the Service will be error-free or uninterrupted.
            Under no circumstances will the developers be held liable for any
            damages arising from the use or inability to use the Service.
          </p>

          <!-- Section: Privacy -->
          <h3 class="text-xl font-semibold text-gray-800 mb-2">
            5. Privacy and Data Handling
          </h3>
          <p class="text-gray-700 leading-relaxed mb-4">
            By using the Service, you also agree to our Privacy Policy, which
            explains how we collect and manage information. Please review it to
            understand your rights and how your data is handled.
          </p>

          <!-- Section: Modifications -->
          <h3 class="text-xl font-semibold text-gray-800 mb-2">
            6. Changes to These Terms
          </h3>
          <p class="text-gray-700 leading-relaxed mb-4">
            We may update these Terms from time to time. Updated versions will
            be posted on this page with a revised “Last Updated” date. Continued
            use of the Service means you accept any changes made.
          </p>

          <!-- Section: Contact -->
          <h3 class="text-xl font-semibold text-gray-800 mb-2">
            7. Contact Information
          </h3>
          <p class="text-gray-700 leading-relaxed mb-4">
            For questions or concerns regarding these Terms, you may contact us
            at:
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
      </div>
    </section>
  </AppLayout>
</template>

<style scoped></style>
