import { BarChart3, Bell, Briefcase, Inbox, LayoutDashboard, ListChecks, Settings2, ShieldCheck, Users, Workflow } from "lucide-react";
import { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
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
  { label: "Funil", path: "/pipeline", icon: Workflow },
  { label: "Clientes", path: "/clientes", icon: Users },
  { label: "Oportunidades", path: "/oportunidades", icon: Briefcase },
  { label: "Próximas ações", path: "/proximas-acoes", icon: ListChecks },
];

const REPORTS_NAV_ITEM: SidebarNavItem = { label: "Relatórios", path: "/relatorios", icon: BarChart3 };
const AUVO_INBOX_NAV_ITEM: SidebarNavItem = { label: "Caixa Auvo", path: "/caixa-auvo", icon: Inbox };
const NOTIFICATIONS_NAV_ITEM: SidebarNavItem = { label: "Notificações", path: "/notificacoes", icon: Bell };
const ADMIN_NAV_ITEM: SidebarNavItem = { label: "Administração", path: "/configuracoes/administracao", icon: ShieldCheck };
const INTEGRATIONS_NAV_ITEM: SidebarNavItem = { label: "Integração Auvo", path: "/configuracoes/integracoes/auvo", icon: Settings2 };

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

  const acompanhamentoItems = [
    NOTIFICATIONS_NAV_ITEM,
    ...(canManageAuvoInbox ? [AUVO_INBOX_NAV_ITEM] : []),
    ...(canViewReports ? [REPORTS_NAV_ITEM] : []),
  ];
  const configuracoesItems = [
    ...(canManageUsers ? [ADMIN_NAV_ITEM] : []),
    ...(canManageIntegrations ? [INTEGRATIONS_NAV_ITEM] : []),
  ];

  const groups: SidebarNavGroup[] = [
    { label: "Operação", items: OPERACAO_NAV_ITEMS },
    { label: "Acompanhamento", items: acompanhamentoItems },
    ...(configuracoesItems.length ? [{ label: "Configurações", items: configuracoesItems }] : []),
  ];
  const isRootPath = location.pathname === "/";

  useOverlayScrollLockAndFocusRestore(isMobileOpen);
  useEscapeKey(isMobileOpen, onCloseMobile);

  useEffect(() => {
    if (!isMobileOpen) return;
    navRef.current?.querySelector<HTMLElement>("a")?.focus();
  }, [isMobileOpen]);

  return (
    <>
      {isMobileOpen ? <div className="sidebar-backdrop" role="presentation" onClick={onCloseMobile} /> : null}
      <aside className={isMobileOpen ? "sidebar is-open" : "sidebar"} aria-label="Navegação principal">
        <div className="brand-row">
          <div className="brand-mark">A</div>
          <div>
            <strong>Artec CRM</strong>
            <span>Comercial</span>
          </div>
        </div>
        <nav ref={navRef}>
          {groups.map((group) => (
            <div key={group.label}>
              <p className="nav-section-label">{group.label}</p>
              {group.items.map((item) => {
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
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
