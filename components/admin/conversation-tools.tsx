"use client";
import { HeadingInfo } from "./info-tip";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDocumentInfo } from "@payloadcms/ui";
type Message = { id: number; sender: string; text: string; createdAt: string };
const quickReplies = [
  [
    "Appointment request",
    "Please call (407) 898-1621 so our reception team can help you request an appointment and confirm availability.",
  ],
  [
    "Contact the practice",
    "You can reach Fine Dentistry of Downtown Orlando at (407) 898-1621. Our team will be happy to help with general questions about your visit.",
  ],
  [
    "Follow-up",
    "Thank you for contacting Fine Dentistry. Is there anything else our reception team can help you with? Please avoid sharing medical details in this chat.",
  ],
];
export function ConversationTools() {
  const { id } = useDocumentInfo();
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const refreshVersion = useRef(0);
  const appliedRefreshVersion = useRef(0);
  const refresh = useCallback(async () => {
    if (!id) return;
    const version = ++refreshVersion.current;
    try {
      const response = await fetch(`/api/clinic-chat?conversation=${id}`, {
        cache: "no-store",
      });
      if (!response.ok) throw Error("Unable to load the conversation.");
      const result = await response.json();
      if (!Array.isArray(result.messages))
        throw Error("Unable to load the conversation.");
      if (version < appliedRefreshVersion.current) return;
      appliedRefreshVersion.current = version;
      setMessages(result.messages);
      setStatus(`${result.status} · ${result.controller}`);
      setLoadError("");
    } catch {
      if (version >= appliedRefreshVersion.current) {
        appliedRefreshVersion.current = version;
        setLoadError(
          "Unable to load the conversation. Reconnecting automatically…",
        );
      }
    }
  }, [id]);
  useEffect(() => {
    appliedRefreshVersion.current = ++refreshVersion.current;
    setMessages([]);
    setMessage("");
    setStatus("");
    setError("");
    setLoadError("");
    void refresh();
    const timer = setInterval(() => void refresh(), 2500);
    return () => {
      clearInterval(timer);
    };
  }, [refresh]);
  async function action(action: string) {
    if (pending.current || !id || (action === "reply" && !message.trim()))
      return;
    pending.current = true;
    const submittedMessage = message;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/clinic-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, id, text: submittedMessage }),
      });
      if (!response.ok) throw Error("The action was not saved. Please retry.");
      if (action === "reply")
        setMessage((draft) => (draft === submittedMessage ? "" : draft));
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to connect.");
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  if (!id) return <p>Open a website conversation to view its messages.</p>;
  return (
    <section className="clinic-inbox" aria-label="Conversation">
      <div className="clinic-inbox-heading">
        <HeadingInfo title="Conversation">
          {" "}
          <p>
            Replies appear in the visitor’s open website chat. SMS and email
            delivery are not connected.
          </p>
        </HeadingInfo>
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
      <label htmlFor="reception-quick-reply">Quick replies</label>
      <select
        id="reception-quick-reply"
        defaultValue=""
        disabled={busy}
        onChange={(event) => {
          const template = quickReplies[Number(event.target.value)]?.[1];
          if (template)
            setMessage((draft) =>
              draft ? `${draft}\n\n${template}` : template,
            );
          event.target.value = "";
          document.getElementById("reception-reply")?.focus();
        }}
      >
        <option value="" disabled>
          Insert a reply to review…
        </option>
        {quickReplies.map(([label], index) => (
          <option key={label} value={index}>
            {label}
          </option>
        ))}
      </select>
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
          {busy ? "Saving…" : "Send reply"}
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
    </section>
  );
}
