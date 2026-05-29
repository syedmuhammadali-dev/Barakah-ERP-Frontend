import { Settings } from "../src/pages/settings";
import { ProtectedRoute } from "../src/components/protected-route";

export default function SettingsPage() {
  return <ProtectedRoute component={Settings} />;
}

