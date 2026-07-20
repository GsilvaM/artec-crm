import { AlertCircle, LogIn, LogOut, Search, Settings, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { readSupabaseSession, signInWithPassword, signOut, type AuthState } from "./domain/auth";

const baseNavItems = ["Inicio"];

export function App() {
  const [authState, setAuthState] = useState<AuthState>({ status: "loading" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    void readSupabaseSession().then(setAuthState);
  }, []);

  const activeUser = authState.status === "authenticated" ? authState.user : null;
  const navItems = activeUser ? buildNavItems(activeUser.permissions) : baseNavItems;

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
          <h1>Erro ao abrir o CRM</h1>
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

  if (!activeUser) {
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

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Navegacao principal">
        <div className="brand-row">
          <div className="brand-mark">A</div>
          <div>
            <strong>Artec CRM</strong>
            <span>Comercial</span>
          </div>
        </div>
        <nav>
          {navItems.map((item) => (
            <button className={item === "Visao geral" ? "nav-item active" : "nav-item"} type="button" key={item}>
              {item}
            </button>
          ))}
        </nav>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <label className="search-box">
            <Search aria-hidden="true" />
            <input type="search" placeholder="Buscar no CRM" />
          </label>
          <div className="user-chip">
            <UserRound aria-hidden="true" />
            <span>{activeUser.email}</span>
          </div>
          <button className="button ghost" type="button" onClick={handleLogout}>
            <LogOut aria-hidden="true" />
            Sair
          </button>
        </header>

        <section className="page-heading">
          <div>
            <p className="eyebrow">Fundacao</p>
            <h1>Ambiente CRM</h1>
          </div>
        </section>

        <FoundationHome role={activeUser.role} permissions={activeUser.permissions} />
      </main>
    </div>
  );
}

function buildNavItems(permissions: string[]) {
  const items = [...baseNavItems];
  if (permissions.includes("settings:read")) items.push("Configuracoes");
  if (permissions.includes("users:manage")) items.push("Usuarios");
  return items;
}

function getAuthBlockedCopy(state: Exclude<AuthState, { status: "loading" | "authenticated" | "anonymous" | "error" }>) {
  if (state.status === "not_configured") {
    return { title: "Ambiente nao configurado", message: state.message };
  }

  if (state.status === "membership_missing") {
    return { title: "Acesso nao liberado", message: state.message };
  }

  if (state.status === "membership_inactive") {
    return { title: "Acesso inativo", message: state.message };
  }

  if (state.status === "access_denied") {
    return { title: "Acesso negado", message: state.message };
  }

  return { title: "API temporariamente indisponivel", message: state.message };
}

function FoundationHome({ role, permissions }: { role: string; permissions: string[] }) {
  return (
    <section className="foundation-grid">
      <article className="state-panel">
        <ShieldCheck aria-hidden="true" className="state-icon success" />
        <h2>Autenticacao validada pelo backend</h2>
        <p>Seu token Supabase foi validado pela API e sua membership ativa foi confirmada no schema `crm`.</p>
      </article>
      <article className="panel foundation-panel">
        <Settings aria-hidden="true" />
        <span>Papel atual</span>
        <strong>{role}</strong>
      </article>
      <article className="panel foundation-panel">
        <UsersRound aria-hidden="true" />
        <span>Permissoes derivadas</span>
        <strong>{permissions.length}</strong>
      </article>
    </section>
  );
}

function LoginForm({
  email,
  password,
  isSubmitting,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}: {
  email: string;
  password: string;
  isSubmitting: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="login-form" onSubmit={onSubmit}>
      <label>
        <span>E-mail</span>
        <input value={email} type="email" autoComplete="email" required onChange={(event) => onEmailChange(event.target.value)} />
      </label>
      <label>
        <span>Senha</span>
        <input value={password} type="password" autoComplete="current-password" required onChange={(event) => onPasswordChange(event.target.value)} />
      </label>
      <button className="button primary" type="submit" disabled={isSubmitting}>
        <LogIn aria-hidden="true" />
        {isSubmitting ? "Entrando" : "Entrar no CRM"}
      </button>
    </form>
  );
}
