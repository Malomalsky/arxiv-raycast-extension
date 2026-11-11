import { LocalStorage } from "@raycast/api";

const API = "https://api.semanticscholar.org/graph/v1";
const CACHE_KEY = "citation-cache";
const CACHE_DURATION = 24 * 60 * 60 * 1000;
type CitationCache = Record<string, { count: number; timestamp: number }>;

export async function getBatchCitations(
  arxivIds: string[],
  signal?: AbortSignal,
): Promise<Map<string, number>> {
  signal?.throwIfAborted();
  const citations = new Map<string, number>();
  const raw = await LocalStorage.getItem<string>(CACHE_KEY);
  let cache: CitationCache = {};
  try {
    const parsed = raw ? JSON.parse(raw) : {};
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed))
      cache = parsed;
  } catch {
    // Citation counts can be fetched again if their cache is damaged.
  }
  const now = Date.now();
  cache = Object.fromEntries(
    Object.entries(cache).filter(
      ([, item]) =>
        item &&
        Number.isInteger(item.count) &&
        item.count >= 0 &&
        Number.isFinite(item.timestamp) &&
        now - item.timestamp < CACHE_DURATION,
    ),
  );
  const missing = [...new Set(arxivIds)].filter((id) => {
    const cached = cache[id] || cache[id.replace(/v\d+$/, "")];
    if (!cached) return true;
    citations.set(id, cached.count);
    return false;
  });
  for (let index = 0; index < missing.length; index += 500) {
    const batch = missing.slice(index, index + 500);
    const response = await fetch(`${API}/paper/batch?fields=citationCount`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ids: batch.map((id) => `ARXIV:${id.replace(/v\d+$/, "")}`),
      }),
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(20_000)])
        : AbortSignal.timeout(20_000),
    });
    if (!response.ok)
      throw new Error(
        response.status === 429
          ? "Citation counts are rate limited. Choose another sort order or try again shortly."
          : `Citation counts are unavailable (HTTP ${response.status}).`,
      );
    const data = (await response.json()) as ({
      citationCount?: number;
    } | null)[];
    if (!Array.isArray(data) || data.length !== batch.length)
      throw new Error("Semantic Scholar returned invalid citation data.");
    data.forEach((paper, position) => {
      const count = paper?.citationCount;
      if (typeof count === "number" && Number.isInteger(count) && count >= 0) {
        citations.set(batch[position], count);
        cache[batch[position].replace(/v\d+$/, "")] = { count, timestamp: now };
      }
    });
  }
  signal?.throwIfAborted();
  if (missing.length)
    await LocalStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  return citations;
}
