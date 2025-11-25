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
      id: 'create-test-btn',
      title: 'Create Test Button',
      description: 'Click the create test button to create a new test questionnaire.',
      target: '.tutorial-create-test-btn',
      position: 'center'
    },
    {
      id: 'create-test',
      title: 'Create Test Modal',
      description: 'This is the create test modal. You can enter the title, description, and upload a header image for the test.',
      target: '.tutorial-create-test-modal',
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
        id: 'test-name',
        title: 'Test Information',
        description: 'This is the test information with a back icon to go back to the dashboard.',
        target: '.tutorial-test-info',
        position: 'top'
    },
    {
      id: 'add-question',
      title: 'Add Question',
      description: 'Click the Questions button to add question, answer-choices, and correct answer manually to the test.',
      target: '.tutorial-test-add-question-btn',
      position: 'top'
    },
    {
      id: 'question-form',
      title: 'Question Form',
      description: 'This is the question form, you can input a question, upload an image, and add answer-choices with images or text, and mark the correct answer.',
      target: '.tutorial-question-form',
      position: 'top'
    },
    {
      id: 'upload-document',
      title: 'Upload Document',
      description: 'Click the upload document button to upload a document to the test.',
      target: '.tutorial-test-upload-document-btn',
      position: 'top'
    },
    {
      id: 'upload-document-modal-top',
      title: 'Upload Document Instructions',
      description: 'This is the upload document modal, in the top part of the modal there is instructions on how to upload a document to the test.',
      target: '.tutorial-upload-document-modal-top',
      position: 'top'
    },
    {
      id: 'upload-document-modal-bot',
      title: 'Upload Document Inputs',
      description: 'In the bottom part of the modal you can click to upload or drag and drop a file to upload a document to the test. You can also add answer-key',
      target: '.tutorial-upload-document-modal-bot',
      position: 'top'
    },
    {
      id: 'image-extraction',
      title: 'Image Extraction',
      description: 'After you upload a document, the system will extract the questions and answer-choices from the document.',
      target: '.tutorial-image-extraction',
      position: 'top'
    },
    {
      id: 'image-assignment',
      title: 'Image Assignment to Questions',
      description: 'Click the Questions tab to assign the images to the Questions.',
      target: '.tutorial-questions-tab',
      position: 'top'
    },
    {
      id: 'image-assignment-choices',
      title: 'Image Assignment to Answer Choices',
      description: 'Click the Answer Choices tab to assign the images to the Answer Choices.',
      target: '.tutorial-answer-choices-tab',
      position: 'top'
    },
    {
      id: 'tabs',
      title: 'Tabs',
      description: 'You can switch between the Questions and Randomized Versions tabs to view the questions and randomized versions respectively.',
      target: '.tutorial-randomized-versions-tab',
      position: 'top'
    },
    {
      id: 'select-all-questions',
      title: 'Select All Questions',
      description: 'Select all questions to easily delete all questions at once or you can click the checkbox next to each question to delete individual questions.',
      target: '.tutorial-select-all-questions',
      position: 'top'
    },
    {
      id: 'question-list',
      title: 'Question List',
      description: 'This is the question list with a checkbox to select individual questions and a delete button to delete the question.',
      target: '.tutorial-question-list',
      position: 'top'
    },
    {
      id: 'randomized-versions-tab',
      title: 'Generate Versions',
      description: 'You can click either the Generate Your First Version button or the Generate Versions button to generate the randomized versions of the test.',
      target: '.tutorial-generate-versions-btn',
      position: 'top'
    },
    {
      id: 'randomized-version-form',
      title: 'Randomized Version Form',
      description: 'This is the randomized version form, you can input the number of versions and the number of questions per version.',
      target: '.tutorial-random-form',
      position: 'top'
    },
    {
      id: 'versions-card',
      title: 'Randomized Versions Card',
      description: 'After generating version the version cards will appear here.',
      target: '.tutorial-versions-card',
      position: 'top'
    },
    {
      id: 'version-card-btn',
      title: 'Version Card Buttons',
      description: 'You can click the version card icon buttons in the right side of the version card to view answer key, preview randomized version, download or delete the version.',
      target: '.tutorial-version-card-btn',
      position: 'top'
    },
    {
      id: 'select-all-versions',
      title: 'Select All Versions',
      description: 'You can select all versions to easily download or delete all versions at once or you can click the version card to download or delete individual versions.',
      target: '.tutorial-select-all-versions',
      position: 'top'
    },
    {
      id: 'download-form',
      title: 'Download Form',
      description: 'This is the download form, you can select the format you want to download it in. You can also select the versions you want to download.',
      target: '.tutorial-download-form',
      position: 'top'
    },
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