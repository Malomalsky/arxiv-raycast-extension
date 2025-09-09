import { useEffect, useState } from "react";
import {
  List,
  ActionPanel,
  Action,
  Icon,
  LocalStorage,
  Color,
  showToast,
  Toast,
} from "@raycast/api";
import { Subscription } from "./types";
import FeedCommand from "./feed";
import { SubscriptionFeed } from "./SubscriptionFeed";

export default function FeedSelectorCommand() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSubscriptions();
  }, []);

  async function loadSubscriptions() {
    try {
      const subsStr = await LocalStorage.getItem<string>('subscriptions');
      if (subsStr) {
        const subs = JSON.parse(subsStr);
        setSubscriptions(subs);
      }
    } catch (error) {
      showToast({ style: Toast.Style.Failure, title: "Failed to load subscriptions" });
    } finally {
      setIsLoading(false);
    }
  }

  if (subscriptions.length === 0 && !isLoading) {
    return (
      <List>
        <List.EmptyView
          title="No subscriptions yet"
          description="Add subscriptions first to see feeds"
          icon={Icon.Bell}
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

  const categorySubs = subscriptions.filter(s => s.type === 'category');
  const authorSubs = subscriptions.filter(s => s.type === 'author');
  const keywordSubs = subscriptions.filter(s => s.type === 'keyword');

  return (
    <List
      isLoading={isLoading}
      navigationTitle="Select Feed"
      searchBarPlaceholder="Search feeds..."
    >
      <List.Section title="All Feeds">
        <List.Item
          title="All Subscriptions"
          subtitle={`View papers from all ${subscriptions.length} subscriptions`}
          icon={{ source: Icon.Globe, tintColor: Color.Blue }}
          accessories={[
            { text: `${subscriptions.length} sources` }
          ]}
          actions={
            <ActionPanel>
              <Action.Push
                title="View All Feeds"
                target={<FeedCommand />}
                icon={Icon.List}
              />
            </ActionPanel>
          }
        />
      </List.Section>

      {categorySubs.length > 0 && (
        <List.Section title="Category Feeds" subtitle={`${categorySubs.length} categories`}>
          {categorySubs.map((sub) => (
            <FeedItem key={sub.id} subscription={sub} />
          ))}
        </List.Section>
      )}

      {authorSubs.length > 0 && (
        <List.Section title="Author Feeds" subtitle={`${authorSubs.length} authors`}>
          {authorSubs.map((sub) => (
            <FeedItem key={sub.id} subscription={sub} />
          ))}
        </List.Section>
      )}

      {keywordSubs.length > 0 && (
        <List.Section title="Keyword Feeds" subtitle={`${keywordSubs.length} keywords`}>
          {keywordSubs.map((sub) => (
            <FeedItem key={sub.id} subscription={sub} />
          ))}
        </List.Section>
      )}
    </List>
  );
}

function FeedItem({ subscription }: { subscription: Subscription }) {
  const icon = subscription.type === 'category' ? Icon.Tag : 
               subscription.type === 'author' ? Icon.Person : 
               Icon.MagnifyingGlass;
  
  const color = subscription.color ? subscription.color as Color : 
                subscription.type === 'category' ? Color.Blue :
                subscription.type === 'author' ? Color.Green :
                Color.Orange;

  return (
    <List.Item
      title={subscription.name}
      subtitle={subscription.value}
      icon={{ source: icon, tintColor: color }}
      accessories={[
        { text: subscription.type }
      ]}
      actions={
        <ActionPanel>
          <Action.Push
            title="View Feed"
            target={<SubscriptionFeed subscription={subscription} />}
            icon={Icon.List}
          />
          <Action.Open
            title="Manage Subscriptions"
            target="raycast://extensions/ivan/arxiv-pro/subscriptions"
            icon={Icon.Gear}
          />
        </ActionPanel>
      }
    />
  );
}