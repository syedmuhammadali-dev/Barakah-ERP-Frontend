import { Suppliers } from "../src/pages/suppliers";
import { ProtectedRoute } from "../src/components/protected-route";

export default function SuppliersPage() {
  return <ProtectedRoute component={Suppliers} />;
}

