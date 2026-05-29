import { Subscription } from "../src/pages/subscription";
import { SubscriptionGuard } from "../src/components/subscription-guard";
import { AppLayout } from "../src/components/layout";

export default function SubscriptionPage() {
  return (
    <AppLayout>
      <SubscriptionGuard>
        <Subscription />
      </SubscriptionGuard>
    </AppLayout>
  );
}

