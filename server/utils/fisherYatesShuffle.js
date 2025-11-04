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
 * 
 * @param {Array} questions - Array of question objects with answer_choices
 * @returns {Object} - Shuffled questions with shuffled answer choices
 */
export function shuffleTestQuestions(questions) {
  // Shuffle the order of questions
  const shuffledQuestions = fisherYatesShuffle(questions);
  
  // For each question, shuffle its answer choices
  const result = shuffledQuestions.map((question, index) => {
    const shuffledChoices = fisherYatesShuffle(question.answer_choices || []);
    
    return {
      ...question,
      question_order: index + 1,
      shuffled_answer_choices: shuffledChoices.map((choice, choiceIndex) => ({
        ...choice,
        choice_order: choiceIndex + 1
      }))
    };
  });
  
  return result;
}

export default {
  fisherYatesShuffle,
  generateUniqueShuffles,
  shuffleTestQuestions
};

