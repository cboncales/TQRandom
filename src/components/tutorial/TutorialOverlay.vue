<!-- components/TutorialOverlay.vue -->
<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useTutorialStore } from '@/stores/tutorialStore';

const tutorialStore = useTutorialStore();
const targetElement = ref(null);
const position = ref({ top: 0, left: 0 });
const elementDimensions = ref({ width: 0, height: 0 });

const currentStep = computed(() => 
  tutorialStore.tutorialSteps[tutorialStore.currentStep]
);

const isLastStep = computed(() => 
  tutorialStore.currentStep === tutorialStore.tutorialSteps.length - 1
);

const isFirstStep = computed(() => 
  tutorialStore.currentStep === 0
);

const highlightStyle = computed(() => {
  if (!currentStep.value.target) return { display: 'none' };
  
  return {
    top: `${position.value.top}px`,
    left: `${position.value.left}px`,
    width: `${elementDimensions.value.width}px`,
    height: `${elementDimensions.value.height}px`,
    display: 'block',
  };
});

const tooltipStyle = computed(() => {
  if (!currentStep.value.target) {
    // Center tooltip for center position
    return {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    };
  }

  // Tooltip dimensions (approximate max-width + padding)
  const tooltipWidth = window.innerWidth < 640 ? window.innerWidth - 32 : 448; // max-width + padding
  const tooltipHeight = 300; // approximate height
  const margin = 20; // margin from viewport edge
  const spacing = 20; // spacing from target element

  // Viewport dimensions
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Calculate initial positions
  const positions = {
    top: {
      top: position.value.top - spacing,
      left: position.value.left + elementDimensions.value.width / 2,
      transform: 'translate(-50%, -100%)',
    },
    bottom: {
      top: position.value.top + elementDimensions.value.height + spacing,
      left: position.value.left + elementDimensions.value.width / 2,
      transform: 'translate(-50%, 0)',
    },
    left: {
      top: position.value.top + elementDimensions.value.height / 2,
      left: position.value.left - spacing,
      transform: 'translate(-100%, -50%)',
    },
    right: {
      top: position.value.top + elementDimensions.value.height / 2,
      left: position.value.left + elementDimensions.value.width + spacing,
      transform: 'translate(0, -50%)',
    },
  };

  let basePosition = positions[currentStep.value.position] || positions.bottom;
  let finalTop = basePosition.top;
  let finalLeft = basePosition.left;
  let finalTransform = basePosition.transform;

  // For mobile screens, use intelligent positioning
  if (viewportWidth < 640) {
    const elementCenterY = position.value.top + elementDimensions.value.height / 2;
    const elementBottom = position.value.top + elementDimensions.value.height;
    
    // Check if there's more space above or below the element
    const spaceAbove = position.value.top;
    const spaceBelow = viewportHeight - elementBottom;
    
    // Position tooltip where there's more space
    if (spaceBelow > spaceAbove && spaceBelow > 250) {
      // Position below
      finalTop = elementBottom + 10;
      finalLeft = viewportWidth / 2;
      finalTransform = 'translate(-50%, 0)';
    } else if (spaceAbove > 250) {
      // Position above
      finalTop = position.value.top - 10;
      finalLeft = viewportWidth / 2;
      finalTransform = 'translate(-50%, -100%)';
    } else {
      // Not enough space above or below, position at top of screen
      finalTop = margin;
      finalLeft = viewportWidth / 2;
      finalTransform = 'translate(-50%, 0)';
    }
  } else {
    // Desktop/tablet logic
    // Adjust for viewport boundaries
    // Check if tooltip exceeds left boundary
    if (currentStep.value.position === 'left' || currentStep.value.position === 'top' || currentStep.value.position === 'bottom') {
      const leftEdge = finalLeft - (tooltipWidth / 2);
      if (leftEdge < margin) {
        finalLeft = margin + (tooltipWidth / 2);
      }
      
      // Check if tooltip exceeds right boundary
      const rightEdge = finalLeft + (tooltipWidth / 2);
      if (rightEdge > viewportWidth - margin) {
        finalLeft = viewportWidth - margin - (tooltipWidth / 2);
      }
    }

    // For left position specifically
    if (currentStep.value.position === 'left') {
      const leftEdge = finalLeft - tooltipWidth;
      if (leftEdge < margin) {
        // Switch to right position if there's not enough space on the left
        finalLeft = position.value.left + elementDimensions.value.width + spacing;
        finalTransform = 'translate(0, -50%)';
      }
    }

    // For right position
    if (currentStep.value.position === 'right') {
      const rightEdge = finalLeft + tooltipWidth;
      if (rightEdge > viewportWidth - margin) {
        // Switch to left position if there's not enough space on the right
        finalLeft = position.value.left - spacing;
        finalTransform = 'translate(-100%, -50%)';
      }
    }

    // Check vertical boundaries
    if (currentStep.value.position === 'top') {
      const topEdge = finalTop - tooltipHeight;
      if (topEdge < margin) {
        // Switch to bottom if not enough space on top
        finalTop = position.value.top + elementDimensions.value.height + spacing;
        finalTransform = 'translate(-50%, 0)';
      }
    }

    if (currentStep.value.position === 'bottom') {
      const bottomEdge = finalTop + tooltipHeight;
      if (bottomEdge > viewportHeight - margin) {
        // Switch to top if not enough space on bottom
        finalTop = position.value.top - spacing;
        finalTransform = 'translate(-50%, -100%)';
      }
    }
  }

  return {
    top: `${finalTop}px`,
    left: `${finalLeft}px`,
    transform: finalTransform,
  };
});

const updatePosition = () => {
  if (!currentStep.value.target) {
    targetElement.value = null;
    return;
  }

  const element = document.querySelector(currentStep.value.target);
  if (element) {
    // Add padding/margin around the highlight box for better visibility
    const padding = 8;
    const rect = element.getBoundingClientRect();
    
    // Use fixed positioning - getBoundingClientRect already accounts for scroll
    // Round values to prevent subpixel rendering issues
    position.value = {
      top: Math.round(rect.top - padding),
      left: Math.round(rect.left - padding),
    };
    elementDimensions.value = {
      width: Math.round(rect.width + padding * 2),
      height: Math.round(rect.height + padding * 2),
    };
    targetElement.value = element;
  }
};

// Watch for step changes and update position
watch(() => tutorialStore.currentStep, () => {
  // Add multiple setTimeout calls to ensure element is rendered
  setTimeout(updatePosition, 50);
  setTimeout(updatePosition, 200);
  setTimeout(updatePosition, 500);
});

// Watch for tutorial visibility changes - DON'T lock scrolling
watch(() => tutorialStore.showTutorial, (isShowing) => {
  if (isShowing) {
    // Reset position values when tutorial starts
    position.value = { top: 0, left: 0 };
    elementDimensions.value = { width: 0, height: 0 };
    targetElement.value = null;
    // Update position when tutorial becomes visible
    setTimeout(updatePosition, 50);
    setTimeout(updatePosition, 200);
    setTimeout(updatePosition, 500);
  } else {
    // Clear position when tutorial closes
    position.value = { top: 0, left: 0 };
    elementDimensions.value = { width: 0, height: 0 };
    targetElement.value = null;
  }
}, { immediate: true });

onMounted(() => {
  // Wait for DOM to fully render
  setTimeout(updatePosition, 100);
  setTimeout(updatePosition, 300);
  
  // Throttle scroll updates to prevent lag
  let scrollTimeout = null;
  const handleScroll = () => {
    if (scrollTimeout) {
      cancelAnimationFrame(scrollTimeout);
    }
    scrollTimeout = requestAnimationFrame(() => {
      updatePosition();
    });
  };
  
  const handleResize = () => {
    requestAnimationFrame(updatePosition);
  };
  
  window.addEventListener('resize', handleResize);
  window.addEventListener('scroll', handleScroll, true); // Use capture to catch all scrolls
  
  // Recalculate on any layout shift
  const resizeObserver = new ResizeObserver(() => {
    requestAnimationFrame(updatePosition);
  });
  
  // Observe body for size changes
  resizeObserver.observe(document.body);
  
  // Cleanup on component unmount
  return () => {
    if (scrollTimeout) {
      cancelAnimationFrame(scrollTimeout);
    }
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('scroll', handleScroll, true);
    resizeObserver.disconnect();
  };
});
</script>

<template>
  <div v-if="tutorialStore.showTutorial" class="tutorial-overlay-container">
    <!-- Darkened Background -->
    <div 
      v-if="currentStep.target"
      class="tutorial-overlay"
      :style="{
        '--top': position.top + 'px',
        '--left': position.left + 'px',
        '--width': elementDimensions.width + 'px',
        '--height': elementDimensions.height + 'px',
        '--bottom': position.top + elementDimensions.height + 'px',
        '--right': position.left + elementDimensions.width + 'px'
      }"
    ></div>
    
    <!-- Full dark overlay for steps without target -->
    <div 
      v-if="!currentStep.target"
      class="tutorial-overlay-full"
    ></div>

    <!-- Highlight Box with Transparent Cutout -->
    <div
      v-if="currentStep.target"
      class="tutorial-highlight"
      :style="highlightStyle"
    ></div>

    <!-- Tooltip -->
    <div
      class="tutorial-tooltip"
      :style="tooltipStyle"
      :data-position="currentStep.position"
    >
      <div class="tutorial-tooltip-content">
        <h3 class="tutorial-tooltip-title">{{ currentStep.title }}</h3>
        <p class="tutorial-tooltip-description">{{ currentStep.description }}</p>

        <!-- Step Counter -->
        <div class="tutorial-step-counter">
          Step {{ tutorialStore.currentStep + 1 }} of {{ tutorialStore.tutorialSteps.length }}
        </div>

        <!-- Progress Bar -->
        <div class="tutorial-progress-bar">
          <div
            class="tutorial-progress-fill"
            :style="{
              width: `${((tutorialStore.currentStep + 1) / tutorialStore.tutorialSteps.length) * 100}%`
            }"
          ></div>
        </div>

        <!-- Buttons -->
        <div class="tutorial-buttons">
          <button
            @click="tutorialStore.skipTutorial"
            class="tutorial-btn tutorial-btn-skip"
          >
            Skip
          </button>

          <div class="tutorial-nav-buttons">
            <button
              v-if="!isFirstStep"
              @click="tutorialStore.previousStep"
              class="tutorial-btn tutorial-btn-secondary"
            >
              ← Back
            </button>

            <button
              @click="isLastStep ? tutorialStore.completeTutorial() : tutorialStore.nextStep()"
              class="tutorial-btn tutorial-btn-primary"
            >
              {{ isLastStep ? 'Got it!' : 'Next' }} →
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tutorial-overlay-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 100;
  pointer-events: auto; /* Changed to auto to block clicks outside tutorial */
}

.tutorial-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.6);
  z-index: 101;
  pointer-events: auto; /* Block all clicks on the overlay */

  /* Create the rectangular hole */
  mask:
    linear-gradient(#000 0 0) top / 100% var(--top) no-repeat,
    linear-gradient(#000 0 0) bottom / 100% calc(100% - var(--bottom)) no-repeat,
    linear-gradient(#000 0 0) left / var(--left) 100% no-repeat,
    linear-gradient(#000 0 0) right / calc(100% - var(--right)) 100% no-repeat;
}

.tutorial-overlay-full {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.6);
  z-index: 101;
  pointer-events: auto;
}

.tutorial-highlight {
  position: fixed;
  border: 3px solid #3b82f6;
  border-radius: 8px;
  z-index: 102;
  pointer-events: none;
  background: transparent;
  will-change: transform;
  /* Remove transition to prevent lag during scroll */
}

.tutorial-tooltip {
  position: fixed;
  z-index: 103;
  pointer-events: auto;
  animation: slideIn 0.3s ease;
  will-change: transform;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.tutorial-tooltip-content {
  background: white;
  border-radius: 12px;
  padding: 24px;
  max-width: 400px;
  box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);
  border: 2px solid #3b82f6;
}

.tutorial-tooltip-title {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 8px 0;
}

.tutorial-tooltip-description {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 16px 0;
  line-height: 1.5;
}

.tutorial-step-counter {
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 8px;
  font-weight: 500;
}

.tutorial-progress-bar {
  width: 100%;
  height: 4px;
  background-color: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 16px;
}

.tutorial-progress-fill {
  height: 100%;
  background-color: #3b82f6;
  transition: width 0.3s ease;
}

.tutorial-buttons {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.tutorial-btn {
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tutorial-btn-skip {
  background-color: transparent;
  color: #6b7280;
  border: 1px solid #d1d5db;
  
  &:hover {
    background-color: #f3f4f6;
    color: #374151;
  }
}

.tutorial-btn-primary {
  background-color: #3b82f6;
  color: white;
  flex-grow: 1;

  &:hover {
    background-color: #2563eb;
  }

  &:active {
    background-color: #1d4ed8;
  }
}

.tutorial-btn-secondary {
  background-color: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;

  &:hover {
    background-color: #e5e7eb;
  }
}

.tutorial-nav-buttons {
  display: flex;
  gap: 8px;
}

/* Responsive */
@media (max-width: 640px) {
  .tutorial-tooltip-content {
    max-width: calc(100vw - 32px);
    padding: 16px;
  }

  .tutorial-tooltip {
    /* Ensure tooltip stays within viewport on mobile */
    max-width: calc(100vw - 32px);
    /* Make tooltip scrollable if content is too long */
    max-height: calc(100vh - 40px);
    overflow-y: auto;
  }

  .tutorial-buttons {
    flex-direction: column;
  }

  .tutorial-nav-buttons {
    width: 100%;
    
    button {
      flex: 1;
    }
  }

  .tutorial-btn{
    font-size: 10px;
  }
  
  .tutorial-tooltip-title {
    font-size: 16px;
  }
  
  .tutorial-tooltip-description {
    font-size: 13px;
  }
}

@media (max-width: 768px) {
  .tutorial-tooltip-content {
    max-width: calc(100vw - 48px);
  }
}

@media (max-width: 1024px) {
  .tutorial-tooltip-content {
    max-width: 380px;
  }
}
</style>