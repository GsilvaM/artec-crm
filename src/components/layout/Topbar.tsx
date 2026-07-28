import { Bell, LogOut, Menu, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar } from "../ui/Avatar";
import { NotificationList } from "../ui/NotificationList";
import { Separator } from "../ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { globalSearch, type GlobalSearchResult } from "../../domain/crm";
import { useNotifications } from "../../features/notifications/useNotifications";

export function Topbar({
  userEmail,
  onLogout,
  onOpenMobileNav,
}: {
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
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

  useEffect(() => {
    function handleGlobalKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    }
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

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
    setSearch("");
  }

  const badgeCount = notifications.unreadCount > 9 ? "9+" : notifications.unreadCount;

  return (
    <TooltipProvider delayDuration={250}>
      <header className="app-topbar">
      <div className="app-topbar-mobile-actions">
        <button type="button" onClick={onOpenMobileNav} className="app-icon-button" aria-label="Abrir menu de navegacao">
          <Menu size={20} aria-hidden="true" />
        </button>
      </div>

      <div className="app-search">
        <label>
          <Search size={18} aria-hidden="true" />
          <input
            ref={searchInputRef}
            type="search"
            placeholder="Buscar clientes, oportunidades..."
            aria-label="Buscar clientes, oportunidades"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") setSearchResults(null);
            }}
          />
          {search ? null : <kbd>{isMac ? "⌘" : "Ctrl"} K</kbd>}
        </label>
        {searchResults && (searchResults.customers.length || searchResults.opportunities.length) ? (
          <div role="listbox" aria-label="Resultados da busca" className="app-search-results">
            {searchResults.customers.length ? (
              <div>
                <span>Clientes</span>
                {searchResults.customers.map((customer) => (
                  <button key={customer.id} type="button" onClick={() => openResult(`/clientes/${customer.id}`)}>
                    <strong>{customer.nome}</strong>
                    <small>{customer.telefone ?? customer.empresa ?? ""}</small>
                  </button>
                ))}
              </div>
            ) : null}
            {searchResults.opportunities.length ? (
              <div>
                <span>Oportunidades</span>
                {searchResults.opportunities.map((opportunity) => (
                  <button key={opportunity.id} type="button" onClick={() => openResult(`/oportunidades/${opportunity.id}`)}>
                    <strong>{opportunity.titulo}</strong>
                    <small>
                      {opportunity.clienteNome} - {opportunity.etapaNome}
                    </small>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="app-topbar-spacer" />

      <div className="app-notification-shell">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              ref={bellButtonRef}
              type="button"
              aria-label="Abrir notificacoes"
              aria-expanded={notificationPanelOpen}
              onClick={() => setNotificationPanelOpen((open) => !open)}
              className="app-icon-button"
            >
              <Bell size={18} aria-hidden="true" />
              {notifications.unreadCount > 0 ? <span>{badgeCount}</span> : null}
            </button>
          </TooltipTrigger>
          <TooltipContent className="app-tooltip">Notificacoes</TooltipContent>
        </Tooltip>
        {notificationPanelOpen ? (
          <div role="dialog" aria-label="Notificacoes recentes" ref={notificationPanelRef} className="app-notification-popover">
            <header>
              <strong>Notificacoes</strong>
              <button type="button" onClick={() => void notifications.readAll()}>
                Ler todas
              </button>
            </header>
            <NotificationList items={notifications.notifications} onRead={notifications.read} onArchive={notifications.archive} onSnooze={notifications.snooze} />
          </div>
        ) : null}
      </div>

      <Separator orientation="vertical" className="app-topbar-separator" />

      <div className="app-user-chip">
        <Avatar name={userEmail ?? "AR"} size="sm" />
        <span>{userEmail?.split("@")[0] ?? "Ana"}</span>
      </div>

      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" onClick={() => void onLogout()} className="app-icon-button app-logout-button" aria-label="Sair">
            <LogOut size={18} aria-hidden="true" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="app-tooltip">Sair</TooltipContent>
      </Tooltip>
      </header>
    </TooltipProvider>
  );
}
