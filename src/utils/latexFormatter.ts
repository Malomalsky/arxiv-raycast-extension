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
    
    // Greek letters - lowercase
    result = result.replace(/\\alpha/g, 'α');
    result = result.replace(/\\beta/g, 'β');
    result = result.replace(/\\gamma/g, 'γ');
    result = result.replace(/\\delta/g, 'δ');
    result = result.replace(/\\epsilon/g, 'ε');
    result = result.replace(/\\varepsilon/g, 'ε');
    result = result.replace(/\\zeta/g, 'ζ');
    result = result.replace(/\\eta/g, 'η');
    result = result.replace(/\\theta/g, 'θ');
    result = result.replace(/\\vartheta/g, 'ϑ');
    result = result.replace(/\\iota/g, 'ι');
    result = result.replace(/\\kappa/g, 'κ');
    result = result.replace(/\\lambda/g, 'λ');
    result = result.replace(/\\mu/g, 'μ');
    result = result.replace(/\\nu/g, 'ν');
    result = result.replace(/\\xi/g, 'ξ');
    result = result.replace(/\\pi/g, 'π');
    result = result.replace(/\\varpi/g, 'ϖ');
    result = result.replace(/\\rho/g, 'ρ');
    result = result.replace(/\\varrho/g, 'ϱ');
    result = result.replace(/\\sigma/g, 'σ');
    result = result.replace(/\\varsigma/g, 'ς');
    result = result.replace(/\\tau/g, 'τ');
    result = result.replace(/\\upsilon/g, 'υ');
    result = result.replace(/\\phi/g, 'φ');
    result = result.replace(/\\varphi/g, 'φ');
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
    result = result.replace(/\\Upsilon/g, 'Υ');
    result = result.replace(/\\Phi/g, 'Φ');
    result = result.replace(/\\Psi/g, 'Ψ');
    result = result.replace(/\\Omega/g, 'Ω');
    
    // Common math symbols
    result = result.replace(/\\infty/g, '∞');
    result = result.replace(/\\pm/g, '±');
    result = result.replace(/\\mp/g, '∓');
    result = result.replace(/\\times/g, '×');
    result = result.replace(/\\div/g, '÷');
    result = result.replace(/\\cdot/g, '·');
    result = result.replace(/\\circ/g, '∘');
    result = result.replace(/\\ast/g, '∗');
    result = result.replace(/\\star/g, '⋆');
    result = result.replace(/\\dagger/g, '†');
    result = result.replace(/\\ddagger/g, '‡');
    result = result.replace(/\\bullet/g, '•');
    
    // Relations
    result = result.replace(/\\neq/g, '≠');
    result = result.replace(/\\ne/g, '≠');
    result = result.replace(/\\leq/g, '≤');
    result = result.replace(/\\le/g, '≤');
    result = result.replace(/\\geq/g, '≥');
    result = result.replace(/\\ge/g, '≥');
    result = result.replace(/\\ll/g, '≪');
    result = result.replace(/\\gg/g, '≫');
    result = result.replace(/\\approx/g, '≈');
    result = result.replace(/\\sim/g, '∼');
    result = result.replace(/\\simeq/g, '≃');
    result = result.replace(/\\cong/g, '≅');
    result = result.replace(/\\equiv/g, '≡');
    result = result.replace(/\\propto/g, '∝');
    result = result.replace(/\\perp/g, '⊥');
    result = result.replace(/\\parallel/g, '∥');
    
    // Set theory
    result = result.replace(/\\in/g, '∈');
    result = result.replace(/\\notin/g, '∉');
    result = result.replace(/\\ni/g, '∋');
    result = result.replace(/\\subset/g, '⊂');
    result = result.replace(/\\subseteq/g, '⊆');
    result = result.replace(/\\supset/g, '⊃');
    result = result.replace(/\\supseteq/g, '⊇');
    result = result.replace(/\\cup/g, '∪');
    result = result.replace(/\\cap/g, '∩');
    result = result.replace(/\\setminus/g, '∖');
    result = result.replace(/\\emptyset/g, '∅');
    result = result.replace(/\\varnothing/g, '∅');
    
    // Logic
    result = result.replace(/\\forall/g, '∀');
    result = result.replace(/\\exists/g, '∃');
    result = result.replace(/\\nexists/g, '∄');
    result = result.replace(/\\neg/g, '¬');
    result = result.replace(/\\lnot/g, '¬');
    result = result.replace(/\\land/g, '∧');
    result = result.replace(/\\wedge/g, '∧');
    result = result.replace(/\\lor/g, '∨');
    result = result.replace(/\\vee/g, '∨');
    result = result.replace(/\\oplus/g, '⊕');
    result = result.replace(/\\otimes/g, '⊗');
    
    // Arrows
    result = result.replace(/\\rightarrow/g, '→');
    result = result.replace(/\\to/g, '→');
    result = result.replace(/\\leftarrow/g, '←');
    result = result.replace(/\\gets/g, '←');
    result = result.replace(/\\leftrightarrow/g, '↔');
    result = result.replace(/\\Rightarrow/g, '⇒');
    result = result.replace(/\\Leftarrow/g, '⇐');
    result = result.replace(/\\Leftrightarrow/g, '⇔');
    result = result.replace(/\\iff/g, '⇔');
    result = result.replace(/\\implies/g, '⇒');
    result = result.replace(/\\mapsto/g, '↦');
    result = result.replace(/\\uparrow/g, '↑');
    result = result.replace(/\\downarrow/g, '↓');
    result = result.replace(/\\updownarrow/g, '↕');
    
    // Calculus
    result = result.replace(/\\partial/g, '∂');
    result = result.replace(/\\nabla/g, '∇');
    result = result.replace(/\\sum/g, '∑');
    result = result.replace(/\\prod/g, '∏');
    result = result.replace(/\\int/g, '∫');
    result = result.replace(/\\iint/g, '∬');
    result = result.replace(/\\iiint/g, '∭');
    result = result.replace(/\\oint/g, '∮');
    result = result.replace(/\\lim/g, 'lim');
    
    // Other symbols
    result = result.replace(/\\ldots/g, '…');
    result = result.replace(/\\cdots/g, '⋯');
    result = result.replace(/\\vdots/g, '⋮');
    result = result.replace(/\\ddots/g, '⋱');
    result = result.replace(/\\therefore/g, '∴');
    result = result.replace(/\\because/g, '∵');
    result = result.replace(/\\angle/g, '∠');
    result = result.replace(/\\triangle/g, '△');
    result = result.replace(/\\square/g, '□');
    result = result.replace(/\\diamond/g, '◊');
    result = result.replace(/\\clubsuit/g, '♣');
    result = result.replace(/\\diamondsuit/g, '♦');
    result = result.replace(/\\heartsuit/g, '♥');
    result = result.replace(/\\spadesuit/g, '♠');
    result = result.replace(/\\flat/g, '♭');
    result = result.replace(/\\natural/g, '♮');
    result = result.replace(/\\sharp/g, '♯');
    
    // Common functions
    result = result.replace(/\\sqrt\{([^}]+)\}/g, '√($1)');
    result = result.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1/$2)');
    
    // Math fonts
    result = result.replace(/\\mathbb\{([A-Z])\}/g, (match, letter) => {
      const blackboard = {
        'A': '𝔸', 'B': '𝔹', 'C': 'ℂ', 'D': '𝔻', 'E': '𝔼', 'F': '𝔽', 'G': '𝔾',
        'H': 'ℍ', 'I': '𝕀', 'J': '𝕁', 'K': '𝕂', 'L': '𝕃', 'M': '𝕄', 'N': 'ℕ',
        'O': '𝕆', 'P': 'ℙ', 'Q': 'ℚ', 'R': 'ℝ', 'S': '𝕊', 'T': '𝕋', 'U': '𝕌',
        'V': '𝕍', 'W': '𝕎', 'X': '𝕏', 'Y': '𝕐', 'Z': 'ℤ'
      };
      return blackboard[letter] || letter;
    });
    
    result = result.replace(/\\mathcal\{([A-Z])\}/g, (match, letter) => {
      const calligraphic = {
        'A': '𝒜', 'B': 'ℬ', 'C': '𝒞', 'D': '𝒟', 'E': 'ℰ', 'F': 'ℱ', 'G': '𝒢',
        'H': 'ℋ', 'I': 'ℐ', 'J': '𝒥', 'K': '𝒦', 'L': 'ℒ', 'M': 'ℳ', 'N': '𝒩',
        'O': '𝒪', 'P': '𝒫', 'Q': '𝒬', 'R': 'ℛ', 'S': '𝒮', 'T': '𝒯', 'U': '𝒰',
        'V': '𝒱', 'W': '𝒲', 'X': '𝒳', 'Y': '𝒴', 'Z': '𝒵'
      };
      return calligraphic[letter] || letter;
    });
    
    result = result.replace(/\\mathfrak\{([A-Za-z])\}/g, (match, letter) => {
      const fraktur = {
        'A': '𝔄', 'B': '𝔅', 'C': 'ℭ', 'D': '𝔇', 'E': '𝔈', 'F': '𝔉', 'G': '𝔊',
        'H': 'ℌ', 'I': 'ℑ', 'J': '𝔍', 'K': '𝔎', 'L': '𝔏', 'M': '𝔐', 'N': '𝔑',
        'O': '𝔒', 'P': '𝔓', 'Q': '𝔔', 'R': 'ℜ', 'S': '𝔖', 'T': '𝔗', 'U': '𝔘',
        'V': '𝔙', 'W': '𝔚', 'X': '𝔛', 'Y': '𝔜', 'Z': 'ℨ',
        'a': '𝔞', 'b': '𝔟', 'c': '𝔠', 'd': '𝔡', 'e': '𝔢', 'f': '𝔣', 'g': '𝔤',
        'h': '𝔥', 'i': '𝔦', 'j': '𝔧', 'k': '𝔨', 'l': '𝔩', 'm': '𝔪', 'n': '𝔫',
        'o': '𝔬', 'p': '𝔭', 'q': '𝔮', 'r': '𝔯', 's': '𝔰', 't': '𝔱', 'u': '𝔲',
        'v': '𝔳', 'w': '𝔴', 'x': '𝔵', 'y': '𝔶', 'z': '𝔷'
      };
      return fraktur[letter] || letter;
    });
    
    // Accents (simplified)
    result = result.replace(/\\hat\{([^}]+)\}/g, '$1̂');
    result = result.replace(/\\tilde\{([^}]+)\}/g, '$1̃');
    result = result.replace(/\\bar\{([^}]+)\}/g, '$1̄');
    result = result.replace(/\\vec\{([^}]+)\}/g, '$1⃗');
    result = result.replace(/\\dot\{([^}]+)\}/g, '$1̇');
    result = result.replace(/\\ddot\{([^}]+)\}/g, '$1̈');
    
    // Common abbreviations
    result = result.replace(/\\ell/g, 'ℓ');
    result = result.replace(/\\hbar/g, 'ℏ');
    result = result.replace(/\\aleph/g, 'ℵ');
    result = result.replace(/\\beth/g, 'ℶ');
    result = result.replace(/\\gimel/g, 'ℷ');
    result = result.replace(/\\daleth/g, 'ℸ');
    result = result.replace(/\\wp/g, '℘');
    result = result.replace(/\\Im/g, 'ℑ');
    result = result.replace(/\\Re/g, 'ℜ');
    
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