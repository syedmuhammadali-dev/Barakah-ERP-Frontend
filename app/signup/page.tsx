import type { Metadata } from "next";
import { Signup } from "@/views/signup";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create a new Barakah ERP account.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SignupPage() {
  return <Signup />;
}

