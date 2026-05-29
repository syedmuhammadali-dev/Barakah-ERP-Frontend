import { Salesmen } from "../src/pages/salesmen";
import { ProtectedRoute } from "../src/components/protected-route";

export default function SalesmenPage() {
  return <ProtectedRoute component={Salesmen} />;
}

