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
    
    // Convert exponents with parentheses: e^(2x) → e^(²ˣ) using superscript
    result = result.replace(/\^(\([^)]+\))/g, (match, expr) => {
      // Remove outer parentheses
      let inner = expr.slice(1, -1);
      
      const superscriptMap = {
        '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
        '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
        'a': 'ᵃ', 'b': 'ᵇ', 'c': 'ᶜ', 'd': 'ᵈ', 'e': 'ᵉ',
        'f': 'ᶠ', 'g': 'ᵍ', 'h': 'ʰ', 'i': 'ⁱ', 'j': 'ʲ',
        'k': 'ᵏ', 'l': 'ˡ', 'm': 'ᵐ', 'n': 'ⁿ', 'o': 'ᵒ',
        'p': 'ᵖ', 'r': 'ʳ', 's': 'ˢ', 't': 'ᵗ', 'u': 'ᵘ',
        'v': 'ᵛ', 'w': 'ʷ', 'x': 'ˣ', 'y': 'ʸ', 'z': 'ᶻ',
        '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾'
      };
      
      const converted = inner.split('').map(char => 
        superscriptMap[char.toLowerCase()] || char
      ).join('');
      
      return converted;
    });
    
    // Convert simple exponents: x^2, x^3, etc. to superscript Unicode
    result = result.replace(/\^2\b/g, '²');
    result = result.replace(/\^3\b/g, '³');
    result = result.replace(/\^1\b/g, '¹');
    
    // Convert other single digit exponents to superscript
    result = result.replace(/\^(\d)\b/g, (match, power) => {
      const superscripts = {
        '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
        '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'
      };
      return superscripts[power] || match;
    });
    
    // Convert multi-digit exponents to superscript
    result = result.replace(/\^(\d{2,})\b/g, (match, power) => {
      const superscripts = {
        '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
        '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'
      };
      return power.split('').map(d => superscripts[d] || d).join('');
    });
    
    // Convert single letter exponents: x^n, x^y, etc.
    result = result.replace(/\^([a-zA-Z])\b/g, (match, letter) => {
      const superscriptMap = {
        'a': 'ᵃ', 'b': 'ᵇ', 'c': 'ᶜ', 'd': 'ᵈ', 'e': 'ᵉ',
        'f': 'ᶠ', 'g': 'ᵍ', 'h': 'ʰ', 'i': 'ⁱ', 'j': 'ʲ',
        'k': 'ᵏ', 'l': 'ˡ', 'm': 'ᵐ', 'n': 'ⁿ', 'o': 'ᵒ',
        'p': 'ᵖ', 'r': 'ʳ', 's': 'ˢ', 't': 'ᵗ', 'u': 'ᵘ',
        'v': 'ᵛ', 'w': 'ʷ', 'x': 'ˣ', 'y': 'ʸ', 'z': 'ᶻ'
      };
      return superscriptMap[letter.toLowerCase()] || match;
    });
    
    // Convert sqrt() to radical symbol
    result = result.replace(/sqrt\(([^)]+)\)/gi, '√($1)');
    result = result.replace(/√\(([^)]+)\)/g, '√$1');
    
    // Convert cbrt() (cube root) to ∛
    result = result.replace(/cbrt\(([^)]+)\)/gi, '∛($1)');
    result = result.replace(/∛\(([^)]+)\)/g, '∛$1');
    
    // Convert nth root notation: root(n, x) → ⁿ√x
    result = result.replace(/root\((\d+),\s*([^)]+)\)/gi, (match, n, x) => {
      const superscripts = {
        '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
        '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'
      };
      const nSuper = n.split('').map(d => superscripts[d] || d).join('');
      return `${nSuper}√${x}`;
    });
    
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
      let result = String(text);
      
      // First, protect LaTeX expressions from conversion
      const latexBlocks = [];
      
      // Extract and store display math ($$...$$)
      result = result.replace(/\$\$([^$]+)\$\$/g, (match, math) => {
        const placeholder = `__LATEX_DISPLAY_${latexBlocks.length}__`;
        latexBlocks.push({ type: 'display', content: math.trim() });
        return placeholder;
      });
      
      // Extract and store inline math ($...$)
      result = result.replace(/\$([^$]+)\$/g, (match, math) => {
        const placeholder = `__LATEX_INLINE_${latexBlocks.length}__`;
        latexBlocks.push({ type: 'inline', content: math.trim() });
        return placeholder;
      });
      
      // Apply common notation conversions to non-LaTeX text
      result = convertMathNotation(result);
      
      // Escape HTML in non-math parts
      result = result.replace(/[&<>"']/g, (char) => {
        const escapeMap = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;'
        };
        return escapeMap[char];
      });
      
      // Restore and render LaTeX blocks
      latexBlocks.forEach((block, index) => {
        try {
          const rendered = katex.renderToString(block.content, {
            displayMode: block.type === 'display',
            throwOnError: false,
            output: 'html',
            trust: false
          });
          
          if (block.type === 'display') {
            result = result.replace(`__LATEX_DISPLAY_${index}__`, rendered);
          } else {
            result = result.replace(`__LATEX_INLINE_${index}__`, rendered);
          }
        } catch (e) {
          console.warn('KaTeX rendering error:', e);
          // Restore original if rendering fails
          const original = block.type === 'display' 
            ? `$$${block.content}$$` 
            : `$${block.content}$`;
          result = result.replace(
            block.type === 'display' 
              ? `__LATEX_DISPLAY_${index}__`
              : `__LATEX_INLINE_${index}__`,
            original
          );
        }
      });
      
      return result;
    } catch (error) {
      console.error('Math rendering error:', error);
      return String(text); // Return original text if something goes wrong
    }
  };

  return {
    renderMath,
    convertMathNotation
  };
}
