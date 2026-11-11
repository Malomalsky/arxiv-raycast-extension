import { randomUUID } from "node:crypto";
import { Subscription } from "../types";
import { readItems, updateItems } from "./storage";

export async function getSubscriptions(): Promise<Subscription[]> {
  const subscriptions = await readItems<Subscription>("subscriptions");
  if (
    subscriptions.some(
      (subscription) =>
        !subscription?.id ||
        !["category", "author", "keyword"].includes(subscription.type) ||
        typeof subscription.value !== "string" ||
        typeof subscription.name !== "string",
    )
  ) {
    throw new Error(
      "Some saved subscriptions are invalid. They have not been changed.",
    );
  }
  return subscriptions;
}

export function saveSubscription(
  values: Pick<Subscription, "type" | "value" | "name">,
  existing?: Subscription,
): Promise<void> {
  const value = values.value.trim();
  if (!["category", "author", "keyword"].includes(values.type))
    return Promise.reject(new Error("Choose a subscription type."));
  if (!value)
    return Promise.reject(new Error("Enter a category, author or keyword."));
  return updateItems<Subscription>("subscriptions", (subscriptions) => {
    if (existing && !subscriptions.some((item) => item.id === existing.id))
      throw new Error("This subscription has already been removed.");
    if (
      subscriptions.some(
        (subscription) =>
          subscription.id !== existing?.id &&
          subscription.type === values.type &&
          subscription.value.toLowerCase() === value.toLowerCase(),
      )
    ) {
      throw new Error("You already follow this subscription.");
    }
    const now = new Date().toISOString();
    const subscription: Subscription = {
      id: randomUUID(),
      createdAt: now,
      lastChecked: now,
      ...existing,
      type: values.type,
      value,
      name: values.name.trim() || value,
    };
    return existing
      ? subscriptions.map((item) =>
          item.id === existing.id ? subscription : item,
        )
      : [...subscriptions, subscription];
  });
}

export function removeSubscription(id: string): Promise<void> {
  return updateItems<Subscription>("subscriptions", (subscriptions) =>
    subscriptions.filter((subscription) => subscription.id !== id),
  );
}
