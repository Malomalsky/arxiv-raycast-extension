import { Alert, confirmAlert, showToast, Toast } from "@raycast/api";
import { showFailureToast, usePromise } from "@raycast/utils";
import { ArxivPaper } from "../types";
import { getBookmarks, setBookmark } from "../utils/bookmarks";
import {
  getPaperStatuses,
  ReadingStatus,
  setReadingStatus,
} from "../utils/readingStatus";

async function loadLibrary() {
  const [bookmarks, statuses] = await Promise.all([
    getBookmarks(),
    getPaperStatuses(),
  ]);
  return { bookmarks, statuses };
}

export function useLibrary() {
  const { data, isLoading, error, revalidate } = usePromise(loadLibrary);
  const bookmarks = data?.bookmarks || [];

  async function update(
    action: () => Promise<unknown>,
    title: string,
  ): Promise<boolean> {
    if (isLoading || error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Library is unavailable",
        message: "Reload the library before making changes.",
      });
      return false;
    }
    try {
      await action();
      await revalidate();
      await showToast({ style: Toast.Style.Success, title });
      return true;
    } catch (error) {
      await showFailureToast(error, { title: "Could not update library" });
      return false;
    }
  }

  async function toggleBookmark(paper: ArxivPaper) {
    const existing = bookmarks.find(
      (bookmark) => bookmark.paperId === paper.id,
    );
    if (
      existing &&
      (existing.notes || existing.tags.length || existing.rating)
    ) {
      const confirmed = await confirmAlert({
        title: "Remove Bookmark?",
        message: "Its notes, tags and rating will also be removed.",
        primaryAction: {
          title: "Remove",
          style: Alert.ActionStyle.Destructive,
        },
      });
      if (!confirmed) return;
    }
    await update(
      () => setBookmark(paper, !existing),
      existing ? "Bookmark removed" : "Paper bookmarked",
    );
  }

  async function changeReadingStatus(paperId: string, status: ReadingStatus) {
    await update(
      () => setReadingStatus(paperId, status),
      status === "read"
        ? "Marked as read"
        : status === "reading"
          ? "Marked as reading"
          : "Marked as unread",
    );
  }

  return {
    bookmarks,
    bookmarkById: new Map(
      bookmarks.map((bookmark) => [bookmark.paperId, bookmark]),
    ),
    statusById: new Map(
      (data?.statuses || []).map((status) => [status.paperId, status]),
    ),
    isLoading,
    error,
    revalidate,
    update,
    toggleBookmark,
    changeReadingStatus,
  };
}

export type Library = ReturnType<typeof useLibrary>;
