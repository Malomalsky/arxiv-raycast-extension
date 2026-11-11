import {
  Action,
  ActionPanel,
  Alert,
  confirmAlert,
  Icon,
  launchCommand,
  LaunchType,
  List,
} from "@raycast/api";
import { useCachedState } from "@raycast/utils";
import { generateBibTeX } from "./api/arxiv";
import { PaperListItem } from "./components/PaperListItem";
import { useLibrary } from "./hooks/useLibrary";
import { Bookmark } from "./types";
import { updateItems } from "./utils/storage";

export default function BookmarksCommand() {
  const library = useLibrary();
  const [showDetail, setShowDetail] = useCachedState("show-paper-detail", true);
  const [status, setStatus] = useCachedState("bookmark-status-filter", "all");
  const bookmarks = library.bookmarks.filter(
    (bookmark) =>
      status === "all" ||
      (library.statusById.get(bookmark.paperId)?.status || "new") === status,
  );

  const libraryActions = (
    <ActionPanel.Section title="Library">
      {library.bookmarks.length > 0 && (
        <Action.CopyToClipboard
          title="Copy All as BibTeX"
          content={library.bookmarks
            .map((bookmark) => generateBibTeX(bookmark.paper))
            .join("\n\n")}
        />
      )}
      <Action
        title="Refresh Bookmarks"
        icon={Icon.ArrowClockwise}
        onAction={library.revalidate}
        shortcut={{ modifiers: ["cmd"], key: "r" }}
      />
      <Action
        title="Search Papers"
        icon={Icon.MagnifyingGlass}
        onAction={() =>
          launchCommand({ name: "search", type: LaunchType.UserInitiated })
        }
      />
      {library.bookmarks.length > 0 && (
        <Action
          title="Clear All Bookmarks"
          icon={Icon.Trash}
          style={Action.Style.Destructive}
          onAction={async () => {
            if (
              await confirmAlert({
                title: "Clear All Bookmarks?",
                message:
                  "All saved papers, notes, tags and ratings will be removed.",
                primaryAction: {
                  title: "Clear All",
                  style: Alert.ActionStyle.Destructive,
                },
              })
            ) {
              await library.update(
                () => updateItems<Bookmark>("bookmarks", () => []),
                "Bookmarks cleared",
              );
            }
          }}
        />
      )}
    </ActionPanel.Section>
  );

  return (
    <List
      navigationTitle="Bookmarks"
      searchBarPlaceholder="Search papers, authors, tags, or notes…"
      isLoading={library.isLoading}
      isShowingDetail={showDetail}
      actions={<ActionPanel>{libraryActions}</ActionPanel>}
      searchBarAccessory={
        <List.Dropdown
          tooltip="Reading Status"
          value={status}
          onChange={setStatus}
        >
          <List.Dropdown.Item value="all" title="All Papers" />
          <List.Dropdown.Item value="new" title="Unread" />
          <List.Dropdown.Item value="reading" title="Reading" />
          <List.Dropdown.Item value="read" title="Read" />
        </List.Dropdown>
      }
    >
      {library.error ? (
        <List.EmptyView
          icon={Icon.ExclamationMark}
          title="Could Not Load Bookmarks"
          description={library.error.message}
          actions={<ActionPanel>{libraryActions}</ActionPanel>}
        />
      ) : null}
      {!library.error &&
        !library.isLoading &&
        library.bookmarks.length === 0 && (
          <List.EmptyView
            icon={Icon.Bookmark}
            title="No Bookmarks"
            description="Save a paper with Command-B in search or a feed."
            actions={
              <ActionPanel>
                <Action
                  title="Search Papers"
                  icon={Icon.MagnifyingGlass}
                  onAction={() =>
                    launchCommand({
                      name: "search",
                      type: LaunchType.UserInitiated,
                    })
                  }
                />
              </ActionPanel>
            }
          />
        )}
      {!library.error && library.bookmarks.length > 0 && (
        <List.Section
          title="Saved Papers"
          subtitle={`${bookmarks.length} ${bookmarks.length === 1 ? "paper" : "papers"}`}
        >
          {bookmarks.map((bookmark) => (
            <PaperListItem
              key={bookmark.paperId}
              paper={bookmark.paper}
              library={library}
              showDetail={showDetail}
              onToggleDetail={() => setShowDetail(!showDetail)}
              actions={libraryActions}
            />
          ))}
        </List.Section>
      )}
      {!library.error &&
        library.bookmarks.length > 0 &&
        bookmarks.length === 0 && (
          <List.EmptyView
            icon={Icon.CheckCircle}
            title="No Papers with This Status"
            description="Choose another reading status to see your saved papers."
            actions={
              <ActionPanel>
                <Action
                  title="Show All Papers"
                  icon={Icon.List}
                  onAction={() => setStatus("all")}
                />
                {libraryActions}
              </ActionPanel>
            }
          />
        )}
    </List>
  );
}
