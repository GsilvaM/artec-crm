import {
  BarChart3,
  Bell,
  Briefcase,
  ChevronsLeft,
  ChevronsRight,
  Inbox,
  LayoutDashboard,
  ListChecks,
  Settings2,
  ShieldCheck,
  Users,
  Workflow,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "../../lib/utils";
import { useEscapeKey, useOverlayScrollLockAndFocusRestore } from "../ui/useOverlayBehavior";

export type SidebarNavItem = {
  label: string;
  path: string;
  icon: typeof LayoutDashboard;
};

type SidebarNavGroup = {
  label: string;
  items: SidebarNavItem[];
};

const OPERACAO_NAV_ITEMS: SidebarNavItem[] = [
  { label: "Central Comercial", path: "/central-comercial", icon: LayoutDashboard },
  { label: "Proximas Acoes", path: "/proximas-acoes", icon: ListChecks },
  { label: "Funil", path: "/pipeline", icon: Workflow },
  { label: "Oportunidades", path: "/oportunidades", icon: Briefcase },
  { label: "Clientes", path: "/clientes", icon: Users },
  { label: "Caixa Auvo", path: "/caixa-auvo", icon: Inbox },
  { label: "Notificacoes", path: "/notificacoes", icon: Bell },
];

const REPORTS_NAV_ITEM: SidebarNavItem = { label: "Relatorios", path: "/relatorios", icon: BarChart3 };
const ADMIN_NAV_ITEM: SidebarNavItem = { label: "Administracao", path: "/configuracoes/administracao", icon: ShieldCheck };
const INTEGRATIONS_NAV_ITEM: SidebarNavItem = { label: "Integracao Auvo", path: "/configuracoes/integracoes/auvo", icon: Settings2 };

export function Sidebar({
  canViewReports,
  canManageAuvoInbox,
  canManageUsers,
  canManageIntegrations,
  isMobileOpen,
  onCloseMobile,
}: {
  canViewReports: boolean;
  canManageAuvoInbox: boolean;
  canManageUsers: boolean;
  canManageIntegrations: boolean;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const location = useLocation();
  const navRef = useRef<HTMLElement>(null);
  const [collapsed, setCollapsed] = useState(false);

  const operationItems = OPERACAO_NAV_ITEMS.filter((item) => item.path !== "/caixa-auvo" || canManageAuvoInbox);
  const managementItems = [
    ...(canViewReports ? [REPORTS_NAV_ITEM] : []),
    ...(canManageUsers ? [ADMIN_NAV_ITEM] : []),
    ...(canManageIntegrations ? [INTEGRATIONS_NAV_ITEM] : []),
  ];

  const groups: SidebarNavGroup[] = [
    { label: "Operacao", items: operationItems },
    ...(managementItems.length ? [{ label: "Gestao", items: managementItems }] : []),
  ];
  const isRootPath = location.pathname === "/";

  useOverlayScrollLockAndFocusRestore(isMobileOpen);
  useEscapeKey(isMobileOpen, onCloseMobile);

  useEffect(() => {
    if (!isMobileOpen) return;
    navRef.current?.querySelector<HTMLElement>("a")?.focus();
  }, [isMobileOpen]);

  function isItemActive(item: SidebarNavItem): boolean {
    return location.pathname === item.path || (item.path === "/central-comercial" && isRootPath);
  }

  return (
    <>
      <aside className={cn("app-sidebar", collapsed && "is-collapsed")}>
        <SidebarInner
          collapsed={collapsed}
          onToggle={() => setCollapsed((value) => !value)}
          groups={groups}
          isItemActive={isItemActive}
          onNavigate={undefined}
          navRef={navRef}
        />
      </aside>

      {isMobileOpen ? (
        <div className="app-sidebar-drawer">
          <div className="app-sidebar-backdrop" role="presentation" onClick={onCloseMobile} />
          <aside className="app-sidebar app-sidebar-mobile" aria-label="Navegacao principal">
            <SidebarInner
              collapsed={false}
              onToggle={onCloseMobile}
              groups={groups}
              isItemActive={isItemActive}
              onNavigate={onCloseMobile}
              navRef={navRef}
              mobile
            />
          </aside>
        </div>
      ) : null}
    </>
  );
}

function SidebarInner({
  collapsed,
  onToggle,
  groups,
  isItemActive,
  onNavigate,
  navRef,
  mobile,
}: {
  collapsed: boolean;
  onToggle: () => void;
  groups: SidebarNavGroup[];
  isItemActive: (item: SidebarNavItem) => boolean;
  onNavigate: (() => void) | undefined;
  navRef: React.RefObject<HTMLElement | null>;
  mobile?: boolean;
}) {
  return (
    <>
      <div className={cn("app-sidebar-brand", collapsed && "is-collapsed")}>
        <div className="app-sidebar-logo">A</div>
        {!collapsed ? (
          <div className="app-sidebar-brand-copy">
            <div>Artec CRM</div>
            <span>Ambientes Climatizados</span>
          </div>
        ) : null}
      </div>

      <nav ref={navRef as React.RefObject<HTMLElement>} className="app-sidebar-nav" aria-label={mobile ? undefined : "Navegacao principal"}>
        {groups.map((group) => (
          <NavGroup key={group.label} group={group} collapsed={collapsed} isItemActive={isItemActive} onNavigate={onNavigate} />
        ))}
      </nav>

      {!mobile ? (
        <div className="app-sidebar-footer">
          <div className="app-sidebar-user">
            <span>AR</span>
            {!collapsed ? (
              <div>
                <strong>Ana Ribeiro</strong>
                <small>Gestor</small>
              </div>
            ) : null}
          </div>
          <button type="button" onClick={onToggle} className="app-sidebar-collapse" aria-label={collapsed ? "Expandir menu" : "Recolher menu"}>
            {collapsed ? (
              <ChevronsRight size={16} aria-hidden="true" />
            ) : (
              <>
                <ChevronsLeft size={16} aria-hidden="true" /> Recolher
              </>
            )}
          </button>
        </div>
      ) : null}
    </>
  );
}

function NavGroup({
  group,
  collapsed,
  isItemActive,
  onNavigate,
}: {
  group: SidebarNavGroup;
  collapsed: boolean;
  isItemActive: (item: SidebarNavItem) => boolean;
  onNavigate: (() => void) | undefined;
}) {
  if (group.items.length === 0) return null;

  return (
    <div className="app-sidebar-group">
      {!collapsed ? <p className="app-sidebar-group-label">{group.label}</p> : null}
      <ul className="app-sidebar-list">
        {group.items.map((item) => {
          const active = isItemActive(item);
          return (
            <li key={item.path}>
              <Link
                to={item.path}
                aria-current={active ? "page" : undefined}
                aria-label={item.label}
                title={collapsed ? item.label : undefined}
                onClick={onNavigate}
                className={cn("app-sidebar-link", active && "is-active", collapsed && "is-collapsed")}
              >
                <item.icon aria-hidden="true" size={18} />
                {!collapsed ? <span>{item.label}</span> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
