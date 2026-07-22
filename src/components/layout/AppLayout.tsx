import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppLayout({ userEmail, onLogout, canViewReports, canManageAuvoInbox, canManageUsers, canManageIntegrations }: {
  userEmail: string | null;
  onLogout: () => void | Promise<void>;
  canViewReports: boolean;
  canManageAuvoInbox: boolean;
  canManageUsers: boolean;
  canManageIntegrations: boolean;
}) {
  return (
    <div className="app-shell">
      <Sidebar
        canViewReports={canViewReports}
        canManageAuvoInbox={canManageAuvoInbox}
        canManageUsers={canManageUsers}
        canManageIntegrations={canManageIntegrations}
      />
      <main className="workspace">
        <Topbar userEmail={userEmail} onLogout={onLogout} />
        <Outlet />
      </main>
    </div>
  );
}
