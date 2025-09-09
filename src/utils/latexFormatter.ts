import katex from 'katex';

export function formatLatexTitle(title: string): string {
  if (!title) return title;
  
  let formatted = title;
  
  // Process LaTeX math expressions
  formatted = formatted.replace(/\$\$?([^$]+)\$\$?/g, (match, content) => {
    try {
      // Parse LaTeX to get the structure
      const parsed = katex.renderToString(content, {
        throwOnError: false,
        output: 'mathml',
        displayMode: false
      });
      
      // Extract text content from MathML
      const textContent = parsed
        .replace(/<[^>]*>/g, '') // Remove all HTML/MathML tags
        .replace(/&[^;]+;/g, (entity) => {
          // Convert HTML entities to Unicode
          const entities: Record<string, string> = {
            '&alpha;': 'α', '&beta;': 'β', '&gamma;': 'γ', '&delta;': 'δ',
            '&epsilon;': 'ε', '&zeta;': 'ζ', '&eta;': 'η', '&theta;': 'θ',
            '&iota;': 'ι', '&kappa;': 'κ', '&lambda;': 'λ', '&mu;': 'μ',
            '&nu;': 'ν', '&xi;': 'ξ', '&pi;': 'π', '&rho;': 'ρ',
            '&sigma;': 'σ', '&tau;': 'τ', '&upsilon;': 'υ', '&phi;': 'φ',
            '&chi;': 'χ', '&psi;': 'ψ', '&omega;': 'ω',
            '&Alpha;': 'Α', '&Beta;': 'Β', '&Gamma;': 'Γ', '&Delta;': 'Δ',
            '&Epsilon;': 'Ε', '&Zeta;': 'Ζ', '&Eta;': 'Η', '&Theta;': 'Θ',
            '&Iota;': 'Ι', '&Kappa;': 'Κ', '&Lambda;': 'Λ', '&Mu;': 'Μ',
            '&Nu;': 'Ν', '&Xi;': 'Ξ', '&Pi;': 'Π', '&Rho;': 'Ρ',
            '&Sigma;': 'Σ', '&Tau;': 'Τ', '&Upsilon;': 'Υ', '&Phi;': 'Φ',
            '&Chi;': 'Χ', '&Psi;': 'Ψ', '&Omega;': 'Ω',
            '&infin;': '∞', '&plusmn;': '±', '&times;': '×', '&divide;': '÷',
            '&ne;': '≠', '&le;': '≤', '&ge;': '≥', '&asymp;': '≈',
            '&sim;': '∼', '&prop;': '∝', '&isin;': '∈', '&notin;': '∉',
            '&sub;': '⊂', '&sup;': '⊃', '&sube;': '⊆', '&supe;': '⊇',
            '&cup;': '∪', '&cap;': '∩', '&empty;': '∅',
            '&forall;': '∀', '&exist;': '∃', '&not;': '¬', '&and;': '∧',
            '&or;': '∨', '&rarr;': '→', '&larr;': '←', '&harr;': '↔',
            '&rArr;': '⇒', '&lArr;': '⇐', '&hArr;': '⇔',
            '&part;': '∂', '&nabla;': '∇', '&sum;': '∑', '&prod;': '∏',
            '&int;': '∫', '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>',
            '&#x2212;': '−', '&#x221E;': '∞', '&#x2260;': '≠', '&#x2264;': '≤',
            '&#x2265;': '≥', '&#x2248;': '≈', '&#x223C;': '∼', '&#x221D;': '∝',
            '&#x2208;': '∈', '&#x2209;': '∉', '&#x2282;': '⊂', '&#x2283;': '⊃',
            '&#x2286;': '⊆', '&#x2287;': '⊇', '&#x222A;': '∪', '&#x2229;': '∩',
            '&#x2205;': '∅', '&#x2200;': '∀', '&#x2203;': '∃', '&#x00AC;': '¬',
            '&#x2227;': '∧', '&#x2228;': '∨', '&#x2192;': '→', '&#x2190;': '←',
            '&#x2194;': '↔', '&#x21D2;': '⇒', '&#x21D0;': '⇐', '&#x21D4;': '⇔',
            '&#x2202;': '∂', '&#x2207;': '∇', '&#x2211;': '∑', '&#x220F;': '∏',
            '&#x222B;': '∫'
          };
          return entities[entity] || entity;
        })
        .replace(/\s+/g, ' ')
        .trim();
      
      return textContent || fallbackParse(content);
    } catch (error) {
      // Fallback to simple parsing if KaTeX fails
      return fallbackParse(content);
    }
  });
  
  // Clean up extra spaces
  formatted = formatted.replace(/\s+/g, ' ').trim();
  
  return formatted;
}

function fallbackParse(content: string): string {
  let result = content;
  
  // Basic subscript/superscript handling
  result = result.replace(/_\{([^}]+)\}/g, '₍$1₎');
  result = result.replace(/\^{([^}]+)}/g, '⁽$1⁾');
  result = result.replace(/_([a-zA-Z0-9])/g, '₍$1₎');
  result = result.replace(/\^([a-zA-Z0-9])/g, '⁽$1⁾');
  
  // Greek letters
  const greekLetters: Record<string, string> = {
    '\\alpha': 'α', '\\beta': 'β', '\\gamma': 'γ', '\\delta': 'δ',
    '\\epsilon': 'ε', '\\varepsilon': 'ε', '\\zeta': 'ζ', '\\eta': 'η',
    '\\theta': 'θ', '\\vartheta': 'ϑ', '\\iota': 'ι', '\\kappa': 'κ',
    '\\lambda': 'λ', '\\mu': 'μ', '\\nu': 'ν', '\\xi': 'ξ',
    '\\pi': 'π', '\\varpi': 'ϖ', '\\rho': 'ρ', '\\varrho': 'ϱ',
    '\\sigma': 'σ', '\\varsigma': 'ς', '\\tau': 'τ', '\\upsilon': 'υ',
    '\\phi': 'φ', '\\varphi': 'φ', '\\chi': 'χ', '\\psi': 'ψ', '\\omega': 'ω',
    '\\Gamma': 'Γ', '\\Delta': 'Δ', '\\Theta': 'Θ', '\\Lambda': 'Λ',
    '\\Xi': 'Ξ', '\\Pi': 'Π', '\\Sigma': 'Σ', '\\Upsilon': 'Υ',
    '\\Phi': 'Φ', '\\Psi': 'Ψ', '\\Omega': 'Ω'
  };
  
  Object.entries(greekLetters).forEach(([latex, unicode]) => {
    result = result.replace(new RegExp(latex.replace(/\\/g, '\\\\'), 'g'), unicode);
  });
  
  // Math symbols
  const mathSymbols: Record<string, string> = {
    '\\infty': '∞', '\\pm': '±', '\\mp': '∓', '\\times': '×', '\\div': '÷',
    '\\cdot': '·', '\\neq': '≠', '\\ne': '≠', '\\leq': '≤', '\\le': '≤',
    '\\geq': '≥', '\\ge': '≥', '\\ll': '≪', '\\gg': '≫', '\\approx': '≈',
    '\\sim': '∼', '\\simeq': '≃', '\\cong': '≅', '\\equiv': '≡', '\\propto': '∝',
    '\\in': '∈', '\\notin': '∉', '\\subset': '⊂', '\\supset': '⊃',
    '\\subseteq': '⊆', '\\supseteq': '⊇', '\\cup': '∪', '\\cap': '∩',
    '\\emptyset': '∅', '\\varnothing': '∅', '\\forall': '∀', '\\exists': '∃',
    '\\neg': '¬', '\\lnot': '¬', '\\land': '∧', '\\wedge': '∧', '\\lor': '∨',
    '\\vee': '∨', '\\rightarrow': '→', '\\to': '→', '\\leftarrow': '←',
    '\\leftrightarrow': '↔', '\\Rightarrow': '⇒', '\\Leftarrow': '⇐',
    '\\Leftrightarrow': '⇔', '\\iff': '⇔', '\\partial': '∂', '\\nabla': '∇',
    '\\sum': '∑', '\\prod': '∏', '\\int': '∫', '\\oint': '∮',
    '\\ldots': '…', '\\cdots': '⋯', '\\vdots': '⋮', '\\ddots': '⋱'
  };
  
  Object.entries(mathSymbols).forEach(([latex, unicode]) => {
    result = result.replace(new RegExp(latex.replace(/\\/g, '\\\\'), 'g'), unicode);
  });
  
  // Functions
  result = result.replace(/\\sqrt\{([^}]+)\}/g, '√($1)');
  result = result.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1/$2)');
  
  // Clean up remaining backslashes
  result = result.replace(/\\/g, '');
  
  return result;
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