import { LocalStorage } from "@raycast/api";

export type ReadingStatus = "new" | "reading" | "read";

interface PaperStatus {
  paperId: string;
  status: ReadingStatus;
  updatedAt: Date;
  downloadedAt?: Date;
  notes?: string;
}

const STORAGE_KEY = "paper-reading-status";

export async function getReadingStatus(
  paperId: string,
): Promise<ReadingStatus> {
  try {
    const data = await LocalStorage.getItem<string>(STORAGE_KEY);
    if (!data) return "new";

    const statuses: PaperStatus[] = JSON.parse(data);
    const status = statuses.find((s) => s.paperId === paperId);
    return status?.status || "new";
  } catch {
    return "new";
  }
}

export async function setReadingStatus(
  paperId: string,
  status: ReadingStatus,
): Promise<void> {
  try {
    const data = await LocalStorage.getItem<string>(STORAGE_KEY);
    const statuses: PaperStatus[] = data ? JSON.parse(data) : [];

    const existingIndex = statuses.findIndex((s) => s.paperId === paperId);
    const paperStatus: PaperStatus = {
      paperId,
      status,
      updatedAt: new Date(),
    };

    if (existingIndex >= 0) {
      statuses[existingIndex] = { ...statuses[existingIndex], ...paperStatus };
    } else {
      statuses.push(paperStatus);
    }

    await LocalStorage.setItem(STORAGE_KEY, JSON.stringify(statuses));
  } catch (error) {
    console.error("Failed to save reading status:", error);
  }
}

export async function markAsDownloaded(paperId: string): Promise<void> {
  try {
    const data = await LocalStorage.getItem<string>(STORAGE_KEY);
    const statuses: PaperStatus[] = data ? JSON.parse(data) : [];

    const existingIndex = statuses.findIndex((s) => s.paperId === paperId);
    if (existingIndex >= 0) {
      statuses[existingIndex].downloadedAt = new Date();
    } else {
      statuses.push({
        paperId,
        status: "new",
        updatedAt: new Date(),
        downloadedAt: new Date(),
      });
    }

    await LocalStorage.setItem(STORAGE_KEY, JSON.stringify(statuses));
  } catch (error) {
    console.error("Failed to mark as downloaded:", error);
  }
}

export async function isDownloaded(paperId: string): Promise<boolean> {
  try {
    const data = await LocalStorage.getItem<string>(STORAGE_KEY);
    if (!data) return false;

    const statuses: PaperStatus[] = JSON.parse(data);
    const status = statuses.find((s) => s.paperId === paperId);
    return !!status?.downloadedAt;
  } catch {
    return false;
  }
}
