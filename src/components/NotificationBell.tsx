import { Bell, CheckCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import type { NotificationItem, Page } from "../api";
import { api, errorText } from "../api";
import "../style.css";
import { useApp } from "./useApp";

function notificationText(notification: NotificationItem) {
  const title =
    typeof notification.payload.contractTitle === "string"
      ? notification.payload.contractTitle
      : "замовлення";
  switch (notification.type) {
    case "proposal_received":
      return `Нова пропозиція для «${title}»`;
    case "proposal_accepted":
      return `Вашу пропозицію прийнято: «${title}»`;
    case "proposal_rejected":
      return `Пропозицію відхилено: «${title}»`;
    case "contract_status_changed":
      return `Змінився статус замовлення «${title}»`;
  }
}

export function NotificationBell() {
  const app = useApp();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    api
      .get<{ count: number }>("/notifications/unread-count")
      .then(({ data }) => {
        if (active) setUnread(data.count);
      })
      .catch((e: unknown) => {
        if (active) app.notice(errorText(e));
      });

    const token = app.session?.accessToken;
    if (!token || app.demo) return () => { active = false; };
    const socket = io(import.meta.env.VITE_API_URL, {
      auth: { token },
      withCredentials: true,
    });
    socket.on("notification:new", (notification: NotificationItem) => {
      setUnread((count) => count + (notification.readAt ? 0 : 1));
      setItems((current) =>
        current.some((item) => item.id === notification.id)
          ? current
          : [notification, ...current].slice(0, 8),
      );
    });
    return () => {
      active = false;
      socket.disconnect();
    };
  }, [app.session?.accessToken, app.demo]);

  async function loadNotifications() {
    setLoading(true);
    try {
      const { data } = await api.get<Page<NotificationItem>>("/notifications", {
        params: { page: 1, limit: 8 },
      });
      setItems(data.items);
    } catch (e) {
      app.notice(errorText(e));
    } finally {
      setLoading(false);
    }
  }

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next) await loadNotifications();
  }

  async function markRead(notification: NotificationItem) {
    if (notification.readAt) return notification;
    try {
      const { data } = await api.patch<NotificationItem>(
        `/notifications/${encodeURIComponent(notification.id)}/read`,
      );
      setItems((current) => current.map((item) => item.id === data.id ? data : item));
      setUnread((count) => Math.max(0, count - 1));
      return data;
    } catch (e) {
      app.notice(errorText(e));
      return undefined;
    }
  }

  async function openNotification(notification: NotificationItem) {
    const updated = await markRead(notification);
    if (!updated) return;
    setOpen(false);
    const contractId = updated.payload.contractId;
    if (typeof contractId === "string") navigate(`/contracts/${encodeURIComponent(contractId)}`);
  }

  async function markAllRead() {
    try {
      await api.patch("/notifications/read-all");
      setItems((current) => current.map((item) => ({ ...item, readAt: item.readAt ?? new Date().toISOString() })));
      setUnread(0);
    } catch (e) {
      app.notice(errorText(e));
    }
  }

  return (
    <div className="notification-wrap">
      <button
        className="icon-button notification-button"
        title="Сповіщення"
        aria-label={`Сповіщення, непрочитаних: ${unread}`}
        aria-expanded={open}
        onClick={() => void toggle()}
      >
        <Bell size={18} />
        {unread > 0 && <span className="notification-count">{unread > 99 ? "99+" : unread}</span>}
      </button>
      {open && (
        <section className="notification-menu panel" aria-label="Сповіщення">
          <div className="notification-menu-heading">
            <b>Сповіщення</b>
            {unread > 0 && (
              <button className="link-button" onClick={() => void markAllRead()}>
                <CheckCheck size={14} /> Прочитати всі
              </button>
            )}
          </div>
          {loading ? (
            <p className="notification-empty">Завантаження…</p>
          ) : items.length ? (
            items.map((item) => (
              <button
                className={`notification-item${item.readAt ? "" : " unread"}`}
                key={item.id}
                onClick={() => void openNotification(item)}
              >
                <span>{notificationText(item)}</span>
                <time>{new Date(item.createdAt).toLocaleString("uk-UA", {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}</time>
              </button>
            ))
          ) : (
            <p className="notification-empty">Нових сповіщень поки немає.</p>
          )}
        </section>
      )}
    </div>
  );
}
