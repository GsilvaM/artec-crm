import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { AuthVerifier, VerifiedTokenUser } from "./types.js";

export class SupabaseTokenVerifier implements AuthVerifier {
  private readonly supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseAnonKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  async verify(accessToken: string): Promise<VerifiedTokenUser> {
    const result = await this.supabase.auth.getUser(accessToken);

    if (result.error || !result.data.user) {
      throw new Error("invalid_token");
    }

    return {
      id: result.data.user.id,
      email: result.data.user.email ?? null,
    };
  }
}
