import { ArxivPaper, Bookmark } from "../types";
import { readItems, updateItems } from "./storage";

export async function getBookmarks(): Promise<Bookmark[]> {
  const bookmarks = await readItems<Bookmark>("bookmarks");
  if (
    bookmarks.some(
      (bookmark) =>
        !bookmark?.paperId ||
        !bookmark.paper?.title ||
        !Array.isArray(bookmark.paper.authors) ||
        bookmark.paper.authors.some((author) => typeof author !== "string") ||
        !Array.isArray(bookmark.paper.categories) ||
        typeof bookmark.paper.primaryCategory !== "string" ||
        !Number.isFinite(Date.parse(bookmark.paper.published)) ||
        !Number.isFinite(Date.parse(bookmark.paper.updated)) ||
        !Array.isArray(bookmark.tags) ||
        bookmark.tags.some((tag) => typeof tag !== "string"),
    )
  ) {
    throw new Error(
      "Some saved bookmarks are invalid. They have not been changed.",
    );
  }
  return bookmarks;
}

export function setBookmark(paper: ArxivPaper, saved: boolean): Promise<void> {
  return updateItems<Bookmark>("bookmarks", (bookmarks) => {
    if (!saved)
      return bookmarks.filter((bookmark) => bookmark.paperId !== paper.id);
    if (bookmarks.some((bookmark) => bookmark.paperId === paper.id))
      return bookmarks;
    return [
      { paperId: paper.id, paper, addedAt: new Date().toISOString(), tags: [] },
      ...bookmarks,
    ];
  });
}

export function editBookmark(
  paperId: string,
  changes: Pick<Bookmark, "tags" | "notes" | "rating">,
): Promise<void> {
  if (
    changes.rating !== undefined &&
    (!Number.isInteger(changes.rating) ||
      changes.rating < 1 ||
      changes.rating > 5)
  ) {
    return Promise.reject(new Error("Choose a rating from 1 to 5."));
  }
  return updateItems<Bookmark>("bookmarks", (bookmarks) => {
    if (!bookmarks.some((bookmark) => bookmark.paperId === paperId))
      throw new Error("This paper is no longer bookmarked.");
    return bookmarks.map((bookmark) =>
      bookmark.paperId === paperId ? { ...bookmark, ...changes } : bookmark,
    );
  });
}

export function parseTags(value: string): string[] {
  const tags = value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  return tags.filter(
    (tag, index) =>
      tags.findIndex((other) => other.toLowerCase() === tag.toLowerCase()) ===
      index,
  );
}
