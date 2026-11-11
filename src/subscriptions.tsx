import {
  Action,
  ActionPanel,
  Alert,
  confirmAlert,
  Form,
  Icon,
  List,
  showToast,
  Toast,
  useNavigation,
} from "@raycast/api";
import { showFailureToast, useForm, usePromise } from "@raycast/utils";
import { ARXIV_CATEGORIES, Subscription } from "./types";
import { SubscriptionFeed } from "./SubscriptionFeed";
import {
  getSubscriptions,
  removeSubscription,
  saveSubscription,
} from "./utils/subscriptions";

const GROUPS = [
  ["category", "Categories", Icon.Tag],
  ["author", "Authors", Icon.Person],
  ["keyword", "Keywords", Icon.MagnifyingGlass],
] as const;

export default function SubscriptionsCommand() {
  const {
    data: subscriptions = [],
    isLoading,
    error,
    revalidate,
  } = usePromise(getSubscriptions);
  const addAction = (
    <Action.Push
      title="Add Subscription"
      icon={Icon.Plus}
      target={<SubscriptionForm onSave={revalidate} />}
      shortcut={{ modifiers: ["cmd"], key: "n" }}
    />
  );
  const actions = (
    <ActionPanel>
      {addAction}
      <Action
        title="Refresh Subscriptions"
        icon={Icon.ArrowClockwise}
        onAction={revalidate}
        shortcut={{ modifiers: ["cmd"], key: "r" }}
      />
    </ActionPanel>
  );

  return (
    <List
      navigationTitle="Subscriptions"
      searchBarPlaceholder="Filter categories, authors, or keywords…"
      isLoading={isLoading}
      actions={actions}
    >
      {error && (
        <List.EmptyView
          icon={Icon.ExclamationMark}
          title="Could Not Load Subscriptions"
          description={error.message}
          actions={actions}
        />
      )}
      {!error && !isLoading && subscriptions.length === 0 && (
        <List.EmptyView
          icon={Icon.List}
          title="No Subscriptions"
          description="Follow a category, author or keyword. New papers appear when you open the feed."
          actions={actions}
        />
      )}
      {!error &&
        GROUPS.map(([type, title, icon]) => {
          const items = subscriptions.filter(
            (subscription) => subscription.type === type,
          );
          return items.length ? (
            <List.Section
              key={type}
              title={title}
              subtitle={String(items.length)}
            >
              {items.map((subscription) => (
                <List.Item
                  key={subscription.id}
                  title={subscription.name}
                  subtitle={
                    subscription.name !== subscription.value
                      ? subscription.value
                      : undefined
                  }
                  icon={icon}
                  keywords={[subscription.value, subscription.type]}
                  actions={
                    <ActionPanel>
                      <Action.Push
                        title="Open Feed"
                        icon={Icon.List}
                        target={
                          <SubscriptionFeed subscription={subscription} />
                        }
                      />
                      <Action.Push
                        title="Edit Subscription"
                        icon={Icon.Pencil}
                        target={
                          <SubscriptionForm
                            subscription={subscription}
                            onSave={revalidate}
                          />
                        }
                        shortcut={{ modifiers: ["cmd"], key: "e" }}
                      />
                      {addAction}
                      <Action
                        title="Remove Subscription"
                        icon={Icon.Trash}
                        style={Action.Style.Destructive}
                        shortcut={{
                          modifiers: ["cmd", "shift"],
                          key: "backspace",
                        }}
                        onAction={async () => {
                          if (
                            !(await confirmAlert({
                              title: "Remove Subscription?",
                              message: subscription.name,
                              primaryAction: {
                                title: "Remove",
                                style: Alert.ActionStyle.Destructive,
                              },
                            }))
                          )
                            return;
                          try {
                            await removeSubscription(subscription.id);
                            await revalidate();
                          } catch (error) {
                            await showFailureToast(error, {
                              title: "Could not remove subscription",
                            });
                          }
                        }}
                      />
                    </ActionPanel>
                  }
                />
              ))}
            </List.Section>
          ) : null;
        })}
    </List>
  );
}

function SubscriptionForm({
  subscription,
  onSave,
}: {
  subscription?: Subscription;
  onSave: () => Promise<unknown>;
}) {
  const { pop } = useNavigation();
  const { handleSubmit, itemProps, values, setValue, setValidationError } =
    useForm<{ type: string; value: string; name: string }>({
      initialValues: {
        type: subscription?.type || "category",
        value: subscription?.value || "",
        name: subscription?.name || "",
      },
      validation: {
        value: (value) =>
          value?.trim() ? undefined : "Choose a category or enter a value.",
      },
      async onSubmit(values) {
        try {
          const name =
            values.name.trim() ||
            (values.type === "category"
              ? Object.values(ARXIV_CATEGORIES)
                  .flatMap((categories) => Object.entries(categories))
                  .find(([code]) => code === values.value)?.[1]
              : undefined) ||
            values.value.trim();
          await saveSubscription(
            { ...values, type: values.type as Subscription["type"], name },
            subscription,
          );
          await onSave();
          await showToast({
            style: Toast.Style.Success,
            title: subscription ? "Subscription updated" : "Subscription added",
          });
          pop();
        } catch (error) {
          if (
            error instanceof Error &&
            error.message === "You already follow this subscription."
          )
            setValidationError("value", error.message);
          else
            await showFailureToast(error, {
              title: "Could not save subscription",
            });
        }
      },
    });

  return (
    <Form
      navigationTitle={subscription ? "Edit Subscription" : "Add Subscription"}
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title={subscription ? "Save Subscription" : "Add Subscription"}
            onSubmit={handleSubmit}
          />
        </ActionPanel>
      }
    >
      <Form.Dropdown
        title="Follow"
        {...itemProps.type}
        onChange={(type) => {
          setValue("type", type);
          setValue("value", "");
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
      {values.type === "category" ? (
        <Form.Dropdown title="Category" {...itemProps.value}>
          <Form.Dropdown.Item value="" title="Choose a Category" />
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
      ) : (
        <Form.TextField
          title={values.type === "author" ? "Author" : "Keyword"}
          placeholder={
            values.type === "author" ? "Yann LeCun" : "graph neural networks"
          }
          {...itemProps.value}
        />
      )}
      <Form.TextField
        title="Display Name"
        placeholder="Optional"
        {...itemProps.name}
      />
    </Form>
  );
}
