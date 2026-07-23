import { AlertCircle, LogIn, LogOut } from "lucide-react";
import { type FormEvent, Suspense, lazy, useEffect, useState } from "react";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import { readSupabaseSession, signInWithPassword, signOut, type AuthState } from "./domain/auth";
import { AppLayout } from "./components/layout/AppLayout";
import { EmptyState } from "./components/ui/EmptyState";

// Cada pagina vira um chunk separado (code-splitting por rota) — evita que o
// bundle inicial carregue Pipeline, Relatorios, Administracao etc. antes de
// serem visitados. Seção 21 do prompt de refatoração pede evitar bundles
// grandes por padrão; o build sem isso gerava um unico chunk de ~549 kB.
const CentralComercialPage = lazy(() => import("./features/commercial-center/CentralComercialPage").then((m) => ({ default: m.CentralComercialPage })));
const ProximasAcoesPage = lazy(() => import("./features/next-actions/ProximasAcoesPage").then((m) => ({ default: m.ProximasAcoesPage })));
const OportunidadePage = lazy(() => import("./features/opportunities/OportunidadePage").then((m) => ({ default: m.OportunidadePage })));
const ClientePage = lazy(() => import("./features/customers/ClientePage").then((m) => ({ default: m.ClientePage })));
const ClientesPage = lazy(() => import("./features/customers/ClientesPage").then((m) => ({ default: m.ClientesPage })));
const OportunidadesPage = lazy(() => import("./features/opportunities/OportunidadesPage").then((m) => ({ default: m.OportunidadesPage })));
const NotificacoesPage = lazy(() => import("./features/notifications/NotificacoesPage").then((m) => ({ default: m.NotificacoesPage })));
const PipelinePage = lazy(() => import("./features/pipeline/PipelinePage").then((m) => ({ default: m.PipelinePage })));
const RelatoriosPage = lazy(() => import("./features/reports/RelatoriosPage").then((m) => ({ default: m.RelatoriosPage })));
const AdministracaoPage = lazy(() => import("./features/settings/AdministracaoPage").then((m) => ({ default: m.AdministracaoPage })));
const AuvoAdminPage = lazy(() => import("./features/integrations/AuvoAdminPage").then((m) => ({ default: m.AuvoAdminPage })));
const CaixaAuvoPage = lazy(() => import("./features/integrations/CaixaAuvoPage").then((m) => ({ default: m.CaixaAuvoPage })));

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
          <h1>Acesse o Artec CRM</h1>
          <p>Organize clientes, oportunidades e follow-up comercial em um só lugar.</p>
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
      <EmptyState title="Página não encontrada" text="O link acessado não existe ou você não tem permissão para esta área.">
        <Link className="button primary" to="/central-comercial">Ir para a Central Comercial</Link>
      </EmptyState>
    </section>
  );
}

function getAuthBlockedCopy(state: Exclude<AuthState, { status: "loading" | "authenticated" | "anonymous" | "error" }>) {
  if (state.status === "not_configured") return { title: "Ambiente não configurado", message: state.message };
  if (state.status === "membership_missing") return { title: "Acesso não liberado", message: state.message };
  if (state.status === "membership_inactive") return { title: "Acesso inativo", message: state.message };
  if (state.status === "access_denied") return { title: "Acesso negado", message: state.message };
  return { title: "API temporariamente indisponível", message: state.message };
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
