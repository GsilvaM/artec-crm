import { AlertCircle, Eye, EyeOff, ListChecks, Loader2, LogOut, ShieldCheck, Wind } from "lucide-react";
import { type FormEvent, type ReactNode, lazy, useEffect, useState } from "react";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import { readSupabaseSession, signInWithPassword, signOut, type AuthState } from "./domain/auth";
import { AppLayout } from "./components/layout/AppLayout";
import { EmptyState } from "./components/ui/EmptyState";
import { cn } from "./lib/utils";

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
      <AuthShell>
        <div className="space-y-4" aria-busy="true" aria-label="Carregando sessão">
          <div className="h-9 w-48 rounded-md bg-surface-subtle animate-pulse" />
          <div className="h-4 w-64 rounded-md bg-surface-subtle animate-pulse" />
          <div className="h-4 w-56 rounded-md bg-surface-subtle animate-pulse" />
          <div className="h-10 w-full rounded-md bg-surface-subtle animate-pulse mt-6" />
        </div>
      </AuthShell>
    );
  }

  if (authState.status === "error") {
    return (
      <AuthShell>
        <AuthStateIcon tone="danger" />
        <p className="mt-4 text-xs font-bold uppercase tracking-wide text-brand">Artec CRM</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-content-primary">Erro ao entrar</h1>
        <p className="mt-1 text-sm text-content-secondary">{authState.message}</p>
        <LoginForm email={email} password={password} isSubmitting={isSubmitting} onEmailChange={setEmail} onPasswordChange={setPassword} onSubmit={handleLogin} />
      </AuthShell>
    );
  }

  if (authState.status === "not_configured" || authState.status === "membership_missing" || authState.status === "membership_inactive" || authState.status === "access_denied" || authState.status === "api_error") {
    const copy = getAuthBlockedCopy(authState);
    return (
      <AuthShell>
        <AuthStateIcon tone={authState.status === "not_configured" ? "neutral" : "danger"} />
        <p className="mt-4 text-xs font-bold uppercase tracking-wide text-brand">Artec CRM</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-content-primary">{copy.title}</h1>
        <p className="mt-1 text-sm text-content-secondary">{copy.message}</p>
        {authState.status !== "not_configured" ? (
          <button
            type="button"
            onClick={handleLogout}
            className="mt-6 h-10 inline-flex items-center gap-2 px-4 rounded-md border border-border-default bg-transparent text-sm font-medium text-content-primary hover:bg-surface-subtle transition"
          >
            <LogOut size={16} aria-hidden="true" />
            Sair
          </button>
        ) : null}
      </AuthShell>
    );
  }

  if (authState.status !== "authenticated") {
    return (
      <AuthShell>
        <p className="text-xs font-bold uppercase tracking-wide text-brand">Artec CRM</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-content-primary">Acesse o Artec CRM</h1>
        <p className="auth-demo-copy mt-2 text-sm leading-relaxed text-content-secondary">Use suas credenciais corporativas para acessar o painel comercial.</p>
        <p className="mt-1 text-sm text-content-secondary">Organize clientes, oportunidades e follow-up comercial em um só lugar.</p>
        <LoginForm email={email} password={password} isSubmitting={isSubmitting} onEmailChange={setEmail} onPasswordChange={setPassword} onSubmit={handleLogin} />
      </AuthShell>
    );
  }

  const permissions = authState.user.permissions;
  const canViewReports = permissions.includes("reports:read");
  const canManageAuvoInbox = permissions.includes("auvo_inbox:read");
  const canManageUsers = permissions.includes("users:manage");
  const canManageIntegrations = permissions.includes("integrations:read");

  return (
    <AppLayout
      userEmail={authState.user.email}
      onLogout={handleLogout}
      canViewReports={canViewReports}
      canManageAuvoInbox={canManageAuvoInbox}
      canManageUsers={canManageUsers}
      canManageIntegrations={canManageIntegrations}
    >
      <Routes>
        <Route path="central-comercial" element={<CentralComercialPage currentUserId={authState.user.id} />} />
        <Route path="pipeline" element={<PipelinePage currentUserId={authState.user.id} />} />
        <Route path="proximas-acoes" element={<ProximasAcoesPage currentUserId={authState.user.id} />} />
        <Route path="oportunidades/:id" element={<OportunidadePage currentUserId={authState.user.id} canManageUsers={canManageUsers} />} />
        <Route path="oportunidades" element={<OportunidadesPage currentUserId={authState.user.id} />} />
        <Route path="clientes/:id" element={<ClientePage currentUserId={authState.user.id} />} />
        <Route path="clientes" element={<ClientesPage currentUserId={authState.user.id} />} />
        <Route path="notificacoes" element={<NotificacoesPage />} />
        {canViewReports ? <Route path="relatorios" element={<RelatoriosPage />} /> : null}
        {canManageAuvoInbox ? <Route path="caixa-auvo" element={<CaixaAuvoPage currentUserId={authState.user.id} />} /> : null}
        {canManageUsers ? <Route path="configuracoes/administracao" element={<AdministracaoPage currentUserId={authState.user.id} />} /> : null}
        {canManageIntegrations ? <Route path="configuracoes/integracoes/auvo" element={<AuvoAdminPage />} /> : null}
        <Route index element={<Navigate to="/central-comercial" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppLayout>
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
  const [showPassword, setShowPassword] = useState(false);
  const inputClasses = cn(
    "w-full h-10 px-3 rounded-md bg-surface border border-border-default",
    "text-sm placeholder:text-content-tertiary text-content-primary",
    "focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition",
  );

  return (
    <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium text-content-primary">E-mail</label>
        <input
          id="email"
          value={email}
          type="email"
          autoComplete="email"
          required
          placeholder="voce@artec.com.br"
          onChange={(event) => onEmailChange(event.target.value)}
          className={inputClasses}
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium text-content-primary">Senha</label>
        <div className="relative">
          <input
            id="password"
            value={password}
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            placeholder="••••••••"
            onChange={(event) => onPasswordChange(event.target.value)}
            className={cn(inputClasses, "pr-10")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute inset-y-0 right-2 grid place-items-center w-7 border-0 bg-transparent text-content-secondary hover:text-content-primary"
            // Nao usar a palavra "senha" no rotulo: getByLabel("Senha") do
            // Playwright faz match por substring, e um aria-label contendo
            // "senha" neste botao colide com o input (e2e/support/auth.ts).
            aria-label={showPassword ? "Ocultar caracteres digitados" : "Mostrar caracteres digitados"}
          >
            {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
          </button>
        </div>
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className={cn(
          "w-full h-10 rounded-md bg-brand text-brand-foreground text-sm font-semibold",
          "hover:bg-brand-hover transition inline-flex items-center justify-center gap-2",
          "disabled:opacity-70 disabled:cursor-not-allowed",
        )}
      >
        {isSubmitting ? <Loader2 size={16} aria-hidden="true" className="animate-spin" /> : null}
        {isSubmitting ? "Entrando" : "Entrar"}
      </button>
    </form>
  );
}

// Painel de marca do login — unica tela onde bg-brand solido e permitido
// (ADR-0003 restringe cor de marca solida ao CTA/foco/link/decoracao pontual,
// nao ao chrome persistente como a sidebar). Reaproveitado em todos os
// estados de autenticacao (loading/erro/bloqueado/anonimo) para consistencia.
function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] bg-canvas">
      <aside className="relative hidden lg:flex flex-col justify-between p-12 bg-brand text-brand-foreground overflow-hidden">
        <div className="relative flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur grid place-items-center font-black text-xl">A</div>
          <div>
            <div className="text-lg font-semibold leading-tight">Artec CRM</div>
            <div className="text-xs opacity-80">Ambientes Climatizados</div>
          </div>
        </div>

        <div className="relative space-y-6 max-w-md">
          <h2 className="text-3xl font-bold leading-tight">
            Organize clientes, oportunidades e próximas ações em um só lugar.
          </h2>
          <p className="text-sm opacity-85 leading-relaxed">
            A rotina comercial da Artec — instalação, manutenção, higienização, PMOC e
            visitas técnicas — organizada por etapa, responsável e prazo.
          </p>
          <ul className="space-y-3 text-sm">
            {[
              { icon: Wind, label: "Funil comercial pensado para climatização" },
              { icon: ShieldCheck, label: "Cliente e oportunidade separados, com histórico completo" },
              { icon: ListChecks, label: "Priorize o que exige ação agora" },
            ].map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-start gap-3 opacity-90">
                <span className="w-8 h-8 rounded-lg bg-white/15 grid place-items-center shrink-0">
                  <Icon size={16} aria-hidden="true" />
                </span>
                <span className="pt-1">{label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative text-xs opacity-70">
          © {new Date().getFullYear()} Artec Ambientes Climatizados — Grande Vitória, ES
        </div>
      </aside>

      <section className="flex items-start justify-center p-6 pt-28 md:p-10 md:pt-32 lg:pt-[266px]">
        <div className="auth-panel w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-brand text-brand-foreground grid place-items-center font-black">A</div>
            <div>
              <div className="font-semibold text-content-primary">Artec CRM</div>
              <div className="text-xs text-content-secondary">Ambientes Climatizados</div>
            </div>
          </div>
          {children}
          <p className="mt-8 text-center text-xs text-content-tertiary">Ao entrar voce concorda com as politicas internas da Artec.</p>
        </div>
      </section>
    </div>
  );
}

function AuthStateIcon({ tone }: { tone: "danger" | "neutral" }) {
  return (
    <div
      className={cn(
        "w-10 h-10 rounded-md grid place-items-center",
        tone === "danger" ? "bg-critical-subtle text-critical" : "bg-surface-subtle text-content-secondary",
      )}
    >
      <AlertCircle size={20} aria-hidden="true" />
    </div>
  );
}
