"use client";
import { ArrowUpRight } from "@/components/arrow-up-right";
import { useCallback, useEffect, useRef, useState } from "react";
type ChatSettings = { enabled: boolean; mode: string; welcome: string };
type Session = { id: number; token: string };
type Message = { id: number; sender: string; text: string; createdAt?: string };
export function ClinicChat() {
  const [settings, setSettings] = useState<ChatSettings>();
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<Session>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState(false);
  const sending = useRef(false);
  const refreshVersion = useRef(0);
  const appliedRefreshVersion = useRef(0);
  const [controller, setController] = useState("reception");
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    fetch("/api/clinic-chat")
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => {
        if (s) {
          setSettings(s);
          setController(s.mode === "reception" ? "reception" : "assistant");
        }
      })
      .catch(() => {});
  }, []);
  const refresh = useCallback(async (current: Session) => {
    const version = ++refreshVersion.current;
    try {
      const response = await fetch(
        `/api/clinic-chat?conversation=${current.id}`,
        {
          headers: { "x-conversation-token": current.token },
          cache: "no-store",
        },
      );
      if (!response.ok) throw Error("Unable to load messages.");
      const result = await response.json();
      if (!Array.isArray(result.messages))
        throw Error("Unable to load messages.");
      if (version < appliedRefreshVersion.current) return;
      appliedRefreshVersion.current = version;
      setMessages(result.messages);
      setController(result.controller);
      setLoadError("");
    } catch {
      if (version >= appliedRefreshVersion.current) {
        appliedRefreshVersion.current = version;
        setLoadError(
          "Unable to load replies. Reconnecting automatically… Your saved messages are safe.",
        );
      }
    }
  }, []);
  useEffect(() => {
    if (!open || !session) return;
    const initial = setTimeout(() => void refresh(session), 0);
    const timer = setInterval(() => void refresh(session), 2500);
    return () => {
      clearInterval(timer);
      clearTimeout(initial);
    };
  }, [open, session, refresh]);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);
  async function send(action = "message") {
    if (sending.current || (action === "message" && !message.trim())) return;
    sending.current = true;
    const submittedMessage = message;
    setBusy(true);
    setError("");
    try {
      let current = session;
      if (!current) {
        const started = await fetch("/api/clinic-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "start" }),
        });
        if (!started.ok)
          throw Error("Chat is unavailable. Please call (407) 898-1621.");
        current = (await started.json()) as Session;
        setSession(current);
      }
      const response = await fetch("/api/clinic-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-conversation-token": current.token,
        },
        body: JSON.stringify({
          action,
          id: current.id,
          text: submittedMessage,
        }),
      });
      if (!response.ok)
        throw Error(
          "Your message was not saved. Please retry or call the practice.",
        );
      if (action === "message")
        setMessage((draft) => (draft === submittedMessage ? "" : draft));
      await refresh(current);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to connect.");
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }
  if (!settings?.enabled) return null;
  return (
    <aside className="clinic-chat" aria-label="Practice chat">
      {open && (
        <section
          className="clinic-chat-panel"
          aria-label="Fine Dentistry conversation"
        >
          <div className="clinic-chat-heading">
            <div>
              <strong>Fine Dentistry</strong>
              <small>
                {controller === "assistant"
                  ? "Practice FAQ assistant"
                  : "Message reception"}
              </small>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
            >
              ×
            </button>
          </div>
          <p className="clinic-chat-privacy">
            For general questions about your visit. Please don’t include medical
            details.
          </p>
          <div className="clinic-chat-messages" aria-live="polite">
            {!messages.length && <p>{settings.welcome}</p>}
            {messages.map((m) => (
              <p key={m.id} className={`chat-bubble chat-bubble-${m.sender}`}>
                <small>
                  {m.sender === "visitor"
                    ? "You"
                    : m.sender === "reception"
                      ? "Reception"
                      : "Practice assistant"}
                </small>
                {m.text}
                {m.createdAt && (
                  <small>
                    <time dateTime={m.createdAt}>
                      {new Date(m.createdAt).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </time>
                  </small>
                )}
              </p>
            ))}
            <div ref={end} />
          </div>
          {settings.mode === "hybrid" && controller === "assistant" && (
            <button
              type="button"
              className="clinic-chat-handoff"
              disabled={busy}
              onClick={() => void send("handoff")}
            >
              Ask reception to help <ArrowUpRight />
            </button>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <label className="sr-only" htmlFor="clinic-chat-input">
              Your message
            </label>
            <input
              id="clinic-chat-input"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={4000}
              placeholder="Write a message…"
              autoComplete="off"
              required
            />
            <button type="submit" disabled={busy || !message.trim()}>
              {busy ? "Saving…" : "Send"}
            </button>
          </form>
          {error && (
            <p role="alert" className="clinic-chat-error">
              {error}
            </p>
          )}
          {loadError && (
            <p role="status" className="clinic-chat-error">
              {loadError}
            </p>
          )}
          <a className="clinic-chat-phone" href="tel:+14078981621">
            Or call (407) 898-1621
          </a>
        </section>
      )}
      <button
        type="button"
        className="clinic-chat-toggle"
        data-analytics-event={open ? undefined : "chat_open"}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {open ? "Close chat" : "Let’s talk"}
        <span aria-hidden="true">{open ? "−" : <ArrowUpRight />}</span>
      </button>
    </aside>
  );
}
