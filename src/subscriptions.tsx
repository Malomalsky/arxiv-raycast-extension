import { useEffect, useState } from "react";
import {
  List,
  ActionPanel,
  Action,
  Icon,
  showToast,
  Toast,
  LocalStorage,
  Form,
  confirmAlert,
  Alert,
  Color,
  useNavigation,
} from "@raycast/api";
import { Subscription, ARXIV_CATEGORIES } from "./types";
import { format } from "date-fns";

export default function SubscriptionsCommand() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { push } = useNavigation();

  useEffect(() => {
    loadSubscriptions();
  }, []);

  async function loadSubscriptions() {
    try {
      const subsStr = await LocalStorage.getItem<string>('subscriptions');
      if (subsStr) {
        setSubscriptions(JSON.parse(subsStr));
      }
    } catch (error) {
      showToast({ style: Toast.Style.Failure, title: "Failed to load subscriptions" });
    } finally {
      setIsLoading(false);
    }
  }

  async function removeSubscription(id: string) {
    const confirmed = await confirmAlert({
      title: "Remove Subscription",
      message: "Are you sure you want to remove this subscription?",
      primaryAction: {
        title: "Remove",
        style: Alert.ActionStyle.Destructive,
      },
    });

    if (confirmed) {
      const filtered = subscriptions.filter(s => s.id !== id);
      setSubscriptions(filtered);
      await LocalStorage.setItem('subscriptions', JSON.stringify(filtered));
      showToast({ style: Toast.Style.Success, title: "Subscription removed" });
    }
  }

  async function addSubscription(sub: Omit<Subscription, 'id' | 'createdAt' | 'lastChecked'>) {
    const newSub: Subscription = {
      ...sub,
      id: Date.now().toString(),
      createdAt: new Date(),
      lastChecked: new Date(),
    };
    
    const updated = [...subscriptions, newSub];
    setSubscriptions(updated);
    await LocalStorage.setItem('subscriptions', JSON.stringify(updated));
    showToast({ style: Toast.Style.Success, title: "Subscription added" });
  }

  const categorySubs = subscriptions.filter(s => s.type === 'category');
  const authorSubs = subscriptions.filter(s => s.type === 'author');
  const keywordSubs = subscriptions.filter(s => s.type === 'keyword');

  return (
    <List
      isLoading={isLoading}
      navigationTitle={`Subscriptions (${subscriptions.length})`}
      actions={
        <ActionPanel>
          <Action.Push
            title="Add Subscription"
            target={<AddSubscriptionForm onAdd={addSubscription} />}
            icon={Icon.Plus}
          />
        </ActionPanel>
      }
    >
      {categorySubs.length > 0 && (
        <List.Section title="Categories" subtitle={`${categorySubs.length} subscriptions`}>
          {categorySubs.map((sub) => (
            <SubscriptionItem
              key={sub.id}
              subscription={sub}
              onRemove={() => removeSubscription(sub.id)}
            />
          ))}
        </List.Section>
      )}
      
      {authorSubs.length > 0 && (
        <List.Section title="Authors" subtitle={`${authorSubs.length} subscriptions`}>
          {authorSubs.map((sub) => (
            <SubscriptionItem
              key={sub.id}
              subscription={sub}
              onRemove={() => removeSubscription(sub.id)}
            />
          ))}
        </List.Section>
      )}
      
      {keywordSubs.length > 0 && (
        <List.Section title="Keywords" subtitle={`${keywordSubs.length} subscriptions`}>
          {keywordSubs.map((sub) => (
            <SubscriptionItem
              key={sub.id}
              subscription={sub}
              onRemove={() => removeSubscription(sub.id)}
            />
          ))}
        </List.Section>
      )}
      
      {subscriptions.length === 0 && (
        <List.EmptyView
          title="No subscriptions yet"
          description="Add categories, authors, or keywords to follow"
          icon={Icon.Bell}
          actions={
            <ActionPanel>
              <Action.Push
                title="Add Subscription"
                target={<AddSubscriptionForm onAdd={addSubscription} />}
                icon={Icon.Plus}
              />
            </ActionPanel>
          }
        />
      )}
    </List>
  );
}

function SubscriptionItem({
  subscription,
  onRemove
}: {
  subscription: Subscription;
  onRemove: () => void;
}) {
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
        { text: format(subscription.lastChecked, 'MMM d, HH:mm') },
      ]}
      actions={
        <ActionPanel>
          <Action
            title="Remove Subscription"
            icon={Icon.Trash}
            onAction={onRemove}
            style={Action.Style.Destructive}
          />
        </ActionPanel>
      }
    />
  );
}

function AddSubscriptionForm({
  onAdd
}: {
  onAdd: (sub: Omit<Subscription, 'id' | 'createdAt' | 'lastChecked'>) => void;
}) {
  const { pop } = useNavigation();
  const [type, setType] = useState<'category' | 'author' | 'keyword'>('category');
  
  const allCategories = Object.entries(ARXIV_CATEGORIES).flatMap(([group, cats]) =>
    Object.entries(cats).map(([code, name]) => ({
      title: `${name} (${code})`,
      value: code,
      group
    }))
  );

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Add Subscription"
            onSubmit={(values) => {
              onAdd({
                type: values.type,
                value: values.value,
                name: values.name || values.value,
                color: values.color
              });
              pop();
            }}
          />
        </ActionPanel>
      }
    >
      <Form.Dropdown id="type" title="Type" value={type} onChange={setType as any}>
        <Form.Dropdown.Item value="category" title="Category" icon={Icon.Tag} />
        <Form.Dropdown.Item value="author" title="Author" icon={Icon.Person} />
        <Form.Dropdown.Item value="keyword" title="Keyword" icon={Icon.MagnifyingGlass} />
      </Form.Dropdown>
      
      {type === 'category' ? (
        <Form.Dropdown id="value" title="Category">
          {Object.entries(ARXIV_CATEGORIES).map(([group, categories]) => (
            <Form.Dropdown.Section key={group} title={group}>
              {Object.entries(categories).map(([code, name]) => (
                <Form.Dropdown.Item key={code} value={code} title={`${name} (${code})`} />
              ))}
            </Form.Dropdown.Section>
          ))}
        </Form.Dropdown>
      ) : (
        <Form.TextField
          id="value"
          title={type === 'author' ? "Author Name" : "Keyword"}
          placeholder={type === 'author' ? "e.g., LeCun" : "e.g., transformer"}
        />
      )}
      
      <Form.TextField
        id="name"
        title="Display Name (optional)"
        placeholder="Custom name for this subscription"
      />
      
      <Form.Dropdown id="color" title="Color">
        <Form.Dropdown.Item value={Color.Blue} title="Blue" icon={{ source: Icon.Circle, tintColor: Color.Blue }} />
        <Form.Dropdown.Item value={Color.Green} title="Green" icon={{ source: Icon.Circle, tintColor: Color.Green }} />
        <Form.Dropdown.Item value={Color.Orange} title="Orange" icon={{ source: Icon.Circle, tintColor: Color.Orange }} />
        <Form.Dropdown.Item value={Color.Purple} title="Purple" icon={{ source: Icon.Circle, tintColor: Color.Purple }} />
        <Form.Dropdown.Item value={Color.Red} title="Red" icon={{ source: Icon.Circle, tintColor: Color.Red }} />
        <Form.Dropdown.Item value={Color.Yellow} title="Yellow" icon={{ source: Icon.Circle, tintColor: Color.Yellow }} />
      </Form.Dropdown>
    </Form>
  );
}