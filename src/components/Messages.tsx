import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { io, Socket } from "socket.io-client";
import { useSearchParams } from "react-router-dom";
import type { ChatMessage, Conversation, Page } from "../api";
import { api, errorText } from "../api";
import "../style.css";
import { Empty } from "./Empty";
import { ErrorBox } from "./ErrorBox";
import { PageTitle } from "./PageTitle";
import { Spinner } from "./Spinner";
import { useApp } from "./useApp";

type MessageAcknowledgement =
  | { ok: true; message: ChatMessage }
  | { ok: false; error: string };

export function Messages() {
  const app = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get("conversation") ?? "";
  const selectedRef = useRef(selectedId);
  const socketRef = useRef<Socket | undefined>(undefined);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [connected, setConnected] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    selectedRef.current = selectedId;
  }, [selectedId]);

  const loadConversations = useCallback(async () => {
    setError("");
    try {
      const { data } = await api.get<Page<Conversation>>("/conversations", {
        params: { page: 1, limit: 50 },
      });
      setConversations(data.items);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    setMessages([]);
    if (!selectedId) return;
    let active = true;
    setLoadingMessages(true);
    api
      .get<{ items: ChatMessage[]; hasMore: boolean }>(
        `/conversations/${encodeURIComponent(selectedId)}/messages`,
        { params: { limit: 100 } },
      )
      .then(({ data }) => {
        if (active) {
          setHasMore(data.hasMore);
          const loaded = data.items.slice().reverse();
          setMessages((current) => {
            const ids = new Set(loaded.map((message) => message.id));
            return [...loaded, ...current.filter((message) => !ids.has(message.id))];
          });
        }
      })
      .catch((e: unknown) => {
        if (active) setError(errorText(e));
      })
      .finally(() => {
        if (active) setLoadingMessages(false);
      });
    return () => {
      active = false;
    };
  }, [selectedId]);

  useEffect(() => {
    const token = app.session?.accessToken;
    if (!token || app.demo) return;

    const socket = io(import.meta.env.VITE_API_URL, {
      auth: { token },
      withCredentials: true,
    });
    socketRef.current = socket;
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", () => {
      setConnected(false);
      setError("Не вдалося підключитися до чату. Перевірте доступність сервера.");
    });
    socket.on("message:new", (message: ChatMessage) => {
      setConversations((items) => {
        const index = items.findIndex((item) => item.id === message.conversationId);
        if (index < 0) {
          void loadConversations();
          return items;
        }
        const updated = {
          ...items[index],
          lastMessage: message,
          lastMessageAt: message.createdAt,
        };
        return [updated, ...items.filter((item) => item.id !== message.conversationId)];
      });
      if (message.conversationId === selectedRef.current) {
        setMessages((items) =>
          items.some((item) => item.id === message.id) ? items : [...items, message],
        );
      }
    });
    return () => {
      socket.disconnect();
      socketRef.current = undefined;
      setConnected(false);
    };
  }, [app.session?.accessToken, app.demo, loadConversations]);

  function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const socket = socketRef.current;
    const messageText = text.trim();
    if (!selectedId || !messageText || sending) return;
    if (!socket?.connected) {
      setError("Немає з’єднання з чатом. Перевірте підключення та спробуйте ще раз.");
      return;
    }

    setSending(true);
    setError("");
    socket.timeout(10000).emit(
      "message:send",
      { conversationId: selectedId, text: messageText },
      (timeoutError: Error | null, response?: MessageAcknowledgement) => {
        setSending(false);
        if (timeoutError) {
          setError("Не вдалося надіслати повідомлення: сервер не відповів вчасно.");
          return;
        }
        if (!response?.ok) {
          setError(response?.error ?? "Не вдалося надіслати повідомлення.");
          return;
        }
        setText("");
        setMessages((items) =>
          items.some((item) => item.id === response.message.id)
            ? items
            : [...items, response.message],
        );
      },
    );
  }

  async function loadOlderMessages() {
    const oldest = messages[0];
    if (!selectedId || !oldest || loadingOlder) return;
    setLoadingOlder(true);
    setError("");
    try {
      const { data } = await api.get<{ items: ChatMessage[]; hasMore: boolean }>(
        `/conversations/${encodeURIComponent(selectedId)}/messages`,
        { params: { limit: 100, before: oldest.createdAt } },
      );
      const older = data.items.slice().reverse();
      setHasMore(data.hasMore);
      setMessages((current) => {
        const ids = new Set(current.map((message) => message.id));
        return [...older.filter((message) => !ids.has(message.id)), ...current];
      });
    } catch (e) {
      setError(errorText(e));
    } finally {
      setLoadingOlder(false);
    }
  }

  const selected = conversations.find((item) => item.id === selectedId);

  return (
    <>
      <PageTitle
        title="Повідомлення"
        subtitle="Спілкуйтеся із замовниками та виконавцями напряму."
      />
      {error && <ErrorBox text={error} retry={loadConversations} />}
      <section className="panel chat-layout">
        <aside className="chat-sidebar">
          <div className="chat-sidebar-title">
            <h2>Діалоги</h2>
            <span>{conversations.length}</span>
          </div>
          {loadingConversations ? (
            <Spinner />
          ) : conversations.length ? (
            conversations.map((conversation) => (
              <button
                className={`conversation-row${conversation.id === selectedId ? " selected" : ""}`}
                key={conversation.id}
                onClick={() => setSearchParams({ conversation: conversation.id })}
              >
                <span className="avatar">{conversation.participant.name.slice(0, 1)}</span>
                <span className="conversation-copy">
                  <b>{conversation.participant.name}</b>
                  <small>{conversation.lastMessage?.text ?? "Почніть розмову"}</small>
                </span>
                {conversation.lastMessage && (
                  <time>{new Date(conversation.lastMessage.createdAt).toLocaleDateString("uk-UA")}</time>
                )}
              </button>
            ))
          ) : (
            <Empty text="Поки немає діалогів. Почніть спілкування зі сторінки виконавця." />
          )}
        </aside>
        <div className="chat-panel">
          {selected ? (
            <>
              <div className="chat-heading">
                <span className="avatar">{selected.participant.name.slice(0, 1)}</span>
                <div>
                  <b>{selected.participant.name}</b>
                  <small>{connected ? "Чат активний" : "Підключення до чату…"}</small>
                </div>
              </div>
              <div className="chat-messages" aria-live="polite">
                {loadingMessages ? (
                  <Spinner />
                ) : messages.length ? (
                  <>
                    {hasMore && (
                      <button
                        className="link-button"
                        disabled={loadingOlder}
                        onClick={() => void loadOlderMessages()}
                      >
                        {loadingOlder ? "Завантаження…" : "Завантажити попередні повідомлення"}
                      </button>
                    )}
                    {messages.map((message) => (
                      <div
                        className={`chat-message${message.senderId === app.session?.user.id ? " own" : ""}`}
                        key={message.id}
                      >
                        <p>{message.text}</p>
                        <time>{new Date(message.createdAt).toLocaleString("uk-UA", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}</time>
                      </div>
                    ))}
                  </>
                ) : (
                  <Empty text="Це початок розмови. Напишіть перше повідомлення." />
                )}
              </div>
              <form className="chat-compose" onSubmit={sendMessage}>
                <textarea
                  aria-label="Текст повідомлення"
                  maxLength={2000}
                  rows={2}
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  placeholder="Напишіть повідомлення…"
                  required
                />
                <button className="button primary" disabled={!connected || sending || !text.trim()}>
                  <Send size={16} />
                  {sending ? "Надсилання…" : "Надіслати"}
                </button>
              </form>
            </>
          ) : (
            <div className="chat-placeholder">
              <MessageCircle size={34} />
              <h2>Оберіть діалог</h2>
              <p>Ваші розмови з’являться тут.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
