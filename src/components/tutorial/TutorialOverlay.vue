<script setup>
import { computed } from 'vue';
import { useTutorialStore } from '@/stores/tutorialStore';

// Import tutorial images
import welcomeImage from '@/assets/images/welcome.png';
import createTestBtnImage from '@/assets/images/create-test-btn.png';
import AiGenerateBtnImage from '@/assets/images/ai-generate.png';
import createTestImage from '@/assets/images/create-test.png';
import AiGenerateModalImage from '@/assets/images/ai-generate-modal.png';
import AiGenerateModalImage2 from '@/assets/images/ai-generate-modal-2.png';
import statsImage from '@/assets/images/stats.png';
import searchImage from '@/assets/images/search.png';
import testListImage from '@/assets/images/test-list.png';
import questionsBtnImage from '@/assets/images/question-btn.png';
import editTestBtnImage from '@/assets/images/edit-btn.png';
import deleteTestBtnImage from '@/assets/images/delete-btn.png';
import addQuestionImage from '@/assets/images/add-question.png';
import questionFormImage from '@/assets/images/question-form.png';
import questionTypesImage from '@/assets/images/question-form-2.png';
import uploadDocumentImage from '@/assets/images/upload-doc.png';
import uploadDocumentModalTopImage from '@/assets/images/upload-form.png';
import uploadDocumentModalBotImage from '@/assets/images/upload-form-2.png';
import imageExtractionImage from '@/assets/images/ass-image.png';
import imageAssignmentImage from '@/assets/images/ass-image-2.png';
import imageAssignmentChoicesImage from '@/assets/images/ass-image-3.png';
import tabsImage from '@/assets/images/tabs.png';
import testNameImage from '@/assets/images/test-name.png';
import testInfoImage from '@/assets/images/test-info.png';
import selectAllQuestionsImage from '@/assets/images/select-all-question.png';
import questionListImage from '@/assets/images/question-list.png';
import randomizedVersionsImage from '@/assets/images/random-tab.png';
import randomizedVersionFormImage from '@/assets/images/random-form.png';
import versionsCardImage from '@/assets/images/random-cards.png';
import versionCardBtnImage from '@/assets/images/random-cards-btn.png';
import answerKeyModal from '@/assets/images/answer-key.png'
import PreviewVersionModal from '@/assets/images/preview-version.png';
import selectAllVersionsImage from '@/assets/images/random-cards-2.png';
import downloadFormImage from '@/assets/images/DL-form.png';

const tutorialStore = useTutorialStore();

const currentStep = computed(() => 
  tutorialStore.tutorialSteps[tutorialStore.currentStep]
);

const isLastStep = computed(() => 
  tutorialStore.currentStep === tutorialStore.tutorialSteps.length - 1
);

const isFirstStep = computed(() => 
  tutorialStore.currentStep === 0
);

// Map step IDs to imported images
const getStepImage = (stepId) => {
  const imageMap = {
    'welcome': welcomeImage,
    'create-test-btn': createTestBtnImage,
    'create-test': createTestImage,
    'ai-generate-btn': AiGenerateBtnImage,
    'ai-generate-modal': AiGenerateModalImage,
    'ai-generate-modal-2': AiGenerateModalImage2,
    'stats': statsImage,
    'search': searchImage,
    'test-list': testListImage,
    'view-questions': questionsBtnImage,
    'edit-test': editTestBtnImage,
    'delete-test': deleteTestBtnImage,
    'add-question': addQuestionImage,
    'question-form': questionFormImage,
    'question-types': questionTypesImage,
    'upload-document': uploadDocumentImage,
    'upload-document-modal-top': uploadDocumentModalTopImage,
    'upload-document-modal-bot': uploadDocumentModalBotImage,
    'image-extraction': imageExtractionImage,
    'image-assignment': imageAssignmentImage,
    'image-assignment-choices': imageAssignmentChoicesImage,
    'tabs': tabsImage,
    'test-name': testNameImage,
    'test-info': testInfoImage,
    'select-all-questions': selectAllQuestionsImage,
    'question-list': questionListImage,
    'randomized-versions-tab': randomizedVersionsImage,
    'randomized-version-form': randomizedVersionFormImage,
    'versions-card': versionsCardImage,
    'version-card-btn': versionCardBtnImage,
    'answer-key-modal': answerKeyModal,
    'preview-version-modal': PreviewVersionModal,
    'select-all-versions': selectAllVersionsImage,
    'download-form': downloadFormImage,
    'complete': welcomeImage, // Reuse welcome image for complete step
  };
  return imageMap[stepId] || null;
};
</script>

<template>
  <div v-if="tutorialStore.showTutorial" class="tutorial-modal-container">
    <!-- Backdrop -->
    <div class="tutorial-backdrop" @click="tutorialStore.skipTutorial"></div>
    
    <!-- Modal -->
    <div class="tutorial-modal">
      <div class="tutorial-modal-content">
        <!-- Close Button -->
        <button
          @click="tutorialStore.skipTutorial"
          class="tutorial-close-btn"
          aria-label="Close tutorial"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <!-- Step Image -->
        <div v-if="getStepImage(currentStep.id)" class="tutorial-image-container">
          <img 
            :src="getStepImage(currentStep.id)" 
            :alt="currentStep.title"
            class="tutorial-image"
          />
        </div>

        <!-- Step Content -->
        <div class="tutorial-content">
          <h2 class="tutorial-title">{{ currentStep.title }}</h2>
          <p class="tutorial-description">{{ currentStep.description }}</p>

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

          <!-- Navigation Buttons -->
          <div class="tutorial-buttons">
            <button
              @click="tutorialStore.skipTutorial"
              class="tutorial-btn tutorial-btn-skip"
            >
              Skip Tutorial
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
                {{ isLastStep ? 'Get Started!' : 'Next' }} →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tutorial-modal-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.tutorial-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  animation: fadeIn 0.3s ease;
}

.tutorial-modal {
  position: relative;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  z-index: 10000;
  animation: slideUp 0.4s ease;
}

.tutorial-modal-content {
  background: white;
  border-radius: 16px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  position: relative;
}

.tutorial-close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #6b7280;
}

.tutorial-close-btn:hover {
  background: white;
  color: #374151;
  transform: scale(1.1);
}

.tutorial-image-container {
  width: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 250px;
}

.tutorial-image {
  max-width: 100%;
  height: auto;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  background: white;
  padding: 8px;
}

.tutorial-content {
  padding: 32px;
}

.tutorial-title {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 12px 0;
  line-height: 1.3;
}

.tutorial-description {
  font-size: 16px;
  color: #6b7280;
  margin: 0 0 24px 0;
  line-height: 1.6;
}

.tutorial-step-counter {
  font-size: 13px;
  color: #9ca3af;
  margin-bottom: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.tutorial-progress-bar {
  width: 100%;
  height: 6px;
  background-color: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 24px;
}

.tutorial-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%);
  transition: width 0.4s ease;
  border-radius: 3px;
}

.tutorial-buttons {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.tutorial-btn {
  padding: 12px 24px;
  border-radius: 8px;
  border: none;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.tutorial-btn-skip {
  background-color: #374151;
  color: #6b7280;
  border: 2px solid #e5e7eb;
}

.tutorial-btn-skip:hover {
  background-color: #f9fafb;
  color: #374151;
  border-color: #d1d5db;
}

.tutorial-btn-primary {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  color: white;
  flex-grow: 1;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.tutorial-btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
}

.tutorial-btn-primary:active {
  transform: translateY(0);
}

.tutorial-btn-secondary {
  background-color: #f3f4f6;
  color: #374151;
  border: 2px solid #e5e7eb;
}

.tutorial-btn-secondary:hover {
  background-color: #e5e7eb;
  border-color: #d1d5db;
}

.tutorial-nav-buttons {
  display: flex;
  gap: 12px;
  flex: 1;
  justify-content: flex-end;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .tutorial-modal-content {
    background: #e5e7e9;
  }

  .tutorial-title {
    color: #242527;
  }

  .tutorial-description {
    color: #242527;
  }

  .tutorial-close-btn {
    background: rgba(31, 41, 55, 0.9);
    color: #d1d5db;
  }

  .tutorial-close-btn:hover {
    background: #374151;
    color: #f9fafb;
  }

  .tutorial-progress-bar {
    background-color: #374151;
  }

  .tutorial-btn-skip {
    color: #d1d5db;
    border-color: #4b5563;
  }

  .tutorial-btn-skip:hover {
    background-color: #c4c8ce;
    color: #1d1e1f;
    border-color: #6b7280;
  }

  .tutorial-btn-secondary {
    background-color: #374151;
    color: #f9fafb;
    border-color: #4b5563;
  }

  .tutorial-btn-secondary:hover {
    background-color: #4b5563;
    border-color: #6b7280;
  }
}

/* Responsive */
@media (max-width: 640px) {
  .tutorial-modal {
    max-width: 100%;
  }

  .tutorial-image-container {
    padding: 24px;
    min-height: 200px;
  }

  .tutorial-content {
    padding: 24px;
  }

  .tutorial-title {
    font-size: 20px;
  }

  .tutorial-description {
    font-size: 14px;
  }

  .tutorial-buttons {
    flex-direction: column;
  }

  .tutorial-nav-buttons {
    width: 100%;
  }

  .tutorial-btn {
    width: 100%;
    padding: 12px 16px;
    font-size: 14px;
  }

  .tutorial-nav-buttons button {
    flex: 1;
  }
}

@media (max-width: 480px) {
  .tutorial-modal-container {
    padding: 8px;
  }

  .tutorial-modal {
    max-height: 95vh;
  }
}
</style>