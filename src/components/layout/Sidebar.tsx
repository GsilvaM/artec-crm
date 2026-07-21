import { Bell, Briefcase, LayoutDashboard, ListChecks, Settings2, Users, Workflow } from "lucide-react";
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

const ADMIN_NAV_ITEM: SidebarNavItem = { label: "Integracao Auvo", path: "/configuracoes/integracoes/auvo", icon: Settings2 };

export function Sidebar({ canManageIntegrations }: { canManageIntegrations: boolean }) {
  const location = useLocation();
  const items = canManageIntegrations ? [...BASE_NAV_ITEMS, ADMIN_NAV_ITEM] : BASE_NAV_ITEMS;
  const isRootPath = location.pathname === "/";

  return (
    <aside className="sidebar" aria-label="Navegacao principal">
      <div className="brand-row">
        <div className="brand-mark">A</div>
        <div>
          <strong>Artec CRM</strong>
          <span>Comercial</span>
        </div>
      </div>
      <nav>
        {items.map((item) => {
          const isActive = location.pathname === item.path || (item.path === "/central-comercial" && isRootPath);
          return (
            <Link key={item.path} to={item.path} className={isActive ? "nav-item active" : "nav-item"} aria-current={isActive ? "page" : undefined}>
              <item.icon aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export { BASE_NAV_ITEMS, ADMIN_NAV_ITEM };
