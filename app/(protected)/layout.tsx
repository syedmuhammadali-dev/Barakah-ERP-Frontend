"use client";

import { ProtectedRoute } from "@/components/protected-route";
import { ChatAssistant } from "@/components/chat-assistant";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      {children}
      <ChatAssistant />
    </ProtectedRoute>
  );
}
