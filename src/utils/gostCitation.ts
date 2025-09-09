import { ArxivPaper } from "../types";

export function generateGOSTCitation(paper: ArxivPaper): string {
  const authors = paper.authors.slice(0, 3);
  const hasMoreAuthors = paper.authors.length > 3;
  const year = paper.published.getFullYear();
  const accessDate = new Date().toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric'
  });
  
  const titleClean = paper.title.replace(/\s+/g, ' ').trim();
  
  let citation = '';
  
  if (authors.length === 1) {
    const authorGOST = formatAuthorForHeader(authors[0]);
    const authorResponsibility = formatAuthorForResponsibility(authors[0]);
    citation = `${authorGOST} ${titleClean} [Электронный ресурс] : препринт / ${authorResponsibility}. – arXiv:${paper.arxivId}. – ${year}. – URL: ${paper.arxivUrl} (дата обращения: ${accessDate}).`;
  } else {
    const authorsResponsibility = authors.map(formatAuthorForResponsibility).join(', ');
    citation = `${titleClean} [Электронный ресурс] : препринт / ${authorsResponsibility}${hasMoreAuthors ? ' [и др.]' : ''}. – arXiv:${paper.arxivId}. – ${year}. – URL: ${paper.arxivUrl} (дата обращения: ${accessDate}).`;
  }
  
  if (paper.journalRef) {
    citation = citation.replace(' : препринт', '');
    citation = citation.replace(`arXiv:${paper.arxivId}. – ${year}`, `${paper.journalRef}. – ${year}. – arXiv:${paper.arxivId}`);
  }
  
  return citation;
}

function formatAuthorForHeader(fullName: string): string {
  const parts = fullName.trim().split(' ');
  if (parts.length === 1) return parts[0];
  
  const lastName = parts[parts.length - 1];
  const initials = parts.slice(0, -1).map(n => n[0].toUpperCase() + '.').join(' ');
  
  return `${lastName} ${initials}`;
}

function formatAuthorForResponsibility(fullName: string): string {
  const parts = fullName.trim().split(' ');
  if (parts.length === 1) return parts[0];
  
  const lastName = parts[parts.length - 1];
  const initials = parts.slice(0, -1).map(n => n[0].toUpperCase() + '.').join(' ');
  
  return `${initials} ${lastName}`;
}

export function generateGOSTBibliography(paper: ArxivPaper): string {
  return generateGOSTCitation(paper);
}