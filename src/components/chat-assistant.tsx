"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-error";
import { useAppLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Floating AI assistant. Sits bottom-right in English and bottom-left in
 * Urdu so it never covers the start of a line in either reading direction.
 * Conversation lives in component state only — it is not persisted, and the
 * backend scopes every answer to the signed-in user's own data.
 */
export function ChatAssistant() {
  const { isUrdu, t } = useAppLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, isSending]);

  const send = async () => {
    const question = input.trim();
    if (!question || isSending) {
      return;
    }

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: question }];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setIsSending(true);

    try {
      const response = await apiRequest<{ reply: string }>("/api/assistant/chat", {
        method: "POST",
        body: JSON.stringify({ messages: nextMessages.slice(-10) }),
      });
      setMessages([...nextMessages, { role: "assistant", content: response.reply }]);
    } catch (err) {
      // Surface the real reason inline rather than failing silently.
      setError(getApiErrorMessage(err, t("assistant.error")));
    } finally {
      setIsSending(false);
    }
  };

  const sideClass = isUrdu ? "left-6" : "right-6";

  if (!isOpen) {
    return (
      <Button
        type="button"
        aria-label={t("assistant.open")}
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 z-50 h-14 w-14 rounded-full shadow-lg",
          "bg-primary text-primary-foreground hover:bg-primary/90",
          sideClass,
        )}
      >
        <Bot className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <div
      className={cn(
        "fixed bottom-6 z-50 flex h-128 max-h-[calc(100vh-3rem)] w-88 max-w-[calc(100vw-3rem)]",
        "flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl",
        sideClass,
      )}
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <span className="font-semibold">{t("assistant.title")}</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={t("assistant.close")}
          onClick={() => setIsOpen(false)}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("assistant.greeting")}</p>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                "max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap",
                message.role === "user"
                  ? "ms-auto bg-primary text-primary-foreground"
                  : "me-auto bg-muted text-foreground",
              )}
            >
              {message.content}
            </div>
          ))
        )}
        {isSending ? (
          <div className="me-auto rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
            {t("assistant.thinking")}
          </div>
        ) : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>

      <form
        className="flex items-center gap-2 border-t border-border px-3 py-3"
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
      >
        <Input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={t("assistant.placeholder")}
          disabled={isSending}
        />
        <Button type="submit" size="sm" disabled={isSending || !input.trim()} className="h-9 w-9 p-0">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
