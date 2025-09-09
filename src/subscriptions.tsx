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
import { SubscriptionFeed } from "./SubscriptionFeed";

export default function SubscriptionsCommand() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { push } = useNavigation();

  useEffect(() => {
    loadSubscriptions();
  }, []);

  async function loadSubscriptions() {
    try {
      const subsStr = await LocalStorage.getItem<string>("subscriptions");
      if (subsStr) {
        setSubscriptions(JSON.parse(subsStr));
      }
    } catch (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Failed to load subscriptions",
      });
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
      const filtered = subscriptions.filter((s) => s.id !== id);
      setSubscriptions(filtered);
      await LocalStorage.setItem("subscriptions", JSON.stringify(filtered));
      showToast({ style: Toast.Style.Success, title: "Subscription removed" });
    }
  }

  async function addSubscription(
    sub: Omit<Subscription, "id" | "createdAt" | "lastChecked">,
  ) {
    const isDuplicate = subscriptions.some(
      (s) =>
        s.type === sub.type &&
        s.value.toLowerCase() === sub.value.toLowerCase(),
    );

    if (isDuplicate) {
      showToast({
        style: Toast.Style.Failure,
        title: "Subscription already exists",
        message: `You're already subscribed to ${sub.type}: ${sub.value}`,
      });
      return;
    }

    const newSub: Subscription = {
      ...sub,
      id: Date.now().toString(),
      createdAt: new Date(),
      lastChecked: new Date(),
    };

    const updated = [...subscriptions, newSub];
    setSubscriptions(updated);
    await LocalStorage.setItem("subscriptions", JSON.stringify(updated));
    showToast({ style: Toast.Style.Success, title: "Subscription added" });
  }

  const categorySubs = subscriptions.filter((s) => s.type === "category");
  const authorSubs = subscriptions.filter((s) => s.type === "author");
  const keywordSubs = subscriptions.filter((s) => s.type === "keyword");

  const popularCategories = [
    { code: "cs.AI", name: "Artificial Intelligence" },
    { code: "cs.LG", name: "Machine Learning" },
    { code: "cs.CV", name: "Computer Vision" },
    { code: "cs.CL", name: "Computation and Language" },
    { code: "stat.ML", name: "Machine Learning (Statistics)" },
  ];

  return (
    <List
      isLoading={isLoading}
      navigationTitle={`Subscriptions (${subscriptions.length})`}
      searchBarPlaceholder="Search subscriptions..."
    >
      <List.Section title="Actions">
        <List.Item
          title="Add New Subscription"
          subtitle="Subscribe to categories, authors, or keywords"
          icon={{ source: Icon.PlusCircle, tintColor: Color.Green }}
          actions={
            <ActionPanel>
              <Action.Push
                title="Add Custom Subscription"
                target={
                  <AddSubscriptionForm
                    onAdd={addSubscription}
                    existingSubs={subscriptions}
                  />
                }
                icon={Icon.Plus}
              />
              <ActionPanel.Section title="Quick Add Popular Categories">
                {popularCategories.map((cat) => (
                  <Action
                    key={cat.code}
                    title={`Add ${cat.name}`}
                    icon={Icon.Tag}
                    onAction={() => {
                      if (
                        !subscriptions.some(
                          (s) => s.type === "category" && s.value === cat.code,
                        )
                      ) {
                        addSubscription({
                          type: "category",
                          value: cat.code,
                          name: cat.name,
                          color: Color.Blue,
                        });
                      } else {
                        showToast({
                          style: Toast.Style.Failure,
                          title: "Already subscribed",
                          message: `You're already subscribed to ${cat.name}`,
                        });
                      }
                    }}
                  />
                ))}
              </ActionPanel.Section>
            </ActionPanel>
          }
        />
      </List.Section>

      {categorySubs.length > 0 && (
        <List.Section
          title="Category Subscriptions"
          subtitle={`${categorySubs.length} categories`}
        >
          {categorySubs.map((sub) => (
            <SubscriptionItem
              key={sub.id}
              subscription={sub}
              onRemove={() => removeSubscription(sub.id)}
              onEdit={() =>
                push(
                  <EditSubscriptionForm
                    subscription={sub}
                    onSave={async (updated) => {
                      const newSubs = subscriptions.map((s) =>
                        s.id === sub.id ? { ...s, ...updated } : s,
                      );
                      setSubscriptions(newSubs);
                      await LocalStorage.setItem(
                        "subscriptions",
                        JSON.stringify(newSubs),
                      );
                      showToast({
                        style: Toast.Style.Success,
                        title: "Subscription updated",
                      });
                    }}
                  />,
                )
              }
            />
          ))}
        </List.Section>
      )}

      {authorSubs.length > 0 && (
        <List.Section
          title="Author Subscriptions"
          subtitle={`${authorSubs.length} authors`}
        >
          {authorSubs.map((sub) => (
            <SubscriptionItem
              key={sub.id}
              subscription={sub}
              onRemove={() => removeSubscription(sub.id)}
              onEdit={() =>
                push(
                  <EditSubscriptionForm
                    subscription={sub}
                    onSave={async (updated) => {
                      const newSubs = subscriptions.map((s) =>
                        s.id === sub.id ? { ...s, ...updated } : s,
                      );
                      setSubscriptions(newSubs);
                      await LocalStorage.setItem(
                        "subscriptions",
                        JSON.stringify(newSubs),
                      );
                      showToast({
                        style: Toast.Style.Success,
                        title: "Subscription updated",
                      });
                    }}
                  />,
                )
              }
            />
          ))}
        </List.Section>
      )}

      {keywordSubs.length > 0 && (
        <List.Section
          title="Keyword Subscriptions"
          subtitle={`${keywordSubs.length} keywords`}
        >
          {keywordSubs.map((sub) => (
            <SubscriptionItem
              key={sub.id}
              subscription={sub}
              onRemove={() => removeSubscription(sub.id)}
              onEdit={() =>
                push(
                  <EditSubscriptionForm
                    subscription={sub}
                    onSave={async (updated) => {
                      const newSubs = subscriptions.map((s) =>
                        s.id === sub.id ? { ...s, ...updated } : s,
                      );
                      setSubscriptions(newSubs);
                      await LocalStorage.setItem(
                        "subscriptions",
                        JSON.stringify(newSubs),
                      );
                      showToast({
                        style: Toast.Style.Success,
                        title: "Subscription updated",
                      });
                    }}
                  />,
                )
              }
            />
          ))}
        </List.Section>
      )}

      {subscriptions.length === 0 && !isLoading && (
        <List.EmptyView
          title="No subscriptions yet"
          description="Add categories, authors, or keywords to follow"
          icon={Icon.Bell}
        />
      )}
    </List>
  );
}

function SubscriptionItem({
  subscription,
  onRemove,
  onEdit,
}: {
  subscription: Subscription;
  onRemove: () => void;
  onEdit: () => void;
}) {
  const icon =
    subscription.type === "category"
      ? Icon.Tag
      : subscription.type === "author"
        ? Icon.Person
        : Icon.MagnifyingGlass;

  const color = subscription.color
    ? (subscription.color as Color)
    : subscription.type === "category"
      ? Color.Blue
      : subscription.type === "author"
        ? Color.Green
        : Color.Orange;

  const lastCheckedDate = new Date(subscription.lastChecked);

  return (
    <List.Item
      title={subscription.name}
      subtitle={subscription.value}
      icon={{ source: icon, tintColor: color }}
      accessories={[
        {
          text: format(lastCheckedDate, "MMM d, HH:mm"),
          tooltip: "Last checked",
        },
      ]}
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            <Action.Push
              title="View Feed"
              target={<SubscriptionFeed subscription={subscription} />}
              icon={Icon.List}
            />
            <Action
              title="Edit Subscription"
              icon={Icon.Pencil}
              onAction={onEdit}
              shortcut={{ modifiers: ["cmd"], key: "e" }}
            />
          </ActionPanel.Section>
          <ActionPanel.Section>
            <Action
              title="Remove Subscription"
              icon={Icon.Trash}
              onAction={onRemove}
              style={Action.Style.Destructive}
              shortcut={{ modifiers: ["cmd"], key: "d" }}
            />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}

function AddSubscriptionForm({
  onAdd,
  existingSubs,
  presetType,
  presetValue,
}: {
  onAdd: (sub: Omit<Subscription, "id" | "createdAt" | "lastChecked">) => void;
  existingSubs: Subscription[];
  presetType?: "category" | "author" | "keyword";
  presetValue?: string;
}) {
  const { pop } = useNavigation();
  const [type, setType] = useState<"category" | "author" | "keyword">(
    presetType || "category",
  );
  const [nameFieldValue, setNameFieldValue] = useState("");

  return (
    <Form
      navigationTitle="Add Subscription"
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Add Subscription"
            onSubmit={(values) => {
              if (!values.value) {
                showToast({
                  style: Toast.Style.Failure,
                  title: "Missing value",
                  message: "Please select or enter a value",
                });
                return;
              }

              let displayName = values.name || "";

              if (type === "category" && !displayName) {
                const category = Object.entries(ARXIV_CATEGORIES)
                  .flatMap(([_, cats]) => Object.entries(cats))
                  .find(([code, _]) => code === values.value);
                displayName = category ? category[1] : values.value;
              } else if (!displayName) {
                displayName = values.value;
              }

              onAdd({
                type: values.type,
                value: values.value,
                name: displayName,
                color:
                  values.color ||
                  (type === "category"
                    ? Color.Blue
                    : type === "author"
                      ? Color.Green
                      : Color.Orange),
              });
              pop();
            }}
          />
          <Action
            title="Cancel"
            onAction={pop}
            shortcut={{ modifiers: ["cmd"], key: "." }}
          />
        </ActionPanel>
      }
    >
      <Form.Description text="Subscribe to categories, authors, or keywords to get notified about new papers" />

      <Form.Dropdown
        id="type"
        title="Type"
        value={type}
        onChange={(newType) => {
          setType(newType as any);
          setNameFieldValue("");
        }}
      >
        <Form.Dropdown.Item value="category" title="Category" icon={Icon.Tag} />
        <Form.Dropdown.Item value="author" title="Author" icon={Icon.Person} />
        <Form.Dropdown.Item
          value="keyword"
          title="Keyword"
          icon={Icon.MagnifyingGlass}
        />
      </Form.Dropdown>

      {type === "category" ? (
        <Form.Dropdown
          id="value"
          title="Category"
          defaultValue={presetValue}
          storeValue
        >
          <Form.Dropdown.Item value="" title="Select a category..." />
          {Object.entries(ARXIV_CATEGORIES).map(([group, categories]) => (
            <Form.Dropdown.Section key={group} title={group}>
              {Object.entries(categories).map(([code, name]) => {
                const isSubscribed = existingSubs.some(
                  (s) => s.type === "category" && s.value === code,
                );
                return (
                  <Form.Dropdown.Item
                    key={code}
                    value={code}
                    title={`${name} (${code})${isSubscribed ? " ✓" : ""}`}
                  />
                );
              })}
            </Form.Dropdown.Section>
          ))}
        </Form.Dropdown>
      ) : (
        <Form.TextField
          id="value"
          title={type === "author" ? "Author Name" : "Keyword"}
          placeholder={
            type === "author"
              ? "e.g., Yann LeCun, Geoffrey Hinton"
              : "e.g., transformer, attention mechanism"
          }
          defaultValue={presetValue}
          info={
            type === "author"
              ? "Enter the author's name as it appears in papers"
              : "Papers containing this keyword will appear in your feed"
          }
        />
      )}

      <Form.TextField
        id="name"
        title="Display Name"
        placeholder="Optional: Custom name for this subscription"
        value={nameFieldValue}
        onChange={setNameFieldValue}
        info="Leave empty to use default name"
      />

      <Form.Dropdown id="color" title="Color" defaultValue={Color.Blue}>
        <Form.Dropdown.Item
          value={Color.Blue}
          title="Blue"
          icon={{ source: Icon.Circle, tintColor: Color.Blue }}
        />
        <Form.Dropdown.Item
          value={Color.Green}
          title="Green"
          icon={{ source: Icon.Circle, tintColor: Color.Green }}
        />
        <Form.Dropdown.Item
          value={Color.Orange}
          title="Orange"
          icon={{ source: Icon.Circle, tintColor: Color.Orange }}
        />
        <Form.Dropdown.Item
          value={Color.Purple}
          title="Purple"
          icon={{ source: Icon.Circle, tintColor: Color.Purple }}
        />
        <Form.Dropdown.Item
          value={Color.Red}
          title="Red"
          icon={{ source: Icon.Circle, tintColor: Color.Red }}
        />
        <Form.Dropdown.Item
          value={Color.Yellow}
          title="Yellow"
          icon={{ source: Icon.Circle, tintColor: Color.Yellow }}
        />
        <Form.Dropdown.Item
          value={Color.Magenta}
          title="Magenta"
          icon={{ source: Icon.Circle, tintColor: Color.Magenta }}
        />
      </Form.Dropdown>
    </Form>
  );
}

function EditSubscriptionForm({
  subscription,
  onSave,
}: {
  subscription: Subscription;
  onSave: (updated: Partial<Subscription>) => void;
}) {
  const { pop } = useNavigation();

  return (
    <Form
      navigationTitle="Edit Subscription"
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Save Changes"
            onSubmit={(values) => {
              onSave({
                name: values.name || subscription.value,
                color: values.color,
              });
              pop();
            }}
          />
          <Action
            title="Cancel"
            onAction={pop}
            shortcut={{ modifiers: ["cmd"], key: "." }}
          />
        </ActionPanel>
      }
    >
      <Form.Description
        text={`Editing ${subscription.type}: ${subscription.value}`}
      />

      <Form.TextField
        id="name"
        title="Display Name"
        defaultValue={subscription.name}
        placeholder="Custom name for this subscription"
      />

      <Form.Dropdown
        id="color"
        title="Color"
        defaultValue={subscription.color || Color.Blue}
      >
        <Form.Dropdown.Item
          value={Color.Blue}
          title="Blue"
          icon={{ source: Icon.Circle, tintColor: Color.Blue }}
        />
        <Form.Dropdown.Item
          value={Color.Green}
          title="Green"
          icon={{ source: Icon.Circle, tintColor: Color.Green }}
        />
        <Form.Dropdown.Item
          value={Color.Orange}
          title="Orange"
          icon={{ source: Icon.Circle, tintColor: Color.Orange }}
        />
        <Form.Dropdown.Item
          value={Color.Purple}
          title="Purple"
          icon={{ source: Icon.Circle, tintColor: Color.Purple }}
        />
        <Form.Dropdown.Item
          value={Color.Red}
          title="Red"
          icon={{ source: Icon.Circle, tintColor: Color.Red }}
        />
        <Form.Dropdown.Item
          value={Color.Yellow}
          title="Yellow"
          icon={{ source: Icon.Circle, tintColor: Color.Yellow }}
        />
        <Form.Dropdown.Item
          value={Color.Magenta}
          title="Magenta"
          icon={{ source: Icon.Circle, tintColor: Color.Magenta }}
        />
      </Form.Dropdown>
    </Form>
  );
}
