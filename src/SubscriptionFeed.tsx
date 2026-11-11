import FeedCommand from "./feed";
import { Subscription } from "./types";

export function SubscriptionFeed({
  subscription,
}: {
  subscription: Subscription;
}) {
  return <FeedCommand subscription={subscription} />;
}
