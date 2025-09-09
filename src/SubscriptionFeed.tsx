import { useState } from "react";
import {
  List,
  ActionPanel,
  Action,
  Icon,
  showToast,
  Toast,
  LocalStorage,
  Color,
} from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { searchArxiv, getRecentPapers, generateBibTeX } from "./api/arxiv";
import { ArxivPaper, Subscription } from "./types";
import { format, isToday, isYesterday, differenceInDays } from "date-fns";
import { formatLatexTitle } from "./utils/latexFormatter";
import { generateGOSTCitation } from "./utils/gostCitation";
import { downloadPDF } from "./utils/pdfManager";

export function SubscriptionFeed({ subscription }: { subscription: Subscription }) {
  const { data: papers, isLoading } = useCachedPromise(
    async (sub: Subscription) => {
      try {
        let papers: ArxivPaper[] = [];
        
        if (sub.type === 'category') {
          papers = await getRecentPapers([sub.value], 100);
        } else if (sub.type === 'author') {
          const result = await searchArxiv(`au:"${sub.value}"`, {
            sortBy: 'submittedDate',
            sortOrder: 'descending'
          }, 50);
          papers = result.papers;
        } else if (sub.type === 'keyword') {
          const result = await searchArxiv(`all:"${sub.value}"`, {
            sortBy: 'submittedDate',
            sortOrder: 'descending'
          }, 50);
          papers = result.papers;
        }
        
        return papers;
      } catch (error) {
        showToast({ style: Toast.Style.Failure, title: "Failed to load papers" });
        return [];
      }
    },
    [subscription],
    {
      keepPreviousData: true,
    }
  );

  const groupedPapers = groupPapersByDate(papers || []);

  async function toggleBookmark(paper: ArxivPaper) {
    const bookmarksKey = 'bookmarks';
    const bookmarksStr = await LocalStorage.getItem<string>(bookmarksKey);
    const bookmarks = bookmarksStr ? JSON.parse(bookmarksStr) : [];
    
    const isBookmarked = bookmarks.some((b: any) => b.paperId === paper.id);
    
    if (isBookmarked) {
      const filtered = bookmarks.filter((b: any) => b.paperId !== paper.id);
      await LocalStorage.setItem(bookmarksKey, JSON.stringify(filtered));
      showToast({ style: Toast.Style.Success, title: "Removed from bookmarks" });
    } else {
      bookmarks.unshift({
        paperId: paper.id,
        paper,
        addedAt: new Date(),
        tags: []
      });
      await LocalStorage.setItem(bookmarksKey, JSON.stringify(bookmarks));
      showToast({ style: Toast.Style.Success, title: "Added to bookmarks" });
    }
  }

  const icon = subscription.type === 'category' ? Icon.Tag : 
               subscription.type === 'author' ? Icon.Person : 
               Icon.MagnifyingGlass;

  return (
    <List
      isLoading={isLoading}
      navigationTitle={`${subscription.name} (${papers?.length || 0} papers)`}
      searchBarPlaceholder="Search in this subscription..."
    >
      {Object.entries(groupedPapers).map(([dateLabel, papers]) => (
        <List.Section key={dateLabel} title={dateLabel} subtitle={`${papers.length} papers`}>
          {papers.map((paper) => (
            <FeedItem
              key={paper.id}
              paper={paper}
              subscription={subscription}
              onBookmark={() => toggleBookmark(paper)}
            />
          ))}
        </List.Section>
      ))}
      
      {papers?.length === 0 && !isLoading && (
        <List.EmptyView
          title="No papers found"
          description={`No recent papers for ${subscription.type}: ${subscription.value}`}
          icon={icon}
        />
      )}
    </List>
  );
}

function FeedItem({
  paper,
  subscription,
  onBookmark
}: {
  paper: ArxivPaper;
  subscription: Subscription;
  onBookmark: () => void;
}) {
  const categoryColor = getCategoryColor(paper.primaryCategory);
  const timeAgo = getTimeAgo(paper.published);
  const year = paper.published.getFullYear();
  const authorsStr = paper.authors.slice(0, 2).join(', ') + (paper.authors.length > 2 ? ' et al.' : '');
  
  return (
    <List.Item
      title={formatLatexTitle(paper.title)}
      subtitle={`${authorsStr}, ${year}`}
      accessories={[
        { tag: { value: paper.primaryCategory, color: categoryColor } },
        { text: timeAgo, tooltip: format(paper.published, 'MMM d, yyyy HH:mm') }
      ]}
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            <Action.OpenInBrowser title="Open in arXiv" url={paper.arxivUrl} />
            <Action
              title="Download and Open PDF"
              icon={Icon.Download}
              onAction={async () => {
                await downloadPDF(paper);
              }}
              shortcut={{ modifiers: ["cmd"], key: "d" }}
            />
            <Action
              title="Add to Bookmarks"
              icon={Icon.Bookmark}
              onAction={onBookmark}
              shortcut={{ modifiers: ["cmd"], key: "b" }}
            />
          </ActionPanel.Section>
          <ActionPanel.Section title="Citations">
            <Action.CopyToClipboard
              title="Copy BibTeX"
              content={generateBibTeX(paper)}
              icon={Icon.Document}
              shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
            />
            <Action.CopyToClipboard
              title="Copy GOST Citation"
              content={generateGOSTCitation(paper)}
              icon={Icon.Document}
              shortcut={{ modifiers: ["cmd", "shift"], key: "g" }}
            />
          </ActionPanel.Section>
          <ActionPanel.Section>
            <Action.CopyToClipboard
              title="Copy arXiv ID"
              content={paper.arxivId}
              shortcut={{ modifiers: ["cmd", "shift"], key: "i" }}
            />
            <Action.CopyToClipboard
              title="Copy Title"
              content={paper.title}
              shortcut={{ modifiers: ["cmd", "shift"], key: "t" }}
            />
            <Action.CopyToClipboard
              title="Copy Abstract"
              content={paper.abstract}
              shortcut={{ modifiers: ["cmd", "shift"], key: "a" }}
            />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}

function groupPapersByDate(papers: ArxivPaper[]) {
  const grouped: Record<string, ArxivPaper[]> = {};
  
  papers.forEach(paper => {
    const date = paper.published;
    let label: string;
    
    if (isToday(date)) {
      label = 'Today';
    } else if (isYesterday(date)) {
      label = 'Yesterday';
    } else if (differenceInDays(new Date(), date) < 7) {
      label = format(date, 'EEEE');
    } else if (differenceInDays(new Date(), date) < 30) {
      label = `${Math.floor(differenceInDays(new Date(), date) / 7)} weeks ago`;
    } else {
      label = format(date, 'MMMM yyyy');
    }
    
    if (!grouped[label]) {
      grouped[label] = [];
    }
    grouped[label].push(paper);
  });
  
  return grouped;
}

function getTimeAgo(date: Date): string {
  const days = differenceInDays(new Date(), date);
  
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function getCategoryColor(category: string): Color {
  if (category.startsWith('cs.')) return Color.Blue;
  if (category.startsWith('math.')) return Color.Green;
  if (category.startsWith('physics.') || category.includes('-ph')) return Color.Orange;
  if (category.startsWith('q-bio.')) return Color.Purple;
  if (category.startsWith('q-fin.')) return Color.Yellow;
  if (category.startsWith('stat.')) return Color.Red;
  if (category.startsWith('econ.')) return Color.Magenta;
  if (category.startsWith('eess.')) return Color.PrimaryText;
  return Color.SecondaryText;
}