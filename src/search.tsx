import { useRef, useState } from "react";
import {
  Action,
  ActionPanel,
  Alert,
  confirmAlert,
  Form,
  Icon,
  List,
  useNavigation,
} from "@raycast/api";
import {
  showFailureToast,
  useCachedPromise,
  useCachedState,
  useForm,
  usePromise,
} from "@raycast/utils";
import { searchArxiv } from "./api/arxiv";
import { getBatchCitations } from "./api/semanticScholar";
import { ARXIV_CATEGORIES, SearchFilter, SearchHistory } from "./types";
import { useLibrary } from "./hooks/useLibrary";
import { PaperListItem } from "./components/PaperListItem";
import { readItems, updateItems } from "./utils/storage";

const DEFAULT_FILTER: SearchFilter = {
  sortBy: "relevance",
  sortOrder: "descending",
  dateRange: "all",
};
const DATE_RANGES = {
  all: "All Time",
  today: "Today",
  week: "Past Week",
  month: "Past Month",
  year: "Past Year",
  custom: "Custom Dates",
};
const SORT_ORDERS: { value: SearchFilter["sortBy"]; title: string }[] = [
  { value: "relevance", title: "Relevance" },
  { value: "submittedDate", title: "Newest" },
  { value: "lastUpdatedDate", title: "Recently Updated" },
  { value: "citationCount", title: "Citations (First 100)" },
];

export default function SearchCommand() {
  const [searchText, setSearchText] = useState("");
  const [filter, setFilter] = useCachedState<SearchFilter>(
    "search-filter",
    DEFAULT_FILTER,
  );
  const [showDetail, setShowDetail] = useCachedState("show-paper-detail", true);
  const abortable = useRef<AbortController | null>(null);
  const library = useLibrary();
  const { data: history = [], revalidate: refreshHistory } = usePromise(() =>
    readItems<SearchHistory>("search-history"),
  );
  const query = searchText.trim();
  const {
    data: papers,
    error,
    isLoading,
    pagination,
    revalidate,
  } = useCachedPromise(
    (text: string, searchFilter: SearchFilter) =>
      async ({ page }: { page: number }) => {
        const signal = abortable.current?.signal;
        const byCitations = searchFilter.sortBy === "citationCount";
        const pageSize = byCitations ? 100 : 30;
        const result = await searchArxiv(
          text,
          searchFilter,
          pageSize,
          page * pageSize,
          signal,
        );
        let data = result.papers;
        if (byCitations) {
          const citations = await getBatchCitations(
            data.map((paper) => paper.arxivId),
            signal,
          );
          data = data.map((paper) => ({
            ...paper,
            citationCount: citations.get(paper.arxivId),
          }));
          data.sort(
            (a, b) => (b.citationCount ?? -1) - (a.citationCount ?? -1),
          );
        }
        signal?.throwIfAborted();
        if (page === 0) {
          try {
            await updateItems<SearchHistory>("search-history", (items) =>
              [
                {
                  query: text,
                  timestamp: new Date().toISOString(),
                  resultsCount: result.totalResults,
                },
                ...items.filter((item) => item.query !== text),
              ].slice(0, 50),
            );
            await refreshHistory();
          } catch (error) {
            await showFailureToast(error, {
              title: "Could not save search history",
            });
          }
        }
        return {
          data,
          hasMore: !byCitations && (page + 1) * pageSize < result.totalResults,
        };
      },
    [query, filter],
    { abortable, execute: query.length > 0, keepPreviousData: false },
  );
  const filtersActive =
    filter.dateRange !== "all" || Boolean(filter.categories?.length);
  const loadingPapers = query.length > 0 && (isLoading || (!papers && !error));
  const filterSummary = [
    filter.dateRange ? DATE_RANGES[filter.dateRange] : "All Time",
    ...(filter.categories || []),
  ].join(" · ");

  const searchActions = (
    <ActionPanel.Section>
      <Action.Push
        title={filtersActive ? "Edit Filters" : "Filter Papers"}
        icon={Icon.Filter}
        target={<SearchFiltersForm filter={filter} onApply={setFilter} />}
        shortcut={{ modifiers: ["cmd", "shift"], key: "f" }}
      />
      {filtersActive && (
        <Action
          title="Reset Filters"
          icon={Icon.ArrowCounterClockwise}
          onAction={() =>
            setFilter({
              ...filter,
              dateRange: "all",
              categories: undefined,
              customDateStart: undefined,
              customDateEnd: undefined,
            })
          }
        />
      )}
      {query && (
        <Action
          title="Refresh Results"
          icon={Icon.ArrowClockwise}
          onAction={revalidate}
          shortcut={{ modifiers: ["cmd"], key: "r" }}
        />
      )}
      {library.error && (
        <Action
          title="Reload Library"
          icon={Icon.ArrowClockwise}
          onAction={library.revalidate}
        />
      )}
      {!query && history.length > 0 && (
        <Action
          title="Clear Search History"
          icon={Icon.Trash}
          style={Action.Style.Destructive}
          onAction={async () => {
            if (
              await confirmAlert({
                title: "Clear Search History?",
                primaryAction: {
                  title: "Clear",
                  style: Alert.ActionStyle.Destructive,
                },
              })
            ) {
              await updateItems<SearchHistory>("search-history", () => []);
              await refreshHistory();
            }
          }}
        />
      )}
    </ActionPanel.Section>
  );

  return (
    <List
      navigationTitle="Search Papers"
      searchText={searchText}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search titles, authors, or an arXiv query…"
      throttle
      filtering={false}
      isLoading={loadingPapers || library.isLoading}
      isShowingDetail={query.length > 0 && showDetail}
      pagination={query ? pagination : undefined}
      actions={<ActionPanel>{searchActions}</ActionPanel>}
      searchBarAccessory={
        <List.Dropdown
          tooltip="Sort Papers"
          value={filter.sortBy}
          onChange={(value) =>
            setFilter({ ...filter, sortBy: value as SearchFilter["sortBy"] })
          }
        >
          {SORT_ORDERS.map((sort) => (
            <List.Dropdown.Item
              key={sort.value}
              value={sort.value}
              title={sort.title}
            />
          ))}
        </List.Dropdown>
      }
    >
      {!query && history.length > 0 ? (
        <List.Section title="Recent Searches" subtitle={filterSummary}>
          {history.slice(0, 10).map((item) => (
            <List.Item
              key={item.query}
              title={item.query}
              icon={Icon.Clock}
              accessories={[
                {
                  text: `${item.resultsCount.toLocaleString()} ${item.resultsCount === 1 ? "match" : "matches"}`,
                },
              ]}
              actions={
                <ActionPanel>
                  <Action
                    title="Search Again"
                    icon={Icon.MagnifyingGlass}
                    onAction={() => setSearchText(item.query)}
                  />
                  {searchActions}
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      ) : null}
      {!query && history.length === 0 && (
        <List.EmptyView
          icon={Icon.MagnifyingGlass}
          title="Search arXiv"
          description={
            "Try “graph neural networks”, “au:Hinton” or “cat:cs.LG”."
          }
        />
      )}
      {loadingPapers && !error && !papers?.length && (
        <List.EmptyView
          icon={Icon.MagnifyingGlass}
          title="Searching arXiv"
          description="Fetching papers and applying your filters…"
        />
      )}
      {query && error && (
        <List.EmptyView
          icon={Icon.ExclamationMark}
          title="Could Not Load Papers"
          description={error.message}
          actions={
            <ActionPanel>
              <Action
                title="Try Again"
                icon={Icon.ArrowClockwise}
                onAction={revalidate}
              />
              {searchActions}
            </ActionPanel>
          }
        />
      )}
      {query && !error && papers?.length === 0 && !isLoading && (
        <List.EmptyView
          icon={Icon.MagnifyingGlass}
          title="No Papers Found"
          description={
            filtersActive
              ? "Try another query or reset the filters."
              : "Try a broader query or a different author."
          }
          actions={<ActionPanel>{searchActions}</ActionPanel>}
        />
      )}
      {query && !error && papers && papers.length > 0 && (
        <List.Section
          title="Papers"
          subtitle={
            filter.sortBy === "citationCount"
              ? "Sorted within the first 100 matches"
              : filterSummary
          }
        >
          {papers.map((paper) => (
            <PaperListItem
              key={paper.id}
              paper={paper}
              library={library}
              showDetail={showDetail}
              onToggleDetail={() => setShowDetail(!showDetail)}
              actions={searchActions}
            />
          ))}
        </List.Section>
      )}
    </List>
  );
}

function SearchFiltersForm({
  filter,
  onApply,
}: {
  filter: SearchFilter;
  onApply: (filter: SearchFilter) => void;
}) {
  const { pop } = useNavigation();
  type FilterValues = {
    dateRange: string;
    category: string;
    start: Date | null;
    end: Date | null;
  };
  const form: ReturnType<typeof useForm<FilterValues>> = useForm<FilterValues>({
    initialValues: {
      dateRange: filter.dateRange || "all",
      category: filter.categories?.[0] || "",
      start: filter.customDateStart ? new Date(filter.customDateStart) : null,
      end: filter.customDateEnd ? new Date(filter.customDateEnd) : null,
    },
    validation: {
      start: (date) =>
        form.values.dateRange === "custom" && !date
          ? "Choose a start date."
          : undefined,
      end: (date) => {
        if (form.values.dateRange !== "custom") return;
        if (!date) return "Choose an end date.";
        if (form.values.start && date < form.values.start)
          return "End date must follow the start date.";
      },
    },
    onSubmit(values) {
      const end = values.end ? new Date(values.end) : undefined;
      end?.setHours(23, 59, 59, 999);
      onApply({
        ...filter,
        dateRange: values.dateRange as SearchFilter["dateRange"],
        categories: values.category ? [values.category] : undefined,
        customDateStart: values.start?.toISOString(),
        customDateEnd: end?.toISOString(),
      });
      pop();
    },
  });
  const { handleSubmit, itemProps, values } = form;
  return (
    <Form
      navigationTitle="Search Filters"
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Apply Filters" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.Dropdown title="Published" {...itemProps.dateRange}>
        {Object.entries(DATE_RANGES).map(([value, title]) => (
          <Form.Dropdown.Item key={value} value={value} title={title} />
        ))}
      </Form.Dropdown>
      {values.dateRange === "custom" && (
        <>
          <Form.DatePicker
            title="From"
            type={Form.DatePicker.Type.Date}
            {...itemProps.start}
          />
          <Form.DatePicker
            title="Through"
            type={Form.DatePicker.Type.Date}
            {...itemProps.end}
          />
        </>
      )}
      <Form.Dropdown title="Category" {...itemProps.category}>
        <Form.Dropdown.Item value="" title="All Categories" />
        {Object.entries(ARXIV_CATEGORIES).map(([group, categories]) => (
          <Form.Dropdown.Section key={group} title={group}>
            {Object.entries(categories).map(([code, name]) => (
              <Form.Dropdown.Item
                key={code}
                value={code}
                title={`${name} (${code})`}
              />
            ))}
          </Form.Dropdown.Section>
        ))}
      </Form.Dropdown>
    </Form>
  );
}
