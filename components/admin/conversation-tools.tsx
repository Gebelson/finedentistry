"use client";
import { useCallback, useEffect, useState } from "react";
import { useDocumentInfo } from "@payloadcms/ui";
type Message = { id: number; sender: string; text: string; createdAt: string };
export function ConversationTools() {
  const { id } = useDocumentInfo();
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => {
    if (!id) return;
    try {
      const response = await fetch(`/api/clinic-chat?conversation=${id}`);
      if (!response.ok) throw Error("Unable to load the conversation.");
      const result = await response.json();
      setMessages(result.messages);
      setStatus(`${result.status} · ${result.controller}`);
      setLoadError("");
    } catch {
      setLoadError(
        "Unable to load the conversation. Reconnecting automatically…",
      );
    }
  }, [id]);
  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), 2500);
    return () => clearInterval(timer);
  }, [refresh]);
  async function action(action: string) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/clinic-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, id, text: message }),
      });
      if (!response.ok) throw Error("The action was not saved. Please retry.");
      if (action === "reply") setMessage("");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to connect.");
    } finally {
      setBusy(false);
    }
  }
  if (!id) return <p>Open a website conversation to view its messages.</p>;
  return (
    <section className="clinic-inbox" aria-label="Conversation">
      <div className="clinic-inbox-heading">
        <h2>Conversation</h2>
        <span>{status}</span>
      </div>
      <div className="clinic-inbox-messages" aria-live="polite">
        {messages.map((m) => (
          <div
            className={`clinic-message clinic-message-${m.sender}`}
            key={m.id}
          >
            <small>
              {m.sender} · {new Date(m.createdAt).toLocaleTimeString()}
            </small>
            <p>{m.text}</p>
          </div>
        ))}
      </div>
      <label htmlFor="reception-reply">Reply from reception</label>
      <textarea
        id="reception-reply"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={4000}
        rows={3}
      />
      <div className="clinic-inbox-actions">
        <button
          type="button"
          disabled={busy || !message.trim()}
          onClick={() => void action("reply")}
        >
          Send reply
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void action("takeover")}
        >
          Take over
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void action("resolve")}
        >
          Resolve conversation
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
      {loadError && <p role="alert">{loadError}</p>}
      <p className="clinic-inbox-note">
        Replies appear in the visitor’s open website chat. SMS and email
        delivery are not connected.
      </p>
    </section>
  );
}
