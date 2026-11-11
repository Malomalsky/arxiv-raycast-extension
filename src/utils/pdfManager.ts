import { getPreferenceValues, open, showToast, Toast } from "@raycast/api";
import { randomUUID } from "node:crypto";
import { homedir } from "node:os";
import { isAbsolute, join } from "node:path";
import { promises as fs } from "node:fs";
import { ArxivPaper } from "../types";
import { markAsDownloaded } from "./readingStatus";

function getDownloadPath(): string {
  const preferences = getPreferenceValues<Preferences>();
  const path = (
    preferences.downloadPath?.trim() || "~/Downloads/Papers"
  ).replace(/^~(?=\/|$)/, homedir());
  if (!isAbsolute(path))
    throw new Error(
      "Set the PDF folder to an absolute path or a path starting with ~/.",
    );
  return path;
}

export async function downloadPDF(paper: ArxivPaper): Promise<string | null> {
  const toast = await showToast({
    style: Toast.Style.Animated,
    title: "Downloading PDF",
  });
  let temporaryPath: string | undefined;
  try {
    const preferences = getPreferenceValues<Preferences>();
    const downloadPath = getDownloadPath();
    await fs.mkdir(downloadPath, { recursive: true });
    const filePath = join(downloadPath, generateFileName(paper));
    const existing = await fs.access(filePath).then(
      () => true,
      () => false,
    );
    if (!existing) {
      const response = await fetch(paper.pdfUrl, {
        signal: AbortSignal.timeout(60_000),
      });
      if (!response.ok)
        throw new Error(`PDF download failed (HTTP ${response.status}).`);
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (String.fromCharCode(...bytes.subarray(0, 5)) !== "%PDF-")
        throw new Error("The server returned a document that is not a PDF.");
      temporaryPath = `${filePath}.${randomUUID()}.part`;
      await fs.writeFile(temporaryPath, bytes, { flag: "wx" });
      await fs.rename(temporaryPath, filePath);
      temporaryPath = undefined;
    }
    toast.style = Toast.Style.Success;
    toast.title = existing ? "PDF already saved" : "PDF saved";
    try {
      await markAsDownloaded(paper.id);
    } catch {
      toast.style = Toast.Style.Failure;
      toast.message =
        "The PDF was saved, but its reading state could not be updated.";
    }
    if (preferences.autoOpenPDF) {
      try {
        await open(filePath);
      } catch {
        toast.style = Toast.Style.Failure;
        toast.message = "The PDF was saved, but could not be opened.";
      }
    }
    return filePath;
  } catch (error) {
    toast.style = Toast.Style.Failure;
    toast.title = "Could Not Download PDF";
    toast.message = error instanceof Error ? error.message : String(error);
    return null;
  } finally {
    if (temporaryPath) await fs.unlink(temporaryPath).catch(() => undefined);
  }
}

function generateFileName(paper: ArxivPaper): string {
  const slug = (text: string, length: number) =>
    text
      .normalize("NFKD")
      .replace(/[^a-zA-Z0-9.-]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, length);
  const id = slug(paper.arxivId, 40);
  if (!id) throw new Error("This paper has no valid arXiv ID.");
  const author = slug(
    paper.authors[0]?.trim().split(/\s+/).pop() || "Paper",
    30,
  );
  const title = slug(paper.title, 60);
  return `${id}_${author}_${new Date(paper.published).getFullYear()}_${title}.pdf`;
}

export async function openPDFFolder(): Promise<void> {
  try {
    const path = getDownloadPath();
    await fs.mkdir(path, { recursive: true });
    await open(path);
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Could Not Open PDF Folder",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
