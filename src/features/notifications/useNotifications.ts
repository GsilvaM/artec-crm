import { useCallback, useState } from "react";
import {
  archiveNotification,
  loadNotifications,
  loadUnreadNotificationsCount,
  markAllNotificationsRead,
  markNotificationRead,
  snoozeNotification,
  type Notification,
  type NotificationFilters,
} from "../../domain/crm";

export function useNotifications(initialFilters: NotificationFilters = { status: "active", limit: "20" }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState(initialFilters);

  const refresh = useCallback(async (filters: NotificationFilters = initialFilters) => {
    setIsLoading(true);
    setActiveFilters(filters);
    try {
      const [list, count] = await Promise.all([loadNotifications(filters), loadUnreadNotificationsCount()]);
      setNotifications(list.notifications);
      setNextCursor(list.nextCursor);
      setUnreadCount(count);
    } finally {
      setIsLoading(false);
    }
  }, [initialFilters]);

  async function loadMore() {
    if (!nextCursor) return;
    setIsLoadingMore(true);
    try {
      const list = await loadNotifications({ ...activeFilters, cursor: nextCursor });
      setNotifications((current) => [...current, ...list.notifications]);
      setNextCursor(list.nextCursor);
    } finally {
      setIsLoadingMore(false);
    }
  }

  async function read(id: string) {
    await markNotificationRead(id);
    await refresh();
  }

  async function readAll() {
    await markAllNotificationsRead();
    await refresh();
  }

  async function archive(id: string) {
    await archiveNotification(id);
    await refresh();
  }

  async function snooze(id: string) {
    const until = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await snoozeNotification(id, until);
    await refresh();
  }

  return { notifications, unreadCount, isLoading, isLoadingMore, hasMore: nextCursor !== null, refresh, loadMore, read, readAll, archive, snooze };
}
