import { useEffect, useState } from "react";
import {
  List,
  ActionPanel,
  Action,
  Icon,
  showToast,
  Toast,
  LocalStorage,
  confirmAlert,
  Alert,
  Color,
  Clipboard,
} from "@raycast/api";
import { Bookmark, ArxivPaper } from "./types";
import { format } from "date-fns";
import { generateBibTeX } from "./api/arxiv";
import { formatLatexTitle } from "./utils/latexFormatter";
import { generateGOSTCitation } from "./utils/gostCitation";

export default function BookmarksCommand() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    loadBookmarks();
  }, []);

  async function loadBookmarks() {
    try {
      const bookmarksStr = await LocalStorage.getItem<string>('bookmarks');
      if (bookmarksStr) {
        const bookmarkList = JSON.parse(bookmarksStr);
        setBookmarks(bookmarkList);
      }
    } catch (error) {
      showToast({ style: Toast.Style.Failure, title: "Failed to load bookmarks" });
    } finally {
      setIsLoading(false);
    }
  }

  async function removeBookmark(paperId: string) {
    const confirmed = await confirmAlert({
      title: "Remove Bookmark",
      message: "Are you sure you want to remove this paper from bookmarks?",
      primaryAction: {
        title: "Remove",
        style: Alert.ActionStyle.Destructive,
      },
    });

    if (confirmed) {
      const filtered = bookmarks.filter(b => b.paperId !== paperId);
      setBookmarks(filtered);
      await LocalStorage.setItem('bookmarks', JSON.stringify(filtered));
      showToast({ style: Toast.Style.Success, title: "Removed from bookmarks" });
    }
  }

  async function clearAllBookmarks() {
    const confirmed = await confirmAlert({
      title: "Clear All Bookmarks",
      message: "Are you sure you want to remove all bookmarks? This cannot be undone.",
      primaryAction: {
        title: "Clear All",
        style: Alert.ActionStyle.Destructive,
      },
    });

    if (confirmed) {
      setBookmarks([]);
      await LocalStorage.setItem('bookmarks', JSON.stringify([]));
      showToast({ style: Toast.Style.Success, title: "All bookmarks cleared" });
    }
  }

  async function exportBookmarks() {
    const bibtex = bookmarks.map(b => generateBibTeX(b.paper)).join('\n\n');
    await Clipboard.copy(bibtex);
    showToast({ style: Toast.Style.Success, title: "BibTeX copied to clipboard" });
  }

  const filteredBookmarks = searchText
    ? bookmarks.filter(b => 
        b.paper.title.toLowerCase().includes(searchText.toLowerCase()) ||
        b.paper.authors.some(a => a.toLowerCase().includes(searchText.toLowerCase())) ||
        b.paper.abstract.toLowerCase().includes(searchText.toLowerCase()) ||
        b.tags.some(t => t.toLowerCase().includes(searchText.toLowerCase()))
      )
    : bookmarks;

  return (
    <List
      isLoading={isLoading}
      searchText={searchText}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search bookmarks..."
      navigationTitle={`Bookmarks (${bookmarks.length})`}
    >
      {filteredBookmarks.length > 0 ? (
        <List.Section title={`${filteredBookmarks.length} bookmarked papers`}>
          {filteredBookmarks.map((bookmark) => (
            <BookmarkItem
              key={bookmark.paperId}
              bookmark={bookmark}
              onRemove={() => removeBookmark(bookmark.paperId)}
            />
          ))}
        </List.Section>
      ) : searchText ? (
        <List.EmptyView
          title="No matching bookmarks"
          description="Try a different search term"
          icon={Icon.MagnifyingGlass}
        />
      ) : (
        <List.EmptyView
          title="No bookmarks yet"
          description="Search for papers and bookmark them to see them here"
          icon={Icon.Bookmark}
          actions={
            <ActionPanel>
              <Action.Open
                title="Search Papers"
                target="raycast://extensions/ivan/arxiv-pro/search"
                icon={Icon.MagnifyingGlass}
              />
            </ActionPanel>
          }
        />
      )}
      
      {bookmarks.length > 0 && (
        <List.Section>
          <List.Item
            title="Export All as BibTeX"
            icon={Icon.Download}
            actions={
              <ActionPanel>
                <Action
                  title="Export All as BibTeX"
                  onAction={exportBookmarks}
                  icon={Icon.Download}
                />
                <Action
                  title="Clear All Bookmarks"
                  onAction={clearAllBookmarks}
                  icon={Icon.Trash}
                  style={Action.Style.Destructive}
                />
              </ActionPanel>
            }
          />
        </List.Section>
      )}
    </List>
  );
}

function BookmarkItem({
  bookmark,
  onRemove
}: {
  bookmark: Bookmark;
  onRemove: () => void;
}) {
  const paper = bookmark.paper;
  const categoryColor = getCategoryColor(paper.primaryCategory);
  const addedDate = new Date(bookmark.addedAt);
  
  return (
    <List.Item
      title={formatLatexTitle(paper.title)}
      subtitle={paper.authors.slice(0, 2).join(', ') + (paper.authors.length > 2 ? ' et al.' : '')}
      accessories={[
        { tag: { value: paper.primaryCategory, color: categoryColor } },
        { text: format(addedDate, 'MMM d') },
        bookmark.rating && { text: '⭐'.repeat(bookmark.rating) },
        bookmark.tags.length > 0 && { 
          tag: { value: `${bookmark.tags.length} tags`, color: Color.SecondaryText } 
        }
      ].filter(Boolean) as any}
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
              title="Remove from Bookmarks"
              icon={Icon.BookmarkDisabled}
              onAction={onRemove}
              shortcut={{ modifiers: ["cmd"], key: "r" }}
              style={Action.Style.Destructive}
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
          <ActionPanel.Section>
            <Action.CopyToClipboard
              title="Copy arXiv ID"
              content={paper.arxivId}
            />
            <Action.CopyToClipboard
              title="Copy Title"
              content={paper.title}
            />
            <Action.CopyToClipboard
              title="Copy Abstract"
              content={paper.abstract}
            />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
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