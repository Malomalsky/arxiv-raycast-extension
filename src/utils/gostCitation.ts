import { ArxivPaper } from "../types";

export function generateGOSTCitation(paper: ArxivPaper): string {
  const authors = paper.authors.slice(0, 3);
  const authorsStr = authors.map(formatAuthorGOST).join(', ');
  const hasMoreAuthors = paper.authors.length > 3;
  const year = paper.published.getFullYear();
  
  const titleClean = paper.title.replace(/\s+/g, ' ').trim();
  
  let citation = '';
  
  if (authors.length === 1) {
    citation = `${authorsStr} ${titleClean} // arXiv preprint arXiv:${paper.arxivId}. ${year}.`;
  } else {
    citation = `${titleClean} / ${authorsStr}${hasMoreAuthors ? ' и др.' : ''} // arXiv preprint arXiv:${paper.arxivId}. ${year}.`;
  }
  
  if (paper.journalRef) {
    citation = citation.replace('// arXiv preprint', `// ${paper.journalRef}. ${year}. arXiv:`);
  }
  
  return citation;
}

function formatAuthorGOST(fullName: string): string {
  const parts = fullName.trim().split(' ');
  if (parts.length === 1) return parts[0];
  
  const lastName = parts[parts.length - 1];
  const initials = parts.slice(0, -1).map(n => n[0].toUpperCase() + '.').join(' ');
  
  return `${lastName} ${initials}`;
}

export function generateGOSTBibliography(paper: ArxivPaper): string {
  const authors = paper.authors.slice(0, 3);
  const authorsStr = authors.map(formatAuthorGOST).join(', ');
  const hasMoreAuthors = paper.authors.length > 3;
  const year = paper.published.getFullYear();
  
  const titleClean = paper.title.replace(/\s+/g, ' ').trim();
  
  let bibliography = '';
  
  if (authors.length === 1) {
    bibliography = `${authorsStr} ${titleClean} [Электронный ресурс] // arXiv.org : архив электронных препринтов. ${year}. URL: ${paper.arxivUrl} (дата обращения: ${new Date().toLocaleDateString('ru-RU')}).`;
  } else {
    bibliography = `${titleClean} [Электронный ресурс] / ${authorsStr}${hasMoreAuthors ? ' [и др.]' : ''} // arXiv.org : архив электронных препринтов. ${year}. URL: ${paper.arxivUrl} (дата обращения: ${new Date().toLocaleDateString('ru-RU')}).`;
  }
  
  return bibliography;
}