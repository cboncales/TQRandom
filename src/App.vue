<script setup>
import { RouterView } from "vue-router";
import Preloader from "@/components/Preloader.vue";
import { ref, onMounted, onUnmounted } from "vue";

const showPreloader = ref(true);
const hidePreloader = ref(false);

onMounted(() => {
  setTimeout(() => {
    hidePreloader.value = true;
  }, 2000);

  setTimeout(() => {
    showPreloader.value = false;
  }, 2100);
});

const showScrollTop = ref(false);

const handleScroll = () => {
  showScrollTop.value = window.scrollY > 300;
};

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
};

onMounted(() => {
  window.addEventListener("scroll", handleScroll);
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
});
</script>

<template>
  <Preloader v-if="showPreloader" :hide="hidePreloader" />

  <div v-else class="transition-opacity duration-700 ease-in">
    <RouterView />
  </div>
  <button
    v-show="showScrollTop"
    @click="scrollToTop"
    class="fixed bottom-6 right-6 bg-[#155dfc] text-white p-5 rounded-full shadow-xl hover:bg-[#1a46c9] transition z-50"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="w-8 h-8"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="3"
        d="M5 15l7-7 7 7M5 9l7-7 7 7"
      />
    </svg>
  </button>
</template>

<style scoped>
/* Global styles can go here */
</style>
