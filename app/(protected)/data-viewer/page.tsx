import type { Metadata } from "next";
import { DataViewer } from "@/views/data-viewer";

export const metadata: Metadata = {
  title: "Data Viewer",
  description: "Browse an exported Excel file locally — nothing is uploaded or saved.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DataViewerPage() {
  return <DataViewer />;
}
