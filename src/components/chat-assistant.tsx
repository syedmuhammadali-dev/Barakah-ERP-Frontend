"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, Languages, LoaderCircle, Mic, Send, Volume2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-error";
import { useAppLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useAuth } from "@barakah/auth-web";
import { useRouteTransition } from "@/components/route-transition";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

type SpeechRecognitionResultEvent = Event & {
  results: { [index: number]: { [index: number]: { transcript: string } } };
};

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

const CHAT_STORAGE_KEY = "barakah-assistant-chat-v1";
const LANGUAGE_STORAGE_KEY = "barakah-assistant-language-v1";
const LAUNCHER_POSITION_KEY = "barakah-assistant-launcher-pos-v1";

/**
 * Floating AI assistant. Sits bottom-right in English and bottom-left in
 * Urdu so it never covers the start of a line in either reading direction.
 * Conversation is persisted only in this browser's localStorage. It is never
 * sent to the database, and the backend scopes every answer to the signed-in
 * user's own data.
 */
export function ChatAssistant() {
  const { isUrdu, t } = useAppLocale();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { beginTransition } = useRouteTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [assistantLanguage, setAssistantLanguage] = useState<"en" | "ur">("en");
  const [isHydrated, setIsHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const chatStorageKey = `${CHAT_STORAGE_KEY}:${user?.id ?? "guest"}`;
  const languageStorageKey = `${LANGUAGE_STORAGE_KEY}:${user?.id ?? "guest"}`;
  const [launcherPos, setLauncherPos] = useState<{ x: number; y: number } | null>(null);
  const dragStateRef = useRef<{ dragging: boolean; moved: boolean; startX: number; startY: number; originX: number; originY: number }>({
    dragging: false,
    moved: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  });

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(LAUNCHER_POSITION_KEY);
      if (saved) setLauncherPos(JSON.parse(saved) as { x: number; y: number });
    } catch {
      // ignore malformed/unavailable storage
    }
  }, []);

  const clampPosition = (x: number, y: number) => {
    const size = 64;
    const margin = 8;
    const maxX = window.innerWidth - size - margin;
    const maxY = window.innerHeight - size - margin;
    return { x: Math.min(Math.max(margin, x), Math.max(margin, maxX)), y: Math.min(Math.max(margin, y), Math.max(margin, maxY)) };
  };

  const onLauncherPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    dragStateRef.current = {
      dragging: true,
      moved: false,
      startX: event.clientX,
      startY: event.clientY,
      originX: rect.left,
      originY: rect.top,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onLauncherPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const state = dragStateRef.current;
    if (!state.dragging) return;
    const dx = event.clientX - state.startX;
    const dy = event.clientY - state.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) state.moved = true;
    if (state.moved) {
      setLauncherPos(clampPosition(state.originX + dx, state.originY + dy));
    }
  };

  const onLauncherPointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const state = dragStateRef.current;
    state.dragging = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
    if (state.moved) {
      setLauncherPos((current) => {
        if (current) {
          try {
            window.localStorage.setItem(LAUNCHER_POSITION_KEY, JSON.stringify(current));
          } catch {
            // ignore storage failures (private mode, quota, etc.)
          }
        }
        return current;
      });
    }
  };

  useEffect(() => {
    if (authLoading) return;
    try {
      const savedMessages = window.localStorage.getItem(chatStorageKey);
      const savedLanguage = window.localStorage.getItem(languageStorageKey);
      if (savedMessages) setMessages(JSON.parse(savedMessages) as ChatMessage[]);
      if (savedLanguage === "ur" || savedLanguage === "en") setAssistantLanguage(savedLanguage);
    } catch {
      window.localStorage.removeItem(CHAT_STORAGE_KEY);
    } finally {
      setIsHydrated(true);
    }
  }, [authLoading, chatStorageKey, languageStorageKey]);

  useEffect(() => {
    if (!isHydrated) return;
    window.localStorage.setItem(chatStorageKey, JSON.stringify(messages));
    window.localStorage.setItem(languageStorageKey, assistantLanguage);
  }, [assistantLanguage, chatStorageKey, isHydrated, languageStorageKey, messages]);

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
      const response = await apiRequest<{ reply: string; action?: { type: "navigate"; path: string } }>(
        "/api/assistant/chat",
        {
          method: "POST",
          body: JSON.stringify({ messages: nextMessages.slice(-10), language: assistantLanguage }),
        },
      );
      setMessages([...nextMessages, { role: "assistant", content: response.reply }]);
      if (response.action?.type === "navigate" && response.action.path) {
        beginTransition();
        router.push(response.action.path);
      }
    } catch (err) {
      // Surface the real reason inline rather than failing silently.
      setError(getApiErrorMessage(err, t("assistant.error")));
    } finally {
      setIsSending(false);
    }
  };

  const sideClass = isUrdu ? "left-6" : "right-6";

  const toggleVoiceInput = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const browserWindow = window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const Recognition = browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition;
    if (!Recognition) {
      setError(t("assistant.voiceUnsupported"));
      return;
    }

    const recognition = new Recognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = assistantLanguage === "ur" ? "ur-PK" : "en-US";
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (transcript) setInput((current) => `${current} ${transcript}`.trim());
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => {
      setIsListening(false);
      setError(t("assistant.voiceError"));
    };
    recognitionRef.current = recognition;
    setError(null);
    setIsListening(true);
    recognition.start();
  };

  const speakMessage = (content: string) => {
    if (!("speechSynthesis" in window)) {
      setError(t("assistant.voiceUnsupported"));
      return;
    }
    const utterance = new SpeechSynthesisUtterance(content);
    utterance.lang = /[\u0600-\u06ff]/.test(content) ? "ur-PK" : "en-US";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const toggleAssistantLanguage = () => {
    setAssistantLanguage((current) => (current === "en" ? "ur" : "en"));
    setError(null);
  };

  if (!isOpen) {
    return (
      <Button
        type="button"
        aria-label={t("assistant.open")}
        onClick={() => {
          if (!dragStateRef.current.moved) setIsOpen(true);
        }}
        onPointerDown={onLauncherPointerDown}
        onPointerMove={onLauncherPointerMove}
        onPointerUp={onLauncherPointerUp}
        style={launcherPos ? { left: launcherPos.x, top: launcherPos.y, right: "auto", bottom: "auto" } : undefined}
        className={cn(
          "fixed bottom-6 z-50 h-16 w-16 touch-none cursor-grab rounded-full border-2 border-primary-foreground/70 shadow-xl ring-4 ring-primary/20 active:cursor-grabbing",
          "bg-primary text-primary-foreground hover:bg-primary/90",
          !launcherPos && sideClass,
        )}
      >
        <Bot className="h-8 w-8" />
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
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Bot className="h-5 w-5" />
          </span>
          <span className="font-semibold">{t("assistant.title")}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label={t("assistant.changeLanguage")}
            title={t("assistant.changeLanguage")}
            onClick={toggleAssistantLanguage}
            className="h-8 gap-1 px-2 text-xs"
          >
            <Languages className="h-4 w-4" />
            {assistantLanguage === "en" ? "اردو" : "English"}
          </Button>
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
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("assistant.greeting")}</p>
        ) : (
          messages.map((message, index) => (
            <div key={index} className={cn("flex max-w-[90%] flex-col gap-1", message.role === "user" ? "ms-auto items-end" : "me-auto items-start")}>
              <div className={cn(
                "rounded-lg px-3 py-2 text-sm whitespace-pre-wrap",
                message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
              )}>
                {message.content}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label={t("assistant.readAloud")}
                title={t("assistant.readAloud")}
                onClick={() => speakMessage(message.content)}
                className="h-7 gap-1 px-2 text-xs text-muted-foreground"
              >
                <Volume2 className="h-3.5 w-3.5" />{t("assistant.readAloud")}
              </Button>
            </div>
          ))
        )}
        {isSending ? (
          <div className="me-auto rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
            {t("assistant.thinking")}
          </div>
        ) : null}
        {error ? <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-800/70 dark:bg-rose-950/40 dark:text-rose-200">{error}</p> : null}
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
        <Button
          type="button"
          variant={isListening ? "default" : "outline"}
          size="sm"
          onClick={toggleVoiceInput}
          disabled={isSending}
          aria-label={isListening ? t("assistant.voiceStop") : t("assistant.voiceStart")}
          title={isListening ? t("assistant.voiceStop") : t("assistant.voiceStart")}
          className="h-9 w-9 shrink-0 p-0"
        >
          {isListening ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
        </Button>
        <Button type="submit" size="sm" disabled={isSending || !input.trim()} className="h-9 w-9 p-0">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
