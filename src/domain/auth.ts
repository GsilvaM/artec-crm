import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type CrmUserRole = "gestor" | "vendedor" | "atendimento";
export type CrmPermission =
  | "self:read"
  | "customers:read"
  | "customers:write"
  | "opportunities:read"
  | "opportunities:write"
  | "activities:read"
  | "activities:write"
  | "next_actions:read"
  | "next_actions:write"
  | "users:manage"
  | "settings:read"
  | "settings:write"
  | "integrations:read"
  | "integrations:write"
  | "reports:read"
  | "auvo_inbox:read"
  | "auvo_inbox:write";

export type CrmUser = {
  id: string;
  email: string | null;
  role: CrmUserRole;
  membershipStatus: "active";
  permissions: CrmPermission[];
};

export type AuthState =
  | { status: "loading" }
  | { status: "authenticated"; user: CrmUser }
  | { status: "anonymous" }
  | { status: "not_configured"; message: string }
  | { status: "membership_missing"; message: string }
  | { status: "membership_inactive"; message: string }
  | { status: "access_denied"; message: string }
  | { status: "api_error"; message: string }
  | { status: "error"; message: string };

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const supabaseUrl = import.meta.env.VITE_CRM_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_CRM_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  supabaseClient ??= createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storageKey: "artec-crm.auth",
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return supabaseClient;
}

export async function readSupabaseSession(): Promise<AuthState> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return {
      status: "not_configured",
      message: "Configure VITE_CRM_SUPABASE_URL e VITE_CRM_SUPABASE_ANON_KEY no ambiente do CRM.",
    };
  }

  const sessionResult = await supabase.auth.getSession();

  if (sessionResult.error) {
    return { status: "error", message: sessionResult.error.message };
  }

  const session = sessionResult.data.session;

  if (!session?.user) {
    return { status: "anonymous" };
  }

  return readBackendIdentity(session.access_token);
}

export async function signInWithPassword(email: string, password: string): Promise<AuthState> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return {
      status: "not_configured",
      message: "Configure VITE_CRM_SUPABASE_URL e VITE_CRM_SUPABASE_ANON_KEY no ambiente do CRM.",
    };
  }

  const result = await supabase.auth.signInWithPassword({ email, password });

  if (result.error) {
    return { status: "error", message: result.error.message };
  }

  const session = result.data.session;

  if (!session) {
    return { status: "anonymous" };
  }

  return readBackendIdentity(session.access_token);
}

export async function signOut(): Promise<void> {
  const supabase = getSupabaseClient();
  await supabase?.auth.signOut();
}

async function readBackendIdentity(accessToken: string): Promise<AuthState> {
  const apiUrl = import.meta.env.VITE_CRM_API_URL ?? "";

  try {
    const response = await fetch(`${apiUrl}/api/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const payload = (await response.json()) as CrmUser | { error?: { code?: string; message?: string } };

    if (response.ok) {
      return { status: "authenticated", user: payload as CrmUser };
    }

    const errorCode = "error" in payload ? payload.error?.code : undefined;
    const message = "error" in payload ? payload.error?.message : undefined;

    if (errorCode === "membership_missing") {
      return { status: "membership_missing", message: message ?? "Usuario autenticado sem acesso liberado ao CRM." };
    }

    if (errorCode === "membership_inactive") {
      return { status: "membership_inactive", message: message ?? "Seu acesso ao CRM esta inativo." };
    }

    if (errorCode === "forbidden") {
      return { status: "access_denied", message: message ?? "Acesso negado para este recurso." };
    }

    if (response.status === 401) {
      return { status: "anonymous" };
    }

    return { status: "api_error", message: message ?? "A API do CRM retornou erro temporario." };
  } catch {
    return {
      status: "api_error",
      message: "Nao foi possivel conectar ao backend do CRM. Verifique se o servidor esta ativo.",
    };
  }
}
