// stores/tutorialStore.js
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useTutorialStore = defineStore('tutorial', () => {
  const showTutorial = ref(false);
  const currentStep = ref(0);
  const hasCompletedTutorial = ref(false);

  const tutorialSteps = [
    {
      id: 'welcome',
      title: 'Welcome to Test Management!',
      description: 'This dashboard helps you create and manage test questionnaires. Let\'s take a quick tour.',
      target: null,
      position: 'center'
    },
    {
      id: 'create-test',
      title: 'Create New Test',
      description: 'Click here to create a new test questionnaire. You can upload documents or manually add questions.',
      target: '.tutorial-create-btn',
      position: 'bottom'
    },
    {
      id: 'stats',
      title: 'Dashboard Statistics',
      description: 'Here you can see an overview of your tests, total questions, versions, and more.',
      target: '.tutorial-stats',
      position: 'bottom'
    },
    {
      id: 'search',
      title: 'Search Tests',
      description: 'Use the search bar to quickly find tests by title or description.',
      target: 'input[placeholder*="Search tests"]',
      position: 'bottom'
    },
    {
      id: 'test-list',
      title: 'Your Tests',
      description: 'All your created tests appear here. You can view question details and manage it.',
      target: '.tutorial-test-list',
      position: 'top'
    },
    {
      id: 'view-questions',
      title: 'View & Manage Questions',
      description: 'Click the Questions button to view all questions in this test, add new ones, or edit existing questions.',
      target: '.tutorial-test-questions-btn',
      position: 'top'
    },
    {
      id: 'edit-test',
      title: 'Edit Test Details',
      description: 'Click the edit button (pencil icon) to modify the test title, description, and other basic information.',
      target: '.tutorial-test-edit-btn',
      position: 'top'
    },
    {
      id: 'delete-test',
      title: 'Delete Test',
      description: 'Click the delete button (trash icon) to remove this test and all its associated data. This action cannot be undone.',
      target: '.tutorial-test-delete-btn',
      position: 'top'
    },
    {
      id: 'complete',
      title: 'Finished Test Management Tutorial!',
      description: 'You\'ve learned how to create tests. Click "Questions Button" to begin building your question bank or creating randomized tests.',
      target: null,
      position: 'center'
    }
  ];

  const initTutorial = (isNewUser) => {
    if (isNewUser) {
      showTutorial.value = true;
      currentStep.value = 0;
      hasCompletedTutorial.value = false;
    }
  };

  const nextStep = () => {
    if (currentStep.value < tutorialSteps.length - 1) {
      currentStep.value++;
    } else {
      completeTutorial();
    }
  };

  const previousStep = () => {
    if (currentStep.value > 0) {
      currentStep.value--;
    }
  };

  const skipTutorial = () => {
    showTutorial.value = false;
    currentStep.value = 0;
    hasCompletedTutorial.value = true;
    localStorage.setItem('tutorialCompleted', 'true');
  };
  
  const completeTutorial = () => {
    showTutorial.value = false;
    currentStep.value = 0;
    hasCompletedTutorial.value = true;
    localStorage.setItem('tutorialCompleted', 'true');
  };
  

  const restartTutorial = () => {
    showTutorial.value = true;
    currentStep.value = 0;
    hasCompletedTutorial.value = false;
    localStorage.removeItem('tutorialCompleted');
  };

  return {
    showTutorial,
    currentStep,
    hasCompletedTutorial,
    tutorialSteps,
    initTutorial,
    nextStep,
    previousStep,
    skipTutorial,
    completeTutorial,
    restartTutorial
  };
});