import fetch from 'node-fetch';
import { parseStringPromise } from 'xml2js';
import { format, subDays, subMonths, subYears } from 'date-fns';
import { ArxivPaper, SearchFilter } from '../types';

const ARXIV_API_BASE = 'http://export.arxiv.org/api/query';
const ARXIV_RSS_BASE = 'http://rss.arxiv.org/rss';
const REQUEST_DELAY = 3000; // 3 seconds between requests per API guidelines

let lastRequestTime = 0;

async function throttleRequest() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < REQUEST_DELAY) {
    await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY - timeSinceLastRequest));
  }
  lastRequestTime = Date.now();
}

export async function searchArxiv(
  query: string,
  filter?: SearchFilter,
  maxResults: number = 20,
  start: number = 0
): Promise<{ papers: ArxivPaper[]; totalResults: number }> {
  await throttleRequest();

  let searchQuery = query;
  
  // Add date filter if specified
  if (filter?.dateRange && filter.dateRange !== 'all') {
    const dateFilter = buildDateFilter(filter.dateRange, filter.customDateStart, filter.customDateEnd);
    if (dateFilter) {
      searchQuery = searchQuery ? `${searchQuery}+AND+${dateFilter}` : dateFilter;
    }
  }

  // Add category filter if specified
  if (filter?.categories && filter.categories.length > 0) {
    const categoryFilter = filter.categories.map(cat => `cat:${cat}`).join('+OR+');
    searchQuery = searchQuery ? `${searchQuery}+AND+(${categoryFilter})` : categoryFilter;
  }

  const params = new URLSearchParams({
    search_query: searchQuery || 'all:*',
    start: start.toString(),
    max_results: maxResults.toString(),
    sortBy: filter?.sortBy || 'relevance',
    sortOrder: filter?.sortOrder || 'descending'
  });

  const url = `${ARXIV_API_BASE}?${params}`;
  
  try {
    const response = await fetch(url);
    const xmlText = await response.text();
    const result = await parseStringPromise(xmlText);
    
    const feed = result.feed;
    const totalResults = parseInt(feed['opensearch:totalResults']?.[0] || '0');
    const entries = feed.entry || [];
    
    const papers: ArxivPaper[] = entries.map(parseArxivEntry);
    
    return { papers, totalResults };
  } catch (error) {
    console.error('Error searching arXiv:', error);
    throw new Error('Failed to search arXiv papers');
  }
}

function parseArxivEntry(entry: any): ArxivPaper {
  const id = entry.id[0];
  const idParts = id.split('/');
  const arxivId = id.split('/abs/')[1] || idParts[idParts.length - 1];
  
  const authors = entry.author?.map((a: any) => a.name[0]) || [];
  const categories = entry.category?.map((c: any) => c.$.term) || [];
  
  const links = entry.link || [];
  const pdfLink = links.find((l: any) => l.$.type === 'application/pdf');
  const arxivLink = links.find((l: any) => l.$.type === 'text/html');
  
  return {
    id: arxivId,
    arxivId: arxivId,
    title: cleanText(entry.title[0]),
    authors,
    abstract: cleanText(entry.summary[0]),
    categories,
    primaryCategory: entry['arxiv:primary_category']?.[0]?.$.term || categories[0] || '',
    published: new Date(entry.published[0]),
    updated: new Date(entry.updated[0]),
    pdfUrl: pdfLink?.$.href || `https://arxiv.org/pdf/${arxivId}.pdf`,
    arxivUrl: arxivLink?.$.href || `https://arxiv.org/abs/${arxivId}`,
    comment: entry['arxiv:comment']?.[0] || undefined,
    journalRef: entry['arxiv:journal_ref']?.[0] || undefined,
    doi: entry['arxiv:doi']?.[0] || undefined
  };
}

function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, ' ')
    .trim();
}

function buildDateFilter(
  dateRange: string,
  customStart?: Date,
  customEnd?: Date
): string {
  let startDate: Date;
  let endDate = new Date();
  
  switch (dateRange) {
    case 'today':
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'week':
      startDate = subDays(endDate, 7);
      break;
    case 'month':
      startDate = subMonths(endDate, 1);
      break;
    case 'year':
      startDate = subYears(endDate, 1);
      break;
    case 'custom':
      if (!customStart || !customEnd) return '';
      startDate = customStart;
      endDate = customEnd;
      break;
    default:
      return '';
  }
  
  const startStr = format(startDate, 'yyyyMMdd') + '*';
  const endStr = format(endDate, 'yyyyMMdd') + '*';
  
  return `submittedDate:[${startStr}+TO+${endStr}]`;
}

export async function getRecentPapers(
  categories: string[],
  maxResults: number = 20
): Promise<ArxivPaper[]> {
  const filter: SearchFilter = {
    sortBy: 'submittedDate',
    sortOrder: 'descending',
    categories
  };
  
  const result = await searchArxiv('', filter, maxResults);
  return result.papers;
}

export async function searchByAuthor(
  authorName: string,
  maxResults: number = 20
): Promise<ArxivPaper[]> {
  const query = `au:"${authorName}"`;
  const result = await searchArxiv(query, undefined, maxResults);
  return result.papers;
}

export async function getPaperById(arxivId: string): Promise<ArxivPaper | null> {
  const query = `id:${arxivId}`;
  const result = await searchArxiv(query, undefined, 1);
  return result.papers[0] || null;
}

export function buildSmartQuery(params: {
  title?: string;
  author?: string;
  abstract?: string;
  category?: string;
  allFields?: string;
}): string {
  const parts: string[] = [];
  
  if (params.title) {
    parts.push(`ti:"${params.title}"`);
  }
  if (params.author) {
    parts.push(`au:"${params.author}"`);
  }
  if (params.abstract) {
    parts.push(`abs:"${params.abstract}"`);
  }
  if (params.category) {
    parts.push(`cat:${params.category}`);
  }
  if (params.allFields) {
    parts.push(`all:"${params.allFields}"`);
  }
  
  return parts.join('+AND+');
}

export function generateBibTeX(paper: ArxivPaper): string {
  const year = paper.published.getFullYear();
  const firstAuthor = paper.authors[0]?.split(' ').pop() || 'Unknown';
  const key = `${firstAuthor}${year}${paper.arxivId.replace('.', '')}`;
  
  return `@article{${key},
  title={${paper.title}},
  author={${paper.authors.join(' and ')}},
  journal={arXiv preprint arXiv:${paper.arxivId}},
  year={${year}},
  url={${paper.arxivUrl}}
}`;
}