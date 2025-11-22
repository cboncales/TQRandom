<template>
  <div
    class="fixed inset-0 bg-white flex items-center justify-center z-[9999] transition-transform duration-[1500ms] ease-in-out"
    :class="{ 'translate-y-[-100%] opacity-0': hide }"
  >
    <img src="/favicon.png" class="w-28 animate-pulseRotate" />
  </div>
</template>

<script setup>
defineProps({
  hide: Boolean,
});
</script>

<style>
@keyframes pulseRotate {
  0% {
    transform: scale(0.7) rotate(0deg);
  }
  15% {
    transform: scale(0.85) rotate(-10deg);
  }
  30% {
    transform: scale(1.15) rotate(10deg);
  }
  50% {
    transform: scale(1.25) rotate(-7deg);
  }
  70% {
    transform: scale(1.05) rotate(5deg);
  }
  85% {
    transform: scale(0.85) rotate(-3deg);
  }
  100% {
    transform: scale(1.2) rotate(0deg);
  }
}

.animate-pulseRotate {
  animation: pulseRotate 1.8s cubic-bezier(0.45, 0, 0.55, 1) infinite;
}
</style>
