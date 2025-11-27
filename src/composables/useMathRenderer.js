import katex from 'katex';

/**
 * Composable for rendering mathematical expressions
 * Converts text with math notation to properly formatted HTML
 */
export function useMathRenderer() {
  /**
   * Converts common math notations to proper format
   * Supports:
   * - Exponents: x^2 → x²
   * - Square roots: sqrt(x) → √x
   * - Fractions: a/b in context
   * - Greek letters: alpha, beta, etc.
   * - Math operators: >=, <=, !=
   */
  const convertMathNotation = (text) => {
    if (!text) return '';
    
    let result = text;
    
    // Convert exponents (x^2, x^3, etc.) to superscript
    result = result.replace(/\^2\b/g, '²');
    result = result.replace(/\^3\b/g, '³');
    result = result.replace(/\^(\d+)/g, (match, power) => {
      const superscripts = {
        '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
        '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'
      };
      return power.split('').map(d => superscripts[d] || d).join('');
    });
    
    // Convert sqrt() to radical symbol
    result = result.replace(/sqrt\(([^)]+)\)/gi, '√($1)');
    result = result.replace(/√\(([^)]+)\)/g, '√$1');
    
    // Convert common Greek letters (case insensitive)
    const greekLetters = {
      'alpha': 'α', 'beta': 'β', 'gamma': 'γ', 'delta': 'δ',
      'epsilon': 'ε', 'theta': 'θ', 'lambda': 'λ', 'mu': 'μ',
      'pi': 'π', 'sigma': 'σ', 'phi': 'φ', 'omega': 'ω',
      'Alpha': 'Α', 'Beta': 'Β', 'Gamma': 'Γ', 'Delta': 'Δ',
      'Theta': 'Θ', 'Lambda': 'Λ', 'Sigma': 'Σ', 'Phi': 'Φ', 'Omega': 'Ω'
    };
    
    Object.entries(greekLetters).forEach(([word, symbol]) => {
      const regex = new RegExp(`\\b${word}\\b`, 'g');
      result = result.replace(regex, symbol);
    });
    
    // Convert mathematical operators
    result = result.replace(/>=|≥/g, '≥');
    result = result.replace(/<=|≤/g, '≤');
    result = result.replace(/!=|≠/g, '≠');
    result = result.replace(/\*/g, '×');
    result = result.replace(/\+-/g, '±');
    
    // Convert degrees
    result = result.replace(/\s*degrees?\s*/gi, '°');
    
    return result;
  };

  /**
   * Renders LaTeX math expressions using KaTeX
   * Detects math delimiters: $...$ for inline, $$...$$ for display
   */
  const renderMath = (text) => {
    if (!text) return '';
    
    try {
      // First, convert common notations
      let result = convertMathNotation(text);
      
      // Handle display math ($$...$$)
      result = result.replace(/\$\$([^$]+)\$\$/g, (match, math) => {
        try {
          return katex.renderToString(math.trim(), {
            displayMode: true,
            throwOnError: false,
            output: 'html'
          });
        } catch (e) {
          return match; // Return original if rendering fails
        }
      });
      
      // Handle inline math ($...$)
      result = result.replace(/\$([^$]+)\$/g, (match, math) => {
        try {
          return katex.renderToString(math.trim(), {
            displayMode: false,
            throwOnError: false,
            output: 'html'
          });
        } catch (e) {
          return match; // Return original if rendering fails
        }
      });
      
      return result;
    } catch (error) {
      console.error('Math rendering error:', error);
      return text; // Return original text if something goes wrong
    }
  };

  return {
    renderMath,
    convertMathNotation
  };
}
