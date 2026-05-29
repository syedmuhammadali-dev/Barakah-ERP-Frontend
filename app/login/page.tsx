import type { Metadata } from "next";
import { Login } from "@/views/login";

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to Barakah ERP and continue to your dashboard.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginPage() {
  return <Login />;
}
