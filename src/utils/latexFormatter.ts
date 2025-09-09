export function formatLatexTitle(title: string): string {
  if (!title) return title;
  
  let formatted = title;
  
  // Process LaTeX math expressions with dollar signs
  formatted = formatted.replace(/\$([^$]+)\$/g, (match, content) => {
    return parseLatexContent(content);
  });
  
  // Handle display math mode
  formatted = formatted.replace(/\$\$([^$]+)\$\$/g, (match, content) => {
    return parseLatexContent(content);
  });
  
  // Clean up extra spaces
  formatted = formatted.replace(/\s+/g, ' ').trim();
  
  return formatted;
}

function parseLatexContent(content: string): string {
  let result = content;
  
  // Handle subscripts with braces first
  result = result.replace(/_\{([^}]+)\}/g, (match, sub) => {
    return convertToSubscript(sub);
  });
  
  // Handle single character subscripts
  result = result.replace(/_([A-Za-z0-9])/g, (match, sub) => {
    return convertToSubscript(sub);
  });
  
  // Handle superscripts with braces first
  result = result.replace(/\^\{([^}]+)\}/g, (match, sup) => {
    return convertToSuperscript(sup);
  });
  
  // Handle single character superscripts
  result = result.replace(/\^([A-Za-z0-9])/g, (match, sup) => {
    return convertToSuperscript(sup);
  });
  
  // Greek letters
  result = result.replace(/\\alpha/g, 'α');
  result = result.replace(/\\beta/g, 'β');
  result = result.replace(/\\gamma/g, 'γ');
  result = result.replace(/\\delta/g, 'δ');
  result = result.replace(/\\epsilon/g, 'ε');
  result = result.replace(/\\zeta/g, 'ζ');
  result = result.replace(/\\eta/g, 'η');
  result = result.replace(/\\theta/g, 'θ');
  result = result.replace(/\\iota/g, 'ι');
  result = result.replace(/\\kappa/g, 'κ');
  result = result.replace(/\\lambda/g, 'λ');
  result = result.replace(/\\mu/g, 'μ');
  result = result.replace(/\\nu/g, 'ν');
  result = result.replace(/\\xi/g, 'ξ');
  result = result.replace(/\\pi/g, 'π');
  result = result.replace(/\\rho/g, 'ρ');
  result = result.replace(/\\sigma/g, 'σ');
  result = result.replace(/\\tau/g, 'τ');
  result = result.replace(/\\phi/g, 'φ');
  result = result.replace(/\\chi/g, 'χ');
  result = result.replace(/\\psi/g, 'ψ');
  result = result.replace(/\\omega/g, 'ω');
  
  // Capital Greek letters
  result = result.replace(/\\Gamma/g, 'Γ');
  result = result.replace(/\\Delta/g, 'Δ');
  result = result.replace(/\\Theta/g, 'Θ');
  result = result.replace(/\\Lambda/g, 'Λ');
  result = result.replace(/\\Xi/g, 'Ξ');
  result = result.replace(/\\Pi/g, 'Π');
  result = result.replace(/\\Sigma/g, 'Σ');
  result = result.replace(/\\Phi/g, 'Φ');
  result = result.replace(/\\Psi/g, 'Ψ');
  result = result.replace(/\\Omega/g, 'Ω');
  
  // Common math symbols
  result = result.replace(/\\infty/g, '∞');
  result = result.replace(/\\pm/g, '±');
  result = result.replace(/\\times/g, '×');
  result = result.replace(/\\cdot/g, '·');
  result = result.replace(/\\leq/g, '≤');
  result = result.replace(/\\geq/g, '≥');
  result = result.replace(/\\neq/g, '≠');
  result = result.replace(/\\approx/g, '≈');
  result = result.replace(/\\sim/g, '∼');
  result = result.replace(/\\subset/g, '⊂');
  result = result.replace(/\\in/g, '∈');
  result = result.replace(/\\rightarrow/g, '→');
  result = result.replace(/\\leftarrow/g, '←');
  result = result.replace(/\\Rightarrow/g, '⇒');
  result = result.replace(/\\sum/g, '∑');
  result = result.replace(/\\prod/g, '∏');
  result = result.replace(/\\int/g, '∫');
  result = result.replace(/\\partial/g, '∂');
  result = result.replace(/\\nabla/g, '∇');
  
  // Functions
  result = result.replace(/\\sqrt\{([^}]+)\}/g, '√($1)');
  result = result.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1/$2)');
  
  // Remove remaining backslashes
  result = result.replace(/\\/g, '');
  
  return result;
}

function convertToSubscript(text: string): string {
  const subscriptMap: Record<string, string> = {
    '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
    '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
    'a': 'ₐ', 'e': 'ₑ', 'h': 'ₕ', 'i': 'ᵢ', 'j': 'ⱼ',
    'k': 'ₖ', 'l': 'ₗ', 'm': 'ₘ', 'n': 'ₙ', 'o': 'ₒ',
    'p': 'ₚ', 'r': 'ᵣ', 's': 'ₛ', 't': 'ₜ', 'u': 'ᵤ',
    'v': 'ᵥ', 'x': 'ₓ',
    '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎'
  };
  
  return text.split('').map(char => subscriptMap[char.toLowerCase()] || char).join('');
}

function convertToSuperscript(text: string): string {
  const superscriptMap: Record<string, string> = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    'a': 'ᵃ', 'b': 'ᵇ', 'c': 'ᶜ', 'd': 'ᵈ', 'e': 'ᵉ',
    'f': 'ᶠ', 'g': 'ᵍ', 'h': 'ʰ', 'i': 'ⁱ', 'j': 'ʲ',
    'k': 'ᵏ', 'l': 'ˡ', 'm': 'ᵐ', 'n': 'ⁿ', 'o': 'ᵒ',
    'p': 'ᵖ', 'r': 'ʳ', 's': 'ˢ', 't': 'ᵗ', 'u': 'ᵘ',
    'v': 'ᵛ', 'w': 'ʷ', 'x': 'ˣ', 'y': 'ʸ', 'z': 'ᶻ',
    '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾'
  };
  
  return text.split('').map(char => superscriptMap[char.toLowerCase()] || char).join('');
}

export function cleanLatexForDisplay(text: string): string {
  let cleaned = text;
  
  // Remove common LaTeX environments
  cleaned = cleaned.replace(/\\begin\{[^}]+\}/g, '');
  cleaned = cleaned.replace(/\\end\{[^}]+\}/g, '');
  
  // Remove citations
  cleaned = cleaned.replace(/\\cite\{[^}]+\}/g, '');
  cleaned = cleaned.replace(/\\ref\{[^}]+\}/g, '');
  
  // Remove formatting commands
  cleaned = cleaned.replace(/\\textbf\{([^}]+)\}/g, '$1');
  cleaned = cleaned.replace(/\\textit\{([^}]+)\}/g, '$1');
  cleaned = cleaned.replace(/\\emph\{([^}]+)\}/g, '$1');
  
  // Apply math formatting
  cleaned = formatLatexTitle(cleaned);
  
  return cleaned;
}