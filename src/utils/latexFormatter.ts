import { replace } from "unicodeit";

export function formatLatexTitle(title: string): string {
  if (!title) return title;

  let formatted = title;

  formatted = formatted.replace(
    /\$\$([\s\S]+?)\$\$/g,
    (_match, content: string) => {
      return replace(content);
    },
  );

  formatted = formatted.replace(/\$([^$]+)\$/g, (_match, content: string) => {
    return replace(content);
  });

  formatted = formatted.replace(/\s+/g, " ").trim();

  return formatted;
}

export function cleanLatexForDisplay(text: string): string {
  let cleaned = text;

  cleaned = cleaned.replace(/\\begin\{[^}]+\}/g, "");
  cleaned = cleaned.replace(/\\end\{[^}]+\}/g, "");

  cleaned = cleaned.replace(/\\cite\{[^}]+\}/g, "");
  cleaned = cleaned.replace(/\\ref\{[^}]+\}/g, "");

  cleaned = cleaned.replace(/\\textbf\{([^}]+)\}/g, "$1");
  cleaned = cleaned.replace(/\\textit\{([^}]+)\}/g, "$1");
  cleaned = cleaned.replace(/\\emph\{([^}]+)\}/g, "$1");

  cleaned = formatLatexTitle(cleaned);

  return cleaned;
}
