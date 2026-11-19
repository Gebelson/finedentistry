"use client";
import { useCallback, useEffect, useRef, useState } from "react";
type ChatSettings = { enabled: boolean; mode: string; welcome: string };
type Session = { id: number; token: string };
type Message = { id: number; sender: string; text: string };
export function ClinicChat() {
  const [settings, setSettings] = useState<ChatSettings>();
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<Session>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
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
    const response = await fetch(
      `/api/clinic-chat?conversation=${current.id}`,
      { headers: { "x-conversation-token": current.token } },
    );
    if (response.ok) {
      const result = await response.json();
      setMessages(result.messages);
      setController(result.controller);
    }
  }, []);
  useEffect(() => {
    if (!open || !session) return;
    const timer = setInterval(() => void refresh(session), 2500);
    return () => clearInterval(timer);
  }, [open, session, refresh]);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);
  async function send(action = "message") {
    if (busy) return;
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
        body: JSON.stringify({ action, id: current.id, text: message }),
      });
      if (!response.ok)
        throw Error(
          "Your message was not saved. Please retry or call the practice.",
        );
      setMessage("");
      await refresh(current);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to connect.");
    } finally {
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
              Ask reception to help ↗
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
          <a className="clinic-chat-phone" href="tel:+14078981621">
            Or call (407) 898-1621
          </a>
        </section>
      )}
      <button
        type="button"
        className="clinic-chat-toggle"
        data-analytics-event={open ? undefined : 'chat_open'}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {open ? "Close chat" : "Let’s talk"}
        <span aria-hidden="true">{open ? "−" : "↗"}</span>
      </button>
    </aside>
  );
}
