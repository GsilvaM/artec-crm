import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppLayout({ userEmail, onLogout, canManageIntegrations }: {
  userEmail: string | null;
  onLogout: () => void | Promise<void>;
  canManageIntegrations: boolean;
}) {
  return (
    <div className="app-shell">
      <Sidebar canManageIntegrations={canManageIntegrations} />
      <main className="workspace">
        <Topbar userEmail={userEmail} onLogout={onLogout} />
        <Outlet />
      </main>
    </div>
  );
}
