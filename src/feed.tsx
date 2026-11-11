import { useRef } from "react";
import {
  Action,
  ActionPanel,
  Icon,
  launchCommand,
  LaunchType,
  List,
} from "@raycast/api";
import { useCachedPromise, useCachedState, usePromise } from "@raycast/utils";
import { getFeedPapers } from "./api/feed";
import { PaperListItem } from "./components/PaperListItem";
import { useLibrary } from "./hooks/useLibrary";
import { Subscription } from "./types";
import { getSubscriptions } from "./utils/subscriptions";
import { groupPapersByDate } from "./utils/papers";

export default function FeedCommand({
  subscription,
}: { subscription?: Subscription } = {}) {
  const {
    data: subscriptions = [],
    isLoading: loadingSubscriptions,
    error: subscriptionError,
    revalidate: reloadSubscriptions,
  } = usePromise(
    async () => (subscription ? [subscription] : getSubscriptions()),
    [],
  );
  const [selected, setSelected] = useCachedState("feed-subscription", "all");
  const [showDetail, setShowDetail] = useCachedState("show-paper-detail", true);
  const library = useLibrary();
  const abortable = useRef<AbortController | null>(null);
  const activeId =
    subscription?.id ||
    (subscriptions.some((item) => item.id === selected) ? selected : "all");
  const active =
    activeId === "all"
      ? subscriptions
      : subscriptions.filter((item) => item.id === activeId);
  const sources = active.map(({ id, type, value }) => ({ id, type, value }));
  const {
    data: papers,
    error,
    isLoading,
    revalidate,
  } = useCachedPromise(
    (items: typeof sources) => getFeedPapers(items, abortable.current?.signal),
    [sources],
    { abortable, execute: active.length > 0, keepPreviousData: false },
  );
  const feedError = subscriptionError || error;
  const loadingFeed =
    loadingSubscriptions ||
    (active.length > 0 && (isLoading || (!papers && !feedError)));
  const feedActions = (
    <ActionPanel.Section>
      <Action
        title="Refresh Feed"
        icon={Icon.ArrowClockwise}
        shortcut={{ modifiers: ["cmd"], key: "r" }}
        onAction={async () => {
          await reloadSubscriptions();
          await revalidate();
        }}
      />
      <Action
        title="Manage Subscriptions"
        icon={Icon.Gear}
        onAction={() =>
          launchCommand({
            name: "subscriptions",
            type: LaunchType.UserInitiated,
          })
        }
      />
      {library.error && (
        <Action
          title="Reload Library"
          icon={Icon.ArrowClockwise}
          onAction={library.revalidate}
        />
      )}
    </ActionPanel.Section>
  );

  return (
    <List
      navigationTitle={subscription?.name || "Browse Feeds"}
      searchBarPlaceholder="Filter papers by title, author, or category…"
      isLoading={loadingFeed || library.isLoading}
      isShowingDetail={showDetail}
      actions={<ActionPanel>{feedActions}</ActionPanel>}
      searchBarAccessory={
        subscription ? undefined : (
          <List.Dropdown
            tooltip="Subscription"
            value={activeId}
            onChange={setSelected}
          >
            <List.Dropdown.Item value="all" title="All Subscriptions" />
            {(
              [
                ["category", "Categories"],
                ["author", "Authors"],
                ["keyword", "Keywords"],
              ] as const
            ).map(([type, title]) => (
              <List.Dropdown.Section key={type} title={title}>
                {subscriptions
                  .filter((item) => item.type === type)
                  .map((item) => (
                    <List.Dropdown.Item
                      key={item.id}
                      value={item.id}
                      title={item.name}
                    />
                  ))}
              </List.Dropdown.Section>
            ))}
          </List.Dropdown>
        )
      }
    >
      {loadingFeed && !feedError && !papers?.length && (
        <List.EmptyView
          icon={Icon.Document}
          title="Loading Papers"
          description="Fetching recent papers from your subscriptions…"
        />
      )}
      {feedError && (
        <List.EmptyView
          icon={Icon.ExclamationMark}
          title="Could Not Load Feed"
          description={feedError.message}
          actions={<ActionPanel>{feedActions}</ActionPanel>}
        />
      )}
      {!feedError && !loadingSubscriptions && subscriptions.length === 0 && (
        <List.EmptyView
          icon={Icon.List}
          title="No Subscriptions"
          description="Follow categories, authors or keywords to build a feed."
          actions={
            <ActionPanel>
              <Action
                title="Add Subscriptions"
                icon={Icon.Plus}
                onAction={() =>
                  launchCommand({
                    name: "subscriptions",
                    type: LaunchType.UserInitiated,
                  })
                }
              />
            </ActionPanel>
          }
        />
      )}
      {!feedError &&
        active.length > 0 &&
        !isLoading &&
        papers?.length === 0 && (
          <List.EmptyView
            icon={Icon.Document}
            title="No Papers Found"
            description="Try another subscription or refresh the feed."
            actions={<ActionPanel>{feedActions}</ActionPanel>}
          />
        )}
      {!feedError &&
        active.length > 0 &&
        Object.entries(groupPapersByDate(papers || [])).map(
          ([label, items]) => (
            <List.Section
              key={label}
              title={label}
              subtitle={`${items.length} ${items.length === 1 ? "paper" : "papers"}`}
            >
              {items.map((paper) => (
                <PaperListItem
                  key={paper.id}
                  paper={paper}
                  library={library}
                  showDetail={showDetail}
                  onToggleDetail={() => setShowDetail(!showDetail)}
                  actions={feedActions}
                />
              ))}
            </List.Section>
          ),
        )}
    </List>
  );
}
