import { config } from "dotenv";

export function loadLocalEnv(): void {
  config({ path: ".env.local", quiet: true });
  config({ path: ".env", quiet: true });
}
