import * as unicodeMath from 'unicode-math';

export function formatLatexTitle(title: string): string {
  if (!title) return title;
  
  let formatted = title;
  
  // Process LaTeX math expressions with dollar signs
  formatted = formatted.replace(/\$([^$]+)\$/g, (match, content) => {
    try {
      // Use unicode-math to convert LaTeX to Unicode
      return unicodeMath.toUnicode(content);
    } catch (error) {
      // If unicode-math fails, return original
      return content;
    }
  });
  
  // Handle display math mode
  formatted = formatted.replace(/\$\$([^$]+)\$\$/g, (match, content) => {
    try {
      return unicodeMath.toUnicode(content);
    } catch (error) {
      return content;
    }
  });
  
  // Clean up extra spaces
  formatted = formatted.replace(/\s+/g, ' ').trim();
  
  return formatted;
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