import { Suspense, useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { OfflineBanner } from "../feedback/OfflineBanner";
import { InstallPrompt } from "../feedback/InstallPrompt";
import { LoadingPanels } from "../ui/Skeleton";

export function AppLayout({ userEmail, onLogout, canViewReports, canManageAuvoInbox, canManageUsers, canManageIntegrations }: {
  userEmail: string | null;
  onLogout: () => void | Promise<void>;
  canViewReports: boolean;
  canManageAuvoInbox: boolean;
  canManageUsers: boolean;
  canManageIntegrations: boolean;
}) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar
        canViewReports={canViewReports}
        canManageAuvoInbox={canManageAuvoInbox}
        canManageUsers={canManageUsers}
        canManageIntegrations={canManageIntegrations}
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
      />
      <main className="workspace">
        <Topbar userEmail={userEmail} onLogout={onLogout} onOpenMobileNav={() => setIsMobileNavOpen(true)} />
        <OfflineBanner />
        <InstallPrompt />
        <Suspense fallback={<LoadingPanels />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
