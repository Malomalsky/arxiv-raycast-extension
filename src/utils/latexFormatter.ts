export function formatLatexTitle(title: string): string {
  if (!title) return title;
  
  let formatted = title;
  
  // Basic LaTeX math mode replacements
  formatted = formatted.replace(/\$([^$]+)\$/g, (match, content) => {
    // Simple subscript/superscript handling
    let result = content;
    result = result.replace(/_\{([^}]+)\}/g, '₍$1₎');
    result = result.replace(/\^{([^}]+)}/g, '⁽$1⁾');
    result = result.replace(/_([a-zA-Z0-9])/g, '₍$1₎');
    result = result.replace(/\^([a-zA-Z0-9])/g, '⁽$1⁾');
    
    // Greek letters
    result = result.replace(/\\alpha/g, 'α');
    result = result.replace(/\\beta/g, 'β');
    result = result.replace(/\\gamma/g, 'γ');
    result = result.replace(/\\delta/g, 'δ');
    result = result.replace(/\\epsilon/g, 'ε');
    result = result.replace(/\\theta/g, 'θ');
    result = result.replace(/\\lambda/g, 'λ');
    result = result.replace(/\\mu/g, 'μ');
    result = result.replace(/\\nu/g, 'ν');
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
    result = result.replace(/\\Sigma/g, 'Σ');
    result = result.replace(/\\Phi/g, 'Φ');
    result = result.replace(/\\Psi/g, 'Ψ');
    result = result.replace(/\\Omega/g, 'Ω');
    
    // Common math symbols
    result = result.replace(/\\infty/g, '∞');
    result = result.replace(/\\pm/g, '±');
    result = result.replace(/\\times/g, '×');
    result = result.replace(/\\div/g, '÷');
    result = result.replace(/\\neq/g, '≠');
    result = result.replace(/\\leq/g, '≤');
    result = result.replace(/\\geq/g, '≥');
    result = result.replace(/\\approx/g, '≈');
    result = result.replace(/\\sim/g, '∼');
    result = result.replace(/\\propto/g, '∝');
    result = result.replace(/\\in/g, '∈');
    result = result.replace(/\\subset/g, '⊂');
    result = result.replace(/\\cup/g, '∪');
    result = result.replace(/\\cap/g, '∩');
    result = result.replace(/\\rightarrow/g, '→');
    result = result.replace(/\\leftarrow/g, '←');
    result = result.replace(/\\Rightarrow/g, '⇒');
    result = result.replace(/\\Leftarrow/g, '⇐');
    result = result.replace(/\\partial/g, '∂');
    result = result.replace(/\\nabla/g, '∇');
    result = result.replace(/\\sum/g, '∑');
    result = result.replace(/\\prod/g, '∏');
    result = result.replace(/\\int/g, '∫');
    
    // Common functions
    result = result.replace(/\\sqrt\{([^}]+)\}/g, '√($1)');
    result = result.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1/$2)');
    
    // Clean up remaining backslashes
    result = result.replace(/\\/g, '');
    
    return result;
  });
  
  // Handle display math mode
  formatted = formatted.replace(/\$\$([^$]+)\$\$/g, (match, content) => {
    return formatLatexTitle('$' + content + '$');
  });
  
  // Clean up extra spaces
  formatted = formatted.replace(/\s+/g, ' ').trim();
  
  return formatted;
}

export function cleanLatexForDisplay(text: string): string {
  // Remove LaTeX commands but keep the content readable
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