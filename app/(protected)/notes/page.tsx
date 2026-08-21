import type { Metadata } from "next";
import { Notes } from "@/views/notes";

export const metadata: Metadata = {
  title: "Notes",
  description: "Keep organized notes for your business.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotesPage() {
  return <Notes />;
}
