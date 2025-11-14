<script setup>
import AppLayout from "@/components/layout/AppLayout.vue";
</script>
<template>
    <AppLayout>
      <section class="py-20 bg-gray-200">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 class="text-4xl font-bold text-gray-900 mb-12 text-center">
            Contact Us
          </h1>
  
          <!-- Card Container -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
  
            <!-- Clark Card -->
            <div class="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all">
              <h2 class="text-2xl font-semibold text-gray-800 mb-2">Clark G. Boncales</h2>
              <p class="text-gray-600 mb-4">Developer</p>
  
              <div class="mt-4">
                <p class="text-gray-700 font-medium">Email:</p>
                <a
                  href="mailto:clarkboncales115@gmail.com"
                  class="text-blue-600 hover:underline break-all"
                >
                  clarkboncales115@gmail.com
                </a>
              </div>
            </div>
  
            <!-- Joshua Card -->
            <div class="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all">
              <h2 class="text-2xl font-semibold text-gray-800 mb-2">Joshua T. Tubo</h2>
              <p class="text-gray-600 mb-4">Developer</p>
  
              <div class="mt-4">
                <p class="text-gray-700 font-medium">Email:</p>
                <a
                  href="mailto:joshuatubo4@gmail.com"
                  class="text-blue-600 hover:underline break-all"
                >
                  joshuatubo4@gmail.com
                </a>
              </div>
            </div>
          </div>
  
          <!-- Contact Form (Modern) -->
          <div class="bg-white p-10 rounded-2xl shadow-lg mt-16">
            <h2 class="text-2xl font-semibold text-gray-900 mb-6 text-center">
              Send Us a Message
            </h2>
  
            <form class="space-y-6 max-w-3xl mx-auto">
              <div>
                <label class="block text-gray-700 font-medium mb-1">Your Name</label>
                <input
                  type="text"
                  class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your name"
                />
              </div>
  
              <div>
                <label class="block text-gray-700 font-medium mb-1">Your Email</label>
                <input
                  type="email"
                  class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your email"
                />
              </div>
  
              <div>
                <label class="block text-gray-700 font-medium mb-1">Message</label>
                <textarea
                  rows="5"
                  class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Write your message here"
                ></textarea>
              </div>
  
              <div class="text-center">
                <button
                  type="submit"
                  class="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
                >
                  Send Message
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </AppLayout>
</template>
<style scoped>
</style>