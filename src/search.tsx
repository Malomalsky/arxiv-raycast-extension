import { useEffect, useState } from "react";
import {
  List,
  ActionPanel,
  Action,
  Icon,
  showToast,
  Toast,
  getPreferenceValues,
  LocalStorage,
  Detail,
  Color,
} from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { searchArxiv, buildSmartQuery, generateBibTeX } from "./api/arxiv";
import { getBatchCitations } from "./api/semanticScholar";
import { ArxivPaper, SearchFilter, SearchHistory, ARXIV_CATEGORIES } from "./types";
import { format } from "date-fns";
import { downloadPDF } from "./utils/pdfManager";
import { getReadingStatus, setReadingStatus, isDownloaded } from "./utils/readingStatus";
import { generateGOSTCitation } from "./utils/gostCitation";
import { formatLatexTitle } from "./utils/latexFormatter";

interface Preferences {
  defaultSortBy: 'relevance' | 'submittedDate' | 'lastUpdatedDate';
  defaultDateRange: 'week' | 'month' | 'year' | 'all';
  favoriteCategories: string;
}

export default function SearchCommand() {
  const [searchText, setSearchText] = useState("");
  const [filter, setFilter] = useState<SearchFilter>({
    sortBy: 'relevance',
    sortOrder: 'descending',
    dateRange: 'all'
  });
  const [isShowingDetail, setIsShowingDetail] = useState(false);
  
  const preferences = getPreferenceValues<Preferences>();

  useEffect(() => {
    setFilter({
      sortBy: preferences.defaultSortBy || 'relevance',
      sortOrder: 'descending',
      dateRange: 'all'
    });
  }, []);

  const { data, isLoading, revalidate } = useCachedPromise(
    async (query: string, filter: SearchFilter) => {
      if (!query || query.length < 1) {
        return { papers: [], totalResults: 0 };
      }

      // Save to search history
      const history: SearchHistory = {
        query,
        timestamp: new Date(),
        resultsCount: 0
      };
      
      try {
        const maxResults = filter.sortBy === 'citationCount' ? 100 : 30;
        const result = await searchArxiv(query, filter, maxResults);
        history.resultsCount = result.totalResults;
        
        const historyKey = 'search-history';
        const existingHistory = await LocalStorage.getItem<string>(historyKey);
        const historyArray = existingHistory ? JSON.parse(existingHistory) : [];
        historyArray.unshift(history);
        await LocalStorage.setItem(historyKey, JSON.stringify(historyArray.slice(0, 100)));
        
        let papersWithMetadata = result.papers;
        
        if (filter.sortBy === 'citationCount') {
          showToast({ style: Toast.Style.Animated, title: "Loading citations..." });
          const arxivIds = result.papers.map(p => p.arxivId);
          const citations = await getBatchCitations(arxivIds);
          
          papersWithMetadata = result.papers.map(paper => ({
            ...paper,
            citationCount: citations.get(paper.arxivId) || 0
          }));
          
          papersWithMetadata.sort((a, b) => {
            const aCount = a.citationCount || 0;
            const bCount = b.citationCount || 0;
            return bCount - aCount;
          });
          
          papersWithMetadata = papersWithMetadata.slice(0, 30);
        }
        
        // Skip reading status check for performance
        
        return { papers: papersWithMetadata, totalResults: result.totalResults };
      } catch (error) {
        showToast({ style: Toast.Style.Failure, title: "Search failed", message: String(error) });
        return { papers: [], totalResults: 0 };
      }
    },
    [searchText, filter],
    {
      keepPreviousData: true,
    }
  );

  const papers = data?.papers || [];
  const totalResults = data?.totalResults || 0;

  return (
    <List
      isLoading={isLoading}
      searchText={searchText}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search papers (use ti:, au:, abs:, cat: for specific fields)"
      isShowingDetail={isShowingDetail}
      searchBarAccessory={
        <List.Dropdown
          tooltip="Sort By"
          value={filter.sortBy}
          onChange={(value) => {
            setFilter({
              ...filter,
              sortBy: value as any
            });
            revalidate();
          }}
        >
          <List.Dropdown.Item title="Relevance" value="relevance" />
          <List.Dropdown.Item title="Most Recent" value="submittedDate" />
          <List.Dropdown.Item title="Most Cited" value="citationCount" />
          <List.Dropdown.Item title="Recently Updated" value="lastUpdatedDate" />
        </List.Dropdown>
      }
    >
      {searchText.length > 0 && (
        <List.Section title={`Found ${totalResults} papers`} subtitle={filter.dateRange !== 'all' ? `From last ${filter.dateRange}` : 'All time'}>
          {papers.map((paper) => (
            <PaperListItem
              key={paper.id}
              paper={paper}
              isShowingDetail={isShowingDetail}
              onToggleDetail={() => setIsShowingDetail(!isShowingDetail)}
            />
          ))}
        </List.Section>
      )}
      
      {searchText.length === 0 && (
        <List.EmptyView
          title="Start typing to search arXiv"
          description="Use prefixes: ti: for title, au: for author, abs: for abstract, cat: for category"
          icon={Icon.MagnifyingGlass}
        />
      )}
    </List>
  );
}

function PaperListItem({
  paper,
  isShowingDetail,
  onToggleDetail
}: {
  paper: ArxivPaper;
  isShowingDetail: boolean;
  onToggleDetail: () => void;
}) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  
  useEffect(() => {
    checkIfBookmarked();
  }, []);
  
  async function checkIfBookmarked() {
    const bookmarks = await LocalStorage.getItem<string>('bookmarks');
    if (bookmarks) {
      const bookmarkList = JSON.parse(bookmarks);
      setIsBookmarked(bookmarkList.some((b: any) => b.paperId === paper.id));
    }
  }
  
  async function toggleBookmark() {
    const bookmarksKey = 'bookmarks';
    const bookmarksStr = await LocalStorage.getItem<string>(bookmarksKey);
    const bookmarks = bookmarksStr ? JSON.parse(bookmarksStr) : [];
    
    if (isBookmarked) {
      const filtered = bookmarks.filter((b: any) => b.paperId !== paper.id);
      await LocalStorage.setItem(bookmarksKey, JSON.stringify(filtered));
      setIsBookmarked(false);
      showToast({ style: Toast.Style.Success, title: "Removed from bookmarks" });
    } else {
      bookmarks.unshift({
        paperId: paper.id,
        paper,
        addedAt: new Date(),
        tags: []
      });
      await LocalStorage.setItem(bookmarksKey, JSON.stringify(bookmarks));
      setIsBookmarked(true);
      showToast({ style: Toast.Style.Success, title: "Added to bookmarks" });
    }
  }
  
  const categoryColor = getCategoryColor(paper.primaryCategory);
  const year = paper.published.getFullYear();
  const authorsStr = paper.authors.slice(0, 2).join(', ') + (paper.authors.length > 2 ? ' et al.' : '');
  
  const accessories = [];
  
  if (paper.citationCount !== undefined && paper.citationCount > 0) {
    accessories.push({ text: `${paper.citationCount}`, tooltip: `${paper.citationCount} citations` });
  }
  
  accessories.push({ tag: { value: paper.primaryCategory, color: categoryColor } });
  
  if (paper.isDownloaded) {
    accessories.push({ icon: Icon.Checkmark, tooltip: "Downloaded" });
  } else if (paper.readingStatus === 'read') {
    accessories.push({ icon: Icon.CheckCircle, tooltip: "Read" });
  }
  
  return (
    <List.Item
      id={paper.id}
      title={formatLatexTitle(paper.title)}
      subtitle={`${authorsStr}, ${year}`}
      accessories={accessories}
      detail={
        isShowingDetail && (
          <List.Item.Detail
            markdown={generatePaperMarkdown(paper)}
            metadata={
              <List.Item.Detail.Metadata>
                <List.Item.Detail.Metadata.Label title="arXiv ID" text={paper.arxivId} />
                <List.Item.Detail.Metadata.Label title="Published" text={formattedDate} />
                <List.Item.Detail.Metadata.Label title="Updated" text={format(paper.updated, 'MMM d, yyyy')} />
                <List.Item.Detail.Metadata.Separator />
                <List.Item.Detail.Metadata.Label title="Authors" />
                {paper.authors.map((author, i) => (
                  <List.Item.Detail.Metadata.Label key={i} title="" text={author} />
                ))}
                <List.Item.Detail.Metadata.Separator />
                <List.Item.Detail.Metadata.TagList title="Categories">
                  {paper.categories.map((cat) => (
                    <List.Item.Detail.Metadata.TagList.Item
                      key={cat}
                      text={cat}
                      color={getCategoryColor(cat)}
                    />
                  ))}
                </List.Item.Detail.Metadata.TagList>
                {paper.doi && (
                  <List.Item.Detail.Metadata.Link
                    title="DOI"
                    text={paper.doi}
                    target={`https://doi.org/${paper.doi}`}
                  />
                )}
                {paper.journalRef && (
                  <List.Item.Detail.Metadata.Label title="Journal" text={paper.journalRef} />
                )}
              </List.Item.Detail.Metadata>
            }
          />
        )
      }
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
              title={isBookmarked ? "Remove from Bookmarks" : "Add to Bookmarks"}
              icon={isBookmarked ? Icon.BookmarkDisabled : Icon.Bookmark}
              onAction={toggleBookmark}
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
          <ActionPanel.Section title="Reading Status">
            <Action
              title="Mark as Read"
              icon={Icon.Checkmark}
              onAction={() => setReadingStatus(paper.id, 'read')}
            />
            <Action
              title="Mark as Reading"
              icon={Icon.Eye}
              onAction={() => setReadingStatus(paper.id, 'reading')}
            />
            <Action
              title="Mark as New"
              icon={Icon.Circle}
              onAction={() => setReadingStatus(paper.id, 'new')}
            />
          </ActionPanel.Section>
          <ActionPanel.Section>
            <Action
              title="Toggle Details"
              icon={Icon.Eye}
              onAction={onToggleDetail}
              shortcut={{ modifiers: ["cmd"], key: "y" }}
            />
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

function generatePaperMarkdown(paper: ArxivPaper): string {
  return `# ${paper.title}

**Authors:** ${paper.authors.join(', ')}

**Published:** ${format(paper.published, 'MMMM d, yyyy')}

## Abstract

${paper.abstract}

${paper.comment ? `\n## Comments\n\n${paper.comment}` : ''}

## Links

- [View on arXiv](${paper.arxivUrl})
- [Download PDF](${paper.pdfUrl})
${paper.doi ? `- [DOI: ${paper.doi}](https://doi.org/${paper.doi})` : ''}
`;
}