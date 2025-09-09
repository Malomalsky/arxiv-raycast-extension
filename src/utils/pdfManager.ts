import { getPreferenceValues, showToast, Toast, open } from "@raycast/api";
import { homedir } from "os";
import { join } from "path";
import { promises as fs } from "fs";
import fetch from "node-fetch";
import { ArxivPaper } from "../types";

interface Preferences {
  downloadPath: string;
  autoOpenPDF: boolean;
}

export async function downloadPDF(paper: ArxivPaper): Promise<string | null> {
  const preferences = getPreferenceValues<Preferences>();
  const downloadPath = preferences.downloadPath.replace("~", homedir());

  try {
    await fs.mkdir(downloadPath, { recursive: true });

    const fileName = generateFileName(paper);
    const filePath = join(downloadPath, fileName);

    const existingFile = await fs
      .access(filePath)
      .then(() => true)
      .catch(() => false);
    if (existingFile) {
      showToast({
        style: Toast.Style.Success,
        title: "PDF already downloaded",
        message: fileName,
      });

      if (preferences.autoOpenPDF) {
        await open(filePath);
      }
      return filePath;
    }

    showToast({
      style: Toast.Style.Animated,
      title: "Downloading PDF...",
      message: fileName,
    });

    const response = await fetch(paper.pdfUrl);
    if (!response.ok) throw new Error("Failed to download PDF");

    const buffer = await response.buffer();
    await fs.writeFile(filePath, buffer);

    showToast({
      style: Toast.Style.Success,
      title: "PDF downloaded",
      message: fileName,
    });

    if (preferences.autoOpenPDF) {
      await open(filePath);
    }

    return filePath;
  } catch (error) {
    showToast({
      style: Toast.Style.Failure,
      title: "Download failed",
      message: String(error),
    });
    return null;
  }
}

function generateFileName(paper: ArxivPaper): string {
  const firstAuthor = paper.authors[0]?.split(" ").pop() || "Unknown";
  const year = paper.published.getFullYear();
  const shortTitle = paper.title
    .split(" ")
    .slice(0, 5)
    .join(" ")
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .replace(/\s+/g, "_");

  return `${firstAuthor}_${year}_${shortTitle}.pdf`;
}

export async function openPDFFolder(): Promise<void> {
  const preferences = getPreferenceValues<Preferences>();
  const downloadPath = preferences.downloadPath.replace("~", homedir());

  try {
    await fs.mkdir(downloadPath, { recursive: true });
    await open(downloadPath);
  } catch (error) {
    showToast({
      style: Toast.Style.Failure,
      title: "Failed to open folder",
      message: String(error),
    });
  }
}
