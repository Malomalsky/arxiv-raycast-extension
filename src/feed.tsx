import { useEffect, useState } from "react";
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
import { getRecentPapers, generateBibTeX } from "./api/arxiv";
import { ArxivPaper, Subscription } from "./types";
import { format, isToday, isYesterday, differenceInDays } from "date-fns";
import { formatLatexTitle } from "./utils/latexFormatter";
import { generateGOSTCitation } from "./utils/gostCitation";

export default function FeedCommand() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  useEffect(() => {
    loadSubscriptions();
  }, []);

  async function loadSubscriptions() {
    try {
      const subsStr = await LocalStorage.getItem<string>("subscriptions");
      if (subsStr) {
        const subs = JSON.parse(subsStr);
        setSubscriptions(subs);
      }
    } catch (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Failed to load subscriptions",
      });
    }
  }

  const { data: papers, isLoading } = useCachedPromise(
    async (subs: Subscription[]) => {
      if (!subs || subs.length === 0) return [];

      try {
        const allPapers: ArxivPaper[] = [];

        const categories = subs
          .filter((s) => s.type === "category")
          .map((s) => s.value);
        if (categories.length > 0) {
          const categoryPapers = await getRecentPapers(categories, 50);
          allPapers.push(...categoryPapers);
        }

        const authors = subs.filter((s) => s.type === "author");
        for (const author of authors) {
          const { searchArxiv } = await import("./api/arxiv");
          const result = await searchArxiv(
            `au:"${author.value}"`,
            {
              sortBy: "submittedDate",
              sortOrder: "descending",
            },
            20,
          );
          allPapers.push(...result.papers);
        }

        const keywords = subs.filter((s) => s.type === "keyword");
        for (const keyword of keywords) {
          const { searchArxiv } = await import("./api/arxiv");
          const result = await searchArxiv(
            `all:"${keyword.value}"`,
            {
              sortBy: "submittedDate",
              sortOrder: "descending",
            },
            20,
          );
          allPapers.push(...result.papers);
        }

        const uniquePapers = Array.from(
          new Map(allPapers.map((p) => [p.id, p])).values(),
        ).sort((a, b) => b.published.getTime() - a.published.getTime());

        await LocalStorage.setItem(
          "subscriptions",
          JSON.stringify(
            subs.map((s) => ({
              ...s,
              lastChecked: new Date(),
            })),
          ),
        );

        return uniquePapers;
      } catch (error) {
        showToast({ style: Toast.Style.Failure, title: "Failed to load feed" });
        return [];
      }
    },
    [subscriptions],
    {
      keepPreviousData: true,
    },
  );

  const groupedPapers = groupPapersByDate(papers || []);

  async function toggleBookmark(paper: ArxivPaper) {
    const bookmarksKey = "bookmarks";
    const bookmarksStr = await LocalStorage.getItem<string>(bookmarksKey);
    const bookmarks = bookmarksStr ? JSON.parse(bookmarksStr) : [];

    const isBookmarked = bookmarks.some((b: any) => b.paperId === paper.id);

    if (isBookmarked) {
      const filtered = bookmarks.filter((b: any) => b.paperId !== paper.id);
      await LocalStorage.setItem(bookmarksKey, JSON.stringify(filtered));
      showToast({
        style: Toast.Style.Success,
        title: "Removed from bookmarks",
      });
    } else {
      bookmarks.unshift({
        paperId: paper.id,
        paper,
        addedAt: new Date(),
        tags: [],
      });
      await LocalStorage.setItem(bookmarksKey, JSON.stringify(bookmarks));
      showToast({ style: Toast.Style.Success, title: "Added to bookmarks" });
    }
  }

  if (subscriptions.length === 0) {
    return (
      <List>
        <List.EmptyView
          title="No subscriptions yet"
          description="Subscribe to categories to see papers in your feed"
          icon={Icon.Bookmark}
          actions={
            <ActionPanel>
              <Action.Open
                title="Manage Subscriptions"
                target="raycast://extensions/ivan/arxiv-pro/subscriptions"
                icon={Icon.Gear}
              />
            </ActionPanel>
          }
        />
      </List>
    );
  }

  return (
    <List
      isLoading={isLoading}
      navigationTitle={`Feed (${subscriptions.length} subscriptions)`}
    >
      {Object.entries(groupedPapers).map(([dateLabel, papers]) => (
        <List.Section
          key={dateLabel}
          title={dateLabel}
          subtitle={`${papers.length} papers`}
        >
          {papers.map((paper) => (
            <FeedItem
              key={paper.id}
              paper={paper}
              subscriptions={subscriptions}
              onBookmark={() => toggleBookmark(paper)}
            />
          ))}
        </List.Section>
      ))}

      {papers?.length === 0 && !isLoading && (
        <List.EmptyView
          title="No recent papers"
          description="Check back later for new papers in your subscribed categories"
          icon={Icon.Clock}
        />
      )}
    </List>
  );
}

function FeedItem({
  paper,
  subscriptions,
  onBookmark,
}: {
  paper: ArxivPaper;
  subscriptions: Subscription[];
  onBookmark: () => void;
}) {
  const categoryColor = getCategoryColor(paper.primaryCategory);
  const timeAgo = getTimeAgo(paper.published);

  return (
    <List.Item
      title={formatLatexTitle(paper.title)}
      subtitle={
        paper.authors.slice(0, 2).join(", ") +
        (paper.authors.length > 2 ? " et al." : "")
      }
      accessories={[
        { tag: { value: paper.primaryCategory, color: categoryColor } },
        { text: format(paper.published, "MMM d, yyyy"), tooltip: timeAgo },
      ]}
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            <Action.OpenInBrowser title="Open in arXiv" url={paper.arxivUrl} />
            <Action.OpenInBrowser
              title="Download PDF"
              url={paper.pdfUrl}
              icon={Icon.Download}
              shortcut={{ modifiers: ["cmd"], key: "d" }}
            />
            <Action
              title="Add to Bookmarks"
              icon={Icon.Bookmark}
              onAction={onBookmark}
              shortcut={{ modifiers: ["cmd"], key: "b" }}
            />
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
        </ActionPanel>
      }
    />
  );
}

function groupPapersByDate(papers: ArxivPaper[]) {
  const grouped: Record<string, ArxivPaper[]> = {};

  papers.forEach((paper) => {
    const date = paper.published;
    let label: string;

    if (isToday(date)) {
      label = "Today";
    } else if (isYesterday(date)) {
      label = "Yesterday";
    } else if (differenceInDays(new Date(), date) < 7) {
      label = format(date, "EEEE");
    } else if (differenceInDays(new Date(), date) < 30) {
      label = `${Math.floor(differenceInDays(new Date(), date) / 7)} weeks ago`;
    } else {
      label = format(date, "MMMM yyyy");
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

  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function getCategoryColor(category: string): Color {
  if (category.startsWith("cs.")) return Color.Blue;
  if (category.startsWith("math.")) return Color.Green;
  if (category.startsWith("physics.") || category.includes("-ph"))
    return Color.Orange;
  if (category.startsWith("q-bio.")) return Color.Purple;
  if (category.startsWith("q-fin.")) return Color.Yellow;
  if (category.startsWith("stat.")) return Color.Red;
  if (category.startsWith("econ.")) return Color.Magenta;
  if (category.startsWith("eess.")) return Color.PrimaryText;
  return Color.SecondaryText;
}
