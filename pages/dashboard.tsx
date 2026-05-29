import { Dashboard } from "../src/pages/dashboard";
import { ProtectedRoute } from "../src/components/protected-route";

export default function DashboardPage() {
  return <ProtectedRoute component={Dashboard} />;
}

