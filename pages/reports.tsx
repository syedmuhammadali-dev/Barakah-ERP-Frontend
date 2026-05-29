import { Reports } from "../src/pages/reports";
import { ProtectedRoute } from "../src/components/protected-route";

export default function ReportsPage() {
  return <ProtectedRoute component={Reports} />;
}

