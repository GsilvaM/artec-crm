import { BarChart3, Bell, Briefcase, Inbox, LayoutDashboard, ListChecks, Settings2, ShieldCheck, Users, Workflow } from "lucide-react";
import { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";

export type SidebarNavItem = {
  label: string;
  path: string;
  icon: typeof LayoutDashboard;
};

const BASE_NAV_ITEMS: SidebarNavItem[] = [
  { label: "Central Comercial", path: "/central-comercial", icon: LayoutDashboard },
  { label: "Funil", path: "/pipeline", icon: Workflow },
  { label: "Clientes", path: "/clientes", icon: Users },
  { label: "Oportunidades", path: "/oportunidades", icon: Briefcase },
  { label: "Proximas acoes", path: "/proximas-acoes", icon: ListChecks },
  { label: "Notificacoes", path: "/notificacoes", icon: Bell },
];

const REPORTS_NAV_ITEM: SidebarNavItem = { label: "Relatorios", path: "/relatorios", icon: BarChart3 };
const AUVO_INBOX_NAV_ITEM: SidebarNavItem = { label: "Caixa Auvo", path: "/caixa-auvo", icon: Inbox };
const ADMIN_NAV_ITEM: SidebarNavItem = { label: "Administracao", path: "/configuracoes/administracao", icon: ShieldCheck };
const INTEGRATIONS_NAV_ITEM: SidebarNavItem = { label: "Integracao Auvo", path: "/configuracoes/integracoes/auvo", icon: Settings2 };

export function Sidebar({ canViewReports, canManageAuvoInbox, canManageUsers, canManageIntegrations, isMobileOpen, onCloseMobile }: {
  canViewReports: boolean;
  canManageAuvoInbox: boolean;
  canManageUsers: boolean;
  canManageIntegrations: boolean;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const location = useLocation();
  const navRef = useRef<HTMLElement>(null);
  const items = [
    ...BASE_NAV_ITEMS,
    ...(canViewReports ? [REPORTS_NAV_ITEM] : []),
    ...(canManageAuvoInbox ? [AUVO_INBOX_NAV_ITEM] : []),
    ...(canManageUsers ? [ADMIN_NAV_ITEM] : []),
    ...(canManageIntegrations ? [INTEGRATIONS_NAV_ITEM] : []),
  ];
  const isRootPath = location.pathname === "/";

  useEffect(() => {
    if (!isMobileOpen) return;
    navRef.current?.querySelector<HTMLElement>("a")?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCloseMobile();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isMobileOpen, onCloseMobile]);

  return (
    <>
      {isMobileOpen ? <div className="sidebar-backdrop" role="presentation" onClick={onCloseMobile} /> : null}
      <aside className={isMobileOpen ? "sidebar is-open" : "sidebar"} aria-label="Navegacao principal">
        <div className="brand-row">
          <div className="brand-mark">A</div>
          <div>
            <strong>Artec CRM</strong>
            <span>Comercial</span>
          </div>
        </div>
        <nav ref={navRef}>
          {items.map((item) => {
            const isActive = location.pathname === item.path || (item.path === "/central-comercial" && isRootPath);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={isActive ? "nav-item active" : "nav-item"}
                aria-current={isActive ? "page" : undefined}
                onClick={onCloseMobile}
              >
                <item.icon aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

export { BASE_NAV_ITEMS, ADMIN_NAV_ITEM, AUVO_INBOX_NAV_ITEM, INTEGRATIONS_NAV_ITEM, REPORTS_NAV_ITEM };
