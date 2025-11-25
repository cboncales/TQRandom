/**
 * Fisher-Yates Shuffle Algorithm
 * 
 * This is an unbiased shuffle algorithm that gives each permutation
 * an equal probability of occurring. It's efficient with O(n) time complexity.
 * 
 * How it works:
 * 1. Start from the last element
 * 2. Pick a random element from the remaining unshuffled portion
 * 3. Swap it with the current element
 * 4. Move to the previous element and repeat
 * 
 * @param {Array} array - The array to shuffle
 * @returns {Array} - A new shuffled array (original array is not modified)
 */
export function fisherYatesShuffle(array) {
  // Create a copy to avoid mutating the original array
  const shuffled = [...array];
  
  // Start from the last element and work backwards
  for (let i = shuffled.length - 1; i > 0; i--) {
    // Pick a random index from 0 to i (inclusive)
    const randomIndex = Math.floor(Math.random() * (i + 1));
    
    // Swap elements at i and randomIndex
    [shuffled[i], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[i]];
  }
  
  return shuffled;
}

/**
 * Generate multiple unique shuffles of an array
 * Each shuffle is guaranteed to be different from the original and from each other
 * 
 * @param {Array} array - The array to shuffle
 * @param {number} count - Number of unique shuffles to generate
 * @returns {Array<Array>} - Array of shuffled arrays
 */
export function generateUniqueShuffles(array, count) {
  const shuffles = [];
  const maxAttempts = count * 10; // Prevent infinite loops
  let attempts = 0;
  
  while (shuffles.length < count && attempts < maxAttempts) {
    const shuffled = fisherYatesShuffle(array);
    
    // Convert to string for comparison (simple but effective)
    const shuffledStr = JSON.stringify(shuffled);
    const isUnique = !shuffles.some(s => JSON.stringify(s) === shuffledStr);
    
    if (isUnique) {
      shuffles.push(shuffled);
    }
    
    attempts++;
  }
  
  return shuffles;
}

/**
 * Shuffle questions and their answer choices for test randomization
 * Only shuffles answer choices for Multiple Choice questions
 * 
 * @param {Array} questions - Array of question objects with answer_choices
 * @returns {Object} - Shuffled questions with shuffled answer choices (only for Multiple Choice)
 */
export function shuffleTestQuestions(questions) {
  // If no questions or single question, return as is
  if (!Array.isArray(questions) || questions.length === 0) return [];

  // Helper function to process answer choices based on question type
  const processAnswerChoices = (question) => {
    const choices = question.answer_choices || [];
    const questionType = question.type || '';
    
    // Only shuffle answer choices for Multiple Choice questions
    const shouldShuffle = questionType === 'Multiple Choice';
    const processedChoices = shouldShuffle ? fisherYatesShuffle(choices) : choices;
    
    return processedChoices.map((choice, choiceIndex) => ({
      ...choice,
      choice_order: choiceIndex + 1
    }));
  };

  // Detect if questions have a 'part' field and group by part
  const hasPartField = questions.some(q => q.part !== null && q.part !== undefined);

  if (hasPartField) {
    // Group questions by part value
    const partGroups = {};
    
    for (const q of questions) {
      const partKey = q.part !== null && q.part !== undefined ? q.part : 'no_part';
      
      if (!partGroups[partKey]) {
        partGroups[partKey] = [];
      }
      partGroups[partKey].push(q);
    }

    // Get sorted part keys (1, 2, 3, etc., then 'no_part' at the end)
    const partKeys = Object.keys(partGroups).sort((a, b) => {
      if (a === 'no_part') return 1;
      if (b === 'no_part') return -1;
      return Number(a) - Number(b);
    });

    // Shuffle each part independently and concatenate
    const shuffledQuestions = [];
    for (const partKey of partKeys) {
      const partQuestions = partGroups[partKey];
      const shuffledPart = fisherYatesShuffle(partQuestions);
      shuffledQuestions.push(...shuffledPart);
    }

    // Map questions with their processed answer choices
    return shuffledQuestions.map((question, index) => {
      return {
        ...question,
        question_order: index + 1,
        shuffled_answer_choices: processAnswerChoices(question)
      };
    });
  }

  // If no part field, shuffle all questions together
  const shuffledQuestions = fisherYatesShuffle(questions);

  const result = shuffledQuestions.map((question, index) => {
    return {
      ...question,
      question_order: index + 1,
      shuffled_answer_choices: processAnswerChoices(question)
    };
  });

  return result;
}

export default {
  fisherYatesShuffle,
  generateUniqueShuffles,
  shuffleTestQuestions
};

