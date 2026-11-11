import { parseStringPromise } from "xml2js";
import { startOfDay, subDays, subMonths, subYears } from "date-fns";
import { setTimeout as delay } from "node:timers/promises";
import { ArxivPaper, SearchFilter } from "../types";

const ARXIV_API_BASE = "https://export.arxiv.org/api/query";
const REQUEST_DELAY = 3000;
let lastRequestTime = 0;
let requestQueue = Promise.resolve();

async function throttleRequest(signal?: AbortSignal) {
  const request = requestQueue.then(async () => {
    signal?.throwIfAborted();
    const wait = REQUEST_DELAY - (Date.now() - lastRequestTime);
    if (wait > 0) await delay(wait, undefined, { signal });
    signal?.throwIfAborted();
    lastRequestTime = Date.now();
  });
  requestQueue = request.catch(() => undefined);
  await request;
}

interface AtomEntry {
  id?: string[];
  title?: string[];
  summary?: string[];
  published?: string[];
  updated?: string[];
  author?: { name?: string[] }[];
  category?: { $?: { term?: string } }[];
  "arxiv:primary_category"?: { $?: { term?: string } }[];
  "arxiv:comment"?: string[];
  "arxiv:journal_ref"?: string[];
  "arxiv:doi"?: string[];
}

export async function searchArxiv(
  query: string,
  filter?: SearchFilter,
  maxResults = 30,
  start = 0,
  signal?: AbortSignal,
): Promise<{ papers: ArxivPaper[]; totalResults: number }> {
  await throttleRequest(signal);
  const parts = query.trim() ? [`(${query.trim()})`] : [];
  if (filter?.categories?.length) {
    parts.push(
      `(${filter.categories.map((category) => `cat:${category}`).join(" OR ")})`,
    );
  }
  if (filter?.dateRange && filter.dateRange !== "all") {
    const dateFilter = buildDateFilter(filter);
    if (dateFilter) parts.push(dateFilter);
  }
  const params = new URLSearchParams({
    search_query: parts.join(" AND ") || "all:*",
    start: String(start),
    max_results: String(maxResults),
    sortBy:
      filter?.sortBy === "citationCount"
        ? "relevance"
        : filter?.sortBy || "relevance",
    sortOrder: filter?.sortOrder || "descending",
  });
  const response = await fetch(`${ARXIV_API_BASE}?${params}`, {
    signal: signal
      ? AbortSignal.any([signal, AbortSignal.timeout(30_000)])
      : AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    throw new Error(
      response.status === 429
        ? "arXiv is receiving too many requests. Try again shortly."
        : `arXiv is unavailable (HTTP ${response.status}).`,
    );
  }
  const result = (await parseStringPromise(await response.text())) as {
    feed?: { entry?: AtomEntry[]; "opensearch:totalResults"?: string[] };
  };
  if (!result.feed) throw new Error("arXiv returned an invalid response.");
  const papers = (result.feed.entry || []).map(parseArxivEntry);
  const totalResults = Number(
    result.feed["opensearch:totalResults"]?.[0] ?? papers.length,
  );
  if (!Number.isFinite(totalResults))
    throw new Error("arXiv returned an invalid result count.");
  return { papers, totalResults };
}

function parseArxivEntry(entry: AtomEntry): ArxivPaper {
  const sourceId = entry.id?.[0] || "";
  if (sourceId.includes("/api/errors")) {
    throw new Error(
      cleanText(entry.summary?.[0] || "arXiv could not process this query."),
    );
  }
  const arxivId = sourceId.split("/abs/")[1];
  const published = entry.published?.[0];
  const updated = entry.updated?.[0] || published;
  if (
    !arxivId ||
    !entry.title?.[0] ||
    !published ||
    !updated ||
    !Number.isFinite(Date.parse(published)) ||
    !Number.isFinite(Date.parse(updated))
  ) {
    throw new Error("arXiv returned an incomplete paper.");
  }
  const categories = (entry.category || []).flatMap((category) =>
    category.$?.term ? [category.$.term] : [],
  );
  return {
    id: arxivId,
    arxivId,
    title: cleanText(entry.title[0]),
    authors: (entry.author || []).flatMap((author) =>
      author.name?.[0] ? [cleanText(author.name[0])] : [],
    ),
    abstract: cleanText(entry.summary?.[0] || ""),
    categories,
    primaryCategory:
      entry["arxiv:primary_category"]?.[0]?.$?.term || categories[0] || "",
    published,
    updated,
    pdfUrl: `https://arxiv.org/pdf/${arxivId}`,
    arxivUrl: `https://arxiv.org/abs/${arxivId}`,
    comment: entry["arxiv:comment"]?.[0],
    journalRef: entry["arxiv:journal_ref"]?.[0],
    doi: entry["arxiv:doi"]?.[0],
  };
}

function cleanText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function buildDateFilter(filter: SearchFilter): string {
  const end =
    filter.dateRange === "custom" && filter.customDateEnd
      ? new Date(filter.customDateEnd)
      : new Date();
  let start: Date;
  switch (filter.dateRange) {
    case "today":
      start = startOfDay(end);
      break;
    case "week":
      start = subDays(end, 7);
      break;
    case "month":
      start = subMonths(end, 1);
      break;
    case "year":
      start = subYears(end, 1);
      break;
    case "custom":
      if (!filter.customDateStart || !filter.customDateEnd) return "";
      start = new Date(filter.customDateStart);
      break;
    default:
      return "";
  }
  if (
    !Number.isFinite(start.getTime()) ||
    !Number.isFinite(end.getTime()) ||
    start > end
  ) {
    throw new Error("Choose a valid date range.");
  }
  const timestamp = (date: Date) =>
    date.toISOString().replace(/[-:T]/g, "").slice(0, 12);
  return `submittedDate:[${timestamp(start)} TO ${timestamp(end)}]`;
}

export async function getRecentPapers(
  categories: string[],
  maxResults = 50,
  signal?: AbortSignal,
): Promise<ArxivPaper[]> {
  const result = await searchArxiv(
    "",
    { sortBy: "submittedDate", sortOrder: "descending", categories },
    maxResults,
    0,
    signal,
  );
  return result.papers;
}

export function generateBibTeX(paper: ArxivPaper): string {
  const year = new Date(paper.published).getFullYear();
  const firstAuthor = paper.authors[0]?.trim().split(/\s+/).pop() || "Unknown";
  const key = `${firstAuthor}${year}${paper.arxivId.replace(/[^a-zA-Z0-9]/g, "")}`;
  return `@article{${key},
  title={${paper.title}},
  author={${paper.authors.join(" and ")}},
  journal={arXiv preprint arXiv:${paper.arxivId}},
  year={${year}},
  url={${paper.arxivUrl}}
}`;
}
