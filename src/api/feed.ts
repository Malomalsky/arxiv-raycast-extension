import { ArxivPaper, Subscription } from "../types";
import { getRecentPapers, searchArxiv } from "./arxiv";
import { updateItems } from "../utils/storage";

export async function getFeedPapers(
  subscriptions: Pick<Subscription, "id" | "type" | "value">[],
  signal?: AbortSignal,
): Promise<ArxivPaper[]> {
  const papers: ArxivPaper[] = [];
  const categories = subscriptions
    .filter((subscription) => subscription.type === "category")
    .map((subscription) => subscription.value);
  if (categories.length)
    papers.push(...(await getRecentPapers(categories, 100, signal)));
  for (const subscription of subscriptions.filter(
    (item) => item.type !== "category",
  )) {
    const field = subscription.type === "author" ? "au" : "all";
    const value = subscription.value.replace(/["\\]/g, " ");
    const result = await searchArxiv(
      `${field}:"${value}"`,
      { sortBy: "submittedDate", sortOrder: "descending" },
      50,
      0,
      signal,
    );
    papers.push(...result.papers);
  }
  signal?.throwIfAborted();
  if (subscriptions.length) {
    const ids = new Set(subscriptions.map((subscription) => subscription.id));
    await updateItems<Subscription>("subscriptions", (items) =>
      items.map((item) =>
        ids.has(item.id)
          ? { ...item, lastChecked: new Date().toISOString() }
          : item,
      ),
    );
  }
  return [...new Map(papers.map((paper) => [paper.id, paper])).values()].sort(
    (a, b) => Date.parse(b.published) - Date.parse(a.published),
  );
}
