import type { ReactNode } from "react";
import { Action, ActionPanel, Icon, List } from "@raycast/api";
import { format } from "date-fns";
import { ArxivPaper } from "../types";
import type { Library } from "../hooks/useLibrary";
import { generateBibTeX } from "../api/arxiv";
import { generateGOSTCitation } from "../utils/gostCitation";
import {
  cleanLatexForDisplay,
  formatLatexTitle,
} from "../utils/latexFormatter";
import { downloadPDF, openPDFFolder } from "../utils/pdfManager";
import { EditBookmarkForm } from "./EditBookmarkForm";

export function PaperListItem({
  paper,
  library,
  showDetail,
  onToggleDetail,
  actions,
}: {
  paper: ArxivPaper;
  library: Library;
  showDetail: boolean;
  onToggleDetail: () => void;
  actions?: ReactNode;
}) {
  const bookmark = library.bookmarkById.get(paper.id);
  const personal = library.statusById.get(paper.id);
  const status = personal?.status || "new";
  const statusLabel =
    status === "read" ? "Read" : status === "reading" ? "Reading" : "Unread";
  const authors =
    paper.authors.slice(0, 2).join(", ") +
    (paper.authors.length > 2 ? " et al." : "");
  const published = format(new Date(paper.published), "d MMM yyyy");
  const accessories: List.Item.Accessory[] = [];
  if (paper.citationCount !== undefined)
    accessories.push({
      text: String(paper.citationCount),
      tooltip: `${paper.citationCount} citations on Semantic Scholar`,
    });
  if (bookmark)
    accessories.push({ icon: Icon.Bookmark, tooltip: "Bookmarked" });
  if (personal?.downloadedAt)
    accessories.push({ icon: Icon.Download, tooltip: "PDF downloaded" });
  if (!showDetail)
    accessories.push(
      { text: paper.primaryCategory, tooltip: paper.categories.join(", ") },
      { text: published, tooltip: "Published" },
    );

  return (
    <List.Item
      id={paper.id}
      title={formatLatexTitle(paper.title)}
      subtitle={showDetail ? undefined : authors}
      icon={
        status === "read"
          ? Icon.CheckCircle
          : status === "reading"
            ? Icon.Eye
            : Icon.Document
      }
      keywords={[
        ...paper.authors,
        ...paper.categories,
        ...(bookmark?.tags || []),
        bookmark?.notes || "",
        paper.abstract,
      ]}
      accessories={accessories}
      detail={
        showDetail ? (
          <List.Item.Detail
            markdown={`## ${formatLatexTitle(paper.title)}\n\n${cleanLatexForDisplay(paper.abstract)}${bookmark?.notes ? `\n\n---\n\n### Notes\n\n${bookmark.notes}` : ""}`}
            metadata={
              <List.Item.Detail.Metadata>
                <List.Item.Detail.Metadata.Label
                  title="Authors"
                  text={paper.authors.join(", ")}
                />
                <List.Item.Detail.Metadata.Label
                  title="Published"
                  text={published}
                />
                {paper.updated !== paper.published && (
                  <List.Item.Detail.Metadata.Label
                    title="Updated"
                    text={format(new Date(paper.updated), "d MMM yyyy")}
                  />
                )}
                <List.Item.Detail.Metadata.Label
                  title="Status"
                  text={statusLabel}
                />
                <List.Item.Detail.Metadata.TagList title="Categories">
                  {paper.categories.map((category) => (
                    <List.Item.Detail.Metadata.TagList.Item
                      key={category}
                      text={category}
                    />
                  ))}
                </List.Item.Detail.Metadata.TagList>
                {bookmark?.tags.length ? (
                  <List.Item.Detail.Metadata.TagList title="Tags">
                    {bookmark.tags.map((tag) => (
                      <List.Item.Detail.Metadata.TagList.Item
                        key={tag}
                        text={tag}
                      />
                    ))}
                  </List.Item.Detail.Metadata.TagList>
                ) : null}
                {bookmark?.rating ? (
                  <List.Item.Detail.Metadata.Label
                    title="Rating"
                    text={`${bookmark.rating} / 5`}
                  />
                ) : null}
                {paper.citationCount !== undefined && (
                  <List.Item.Detail.Metadata.Label
                    title="Citations"
                    text={String(paper.citationCount)}
                  />
                )}
                <List.Item.Detail.Metadata.Separator />
                <List.Item.Detail.Metadata.Link
                  title="arXiv"
                  text={paper.arxivId}
                  target={paper.arxivUrl}
                />
                {paper.doi && (
                  <List.Item.Detail.Metadata.Link
                    title="DOI"
                    text={paper.doi}
                    target={`https://doi.org/${paper.doi}`}
                  />
                )}
                {paper.journalRef && (
                  <List.Item.Detail.Metadata.Label
                    title="Journal"
                    text={paper.journalRef}
                  />
                )}
                {paper.comment && (
                  <List.Item.Detail.Metadata.Label
                    title="Comment"
                    text={cleanLatexForDisplay(paper.comment)}
                  />
                )}
              </List.Item.Detail.Metadata>
            }
          />
        ) : undefined
      }
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            <Action.OpenInBrowser title="Open on arXiv" url={paper.arxivUrl} />
            <Action
              title="Download PDF"
              icon={Icon.Download}
              shortcut={{ modifiers: ["cmd"], key: "d" }}
              onAction={async () => {
                const path = await downloadPDF(paper);
                if (path) await library.revalidate();
              }}
            />
            {!library.isLoading && !library.error && (
              <Action
                title={bookmark ? "Remove Bookmark" : "Bookmark Paper"}
                icon={Icon.Bookmark}
                onAction={() => library.toggleBookmark(paper)}
                shortcut={{ modifiers: ["cmd"], key: "b" }}
              />
            )}
            {bookmark && (
              <Action.Push
                title="Edit Bookmark"
                icon={Icon.Pencil}
                target={
                  <EditBookmarkForm bookmark={bookmark} library={library} />
                }
                shortcut={{ modifiers: ["cmd"], key: "e" }}
              />
            )}
          </ActionPanel.Section>
          {!library.isLoading && !library.error && (
            <ActionPanel.Section title="Reading">
              {status !== "reading" && (
                <Action
                  title="Mark as Reading"
                  icon={Icon.Eye}
                  onAction={() =>
                    library.changeReadingStatus(paper.id, "reading")
                  }
                />
              )}
              {status !== "read" && (
                <Action
                  title="Mark as Read"
                  icon={Icon.CheckCircle}
                  onAction={() => library.changeReadingStatus(paper.id, "read")}
                />
              )}
              {status !== "new" && (
                <Action
                  title="Mark as Unread"
                  icon={Icon.Circle}
                  onAction={() => library.changeReadingStatus(paper.id, "new")}
                />
              )}
            </ActionPanel.Section>
          )}
          <ActionPanel.Section title="Copy">
            <Action.CopyToClipboard
              title="Copy BibTeX"
              content={generateBibTeX(paper)}
              shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
            />
            <Action.CopyToClipboard
              title="Copy GOST Citation"
              content={generateGOSTCitation(paper)}
              shortcut={{ modifiers: ["cmd", "shift"], key: "g" }}
            />
            <Action.CopyToClipboard title="Copy URL" content={paper.arxivUrl} />
            <Action.CopyToClipboard title="Copy Title" content={paper.title} />
            <Action.CopyToClipboard
              title="Copy arXiv ID"
              content={paper.arxivId}
              shortcut={{ modifiers: ["cmd", "shift"], key: "i" }}
            />
            <Action.CopyToClipboard
              title="Copy Abstract"
              content={paper.abstract}
            />
          </ActionPanel.Section>
          <ActionPanel.Section>
            <Action
              title={showDetail ? "Hide Preview" : "Show Preview"}
              icon={Icon.AppWindowSidebarRight}
              onAction={onToggleDetail}
              shortcut={{ modifiers: ["cmd"], key: "y" }}
            />
            <Action
              title="Open PDF Folder"
              icon={Icon.Folder}
              onAction={openPDFFolder}
            />
          </ActionPanel.Section>
          {actions}
        </ActionPanel>
      }
    />
  );
}
