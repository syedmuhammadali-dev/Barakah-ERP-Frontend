import { Sales } from "../src/pages/sales";
import { ProtectedRoute } from "../src/components/protected-route";

export default function SalesPage() {
  return <ProtectedRoute component={Sales} />;
}

