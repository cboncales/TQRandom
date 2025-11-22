<script setup>
import { RouterView } from "vue-router";
import { ref, onMounted } from "vue";
import Preloader from "@/components/Preloader.vue";

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
</script>

<template>
  <Preloader v-if="showPreloader" :hide="hidePreloader" />

  <div v-else class="transition-opacity duration-700 ease-in">
    <RouterView />
  </div>
</template>

<style scoped>
/* Global styles can go here */
</style>
