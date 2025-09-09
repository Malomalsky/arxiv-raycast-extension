import fetch from 'node-fetch';
import { LocalStorage } from "@raycast/api";

const SEMANTIC_SCHOLAR_API = 'https://api.semanticscholar.org/graph/v1';
const CACHE_KEY = 'citation-cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface S2Paper {
  paperId: string;
  title: string;
  citationCount: number;
  influentialCitationCount: number;
  year: number;
  authors: { name: string }[];
}

export async function getCitationCount(arxivId: string): Promise<number | null> {
  try {
    const response = await fetch(
      `${SEMANTIC_SCHOLAR_API}/paper/arXiv:${arxivId}?fields=citationCount`
    );
    
    if (!response.ok) return null;
    
    const data = await response.json() as { citationCount: number };
    return data.citationCount || 0;
  } catch (error) {
    console.error('Failed to fetch citations:', error);
    return null;
  }
}

export async function getBatchCitations(arxivIds: string[]): Promise<Map<string, number>> {
  const citations = new Map<string, number>();
  
  try {
    const cacheStr = await LocalStorage.getItem<string>(CACHE_KEY);
    const cache = cacheStr ? JSON.parse(cacheStr) : {};
    const now = Date.now();
    
    const toFetch: string[] = [];
    
    for (const id of arxivIds) {
      if (cache[id] && (now - cache[id].timestamp < CACHE_DURATION)) {
        citations.set(id, cache[id].count);
      } else {
        toFetch.push(id);
      }
    }
    
    if (toFetch.length > 0) {
      const batchSize = 10;
      for (let i = 0; i < toFetch.length; i += batchSize) {
        const batch = toFetch.slice(i, i + batchSize);
        const promises = batch.map(async (id) => {
          const count = await getCitationCount(id);
          if (count !== null) {
            citations.set(id, count);
            cache[id] = { count, timestamp: now };
          }
        });
        await Promise.all(promises);
        
        if (i + batchSize < toFetch.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      await LocalStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    }
  } catch (error) {
    console.error('Failed to fetch batch citations:', error);
  }
  
  return citations;
}

export async function getRelatedPapers(arxivId: string): Promise<S2Paper[]> {
  try {
    const response = await fetch(
      `${SEMANTIC_SCHOLAR_API}/paper/arXiv:${arxivId}/references?fields=title,citationCount,year,authors&limit=20`
    );
    
    if (!response.ok) return [];
    
    const data = await response.json() as { data: { citedPaper: S2Paper }[] };
    return data.data.map(item => item.citedPaper).filter(paper => paper.title);
  } catch (error) {
    console.error('Failed to fetch related papers:', error);
    return [];
  }
}