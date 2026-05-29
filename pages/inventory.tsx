import { Inventory } from "../src/pages/inventory";
import { ProtectedRoute } from "../src/components/protected-route";

export default function InventoryPage() {
  return <ProtectedRoute component={Inventory} />;
}

