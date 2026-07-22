import { Bell, LogOut, Menu, Search, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { NotificationList } from "../ui/NotificationList";
import { globalSearch, type GlobalSearchResult } from "../../domain/crm";
import { useNotifications } from "../../features/notifications/useNotifications";

export function Topbar({ userEmail, onLogout, onOpenMobileNav }: {
  userEmail: string | null;
  onLogout: () => void | Promise<void>;
  onOpenMobileNav: () => void;
}) {
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<GlobalSearchResult | null>(null);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const notifications = useNotifications({ status: "active", limit: "5" });
  const navigate = useNavigate();
  const bellButtonRef = useRef<HTMLButtonElement>(null);
  const notificationPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!notificationPanelOpen) return;
    const panel = notificationPanelRef.current;
    const firstFocusable = panel?.querySelector<HTMLElement>("button, a, [tabindex]");
    firstFocusable?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setNotificationPanelOpen(false);
      bellButtonRef.current?.focus();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [notificationPanelOpen]);

  useEffect(() => {
    void notifications.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (search.trim().length < 2) {
      setSearchResults(null);
      return;
    }
    const timeout = setTimeout(() => {
      void globalSearch(search).then(setSearchResults).catch(() => setSearchResults(null));
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  function openResult(path: string) {
    navigate(path);
    setSearchResults(null);
  }

  return (
    <>
      <header className="topbar">
        <button className="icon-button mobile-nav-toggle" type="button" aria-label="Abrir menu de navegacao" onClick={onOpenMobileNav}>
          <Menu aria-hidden="true" />
        </button>
        <div className="search-shell">
          <label className="search-box">
            <Search aria-hidden="true" />
            <input
              type="search"
              placeholder="Buscar no CRM"
              aria-label="Buscar no CRM"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") setSearchResults(null);
              }}
            />
          </label>
          {searchResults && (searchResults.customers.length || searchResults.opportunities.length) ? (
            <div className="search-dropdown" role="listbox" aria-label="Resultados da busca">
              {searchResults.customers.length ? (
                <div className="search-dropdown-group">
                  <span className="search-dropdown-label">Clientes</span>
                  {searchResults.customers.map((customer) => (
                    <button key={customer.id} type="button" className="search-dropdown-item" onClick={() => openResult(`/clientes/${customer.id}`)}>
                      <strong>{customer.nome}</strong>
                      <span>{customer.telefone ?? customer.empresa ?? ""}</span>
                    </button>
                  ))}
                </div>
              ) : null}
              {searchResults.opportunities.length ? (
                <div className="search-dropdown-group">
                  <span className="search-dropdown-label">Oportunidades</span>
                  {searchResults.opportunities.map((opportunity) => (
                    <button key={opportunity.id} type="button" className="search-dropdown-item" onClick={() => openResult(`/oportunidades/${opportunity.id}`)}>
                      <strong>{opportunity.titulo}</strong>
                      <span>{opportunity.clienteNome} - {opportunity.etapaNome}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="user-chip">
          <UserRound aria-hidden="true" />
          <span>{userEmail ?? "Sem e-mail"}</span>
        </div>
        <div className="notification-shell">
          <button
            ref={bellButtonRef}
            className="icon-button"
            type="button"
            aria-label="Abrir notificacoes"
            aria-expanded={notificationPanelOpen}
            onClick={() => setNotificationPanelOpen((open) => !open)}
          >
            <Bell aria-hidden="true" />
            {notifications.unreadCount > 0 ? <span>{notifications.unreadCount > 9 ? "9+" : notifications.unreadCount}</span> : null}
          </button>
          {notificationPanelOpen ? (
            <div className="notification-popover" role="dialog" aria-label="Notificacoes recentes" ref={notificationPanelRef}>
              <header>
                <strong>Notificacoes</strong>
                <button className="button ghost" type="button" onClick={() => void notifications.readAll()}>Ler todas</button>
              </header>
              <NotificationList items={notifications.notifications} onRead={notifications.read} onArchive={notifications.archive} onSnooze={notifications.snooze} />
            </div>
          ) : null}
        </div>
        <button className="button ghost" type="button" onClick={() => void onLogout()}>
          <LogOut aria-hidden="true" />
          Sair
        </button>
      </header>
    </>
  );
}
