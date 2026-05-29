import { Zakat } from "../src/pages/zakat";
import { ProtectedRoute } from "../src/components/protected-route";

export default function ZakatPage() {
  return <ProtectedRoute component={Zakat} />;
}

