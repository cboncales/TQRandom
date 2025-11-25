<script setup>
import AppLayout from "@/components/layout/AppLayout.vue";
import QuestionForm from "@/components/dashboard/QuestionForm.vue";
import QuestionList from "@/components/dashboard/QuestionList.vue";
import UploadDocumentModal from "@/components/dashboard/UploadDocumentModal.vue";
import ImageAssignmentModal from "@/components/dashboard/ImageAssignmentModal.vue";
import DownloadFormatSelectionModal from "@/components/dashboard/DownloadFormatSelectionModal.vue";
import ProgressModal from "@/components/dashboard/ProgressModal.vue";
import PreviewVersionModal from "@/components/dashboard/PreviewVersionModal.vue";
import AnswerKeyModal from "@/components/dashboard/AnswerKeyModal.vue";
import GenerateVersionsModal from "@/components/dashboard/GenerateVersionsModal.vue";
import DeleteVersionConfirmationModal from "@/components/dashboard/DeleteVersionConfirmationModal.vue";
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useTestStore } from "@/stores/testStore";
import { jsPDF } from "jspdf";
import JSZip from "jszip";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  HeadingLevel,
  ImageRun,
} from "docx";

const route = useRoute();
const router = useRouter();
const testStore = useTestStore();

// Helper functions for loading images
const loadImageAsBase64 = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = url;
  });
};

const loadImageAsBuffer = async (url) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error("Error loading image as buffer:", error);
    return null;
  }
};

const testId = parseInt(route.params.id);
const showQuestionForm = ref(false);
const editingQuestion = ref(null);
const isLoading = ref(true);
const isSavingQuestion = ref(false);
const errorMessage = ref("");

const test = ref({});
const questions = ref([]);
const availableTypes = ref([]);

// Tab management
const activeTab = ref("questions"); // 'questions' or 'versions'

// Version management
const versions = ref([]);
const showGenerateVersionModal = ref(false);
const isGeneratingVersions = ref(false);
const generationProgress = ref({ current: 0, total: 0, message: "" });
const isLoadingVersions = ref(false);
const isDownloadingAll = ref(false);
const downloadProgress = ref({ current: 0, total: 0 });
const showDownloadFormatModal = ref(false);
const downloadType = ref("all"); // 'all', 'selected', or 'single'
const downloadingVersionId = ref(null);
const showDeleteVersionConfirm = ref(null);
const deleteVersionId = ref(null);
const isDeletingVersions = ref(false);
const deletionProgress = ref({ current: 0, total: 0, message: "" });
const selectedVersions = ref([]); // For multiple version card selections
const selectAll = ref(false); // For select all checkbox
const showPreviewModal = ref(false);
const previewVersionId = ref(null);
const showAnswerKeyModal = ref(false);
const answerKeyVersionId = ref(null);

// File upload
const showUploadModal = ref(false);

// Question selection for bulk operations
const selectedQuestions = ref([]);
const selectAllQuestions = ref(false);
const isDeletingQuestions = ref(false);
const questionDeletionProgress = ref({ current: 0, total: 0, message: "" });

// Image assignment modal state
const showImageAssignmentModal = ref(false);
const pendingQuestions = ref([]);
const extractedImages = ref([]);
const savedAnswerKeyMap = ref({}); // Store parsed answer key for later use

const openQuestionForm = () => {
  editingQuestion.value = null;
  showQuestionForm.value = true;
};

const editQuestion = async (question) => {
  try {
    // Get the correct answer for this question
    const answersResult = await testStore.getCorrectAnswersForTest(testId);
    let correctAnswerChoiceId = null;

    if (answersResult.data) {
      const questionAnswer = answersResult.data.find(
        (answer) => answer.question_id === question.id
      );
      correctAnswerChoiceId = questionAnswer?.answer_choices_id;
    }

    // Check if answer_choices exists, if not, we need to fetch the question with its choices
    let answerChoices = question.answer_choices;

    if (!answerChoices) {
      // Get the full question data with answer choices
      const questionsResult = await testStore.getTestQuestions(testId);
      if (questionsResult.data) {
        const fullQuestion = questionsResult.data.find(
          (q) => q.id === question.id
        );
        answerChoices = fullQuestion?.answer_choices || [];

        // If we fetched the full question, use its text for the question field
        if (fullQuestion) {
          question.question = fullQuestion.text;
        }
      }
    }

    // Transform answer_choices to options format with isCorrect flag and imageUrl
    const options = (answerChoices || []).map((choice) => ({
      id: choice.id,
      text: choice.text,
      isCorrect: choice.id === correctAnswerChoiceId,
      imageUrl: choice.imageUrl || choice.image_url || null, // Preserve existing image URL (try both camelCase and snake_case)
    }));

    // Create the editing question object in the format expected by QuestionForm
    editingQuestion.value = {
      id: question.id,
      question: question.question || question.text, // Use question.question if available, fallback to question.text
      type: question.type || "Multiple Choice",
      part: question.part || "",
      imageUrl: question.imageUrl || question.image_url || null, // Preserve existing question image URL (try both camelCase and snake_case)
      options: options,
    };

    showQuestionForm.value = true;
  } catch (error) {
    console.error("Error preparing question for editing:", error);
    alert("Error loading question data for editing");
  }
};

const closeQuestionForm = () => {
  showQuestionForm.value = false;
  editingQuestion.value = null;
  isSavingQuestion.value = false;
};

const handleQuestionSaved = async (questionData) => {
  isSavingQuestion.value = true;

  try {
    if (editingQuestion.value) {
      // Update existing question (with image URL)
      const result = await testStore.updateQuestion(
        editingQuestion.value.id,
        questionData.question,
        questionData.options.filter((opt) => opt.text.trim()),
        questionData.imageUrl, // Pass question image URL
        testId, // Pass testId for cache invalidation
        questionData.type, // Pass question type
        questionData.part // Pass question part
      );

      if (result.error) {
        alert(`Error updating question: ${result.error}`);
      } else {
        // Find the correct answer and store it
        const correctOption = questionData.options.find((opt) => opt.isCorrect);
        if (correctOption) {
          // Get the updated question's answer choices to find the correct choice ID
          const questionsResult = await testStore.getTestQuestions(testId);
          if (questionsResult.data) {
            const updatedQuestion = questionsResult.data.find(
              (q) => q.id === editingQuestion.value.id
            );
            if (updatedQuestion && updatedQuestion.answer_choices) {
              const correctChoice = updatedQuestion.answer_choices.find(
                (choice) => choice.text.trim() === correctOption.text.trim()
              );
              if (correctChoice) {
                await testStore.storeCorrectAnswer(
                  editingQuestion.value.id,
                  correctChoice.id,
                  testId
                );
              }
            }
          }
        }

        // Reload questions to get fresh data (force refresh to show images)
        await loadQuestions(true);
        closeQuestionForm();
      }
    } else {
      // Add new question (with image URL)
      const result = await testStore.createQuestion(
        testId,
        questionData.question,
        questionData.options.filter((opt) => opt.text.trim()),
        questionData.imageUrl, // Pass question image URL
        questionData.type, // Pass question type
        questionData.part // Pass question part
      );

      if (result.error) {
        alert(`Error creating question: ${result.error}`);
      } else {
        // Find the correct answer and store it
        const correctOption = questionData.options.find((opt) => opt.isCorrect);

        if (correctOption && result.data) {
          // Get the created question's answer choices to find the correct choice ID
          const questionsResult = await testStore.getTestQuestions(testId);

          if (questionsResult.data) {
            const createdQuestion = questionsResult.data.find(
              (q) => q.id === result.data.id
            );

            if (createdQuestion && createdQuestion.answer_choices) {
              const correctChoice = createdQuestion.answer_choices.find(
                (choice) => choice.text.trim() === correctOption.text.trim()
              );

              if (correctChoice) {
                await testStore.storeCorrectAnswer(
                  result.data.id,
                  correctChoice.id,
                  testId
                );
              }
            }
          }
        }

        // Reload questions to get fresh data (force refresh to show images)
        await loadQuestions(true);
        closeQuestionForm();
      }
    }
  } catch (error) {
    alert("An unexpected error occurred. Please try again.");
    console.error("Question save error:", error);
  } finally {
    isSavingQuestion.value = false;
  }
};

const handleQuestionDeleted = async (questionId) => {
  try {
    const result = await testStore.deleteQuestion(questionId, testId);

    if (result.error) {
      alert(`Error deleting question: ${result.error}`);
    } else {
      questions.value = questions.value.filter((q) => q.id !== questionId);
      // Remove from selection if it was selected
      selectedQuestions.value = selectedQuestions.value.filter(
        (q) => q.id !== questionId
      );
    }
  } catch (error) {
    alert("An unexpected error occurred while deleting the question.");
    console.error("Delete question error:", error);
  }
};

// Question selection handlers
const toggleQuestionSelection = (question) => {
  const index = selectedQuestions.value.findIndex((q) => q.id === question.id);
  if (index > -1) {
    selectedQuestions.value.splice(index, 1);
  } else {
    selectedQuestions.value.push(question);
  }
  // Update select all checkbox state
  selectAllQuestions.value =
    selectedQuestions.value.length === questions.value.length;
};

const toggleSelectAllQuestions = () => {
  if (selectAllQuestions.value) {
    selectedQuestions.value = [...questions.value];
  } else {
    selectedQuestions.value = [];
  }
};

const deleteSelectedQuestions = async () => {
  if (selectedQuestions.value.length === 0) {
    return;
  }

  const questionCount = selectedQuestions.value.length;
  const questionText = questionCount === 1 ? "question" : "questions";

  if (
    !confirm(
      `Are you sure you want to delete ${questionCount} ${questionText}? This action cannot be undone.`
    )
  ) {
    return;
  }

  isDeletingQuestions.value = true;
  questionDeletionProgress.value = {
    current: 0,
    total: questionCount,
    message: "Preparing to delete questions...",
  };

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < selectedQuestions.value.length; i++) {
    const question = selectedQuestions.value[i];

    // Update progress
    questionDeletionProgress.value.current = i + 1;
    questionDeletionProgress.value.message = `Deleting question ${
      i + 1
    } of ${questionCount}...`;

    try {
      const result = await testStore.deleteQuestion(question.id, testId);

      if (result.error) {
        console.error(
          `Failed to delete question ${question.id}:`,
          result.error
        );
        failCount++;
      } else {
        successCount++;
      }
    } catch (error) {
      console.error(`Error deleting question ${question.id}:`, error);
      failCount++;
    }
  }

  // Finalize
  questionDeletionProgress.value.message = "Refreshing question list...";

  // Clear selection
  selectedQuestions.value = [];
  selectAllQuestions.value = false;

  // Reload questions
  await loadQuestions(true);

  // Show result
  if (failCount === 0) {
    alert(`Successfully deleted ${successCount} ${questionText}!`);
  } else {
    alert(
      `Deleted ${successCount} ${questionText}. Failed to delete ${failCount} ${questionText}.`
    );
  }

  isDeletingQuestions.value = false;
  questionDeletionProgress.value = { current: 0, total: 0, message: "" };
};

const loadTest = async () => {
  try {
    const result = await testStore.getTest(testId);

    if (result.error) {
      errorMessage.value = result.error;
      return false;
    }

    // Transform test data for UI
    test.value = {
      ...result.data,
      subject: result.data.description?.split(" - ")[0] || "General",
      description: result.data.description?.includes(" - ")
        ? result.data.description.split(" - ").slice(1).join(" - ")
        : result.data.description || "",
    };

    return true;
  } catch (error) {
    errorMessage.value = "Failed to load test information";
    return false;
  }
};

const loadQuestions = async (forceRefresh = false) => {
  try {
    const result = await testStore.getTestQuestions(testId, forceRefresh);

    if (result.error) {
      errorMessage.value = result.error;
      return;
    }

    // Get correct answers for all questions in this test
    const answersResult = await testStore.getCorrectAnswersForTest(testId);
    const correctAnswers = answersResult.data || [];

    // Create a map of question_id to correct answer_choices_id
    const correctAnswerMap = {};
    correctAnswers.forEach((answer) => {
      correctAnswerMap[answer.question_id] = answer.answer_choices_id;
    });

    // Transform questions data for UI with correct answer flags
    questions.value = result.data.map((question) => {
      const qType = question.type || 'Multiple Choice';
      const qPart = question.part || '';
      return {
        id: question.id,
        question: question.text,
        type: qType,
        part: qPart,
        imageUrl: question.image_url || null, // Include question image
        options: question.answer_choices.map((choice) => ({
          id: choice.id,
          text: choice.text,
          imageUrl: choice.image_url || null, // Include choice image
          isCorrect: correctAnswerMap[question.id] === choice.id,
        })),
      };
    });

    // Populate availableTypes for the Generate Versions modal
    const typesSet = new Set();
    result.data.forEach((q) => {
      if (q.type) typesSet.add(q.type);
    });
    availableTypes.value = Array.from(typesSet);
  } catch (error) {
    errorMessage.value = "Failed to load questions";
    console.error("Load questions error:", error);
  }
};

const goBackToDashboard = () => {
  router.push({ name: "dashboard" });
};


const openUploadModal = () => {
  showUploadModal.value = true;
};

const closeUploadModal = () => {
  showUploadModal.value = false;
};

// Handle upload complete (no images)
const handleUploadComplete = async (data) => {
  await loadQuestions(true);
};

// Handle images extracted (show image assignment modal)
const handleImagesExtracted = (data) => {
  pendingQuestions.value = data.questions;
  extractedImages.value = data.images;
  savedAnswerKeyMap.value = data.answerKeyMap;
  showImageAssignmentModal.value = true;
};

// Handle image assignment save complete
const handleImageAssignmentComplete = async (data) => {
  await loadQuestions(true);
};

const closeImageAssignmentModal = () => {
  showImageAssignmentModal.value = false;
  pendingQuestions.value = [];
  extractedImages.value = [];
  savedAnswerKeyMap.value = {};
};

const loadVersions = async (forceRefresh = false) => {
  try {
    isLoadingVersions.value = true;

    // Use cached version from testStore
    const result = await testStore.getTestVersions(testId, forceRefresh);

    if (result.error) {
      console.error("Error loading versions:", result.error);
      return;
    }

    // Format versions for UI
    versions.value = result.data.map((v) => ({
      id: v.id,
      name: `Version ${v.version_number}`,
      createdAt: v.created_at,
      questionCount: v.question_count,
    }));
  } catch (error) {
    console.error("Load versions error:", error);
  } finally {
    isLoadingVersions.value = false;
  }
};

const openGenerateVersionModal = () => {
  showGenerateVersionModal.value = true;
};

const closeGenerateVersionModal = () => {
  showGenerateVersionModal.value = false;
};

const handleGenerateVersions = async ({ versionCount, questionsPerVersion }) => {
  isGeneratingVersions.value = true;
  generationProgress.value = {
    current: 0,
    total: versionCount,
    message: "Initializing version generation...",
  };

  try {
    // Simulate progress updates (since generation happens on backend)
    const progressInterval = setInterval(() => {
      if (generationProgress.value.current < versionCount) {
        generationProgress.value.current++;
        generationProgress.value.message = `Generating version ${generationProgress.value.current} of ${versionCount}...`;
      }
    }, 800); // Update progress every 800ms

    // Use testStore to generate versions
    const result = await testStore.generateVersions(
      testId,
      versionCount,
      questionsPerVersion
    );

    clearInterval(progressInterval);

    if (result.error) {
      alert(`Failed to generate versions: ${result.error}`);
      return;
    }

    // Complete progress
    generationProgress.value.current = versionCount;
    generationProgress.value.message = "Finalizing...";

    closeGenerateVersionModal();

    // Switch to versions tab and reload
    activeTab.value = "versions";
    await loadVersions();

    // result.data is the array directly, not nested
    const count = result.data?.length || versionCount;
    alert(
      `Successfully generated ${count} randomized version(s) using Fisher-Yates algorithm!`
    );
  } catch (error) {
    console.error("Generate versions error:", error);
    alert(`An error occurred: ${error.message}`);
  } finally {
    isGeneratingVersions.value = false;
    generationProgress.value = { current: 0, total: 0, message: "" };
  }
};

// Helper function to generate Word document for a version
const generateVersionWord = async (versionData) => {
  const headerParagraphs = [];

  // Add version number at the top right
  headerParagraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `version_${String(versionData.version_number).padStart(
            3,
            "0"
          )}`,
          size: 20,
        }),
      ],
      alignment: AlignmentType.RIGHT,
      spacing: { after: 100 },
    })
  );

  // Add logo if it exists (centered, full size)
  if (versionData.header_logo_url) {
    try {
      const imageBuffer = await loadImageAsBuffer(versionData.header_logo_url);
      if (imageBuffer) {
        // Get image dimensions to maintain aspect ratio
        const image = new Image();
        image.src = versionData.header_logo_url;
        await new Promise((resolve) => {
          image.onload = resolve;
        });

        const maxWidth = 600; // Maximum width in pixels for Word
        const aspectRatio = image.width / image.height;
        const finalWidth = Math.min(image.width, maxWidth);
        const finalHeight = finalWidth / aspectRatio;

        headerParagraphs.push(
          new Paragraph({
            children: [
              new ImageRun({
                data: imageBuffer,
                transformation: {
                  width: finalWidth,
                  height: finalHeight,
                },
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          })
        );
      }
    } catch (error) {
      console.error("Failed to load logo for Word document:", error);
    }
  }

  // Test Title (centered)
  headerParagraphs.push(
    new Paragraph({
      text: versionData.test_title,
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    })
  );

  // Add description if it exists (centered)
  if (versionData.test_description && versionData.test_description.trim()) {
    headerParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: versionData.test_description,
            size: 22,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    );
  }

  // Add name and date row
  headerParagraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "Name: _____________________",
          size: 22,
        }),
        new TextRun({
          text: "\t\t\t\t\t\t\t\tDate: _____________________",
          size: 22,
        }),
      ],
      spacing: { after: 100 },
    })
  );

  // Add section and score row
  headerParagraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "Section: _____________________",
          size: 22,
        }),
        new TextRun({
          text: "\t\t\t\t\t\t\tScore: _____________________",
          size: 22,
        }),
      ],
      spacing: { after: 400 },
    })
  );

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          ...headerParagraphs,

          // Questions
          ...versionData.questions.flatMap((q, qIndex) => {
            const questionParagraphs = [
              // Question text
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${q.question_number}. `,
                    bold: true,
                    size: 22,
                  }),
                  new TextRun({
                    text: q.question_text,
                    size: 22,
                  }),
                ],
                spacing: { before: 200, after: 100 },
              }),
            ];

            // Answer choices (5 spaces before letter)
            const choiceParagraphs = q.answer_choices.map(
              (choice, choiceIndex) => {
                const letter = String.fromCharCode(65 + choiceIndex);
                return new Paragraph({
                  children: [
                    new TextRun({
                      text: `     ${letter}. ${choice.text}`,
                      size: 20,
                    }),
                  ],
                  spacing: { after: 80 },
                });
              }
            );

            return [...questionParagraphs, ...choiceParagraphs];
          }),
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
};

// Helper function to generate PDF for a version
const generateVersionPDF = async (versionData) => {
  // Create PDF
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "letter", // 8.5" x 11"
  });

  // Page settings
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  // Helper function to add new page if needed
  const checkPageBreak = (neededSpace) => {
    if (yPosition + neededSpace > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Helper function to wrap text
  const wrapText = (text, maxWidth) => {
    return doc.splitTextToSize(text, maxWidth);
  };

  // Add version number at the top right
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const versionText = `Version_${String(versionData.version_number).padStart(
    3,
    "0"
  )}`;
  doc.text(versionText, pageWidth - margin, yPosition, { align: "right" });
  yPosition += 8;

  // Add logo if it exists (centered, full width)
  if (versionData.header_logo_url) {
    try {
      const logoBase64 = await loadImageAsBase64(versionData.header_logo_url);

      // Get image dimensions to maintain aspect ratio
      const image = new Image();
      image.src = versionData.header_logo_url;
      await new Promise((resolve) => {
        image.onload = resolve;
      });

      const aspectRatio = image.width / image.height;
      const maxLogoWidth = contentWidth; // Use full content width
      const logoWidth = maxLogoWidth;
      const logoHeight = logoWidth / aspectRatio;
      const logoX = margin; // Start at left margin

      doc.addImage(logoBase64, "PNG", logoX, yPosition, logoWidth, logoHeight);
      yPosition += logoHeight + 5; // Add space after logo
    } catch (error) {
      console.error("Failed to load logo for PDF:", error);
    }
  }

  // Header - Test Title (centered)
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(versionData.test_title, pageWidth / 2, yPosition, {
    align: "center",
  });
  yPosition += 10;

  // Description (centered, if exists)
  if (versionData.test_description && versionData.test_description.trim()) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const descLines = wrapText(versionData.test_description, contentWidth - 20);
    descLines.forEach((line) => {
      checkPageBreak(6);
      doc.text(line, pageWidth / 2, yPosition, { align: "center" });
      yPosition += 6;
    });
    yPosition += 4;
  }

  // Name and Date row
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Name: _____________________", margin, yPosition);
  doc.text("Date: _____________________", pageWidth - margin, yPosition, {
    align: "right",
  });
  yPosition += 6;

  // Section and Score row
  doc.text("Section: _____________________", margin, yPosition);
  doc.text("Score: _____________________", pageWidth - margin, yPosition, {
    align: "right",
  });
  yPosition += 4;

  // Horizontal line
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Reset text color
  doc.setTextColor(0, 0, 0);

  // Questions
  versionData.questions.forEach((q, qIndex) => {
    // Check if we need a new page for the question
    checkPageBreak(25); // Minimum space for question start

    // Question number and text
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");

    const questionPrefix = `${q.question_number}. `;
    const prefixWidth = doc.getTextWidth(questionPrefix);
    const questionLines = wrapText(q.question_text, contentWidth);

    // First line with number
    doc.text(questionPrefix, margin, yPosition);
    doc.setFont("helvetica", "normal");
    doc.text(questionLines[0], margin + prefixWidth, yPosition);
    yPosition += 6;

    // Remaining lines
    for (let i = 1; i < questionLines.length; i++) {
      checkPageBreak(6);
      doc.text(questionLines[i], margin + prefixWidth, yPosition);
      yPosition += 6;
    }

    yPosition += 2; // Small space before answer choices

    // Answer choices (with 5 white spaces to the left)
    q.answer_choices.forEach((choice, choiceIndex) => {
      checkPageBreak(6);

      const letter = String.fromCharCode(65 + choiceIndex); // A, B, C, D...
      const choiceText = `     ${letter}. ${choice.text}`;
      const choiceLines = wrapText(choiceText, contentWidth);

      // Render all lines of the choice
      doc.setFontSize(10);
      choiceLines.forEach((line, lineIndex) => {
        if (lineIndex > 0) checkPageBreak(5);
        doc.text(line, margin, yPosition);
        yPosition += 5;
      });
    });

    yPosition += 8; // Space between questions

    // Add extra space after every 5 questions for readability
    if ((qIndex + 1) % 5 === 0 && qIndex !== versionData.questions.length - 1) {
      yPosition += 5;
    }
  });

  // Footer on all pages
  const totalPages = doc.internal.pages.length - 1; // -1 because first element is null
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, {
      align: "center",
    });
  }

  return doc;
};

// Version card selection (multi-select)
const toggleVersionSelection = (version) => {
  const index = selectedVersions.value.findIndex((v) => v.id === version.id);

  if (index > -1) {
    // Already selected, remove it
    selectedVersions.value.splice(index, 1);
  } else {
    // Not selected, add it
    selectedVersions.value.push(version);
  }

  // Update select all checkbox state
  updateSelectAllState();
};

// Check if a version is selected
const isVersionSelected = (versionId) => {
  return selectedVersions.value.some((v) => v.id === versionId);
};

// Toggle select all versions
const toggleSelectAll = () => {
  if (selectAll.value) {
    // Select all versions
    selectedVersions.value = [...versions.value];
  } else {
    // Deselect all
    selectedVersions.value = [];
  }
};

// Watch for changes in selectedVersions to update selectAll checkbox
const updateSelectAllState = () => {
  if (versions.value.length === 0) {
    selectAll.value = false;
  } else {
    selectAll.value = selectedVersions.value.length === versions.value.length;
  }
};

// Preview version
const openPreview = (version) => {
  previewVersionId.value = version.id;
  showPreviewModal.value = true;
};

const closePreview = () => {
  showPreviewModal.value = false;
  previewVersionId.value = null;
};

// Answer key functions
const openAnswerKey = (version) => {
  answerKeyVersionId.value = version.id;
  showAnswerKeyModal.value = true;
};

const closeAnswerKey = () => {
  showAnswerKeyModal.value = false;
  answerKeyVersionId.value = null;
};

// Open format selection modal
const openDownloadFormatModal = (type, versionId = null) => {
  downloadType.value = type;
  downloadingVersionId.value = versionId;
  showDownloadFormatModal.value = true;
};

const closeDownloadFormatModal = () => {
  showDownloadFormatModal.value = false;
  downloadType.value = "all";
  downloadingVersionId.value = null;
};

const handleDownloadConfirm = async (format) => {
  if (downloadType.value === "all") {
    await downloadAllVersions(format);
  } else if (downloadType.value === "selected") {
    await downloadSelectedVersionsZip(format);
  } else if (downloadType.value === "single" && downloadingVersionId.value) {
    await downloadVersion(downloadingVersionId.value, format);
  }
  closeDownloadFormatModal();
};

const downloadVersion = async (versionId, format = "pdf") => {
  try {
    // Get version data from cache
    const result = await testStore.getVersion(versionId);

    if (result.error) {
      alert(`Failed to download version: ${result.error}`);
      return;
    }

    const versionData = result.data;
    const baseFilename = `${versionData.test_title.replace(
      /[^a-z0-9]/gi,
      "_"
    )}_Version_${versionData.version_number}`;

    if (format === "pdf") {
      const doc = await generateVersionPDF(versionData);
      doc.save(`${baseFilename}.pdf`);
    } else if (format === "docx") {
      const blob = await generateVersionWord(versionData);
      const downloadLink = document.createElement("a");
      downloadLink.href = URL.createObjectURL(blob);
      downloadLink.download = `${baseFilename}.docx`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(downloadLink.href);
    }
  } catch (error) {
    console.error("Download error:", error);
    alert(`An error occurred during download: ${error.message}`);
  }
};

const downloadAllVersions = async (format = "pdf") => {
  if (versions.value.length === 0) {
    alert("No versions available to download.");
    return;
  }

  const formatName = format === "pdf" ? "PDF" : "Word";
  if (
    !confirm(
      `This will download all ${versions.value.length} versions as ${formatName} files in a ZIP. Continue?`
    )
  ) {
    return;
  }

  isDownloadingAll.value = true;
  downloadProgress.value = { current: 0, total: versions.value.length };

  try {
    const zip = new JSZip();
    const testTitle = test.value?.title || "Test";
    const folderName = testTitle.replace(/[^a-z0-9]/gi, "_");
    const fileExtension = format === "pdf" ? "pdf" : "docx";

    // Fetch and generate files for all versions
    for (let i = 0; i < versions.value.length; i++) {
      const version = versions.value[i];
      downloadProgress.value.current = i + 1;

      try {
        // Get version data from cache
        const result = await testStore.getVersion(version.id);

        if (result.error) {
          console.error(
            `Failed to fetch version ${version.version_number}:`,
            result.error
          );
          continue; // Skip this version and continue with others
        }

        const versionData = result.data;
        let fileBlob;

        // Generate file based on format
        if (format === "pdf") {
          const doc = await generateVersionPDF(versionData);
          fileBlob = doc.output("blob");
        } else if (format === "docx") {
          fileBlob = await generateVersionWord(versionData);
        }

        // Add to ZIP with descriptive filename
        const filename = `Version_${versionData.version_number
          .toString()
          .padStart(3, "0")}.${fileExtension}`;
        zip.file(filename, fileBlob);
      } catch (error) {
        console.error(
          `Error generating ${formatName} for version ${version.version_number}:`,
          error
        );
        // Continue with other versions even if one fails
      }
    }

    // Generate ZIP file
    const zipBlob = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

    // Download ZIP file
    const downloadLink = document.createElement("a");
    downloadLink.href = URL.createObjectURL(zipBlob);
    downloadLink.download = `${folderName}_All_Versions_${
      new Date().toISOString().split("T")[0]
    }.zip`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(downloadLink.href);

    alert(
      `Successfully downloaded ${downloadProgress.value.current} versions!`
    );
  } catch (error) {
    console.error("Download all error:", error);
    alert(`An error occurred while creating ZIP file: ${error.message}`);
  } finally {
    isDownloadingAll.value = false;
    downloadProgress.value = { current: 0, total: 0 };
  }
};

const confirmDeleteVersion = (versionId) => {
  deleteVersionId.value = versionId;
  showDeleteVersionConfirm.value = true;
};

const cancelDeleteVersion = () => {
  showDeleteVersionConfirm.value = false;
  deleteVersionId.value = null;
};

const handleDeleteVersionConfirm = async (versionId) => {
  try {
    // Use testStore to delete version
    const result = await testStore.deleteVersion(versionId, testId);

    if (result.error) {
      alert(`Failed to delete version: ${result.error}`);
      cancelDeleteVersion();
      return;
    }

    // Remove from selected versions if it's in there
    selectedVersions.value = selectedVersions.value.filter(
      (v) => v.id !== versionId
    );

    // Reload versions (force refresh to get updated list)
    await loadVersions(true);
    cancelDeleteVersion();
    alert("Version deleted successfully");
  } catch (error) {
    console.error("Delete error:", error);
    alert(`An error occurred: ${error.message}`);
    cancelDeleteVersion();
  }
};

// Download all selected versions
const downloadSelectedVersions = async () => {
  if (selectedVersions.value.length === 0) {
    return;
  }

  // For single version, just download it directly
  if (selectedVersions.value.length === 1) {
    openDownloadFormatModal("single", selectedVersions.value[0].id);
    return;
  }

  // For multiple versions, create a ZIP
  if (
    !confirm(
      `This will download ${selectedVersions.value.length} versions as a ZIP file. Continue?`
    )
  ) {
    return;
  }

  // Open format modal for selected versions
  downloadType.value = "selected";
  showDownloadFormatModal.value = true;
};

// Confirm and execute the selected versions download
const downloadSelectedVersionsZip = async (format = "pdf") => {
  if (selectedVersions.value.length === 0) {
    return;
  }

  isDownloadingAll.value = true;
  downloadProgress.value = { current: 0, total: selectedVersions.value.length };

  try {
    const zip = new JSZip();
    const testTitle = test.value?.title || "Test";
    const folderName = testTitle.replace(/[^a-z0-9]/gi, "_");
    const fileExtension = format === "pdf" ? "pdf" : "docx";

    // Fetch and generate files for selected versions
    for (let i = 0; i < selectedVersions.value.length; i++) {
      const version = selectedVersions.value[i];
      downloadProgress.value.current = i + 1;

      try {
        // Get version data from cache
        const result = await testStore.getVersion(version.id);

        if (result.error) {
          console.error(
            `Failed to fetch version ${version.versionNumber}:`,
            result.error
          );
          continue;
        }

        const versionData = result.data;
        let fileBlob;

        // Generate file based on format
        if (format === "pdf") {
          const doc = await generateVersionPDF(versionData);
          fileBlob = doc.output("blob");
        } else if (format === "docx") {
          fileBlob = await generateVersionWord(versionData);
        }

        // Add to ZIP with descriptive filename
        const filename = `Version_${versionData.version_number
          .toString()
          .padStart(3, "0")}.${fileExtension}`;
        zip.file(filename, fileBlob);
      } catch (error) {
        console.error(
          `Error generating file for version ${version.versionNumber}:`,
          error
        );
      }
    }

    // Generate ZIP file
    const zipBlob = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

    // Download ZIP file
    const downloadLink = document.createElement("a");
    downloadLink.href = URL.createObjectURL(zipBlob);
    downloadLink.download = `${folderName}_Selected_${
      selectedVersions.value.length
    }_Versions_${new Date().toISOString().split("T")[0]}.zip`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(downloadLink.href);

    alert(
      `Successfully downloaded ${downloadProgress.value.current} versions!`
    );
  } catch (error) {
    console.error("Download error:", error);
    alert(`An error occurred while creating ZIP file: ${error.message}`);
  } finally {
    isDownloadingAll.value = false;
    downloadProgress.value = { current: 0, total: 0 };
  }
};

// Delete all selected versions
const deleteSelectedVersions = async () => {
  if (selectedVersions.value.length === 0) {
    return;
  }

  const versionCount = selectedVersions.value.length;
  const versionText = versionCount === 1 ? "version" : "versions";

  if (
    !confirm(
      `Are you sure you want to delete ${versionCount} ${versionText}? This action cannot be undone.`
    )
  ) {
    return;
  }

  isDeletingVersions.value = true;
  deletionProgress.value = {
    current: 0,
    total: versionCount,
    message: "Preparing to delete versions...",
  };

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < selectedVersions.value.length; i++) {
    const version = selectedVersions.value[i];

    // Update progress
    deletionProgress.value.current = i + 1;
    deletionProgress.value.message = `Deleting version ${
      version.version_number
    } (${i + 1} of ${versionCount})...`;

    try {
      const result = await testStore.deleteVersion(version.id, testId);

      if (result.error) {
        console.error(
          `Failed to delete version ${version.version_number}:`,
          result.error
        );
        failCount++;
      } else {
        successCount++;
      }
    } catch (error) {
      console.error(`Error deleting version ${version.version_number}:`, error);
      failCount++;
    }
  }

  // Finalize
  deletionProgress.value.message = "Refreshing version list...";

  // Clear selection
  selectedVersions.value = [];
  selectAll.value = false;

  // Reload versions
  await loadVersions(true);

  // Show result
  if (failCount === 0) {
    alert(`Successfully deleted ${successCount} ${versionText}!`);
  } else {
    alert(
      `Deleted ${successCount} ${versionText}. Failed to delete ${failCount} ${versionText}.`
    );
  }

  isDeletingVersions.value = false;
  deletionProgress.value = { current: 0, total: 0, message: "" };
};

onMounted(async () => {
  errorMessage.value = "";

  // Check if we have valid cached data for test, questions, and answers
  const hasValidTestCache =
    testStore.$state.singleTestCache?.[testId] &&
    Date.now() - testStore.$state.singleTestCache[testId].timestamp <
      5 * 60 * 1000;
  const hasValidQuestionsCache =
    testStore.$state.questionsCache?.[testId] &&
    Date.now() - testStore.$state.questionsCache[testId].timestamp <
      5 * 60 * 1000;
  const hasValidAnswersCache =
    testStore.$state.answersCache?.[testId] &&
    Date.now() - testStore.$state.answersCache[testId].timestamp <
      5 * 60 * 1000;

  // Only show loading if we don't have cached data
  if (!hasValidTestCache || !hasValidQuestionsCache || !hasValidAnswersCache) {
    isLoading.value = true;
  }

  // Load test and questions (will use cache if available)
  const testLoaded = await loadTest();
  if (testLoaded) {
    await loadQuestions();
    // Also load versions
    await loadVersions();
  }

  isLoading.value = false;
});
</script>

<template>
  <AppLayout>
    <div class="min-h-screen bg-gray-200 dark:bg-gray-800">
      <!-- Header -->
      <div class="bg-white dark:bg-gray-800 shadow">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="py-6">
            <div
              class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
              <div class="flex items-center">
                <button
                  @click="goBackToDashboard"
                  class="mr-4 text-gray-600 dark:text-gray-300 hover:text-gray-900"
                >
                  <svg
                    class="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <div>
                  <h1 class="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">
                    {{ test.title }}
                  </h1>
                </div>
              </div>
              <div class="flex items-center gap-2 sm:gap-3 flex-wrap">
                <button
                  v-if="activeTab === 'questions'"
                  @click="openUploadModal"
                  class="bg-green-600 text-white shadow hover:bg-green-700 px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center"
                  title="Upload Document"
                >
                  <svg
                    class="w-5 h-5 sm:mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <span class="text-xs sm:text-sm md:text-sm lg:text-sm"
                    >Upload Document</span
                  >
                </button>
                <button
                  v-if="activeTab === 'questions'"
                  @click="openQuestionForm"
                  class="bg-blue-600 text-white shadow hover:bg-blue-700 px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center"
                  title="Add Question"
                >
                  <svg
                    class="w-5 h-5 sm:mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  <span class="text-xs sm:text-sm md:text-sm lg:text-sm"
                    >Add Question</span
                  >
                </button>
                <div
                  v-if="activeTab === 'versions'"
                  class="flex gap-2 flex-wrap"
                >
                  <button
                    @click="openDownloadFormatModal('all')"
                    :disabled="versions.length === 0 || isDownloadingAll"
                    class="bg-blue-600 text-white shadow hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center"
                    title="Download All Versions"
                  >
                    <svg
                      v-if="isDownloadingAll"
                      class="animate-spin h-4 w-4 sm:mr-2 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        class="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        stroke-width="4"
                      ></circle>
                      <path
                        class="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <svg
                      v-else
                      class="w-5 h-5 sm:mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    <span class="text-xs sm:text-sm md:text-sm lg:text-sm">{{
                      isDownloadingAll
                        ? `Downloading ${downloadProgress.current}/${downloadProgress.total}...`
                        : "Download All"
                    }}</span>
                    <span class="text-xs sm:text-sm md:text-sm lg:text-sm">{{
                      isDownloadingAll
                        ? `${downloadProgress.current}/${downloadProgress.total}`
                        : ""
                    }}</span>
                  </button>
                  <button
                    @click="openGenerateVersionModal"
                    :disabled="questions.length === 0"
                    class="bg-gray-800 dark:bg-gray-900 text-white shadow hover:bg-gray-500 disabled:bg-gray-400 disabled:cursor-not-allowed px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center"
                    title="Generate Versions"
                  >
                    <svg
                      class="w-5 h-5 sm:mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    <span class="text-xs sm:text-sm md:text-sm lg:text-sm"
                      >Generate Versions</span
                    >
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Tabs -->
          <div class="border-t border-gray-200">
            <nav class="-mb-px flex space-x-4 sm:space-x-8">
              <button
                @click="activeTab = 'questions'"
                :class="[
                  activeTab === 'questions'
                    ? 'border-blue-500 text-blue-700'
                    : 'border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 hover:border-gray-300',
                  'whitespace-nowrap py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors duration-200 flex items-center',
                ]"
              >
                <svg
                  class="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span class="text-xs sm:text-sm md:text-sm lg:text-sm"
                  >Questions({{ questions.length }})</span
                >
              </button>
              <button
                @click="activeTab = 'versions'"
                :class="[
                  activeTab === 'versions'
                    ? 'border-blue-500 text-blue-700'
                    : 'border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 hover:border-gray-300',
                  'whitespace-nowrap py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors duration-200 flex items-center',
                ]"
              >
                <svg
                  class="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span class="text-xs sm:text-sm md:text-sm lg:text-sm"
                  >Randomized Versions ({{ versions.length }})</span
                >
              </button>
            </nav>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Error Message -->
        <div
          v-if="errorMessage"
          class="bg-red-50 border border-red-200 rounded-lg p-6 mb-8"
        >
          <div class="flex">
            <div class="shrink-0">
              <svg
                class="h-5 w-5 text-red-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm text-red-800">{{ errorMessage }}</p>
              <button
                @click="goBackToDashboard"
                class="mt-2 text-sm text-red-600 hover:text-red-500 underline"
              >
                Go back to dashboard
              </button>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="flex items-center justify-center py-12">
          <div class="flex items-center space-x-2">
            <svg
              class="animate-spin h-5 w-5 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span class="text-gray-600 dark:text-gray-300">Loading test and questions...</span>
          </div>
        </div>

        <div v-if="!isLoading && !errorMessage">
          <!-- Questions Tab Content -->
          <div v-if="activeTab === 'questions'">
            <!-- Test Info Card -->
            <div class="bg-white dark:bg-gray-900 shadow rounded-lg p-6 mb-8">
              <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Test Information
              </h3>
              <p class="text-gray-600 dark:text-gray-300 mb-4">{{ test.description }}</p>
              <div class="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-300">
                <span class="flex items-center">
                  <svg
                    class="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {{ questions.length }} questions
                </span>
              </div>
            </div>

            <!-- Questions List -->
            <!-- Select All and Bulk Actions -->
            <div
              v-if="questions.length > 0"
              class="mb-4 bg-white dark:bg-gray-900 p-4 rounded-lg shadow"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <input
                    id="select-all-questions"
                    v-model="selectAllQuestions"
                    @change="toggleSelectAllQuestions"
                    type="checkbox"
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                  />
                  <label
                    for="select-all-questions"
                    class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-100 cursor-pointer select-none"
                  >
                    Select All ({{ questions.length }} question{{
                      questions.length !== 1 ? "s" : ""
                    }})
                  </label>
                </div>

                <button
                  v-if="selectedQuestions.length > 0"
                  @click="deleteSelectedQuestions"
                  class="bg-gray-100 dark:bg-gray-800 text-red-500 shadow hover:bg-gray-500 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center"
                >
                  <svg
                    class="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Delete {{ selectedQuestions.length }} question{{
                    selectedQuestions.length > 1 ? "s" : ""
                  }}
                </button>
              </div>

              <div
                v-if="selectedQuestions.length > 0"
                class="mt-2 text-xs text-gray-500 dark:text-gray-300"
              >
                {{ selectedQuestions.length }} of
                {{ questions.length }} question{{
                  selectedQuestions.length !== 1 ? "s" : ""
                }}
                selected
              </div>
            </div>

            <QuestionList
              :questions="questions"
              :selected-questions="selectedQuestions"
              :part-descriptions="test.part_descriptions || []"
              @edit-question="editQuestion"
              @delete-question="handleQuestionDeleted"
              @toggle-selection="toggleQuestionSelection"
            />
          </div>

          <!-- Versions Tab Content -->
          <div v-if="activeTab === 'versions'">
            <!-- Empty State -->
            <div v-if="versions.length === 0" class="text-center py-12">
              <svg
                class="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                No versions generated
              </h3>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-300">
                Generate randomized versions of your test using the Fisher-Yates
                algorithm.
              </p>
              <div class="mt-6">
                <button
                  v-if="questions.length > 0"
                  @click="openGenerateVersionModal"
                  class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-700"
                >
                  <svg
                    class="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Generate Your First Version
                </button>
                <p v-else class="text-sm text-gray-500 mt-4">
                  Add questions to your test first before generating versions.
                </p>
              </div>
            </div>

            <!-- Versions List -->
            <div v-else>
              <!-- Select All Checkbox - Only show when at least one version is selected -->
              <div
                v-if="selectedVersions.length > 0"
                class="mb-4 flex items-center"
              >
                <input
                  id="select-all-versions"
                  v-model="selectAll"
                  @change="toggleSelectAll"
                  type="checkbox"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                />
                <label
                  for="select-all-versions"
                  class="ml-2 text-sm font-medium text-gray-700 cursor-pointer select-none"
                >
                  Select All ({{ versions.length }} version{{
                    versions.length !== 1 ? "s" : ""
                  }})
                </label>
              </div>

              <!-- Version Cards Grid -->
              <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div
                  v-for="version in versions"
                  :key="version.id"
                  @click="toggleVersionSelection(version)"
                  class="bg-white dark:bg-gray-900 overflow-hidden shadow rounded-lg transition-all duration-200 cursor-pointer"
                  :class="[
                    isVersionSelected(version.id)
                      ? 'ring-3 ring-blue-500 shadow-xl scale-[1.02]'
                      : 'hover:shadow-lg',
                  ]"
                >
                  <div class="p-6 flex justify-between">
                    <!-- Left side: Version info -->
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">
                          {{ version.name }}
                        </h3>
                        <span
                          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900 text-blue-800 dark:text-blue-100"
                        >
                          Randomized
                        </span>
                      </div>
                      <div class="space-y-2 text-sm text-gray-500 dark:text-gray-100">
                        <div class="flex items-center">
                          <svg
                            class="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          {{ version.questionCount }} questions
                        </div>
                        <div class="flex items-center">
                          <svg
                            class="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          {{ new Date(version.createdAt).toLocaleDateString() }}
                        </div>
                      </div>
                    </div>

                    <!-- Right side: Action buttons (vertically aligned) -->
                    <div
                      v-if="selectedVersions.length === 0"
                      class="flex flex-col space-y-2 ml-4"
                    >
                      <button
                        @click.stop="openAnswerKey(version)"
                        class="p-2 bg-gray-100 dark:bg-gray-800 text-green-600 shadow hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors duration-200"
                        title="Answer Key"
                      >
                        <svg
                          class="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                          />
                        </svg>
                      </button>
                      <button
                        @click.stop="openPreview(version)"
                        class="p-2 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 shadow hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors duration-200"
                        title="Preview version"
                      >
                        <svg
                          class="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </button>
                      <button
                        @click.stop="
                          openDownloadFormatModal('single', version.id)
                        "
                        class="p-2 bg-gray-100 dark:bg-gray-800 text-blue-600 shadow hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors duration-200"
                        title="Download version"
                      >
                        <svg
                          class="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                          />
                        </svg>
                      </button>
                      <button
                        @click.stop="confirmDeleteVersion(version.id)"
                        class="p-2 bg-gray-100 dark:bg-gray-800 text-red-600 shadow hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors duration-200"
                        title="Delete version"
                      >
                        <svg
                          class="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>

                    <!-- Show "Selected" badge when THIS card is selected -->
                    <div
                      v-else-if="isVersionSelected(version.id)"
                      class="flex items-center ml-4"
                    >
                      <div
                        class="flex items-center text-blue-600 font-medium text-sm"
                      >
                        <svg
                          class="w-5 h-5 mr-2"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clip-rule="evenodd"
                          />
                        </svg>
                        Selected
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Floating Action Buttons (shown when versions are selected) -->
          <div
            v-if="selectedVersions.length > 0"
            class="fixed bottom-8 right-8 flex flex-col space-y-3 z-40 animate-fade-in"
          >
            <!-- Download Button (for all selected) -->
            <button
              @click.stop="downloadSelectedVersions"
              class="group flex items-center bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 transform hover:scale-105"
            >
              <svg
                class="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Download {{ selectedVersions.length }} version{{
                selectedVersions.length > 1 ? "s" : ""
              }}
            </button>

            <!-- Delete Button (for all selected) -->
            <button
              @click.stop="deleteSelectedVersions"
              class="group flex items-center bg-red-600 text-white hover:bg-red-700 shadow-lg hover:shadow-xl px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 transform hover:scale-105"
            >
              <svg
                class="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Delete {{ selectedVersions.length }} version{{
                selectedVersions.length > 1 ? "s" : ""
              }}
            </button>

            <!-- Cancel/Deselect All Button -->
            <button
              @click.stop="
                selectedVersions = [];
                selectAll = false;
              "
              class="flex items-center justify-center bg-gray-600 text-white hover:bg-gray-700 shadow-lg hover:shadow-xl px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 transform hover:scale-105"
            >
              <svg
                class="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Clear Selection
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Question Form Modal -->
      <QuestionForm
        :is-open="showQuestionForm"
        :editing-question="editingQuestion"
        :is-loading="isSavingQuestion"
        :test-parts="test.part_descriptions || []"
        @close="closeQuestionForm"
        @question-saved="handleQuestionSaved"
      />

      <!-- Upload Document Modal -->
      <UploadDocumentModal
        :isOpen="showUploadModal"
        :testId="testId"
        @close="closeUploadModal"
        @upload-complete="handleUploadComplete"
        @images-extracted="handleImagesExtracted"
      />

      <!-- Image Assignment Modal -->
      <ImageAssignmentModal
        :isOpen="showImageAssignmentModal"
        :testId="testId"
        :pendingQuestions="pendingQuestions"
        :extractedImages="extractedImages"
        :answerKeyMap="savedAnswerKeyMap"
        @close="closeImageAssignmentModal"
        @save-complete="handleImageAssignmentComplete"
      />


      <!-- Download Format Selection Modal -->
      <DownloadFormatSelectionModal
        :isOpen="showDownloadFormatModal"
        :downloadType="downloadType"
        :selectedCount="selectedVersions.length"
        :isDownloading="isDownloadingAll"
        @close="closeDownloadFormatModal"
        @confirm="handleDownloadConfirm"
      />


      <!-- Progress Modal for Generation -->
      <ProgressModal
        :isOpen="isGeneratingVersions"
        title="Generating Versions"
        :message="generationProgress.message"
        :current="generationProgress.current"
        :total="generationProgress.total"
        type="generation"
      />

      <!-- Progress Modal for Question Deletion -->
      <ProgressModal
        :isOpen="isDeletingQuestions"
        title="Deleting Questions"
        :message="questionDeletionProgress.message"
        :current="questionDeletionProgress.current"
        :total="questionDeletionProgress.total"
        type="deletion"
      />

      <!-- Progress Modal for Version Deletion -->
      <ProgressModal
        :isOpen="isDeletingVersions"
        title="Deleting Versions"
        :message="deletionProgress.message"
        :current="deletionProgress.current"
        :total="deletionProgress.total"
        type="deletion"
      />

      <!-- Generate Versions Modal -->
      <GenerateVersionsModal
        :isOpen="showGenerateVersionModal"
        :totalQuestions="questions.length"
        :isGenerating="isGeneratingVersions"
        :numberOfParts="test.number_of_parts || 0"
        @close="closeGenerateVersionModal"
        @generate="handleGenerateVersions"
      />

      <!-- Delete Version Confirmation Modal -->
      <DeleteVersionConfirmationModal
        :isOpen="showDeleteVersionConfirm"
        :versionId="deleteVersionId"
        @close="cancelDeleteVersion"
        @confirm="handleDeleteVersionConfirm"
      />

      <!-- Preview Version Modal -->
      <PreviewVersionModal
        :isOpen="showPreviewModal"
        :versionId="previewVersionId"
        @close="closePreview"
      />

      <!-- Answer Key Modal -->
      <AnswerKeyModal
        :isOpen="showAnswerKeyModal"
        :versionId="answerKeyVersionId"
        @close="closeAnswerKey"
      />
  </AppLayout>
</template>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}
</style>
