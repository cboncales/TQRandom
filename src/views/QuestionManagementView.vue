<script setup>
import AppLayout from "@/components/layout/AppLayout.vue";
import QuestionForm from "@/components/dashboard/QuestionForm.vue";
import QuestionList from "@/components/dashboard/QuestionList.vue";
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useTestStore } from "@/stores/testStore";
import { uploadApi } from "@/services/api";
import { jsPDF } from "jspdf";
import JSZip from "jszip";
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } from "docx";

const route = useRoute();
const router = useRouter();
const testStore = useTestStore();

const testId = parseInt(route.params.id);
const showQuestionForm = ref(false);
const editingQuestion = ref(null);
const isLoading = ref(true);
const isSavingQuestion = ref(false);
const errorMessage = ref("");

const test = ref({});
const questions = ref([]);

// Tab management
const activeTab = ref("questions"); // 'questions' or 'versions'

// Version management
const versions = ref([]);
const showGenerateVersionModal = ref(false);
const versionCount = ref(1);
const questionsPerVersion = ref(50);
const isGeneratingVersions = ref(false);
const isLoadingVersions = ref(false);
const isDownloadingAll = ref(false);
const downloadProgress = ref({ current: 0, total: 0 });
const showDownloadFormatModal = ref(false);
const selectedDownloadFormat = ref('pdf'); // 'pdf' or 'docx'
const downloadType = ref('all'); // 'all' or 'single'
const downloadingVersionId = ref(null);
const showDeleteVersionConfirm = ref(null);
const selectedVersions = ref([]); // For multiple version card selections

// File upload
const showUploadModal = ref(false);
const selectedFile = ref(null);
const isUploadingFile = ref(false);
const uploadProgress = ref(0);
const answerKeyText = ref("");

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

    // Transform answer_choices to options format with isCorrect flag
    const options = (answerChoices || []).map((choice) => ({
      id: choice.id,
      text: choice.text,
      isCorrect: choice.id === correctAnswerChoiceId,
    }));

    // Create the editing question object in the format expected by QuestionForm
    editingQuestion.value = {
      id: question.id,
      question: question.question || question.text, // Use question.question if available, fallback to question.text
      options: options,
      paraphrases: [], // Add paraphrases support later if needed
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
        questionData.imageUrl // Pass question image URL
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

        // Reload questions to get fresh data
        await loadQuestions();
        closeQuestionForm();
      }
    } else {
      // Add new question (with image URL)
      const result = await testStore.createQuestion(
        testId,
        questionData.question,
        questionData.options.filter((opt) => opt.text.trim()),
        questionData.imageUrl // Pass question image URL
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

        // Reload questions to get fresh data
        await loadQuestions();
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
    }
  } catch (error) {
    alert("An unexpected error occurred while deleting the question.");
    console.error("Delete question error:", error);
  }
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

const loadQuestions = async () => {
  try {
    const result = await testStore.getTestQuestions(testId);

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
    questions.value = result.data.map((question) => ({
      id: question.id,
      question: question.text,
      imageUrl: question.image_url || null, // NEW: Include question image
      type: "multiple-choice",
      options: question.answer_choices.map((choice) => ({
        id: choice.id,
        text: choice.text,
        imageUrl: choice.image_url || null, // NEW: Include choice image
        isCorrect: correctAnswerMap[question.id] === choice.id,
      })),
      paraphrases: [], // Not implemented in database yet
    }));

  } catch (error) {
    errorMessage.value = "Failed to load questions";
    console.error("Load questions error:", error);
  }
};

const goBackToDashboard = () => {
  router.push({ name: "dashboard" });
};

// UI-only functions (no backend functionality yet)
const openUploadModal = () => {
  showUploadModal.value = true;
  selectedFile.value = null;
  answerKeyText.value = "";
};

const closeUploadModal = () => {
  showUploadModal.value = false;
  selectedFile.value = null;
  answerKeyText.value = "";
};

const handleFileSelect = (event) => {
  const file = event.target.files[0];
  if (file) {
    selectedFile.value = file;
  }
};

/**
 * Parse answer key text into a map of question number to answer letter
 * Format: "1. A" or "1) A" or "1 A"
 */
const parseAnswerKey = (text) => {
  const answerMap = {};
  if (!text || !text.trim()) {
    return answerMap;
  }

  const lines = text.split('\n');
  const pattern = /^(\d+)[\.\):\s]+([A-H])\s*$/i;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const match = trimmed.match(pattern);
    if (match) {
      const questionNumber = parseInt(match[1]);
      const answerLetter = match[2].toUpperCase();
      answerMap[questionNumber] = answerLetter;
    }
  }

  return answerMap;
};

const handleFileUpload = async () => {
  if (!selectedFile.value) {
    return;
  }

  isUploadingFile.value = true;
  uploadProgress.value = 0;

  try {
    // Parse answer key if provided
    const answerKeyMap = parseAnswerKey(answerKeyText.value);
    console.log('Parsed answer key:', answerKeyMap);

    // Upload and parse the document
    const result = await uploadApi.uploadDocument(selectedFile.value);

    if (result.error) {
      alert(`Upload failed: ${result.error}`);
      isUploadingFile.value = false;
      return;
    }

    const parsedQuestions = result.data.data;
    console.log(`Successfully parsed ${parsedQuestions.length} questions from document`);

    // Now add each parsed question to the test
    let successCount = 0;
    let failCount = 0;
    let answerSetCount = 0;

    for (let i = 0; i < parsedQuestions.length; i++) {
      uploadProgress.value = Math.round(((i + 1) / parsedQuestions.length) * 50); // First 50% for creating questions

      const parsed = parsedQuestions[i];
      const questionNumber = i + 1;
      
      // Convert answer_choices array to the format expected by createQuestion
      // Now includes image URLs if present
      const answerChoices = parsed.answer_choices.map(choice => ({
        text: typeof choice === 'string' ? choice : choice.text,
        imageUrl: typeof choice === 'object' ? choice.image?.url : null
      }));

      // Extract question image URL if present
      const questionImageUrl = parsed.question_image?.url || null;

      // Create the question (with optional image)
      const createResult = await testStore.createQuestion(
        testId,
        parsed.question_text,
        answerChoices,
        questionImageUrl
      );

      if (createResult.error) {
        console.error(`Failed to create question ${questionNumber}:`, createResult.error);
        failCount++;
      } else {
        successCount++;

        // If answer key is provided for this question, set the correct answer
        const correctAnswerLetter = answerKeyMap[questionNumber];
        if (correctAnswerLetter && createResult.data) {
          uploadProgress.value = Math.round(50 + ((i + 1) / parsedQuestions.length) * 50); // Second 50% for setting answers

          // Get the created question with its answer choices
          const questionsResult = await testStore.getTestQuestions(testId, true); // Force refresh
          if (questionsResult.data) {
            const createdQuestion = questionsResult.data.find(q => q.id === createResult.data.id);
            
            if (createdQuestion && createdQuestion.answer_choices) {
              // Find the answer choice that matches the letter (A=0, B=1, C=2, etc.)
              const choiceIndex = correctAnswerLetter.charCodeAt(0) - 'A'.charCodeAt(0);
              const correctChoice = createdQuestion.answer_choices[choiceIndex];
              
              if (correctChoice) {
                const answerResult = await testStore.storeCorrectAnswer(
                  createResult.data.id,
                  correctChoice.id,
                  testId
                );
                if (!answerResult.error) {
                  answerSetCount++;
                  console.log(`Set correct answer for Q${questionNumber}: ${correctAnswerLetter}`);
                }
              }
            }
          }
        }
      }
    }

    // Close modal and reload questions
    closeUploadModal();
    await loadQuestions();

    // Show summary
    let message = `Upload complete!\n\nSuccessfully added: ${successCount} questions`;
    if (failCount > 0) {
      message += `\nFailed: ${failCount} questions`;
    }
    if (answerSetCount > 0) {
      message += `\nCorrect answers set: ${answerSetCount}`;
    }
    alert(message);

  } catch (error) {
    console.error('Upload error:', error);
    alert(`An error occurred during upload: ${error.message}`);
  } finally {
    isUploadingFile.value = false;
    uploadProgress.value = 0;
  }
};

const loadVersions = async (forceRefresh = false) => {
  try {
    isLoadingVersions.value = true;
    
    // Use cached version from testStore
    const result = await testStore.getTestVersions(testId, forceRefresh);

    if (result.error) {
      console.error('Error loading versions:', result.error);
      return;
    }

    // Format versions for UI
    versions.value = result.data.map(v => ({
      id: v.id,
      name: `Version ${v.version_number}`,
      createdAt: v.created_at,
      questionCount: v.question_count
    }));

  } catch (error) {
    console.error('Load versions error:', error);
  } finally {
    isLoadingVersions.value = false;
  }
};

const openGenerateVersionModal = () => {
  showGenerateVersionModal.value = true;
  versionCount.value = 1;
  questionsPerVersion.value = questions.value.length;
};

const closeGenerateVersionModal = () => {
  showGenerateVersionModal.value = false;
};

const handleGenerateVersions = async () => {
  if (versionCount.value < 1 || versionCount.value > 100) {
    alert('Please enter a version count between 1 and 100');
    return;
  }

  if (questionsPerVersion.value < 1 || questionsPerVersion.value > questions.value.length) {
    alert(`Please enter questions per version between 1 and ${questions.value.length}`);
    return;
  }

  isGeneratingVersions.value = true;

  try {
    // Use testStore to generate versions
    const result = await testStore.generateVersions(
      testId,
      versionCount.value,
      questionsPerVersion.value
    );

    if (result.error) {
      alert(`Failed to generate versions: ${result.error}`);
      return;
    }

    closeGenerateVersionModal();
    
    // Switch to versions tab and reload
    activeTab.value = 'versions';
    await loadVersions();

    alert(`✅ Successfully generated ${result.data.data.length} randomized version(s) using Fisher-Yates algorithm!`);

  } catch (error) {
    console.error('Generate versions error:', error);
    alert(`An error occurred: ${error.message}`);
  } finally {
    isGeneratingVersions.value = false;
  }
};

// Helper function to generate Word document for a version
const generateVersionWord = async (versionData) => {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        // Header
        new Paragraph({
          text: versionData.test_title,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.LEFT,
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Version ${versionData.version_number}`,
              bold: true,
              size: 24,
            }),
          ],
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Generated: ${new Date(versionData.created_at).toLocaleString()}`,
              size: 18,
              color: "666666",
            }),
          ],
          spacing: { after: 400 },
        }),
        
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

          // Answer choices
          const choiceParagraphs = q.answer_choices.map((choice, choiceIndex) => {
            const letter = String.fromCharCode(65 + choiceIndex);
            return new Paragraph({
              children: [
                new TextRun({
                  text: `     ${letter}. ${choice.text}`,
                  size: 20,
                }),
              ],
              spacing: { after: 80 },
              indent: { left: 720 },
            });
          });

          return [...questionParagraphs, ...choiceParagraphs];
        }),
      ],
    }],
  });

  return await Packer.toBlob(doc);
};

// Helper function to generate PDF for a version
const generateVersionPDF = (versionData) => {
  // Create PDF
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter' // 8.5" x 11"
  });

  // Page settings
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (2 * margin);
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

    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(versionData.test_title, margin, yPosition);
    yPosition += 8;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Version ${versionData.version_number}`, margin, yPosition);
    yPosition += 6;

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date(versionData.created_at).toLocaleString()}`, margin, yPosition);
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
      doc.setFont('helvetica', 'bold');
      
      const questionPrefix = `${q.question_number}. `;
      const questionLines = wrapText(q.question_text, contentWidth - 10);
      
      // First line with number
      doc.text(questionPrefix, margin, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(questionLines[0], margin + 10, yPosition);
      yPosition += 6;

      // Remaining lines
      for (let i = 1; i < questionLines.length; i++) {
        checkPageBreak(6);
        doc.text(questionLines[i], margin + 10, yPosition);
        yPosition += 6;
      }

      yPosition += 2; // Small space before answer choices

      // Answer choices
      q.answer_choices.forEach((choice, choiceIndex) => {
        checkPageBreak(6);
        
        const letter = String.fromCharCode(65 + choiceIndex); // A, B, C, D...
        const choicePrefix = `     ${letter}. `;
        const choiceLines = wrapText(choice.text, contentWidth - 20);

        // First line with letter
        doc.setFontSize(10);
        doc.text(choicePrefix, margin, yPosition);
        doc.text(choiceLines[0], margin + 15, yPosition);
        yPosition += 5;

        // Remaining lines
        for (let i = 1; i < choiceLines.length; i++) {
          checkPageBreak(5);
          doc.text(choiceLines[i], margin + 15, yPosition);
          yPosition += 5;
        }
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
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  return doc;
};

// Version card selection (multi-select)
const toggleVersionSelection = (version) => {
  const index = selectedVersions.value.findIndex(v => v.id === version.id);
  
  if (index > -1) {
    // Already selected, remove it
    selectedVersions.value.splice(index, 1);
  } else {
    // Not selected, add it
    selectedVersions.value.push(version);
  }
};

// Check if a version is selected
const isVersionSelected = (versionId) => {
  return selectedVersions.value.some(v => v.id === versionId);
};

// Open format selection modal
const openDownloadFormatModal = (type, versionId = null) => {
  downloadType.value = type;
  downloadingVersionId.value = versionId;
  selectedDownloadFormat.value = 'pdf'; // Default to PDF
  showDownloadFormatModal.value = true;
};

const closeDownloadFormatModal = () => {
  showDownloadFormatModal.value = false;
  downloadType.value = 'all';
  downloadingVersionId.value = null;
};

const confirmDownload = async () => {
  if (downloadType.value === 'all') {
    await downloadAllVersions(selectedDownloadFormat.value);
  } else if (downloadType.value === 'selected') {
    await downloadSelectedVersionsZip(selectedDownloadFormat.value);
  } else if (downloadType.value === 'single' && downloadingVersionId.value) {
    await downloadVersion(downloadingVersionId.value, selectedDownloadFormat.value);
  }
  closeDownloadFormatModal();
};

const downloadVersion = async (versionId, format = 'pdf') => {
  try {
    // Get version data from cache
    const result = await testStore.getVersion(versionId);

    if (result.error) {
      alert(`Failed to download version: ${result.error}`);
      return;
    }

    const versionData = result.data;
    const baseFilename = `${versionData.test_title.replace(/[^a-z0-9]/gi, '_')}_Version_${versionData.version_number}`;
    
    if (format === 'pdf') {
      const doc = generateVersionPDF(versionData);
      doc.save(`${baseFilename}.pdf`);
    } else if (format === 'docx') {
      const blob = await generateVersionWord(versionData);
      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(blob);
      downloadLink.download = `${baseFilename}.docx`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(downloadLink.href);
    }

  } catch (error) {
    console.error('Download error:', error);
    alert(`An error occurred during download: ${error.message}`);
  }
};

const downloadAllVersions = async (format = 'pdf') => {
  if (versions.value.length === 0) {
    alert('No versions available to download.');
    return;
  }

  const formatName = format === 'pdf' ? 'PDF' : 'Word';
  if (!confirm(`This will download all ${versions.value.length} versions as ${formatName} files in a ZIP. Continue?`)) {
    return;
  }

  isDownloadingAll.value = true;
  downloadProgress.value = { current: 0, total: versions.value.length };

  try {
    const zip = new JSZip();
    const testTitle = test.value?.title || 'Test';
    const folderName = testTitle.replace(/[^a-z0-9]/gi, '_');
    const fileExtension = format === 'pdf' ? 'pdf' : 'docx';

    // Fetch and generate files for all versions
    for (let i = 0; i < versions.value.length; i++) {
      const version = versions.value[i];
      downloadProgress.value.current = i + 1;

      try {
        // Get version data from cache
        const result = await testStore.getVersion(version.id);

        if (result.error) {
          console.error(`Failed to fetch version ${version.version_number}:`, result.error);
          continue; // Skip this version and continue with others
        }

        const versionData = result.data;
        let fileBlob;
        
        // Generate file based on format
        if (format === 'pdf') {
          const doc = generateVersionPDF(versionData);
          fileBlob = doc.output('blob');
        } else if (format === 'docx') {
          fileBlob = await generateVersionWord(versionData);
        }
        
        // Add to ZIP with descriptive filename
        const filename = `Version_${versionData.version_number.toString().padStart(3, '0')}.${fileExtension}`;
        zip.file(filename, fileBlob);

      } catch (error) {
        console.error(`Error generating ${formatName} for version ${version.version_number}:`, error);
        // Continue with other versions even if one fails
      }
    }

    // Generate ZIP file
    const zipBlob = await zip.generateAsync({ 
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });

    // Download ZIP file
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(zipBlob);
    downloadLink.download = `${folderName}_All_Versions_${new Date().toISOString().split('T')[0]}.zip`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(downloadLink.href);

    alert(`Successfully downloaded ${downloadProgress.value.current} versions!`);

  } catch (error) {
    console.error('Download all error:', error);
    alert(`An error occurred while creating ZIP file: ${error.message}`);
  } finally {
    isDownloadingAll.value = false;
    downloadProgress.value = { current: 0, total: 0 };
  }
};

const confirmDeleteVersion = (versionId) => {
  showDeleteVersionConfirm.value = versionId;
};

const cancelDeleteVersion = () => {
  showDeleteVersionConfirm.value = null;
};

const deleteVersion = async (versionId) => {
  try {
    // Use testStore to delete version
    const result = await testStore.deleteVersion(versionId, testId);

    if (result.error) {
      alert(`Failed to delete version: ${result.error}`);
      showDeleteVersionConfirm.value = null;
      return;
    }

    // Remove from selected versions if it's in there
    selectedVersions.value = selectedVersions.value.filter(v => v.id !== versionId);

    // Reload versions (force refresh to get updated list)
    await loadVersions(true);
    showDeleteVersionConfirm.value = null;
    alert('Version deleted successfully');

  } catch (error) {
    console.error('Delete error:', error);
    alert(`An error occurred: ${error.message}`);
    showDeleteVersionConfirm.value = null;
  }
};

// Download all selected versions
const downloadSelectedVersions = async () => {
  if (selectedVersions.value.length === 0) {
    return;
  }

  // For single version, just download it directly
  if (selectedVersions.value.length === 1) {
    openDownloadFormatModal('single', selectedVersions.value[0].id);
    return;
  }

  // For multiple versions, create a ZIP
  if (!confirm(`This will download ${selectedVersions.value.length} versions as a ZIP file. Continue?`)) {
    return;
  }

  // Open format modal for selected versions
  downloadType.value = 'selected';
  showDownloadFormatModal.value = true;
};

// Confirm and execute the selected versions download
const downloadSelectedVersionsZip = async (format = 'pdf') => {
  if (selectedVersions.value.length === 0) {
    return;
  }

  isDownloadingAll.value = true;
  downloadProgress.value = { current: 0, total: selectedVersions.value.length };

  try {
    const zip = new JSZip();
    const testTitle = test.value?.title || 'Test';
    const folderName = testTitle.replace(/[^a-z0-9]/gi, '_');
    const fileExtension = format === 'pdf' ? 'pdf' : 'docx';

    // Fetch and generate files for selected versions
    for (let i = 0; i < selectedVersions.value.length; i++) {
      const version = selectedVersions.value[i];
      downloadProgress.value.current = i + 1;

      try {
        // Get version data from cache
        const result = await testStore.getVersion(version.id);

        if (result.error) {
          console.error(`Failed to fetch version ${version.versionNumber}:`, result.error);
          continue;
        }

        const versionData = result.data;
        let fileBlob;
        
        // Generate file based on format
        if (format === 'pdf') {
          const doc = generateVersionPDF(versionData);
          fileBlob = doc.output('blob');
        } else if (format === 'docx') {
          fileBlob = await generateVersionWord(versionData);
        }
        
        // Add to ZIP with descriptive filename
        const filename = `Version_${versionData.version_number.toString().padStart(3, '0')}.${fileExtension}`;
        zip.file(filename, fileBlob);

      } catch (error) {
        console.error(`Error generating file for version ${version.versionNumber}:`, error);
      }
    }

    // Generate ZIP file
    const zipBlob = await zip.generateAsync({ 
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });

    // Download ZIP file
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(zipBlob);
    downloadLink.download = `${folderName}_Selected_${selectedVersions.value.length}_Versions_${new Date().toISOString().split('T')[0]}.zip`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(downloadLink.href);

    alert(`Successfully downloaded ${downloadProgress.value.current} versions!`);

  } catch (error) {
    console.error('Download error:', error);
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
  const versionText = versionCount === 1 ? 'version' : 'versions';
  
  if (!confirm(`Are you sure you want to delete ${versionCount} ${versionText}? This action cannot be undone.`)) {
    return;
  }

  let successCount = 0;
  let failCount = 0;

  for (const version of selectedVersions.value) {
    try {
      const result = await testStore.deleteVersion(version.id, testId);
      
      if (result.error) {
        console.error(`Failed to delete ${version.name}:`, result.error);
        failCount++;
      } else {
        successCount++;
      }
    } catch (error) {
      console.error(`Error deleting ${version.name}:`, error);
      failCount++;
    }
  }

  // Clear selection
  selectedVersions.value = [];

  // Reload versions
  await loadVersions(true);

  // Show result
  if (failCount === 0) {
    alert(`Successfully deleted ${successCount} ${versionText}!`);
  } else {
    alert(`Deleted ${successCount} ${versionText}. Failed to delete ${failCount} ${versionText}.`);
  }
};

onMounted(async () => {
  errorMessage.value = "";
  
  // Check if we have valid cached data for test, questions, and answers
  const hasValidTestCache = testStore.$state.singleTestCache?.[testId] && 
    (Date.now() - testStore.$state.singleTestCache[testId].timestamp < 5 * 60 * 1000);
  const hasValidQuestionsCache = testStore.$state.questionsCache?.[testId] && 
    (Date.now() - testStore.$state.questionsCache[testId].timestamp < 5 * 60 * 1000);
  const hasValidAnswersCache = testStore.$state.answersCache?.[testId] && 
    (Date.now() - testStore.$state.answersCache[testId].timestamp < 5 * 60 * 1000);
  
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
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <div class="bg-white shadow">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="py-6">
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <button
                  @click="goBackToDashboard"
                  class="mr-4 text-gray-600 hover:text-gray-900"
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
                  <h1 class="text-2xl font-bold text-gray-900">
                    {{ test.title }}
                  </h1>
                  <p class="mt-1 text-sm text-gray-600">
                    {{ test.subject }}
                  </p>
                </div>
              </div>
              <div class="flex items-center space-x-3">
                <button
                  v-if="activeTab === 'questions'"
                  @click="openUploadModal"
                  class="bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center"
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
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  Upload Document
                </button>
                <button
                  v-if="activeTab === 'questions'"
                  @click="openQuestionForm"
                  class="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center"
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
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Add Question
                </button>
                <div v-if="activeTab === 'versions'" class="flex space-x-2">
                  <button
                    @click="openDownloadFormatModal('all')"
                    :disabled="versions.length === 0 || isDownloadingAll"
                    class="bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center"
                  >
                    <svg
                      v-if="isDownloadingAll"
                      class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <svg
                      v-else
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
                    {{ isDownloadingAll ? `Downloading ${downloadProgress.current}/${downloadProgress.total}...` : 'Download All' }}
                  </button>
                  <button
                    @click="openGenerateVersionModal"
                    :disabled="questions.length === 0"
                    class="bg-purple-600 text-white hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center"
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
                    Generate Versions
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Tabs -->
          <div class="border-t border-gray-200">
            <nav class="-mb-px flex space-x-8">
              <button
                @click="activeTab = 'questions'"
                :class="[
                  activeTab === 'questions'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                  'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200'
                ]"
              >
                <svg
                  class="w-5 h-5 inline-block mr-2"
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
                Questions ({{ questions.length }})
              </button>
              <button
                @click="activeTab = 'versions'"
                :class="[
                  activeTab === 'versions'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                  'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200'
                ]"
              >
                <svg
                  class="w-5 h-5 inline-block mr-2"
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
                Randomized Versions ({{ versions.length }})
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
            <span class="text-gray-600">Loading test and questions...</span>
          </div>
        </div>

        <div v-if="!isLoading && !errorMessage">
          <!-- Questions Tab Content -->
          <div v-if="activeTab === 'questions'">
            <!-- Test Info Card -->
            <div class="bg-white shadow rounded-lg p-6 mb-8">
              <h3 class="text-lg font-medium text-gray-900 mb-2">
                Test Information
              </h3>
              <p class="text-gray-600 mb-4">{{ test.description }}</p>
              <div class="flex items-center space-x-6 text-sm text-gray-500">
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
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                  Subject: {{ test.subject }}
                </span>
              </div>
            </div>

            <!-- Questions List -->
            <QuestionList
              :questions="questions"
              @edit-question="editQuestion"
              @delete-question="handleQuestionDeleted"
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
              <h3 class="mt-2 text-sm font-medium text-gray-900">No versions generated</h3>
              <p class="mt-1 text-sm text-gray-500">
                Generate randomized versions of your test using the Fisher-Yates algorithm.
              </p>
              <div class="mt-6">
                <button
                  v-if="questions.length > 0"
                  @click="openGenerateVersionModal"
                  class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
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
            <div v-else class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div
                v-for="version in versions"
                :key="version.id"
                @click="toggleVersionSelection(version)"
                class="bg-white overflow-hidden shadow rounded-lg transition-all duration-200 cursor-pointer"
                :class="[
                  isVersionSelected(version.id)
                    ? 'ring-4 ring-blue-500 shadow-xl scale-[1.02]'
                    : 'hover:shadow-lg'
                ]"
              >
                <div class="p-6">
                  <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-medium text-gray-900">
                      {{ version.name }}
                    </h3>
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      Randomized
                    </span>
                  </div>
                  <div class="space-y-2 text-sm text-gray-500 mb-4">
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
                  <!-- Show buttons when no versions are selected -->
                  <div v-if="selectedVersions.length === 0" class="flex space-x-2">
                    <button
                      @click.stop="openDownloadFormatModal('single', version.id)"
                      class="flex-1 bg-blue-600 text-white hover:bg-blue-700 px-3 py-2 rounded-md text-xs font-medium transition-colors duration-200 flex items-center justify-center"
                    >
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
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                      Download
                    </button>
                    <button
                      @click.stop="confirmDeleteVersion(version.id)"
                      class="bg-red-600 text-white hover:bg-red-700 px-3 py-2 rounded-md text-xs font-medium transition-colors duration-200"
                    >
                      <svg
                        class="w-4 h-4"
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
                  <div v-else-if="isVersionSelected(version.id)" class="flex items-center justify-center py-2">
                    <div class="flex items-center text-blue-600 font-medium text-sm">
                      <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                      </svg>
                      Selected
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
                Download {{ selectedVersions.length }} version{{ selectedVersions.length > 1 ? 's' : '' }}
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
                Delete {{ selectedVersions.length }} version{{ selectedVersions.length > 1 ? 's' : '' }}
              </button>

              <!-- Cancel/Deselect All Button -->
              <button
                @click.stop="selectedVersions = []"
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

        <!-- Question Form Modal -->
      <QuestionForm
        :is-open="showQuestionForm"
        :editing-question="editingQuestion"
        :is-loading="isSavingQuestion"
        @close="closeQuestionForm"
        @question-saved="handleQuestionSaved"
      />

      <!-- Upload Document Modal -->
      <div
        v-if="showUploadModal"
        class="fixed inset-0 z-50 overflow-y-auto"
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
      >
        <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <!-- Background overlay -->
          <div
            class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
            aria-hidden="true"
            @click="closeUploadModal"
          ></div>

          <!-- Center modal -->
          <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

          <div class="relative z-10 inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
            <div>
              <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg
                  class="h-6 w-6 text-green-600"
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
              </div>
              <div class="mt-3 text-center sm:mt-5">
                <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                  Upload Document
                </h3>
                <div class="mt-2">
                  <p class="text-sm text-gray-500">
                    Upload a PDF or Word document to extract questions automatically.
                  </p>
                </div>
              </div>
            </div>

            <div class="mt-5">
              <!-- File Upload Area -->
              <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  @change="handleFileSelect"
                  accept=".pdf,.doc,.docx"
                  class="hidden"
                  id="fileInput"
                />
                <label for="fileInput" class="cursor-pointer">
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
                  <div class="mt-2">
                    <span class="text-sm font-medium text-blue-600 hover:text-blue-500">
                      Click to upload
                    </span>
                    <span class="text-sm text-gray-500"> or drag and drop</span>
                  </div>
                  <p class="text-xs text-gray-500 mt-1">PDF, DOC, DOCX up to 10MB</p>
                </label>
              </div>

              <!-- Selected File Display -->
              <div v-if="selectedFile" class="mt-4 p-3 bg-gray-50 rounded-md">
                <div class="flex items-center justify-between">
                  <div class="flex items-center">
                    <svg
                      class="h-5 w-5 text-gray-400 mr-2"
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
                    <span class="text-sm text-gray-900">{{ selectedFile.name }}</span>
                  </div>
                  <button
                    @click="selectedFile = null"
                    class="text-red-600 hover:text-red-700"
                  >
                    <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fill-rule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Answer Key Input -->
              <div class="mt-5">
                <label for="answerKey" class="block text-sm font-medium text-gray-700 mb-2">
                  Answer Key (Optional)
                  <span class="text-xs font-normal text-gray-500 ml-1">
                    - Paste answer key to automatically set correct answers
                  </span>
                </label>
                <textarea
                  id="answerKey"
                  v-model="answerKeyText"
                  rows="6"
                  placeholder="1. A&#10;2. C&#10;3. A&#10;4. C&#10;5. C&#10;..."
                  class="block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 text-sm focus:border-green-500 focus:ring-green-500 font-mono"
                  :disabled="isUploadingFile"
                ></textarea>
                <p class="mt-1 text-xs text-gray-500">
                  <svg class="inline w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                  </svg>
                  Format: "1. A" or "1) A" (one per line). Letters A-H supported.
                </p>
              </div>
            </div>

            <!-- Upload Progress -->
            <div v-if="isUploadingFile" class="mt-5">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-gray-700">Processing...</span>
                <span class="text-sm font-medium text-gray-700">{{ uploadProgress }}%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  class="bg-green-600 h-2.5 rounded-full transition-all duration-300"
                  :style="{ width: uploadProgress + '%' }"
                ></div>
              </div>
              <p class="mt-2 text-xs text-gray-500 text-center">
                Uploading and adding questions to your test...
              </p>
            </div>

            <div class="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
              <button
                type="button"
                @click="handleFileUpload"
                :disabled="!selectedFile || isUploadingFile"
                class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:col-start-2 sm:text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <svg
                  v-if="isUploadingFile"
                  class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                {{ isUploadingFile ? 'Processing...' : 'Upload & Extract' }}
              </button>
              <button
                type="button"
                @click="closeUploadModal"
                :disabled="isUploadingFile"
                class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Download Format Selection Modal -->
      <div
        v-if="showDownloadFormatModal"
        class="fixed inset-0 z-50 overflow-y-auto"
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
      >
        <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <!-- Background overlay -->
          <div
            class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
            aria-hidden="true"
            @click="closeDownloadFormatModal"
          ></div>

          <!-- Center modal -->
          <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

          <div class="relative z-10 inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
            <div>
              <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                <svg
                  class="h-6 w-6 text-blue-600"
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
              </div>
              <div class="mt-3 text-center sm:mt-5">
                <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                  Select Download Format
                </h3>
                <div class="mt-2">
                  <p class="text-sm text-gray-500">
                    Choose the file format for downloading 
                    <template v-if="downloadType === 'all'">all versions</template>
                    <template v-else-if="downloadType === 'selected'">{{ selectedVersions.length }} selected version{{ selectedVersions.length > 1 ? 's' : '' }}</template>
                    <template v-else>this version</template>.
                  </p>
                </div>
                <div class="mt-6 space-y-3">
                  <!-- PDF Option -->
                  <label
                    class="relative flex cursor-pointer rounded-lg border border-gray-300 bg-white p-4 shadow-sm focus:outline-none hover:border-blue-500"
                    :class="selectedDownloadFormat === 'pdf' ? 'border-blue-600 ring-2 ring-blue-600' : ''"
                  >
                    <input
                      type="radio"
                      name="download-format"
                      value="pdf"
                      v-model="selectedDownloadFormat"
                      class="sr-only"
                    />
                    <div class="flex flex-1 items-center">
                      <div class="flex items-center">
                        <svg class="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <div class="ml-3 text-left">
                          <span class="block text-sm font-medium text-gray-900">PDF Format</span>
                          <span class="block text-xs text-gray-500">Portable Document Format - Universal compatibility</span>
                        </div>
                      </div>
                    </div>
                    <svg v-if="selectedDownloadFormat === 'pdf'" class="h-5 w-5 text-blue-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                  </label>

                  <!-- Word Option -->
                  <label
                    class="relative flex cursor-pointer rounded-lg border border-gray-300 bg-white p-4 shadow-sm focus:outline-none hover:border-blue-500"
                    :class="selectedDownloadFormat === 'docx' ? 'border-blue-600 ring-2 ring-blue-600' : ''"
                  >
                    <input
                      type="radio"
                      name="download-format"
                      value="docx"
                      v-model="selectedDownloadFormat"
                      class="sr-only"
                    />
                    <div class="flex flex-1 items-center">
                      <div class="flex items-center">
                        <svg class="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div class="ml-3 text-left">
                          <span class="block text-sm font-medium text-gray-900">Word Format (DOCX)</span>
                          <span class="block text-xs text-gray-500">Editable document - Microsoft Word compatible</span>
                        </div>
                      </div>
                    </div>
                    <svg v-if="selectedDownloadFormat === 'docx'" class="h-5 w-5 text-blue-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                  </label>
                </div>
              </div>
            </div>
            <div class="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
              <button
                type="button"
                @click="confirmDownload"
                :disabled="isDownloadingAll"
                class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <svg
                  v-if="isDownloadingAll"
                  class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ isDownloadingAll ? 'Downloading...' : 'Download' }}
              </button>
              <button
                type="button"
                @click="closeDownloadFormatModal"
                :disabled="isDownloadingAll"
                class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Generate Versions Modal -->
      <div
        v-if="showGenerateVersionModal"
        class="fixed inset-0 z-50 overflow-y-auto"
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
      >
        <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <!-- Background overlay -->
          <div
            class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
            aria-hidden="true"
            @click="closeGenerateVersionModal"
          ></div>

          <!-- Center modal -->
          <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

          <div class="relative z-10 inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
            <div>
              <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-purple-100">
                <svg
                  class="h-6 w-6 text-purple-600"
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
              </div>
              <div class="mt-3 text-center sm:mt-5">
                <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                  Generate Randomized Versions
                </h3>
                <div class="mt-2">
                  <p class="text-sm text-gray-500">
                    Create randomized test versions using the Fisher-Yates shuffle algorithm.
                  </p>
                </div>
              </div>
            </div>

            <div class="mt-5 space-y-4">
              <!-- Number of Versions -->
              <div>
                <label for="versionCount" class="block text-sm font-medium text-gray-700 mb-1">
                  Number of Versions
                </label>
                <input
                  type="number"
                  id="versionCount"
                  v-model.number="versionCount"
                  min="1"
                  max="100"
                  class="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm px-3 py-2 border"
                />
                <p class="mt-1 text-xs text-gray-500">
                  Generate between 1 and 100 randomized versions
                </p>
              </div>

              <!-- Questions per Version -->
              <div>
                <label for="questionsPerVersion" class="block text-sm font-medium text-gray-700 mb-1">
                  Questions per Version
                </label>
                <input
                  type="number"
                  id="questionsPerVersion"
                  v-model.number="questionsPerVersion"
                  :min="1"
                  :max="questions.length"
                  class="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm px-3 py-2 border"
                />
                <p class="mt-1 text-xs text-gray-500">
                  Available questions: {{ questions.length }}
                </p>
              </div>

              <!-- Algorithm Info -->
              <div class="bg-blue-50 rounded-md p-4">
                <div class="flex">
                  <svg
                    class="h-5 w-5 text-blue-400 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div class="text-sm text-blue-700">
                    <p class="font-medium">Fisher-Yates Algorithm</p>
                    <p class="mt-1 text-xs">
                      Each version will have questions in a unique randomized order with equal probability distribution.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
              <button
                type="button"
                @click="handleGenerateVersions"
                :disabled="isGeneratingVersions"
                class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:col-start-2 sm:text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <svg
                  v-if="isGeneratingVersions"
                  class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                {{ isGeneratingVersions ? 'Generating...' : 'Generate' }}
              </button>
              <button
                type="button"
                @click="closeGenerateVersionModal"
                :disabled="isGeneratingVersions"
                class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Version Confirmation Modal -->
    <div
      v-if="showDeleteVersionConfirm"
      class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
      @click="cancelDeleteVersion"
    >
      <div
        class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white"
        @click.stop
      >
        <div class="mt-3 text-center">
          <div
            class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100"
          >
            <svg
              class="h-6 w-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.084 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mt-2">Delete Test Version</h3>
          <p class="mt-2 text-sm text-gray-500">
            Are you sure you want to delete this randomized version? This action cannot be
            undone.
          </p>
          <div class="mt-4 flex justify-center space-x-3">
            <button
              @click="deleteVersion(showDeleteVersionConfirm)"
              class="bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded-md text-sm font-medium"
            >
              Delete
            </button>
            <button
              @click="cancelDeleteVersion"
              class="bg-gray-300 text-gray-700 hover:bg-gray-400 px-4 py-2 rounded-md text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
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
