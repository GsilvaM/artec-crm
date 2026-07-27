import { Suspense, type ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { OfflineBanner } from "../feedback/OfflineBanner";
import { InstallPrompt } from "../feedback/InstallPrompt";
import { LoadingPanels } from "../ui/Skeleton";

export function AppLayout({ userEmail, onLogout, canViewReports, canManageAuvoInbox, canManageUsers, canManageIntegrations, children }: {
  userEmail: string | null;
  onLogout: () => void | Promise<void>;
  canViewReports: boolean;
  canManageAuvoInbox: boolean;
  canManageUsers: boolean;
  canManageIntegrations: boolean;
  children: ReactNode;
}) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="app-frame">
      <Sidebar
        canViewReports={canViewReports}
        canManageAuvoInbox={canManageAuvoInbox}
        canManageUsers={canManageUsers}
        canManageIntegrations={canManageIntegrations}
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
      />
      <div className="app-workspace">
        <Topbar userEmail={userEmail} onLogout={onLogout} onOpenMobileNav={() => setIsMobileNavOpen(true)} />
        <OfflineBanner />
        <InstallPrompt />
        {/* py-4 (nao py-6/py-8 do modelo Lovable): paginas sem-scroll (ADR-0004)
            calculam altura via calc(100vh - Npx) fixo (ver Notificacoes,
            Clientes, Oportunidades, Proximas Acoes, Pipeline) — o orcamento
            de pixel do chrome (header + padding) precisa bater com o valor
            antigo (~92px) para nao estourar. Ver D030. */}
        <main className="app-main">
          <Suspense fallback={<LoadingPanels />}>
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
