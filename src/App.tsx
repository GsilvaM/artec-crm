import { AlertCircle, LogIn, LogOut } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import { readSupabaseSession, signInWithPassword, signOut, type AuthState } from "./domain/auth";
import { AppLayout } from "./components/layout/AppLayout";
import { EmptyState } from "./components/ui/EmptyState";
import { CentralComercialPage } from "./features/commercial-center/CentralComercialPage";
import { ProximasAcoesPage } from "./features/next-actions/ProximasAcoesPage";
import { OportunidadePage } from "./features/opportunities/OportunidadePage";
import { ClientePage } from "./features/customers/ClientePage";
import { ClientesPage } from "./features/customers/ClientesPage";
import { OportunidadesPage } from "./features/opportunities/OportunidadesPage";
import { NotificacoesPage } from "./features/notifications/NotificacoesPage";
import { PipelinePage } from "./features/pipeline/PipelinePage";
import { RelatoriosPage } from "./features/reports/RelatoriosPage";
import { AdministracaoPage } from "./features/settings/AdministracaoPage";
import { AuvoAdminPage } from "./features/integrations/AuvoAdminPage";
import { CaixaAuvoPage } from "./features/integrations/CaixaAuvoPage";

export function App() {
  const [authState, setAuthState] = useState<AuthState>({ status: "loading" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    void readSupabaseSession().then(setAuthState);
  }, []);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setAuthState(await signInWithPassword(email, password));
    setIsSubmitting(false);
  }

  async function handleLogout() {
    await signOut();
    setAuthState({ status: "anonymous" });
  }

  if (authState.status === "loading") {
    return (
      <main className="auth-screen" aria-busy="true">
        <section className="auth-panel">
          <div className="brand-mark">A</div>
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-line" />
          <div className="skeleton skeleton-button" />
        </section>
      </main>
    );
  }

  if (authState.status === "error") {
    return (
      <main className="auth-screen">
        <section className="auth-panel">
          <AlertCircle aria-hidden="true" className="auth-icon danger" />
          <p className="eyebrow">Artec CRM</p>
          <h1>Erro ao entrar</h1>
          <p>{authState.message}</p>
          <LoginForm email={email} password={password} isSubmitting={isSubmitting} onEmailChange={setEmail} onPasswordChange={setPassword} onSubmit={handleLogin} />
        </section>
      </main>
    );
  }

  if (authState.status === "not_configured" || authState.status === "membership_missing" || authState.status === "membership_inactive" || authState.status === "access_denied" || authState.status === "api_error") {
    const copy = getAuthBlockedCopy(authState);
    return (
      <main className="auth-screen">
        <section className="auth-panel">
          <AlertCircle aria-hidden="true" className={authState.status === "not_configured" ? "auth-icon" : "auth-icon danger"} />
          <p className="eyebrow">Artec CRM</p>
          <h1>{copy.title}</h1>
          <p>{copy.message}</p>
          {authState.status !== "not_configured" ? (
            <button className="button secondary" type="button" onClick={handleLogout}>
              <LogOut aria-hidden="true" />
              Sair
            </button>
          ) : null}
        </section>
      </main>
    );
  }

  if (authState.status !== "authenticated") {
    return (
      <main className="auth-screen">
        <section className="auth-panel">
          <div className="brand-mark">A</div>
          <p className="eyebrow">Artec CRM</p>
          <h1>Central comercial independente</h1>
          <p>Entre com a conta Supabase. O backend validara sua membership antes de liberar o CRM.</p>
          <LoginForm email={email} password={password} isSubmitting={isSubmitting} onEmailChange={setEmail} onPasswordChange={setPassword} onSubmit={handleLogin} />
        </section>
      </main>
    );
  }

  const permissions = authState.user.permissions;
  const canViewReports = permissions.includes("reports:read");
  const canManageAuvoInbox = permissions.includes("auvo_inbox:read");
  const canManageUsers = permissions.includes("users:manage");
  const canManageIntegrations = permissions.includes("integrations:read");

  return (
    <Routes>
      <Route
        element={
          <AppLayout
            userEmail={authState.user.email}
            onLogout={handleLogout}
            canViewReports={canViewReports}
            canManageAuvoInbox={canManageAuvoInbox}
            canManageUsers={canManageUsers}
            canManageIntegrations={canManageIntegrations}
          />
        }
      >
        <Route path="central-comercial" element={<CentralComercialPage currentUserId={authState.user.id} />} />
        <Route path="pipeline" element={<PipelinePage />} />
        <Route path="proximas-acoes" element={<ProximasAcoesPage currentUserId={authState.user.id} />} />
        <Route path="oportunidades/:id" element={<OportunidadePage currentUserId={authState.user.id} canManageUsers={canManageUsers} />} />
        <Route path="oportunidades" element={<OportunidadesPage currentUserId={authState.user.id} />} />
        <Route path="clientes/:id" element={<ClientePage currentUserId={authState.user.id} />} />
        <Route path="clientes" element={<ClientesPage />} />
        <Route path="notificacoes" element={<NotificacoesPage />} />
        {canViewReports ? <Route path="relatorios" element={<RelatoriosPage />} /> : null}
        {canManageAuvoInbox ? <Route path="caixa-auvo" element={<CaixaAuvoPage currentUserId={authState.user.id} />} /> : null}
        {canManageUsers ? <Route path="configuracoes/administracao" element={<AdministracaoPage currentUserId={authState.user.id} />} /> : null}
        {canManageIntegrations ? <Route path="configuracoes/integracoes/auvo" element={<AuvoAdminPage />} /> : null}
        <Route index element={<Navigate to="/central-comercial" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

function NotFoundPage() {
  return (
    <section className="page-heading">
      <EmptyState title="Pagina nao encontrada" text="O link acessado nao existe ou voce nao tem permissao para esta area.">
        <Link className="button primary" to="/central-comercial">Ir para a Central Comercial</Link>
      </EmptyState>
    </section>
  );
}

function getAuthBlockedCopy(state: Exclude<AuthState, { status: "loading" | "authenticated" | "anonymous" | "error" }>) {
  if (state.status === "not_configured") return { title: "Ambiente nao configurado", message: state.message };
  if (state.status === "membership_missing") return { title: "Acesso nao liberado", message: state.message };
  if (state.status === "membership_inactive") return { title: "Acesso inativo", message: state.message };
  if (state.status === "access_denied") return { title: "Acesso negado", message: state.message };
  return { title: "API temporariamente indisponivel", message: state.message };
}

function LoginForm({ email, password, isSubmitting, onEmailChange, onPasswordChange, onSubmit }: {
  email: string;
  password: string;
  isSubmitting: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="login-form" onSubmit={onSubmit}>
      <label><span>E-mail</span><input value={email} type="email" autoComplete="email" required onChange={(event) => onEmailChange(event.target.value)} /></label>
      <label><span>Senha</span><input value={password} type="password" autoComplete="current-password" required onChange={(event) => onPasswordChange(event.target.value)} /></label>
      <button className="button primary" type="submit" disabled={isSubmitting}>
        <LogIn aria-hidden="true" />
        {isSubmitting ? "Entrando" : "Entrar no CRM"}
      </button>
    </form>
  );
}
