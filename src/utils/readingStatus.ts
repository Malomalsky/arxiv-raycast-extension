import { readItems, updateItems } from "./storage";

export type ReadingStatus = "new" | "reading" | "read";

export interface PaperStatus {
  paperId: string;
  status: ReadingStatus;
  updatedAt: string;
  downloadedAt?: string;
  notes?: string;
}

const STORAGE_KEY = "paper-reading-status";

export async function getPaperStatuses(): Promise<PaperStatus[]> {
  const statuses = await readItems<PaperStatus>(STORAGE_KEY);
  if (
    statuses.some(
      (item) =>
        !item?.paperId || !["new", "reading", "read"].includes(item.status),
    )
  ) {
    throw new Error(
      "Some saved reading states are invalid. They have not been changed.",
    );
  }
  return statuses;
}

export function setReadingStatus(
  paperId: string,
  status: ReadingStatus,
): Promise<void> {
  return updateStatus(paperId, { status, updatedAt: new Date().toISOString() });
}

export function markAsDownloaded(paperId: string): Promise<void> {
  return updateStatus(paperId, { downloadedAt: new Date().toISOString() });
}

function updateStatus(
  paperId: string,
  changes: Partial<PaperStatus>,
): Promise<void> {
  return updateItems<PaperStatus>(STORAGE_KEY, (statuses) => {
    const existing = statuses.find((item) => item.paperId === paperId);
    const updated: PaperStatus = {
      paperId,
      status: "new",
      updatedAt: new Date().toISOString(),
      ...existing,
      ...changes,
    };
    return existing
      ? statuses.map((item) => (item.paperId === paperId ? updated : item))
      : [...statuses, updated];
  });
}
