import pg from "pg";
import type { CrmRole } from "./rbac.js";
import type { Membership, MembershipRepository } from "./types.js";

const { Pool } = pg;

type MembershipRow = {
  user_id: string;
  role: CrmRole;
  is_active: boolean;
};

export class PgMembershipRepository implements MembershipRepository {
  private readonly pool: pg.Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      max: 5,
      application_name: "artec-crm-api",
    });
  }

  async findByUserId(userId: string): Promise<Membership | null> {
    const result = await this.pool.query<MembershipRow>(
      `
        SELECT user_id, role, is_active
        FROM crm.user_memberships
        WHERE user_id = $1
        LIMIT 1
      `,
      [userId],
    );

    const row = result.rows[0];
    if (!row) return null;

    return {
      userId: row.user_id,
      role: row.role,
      isActive: row.is_active,
    };
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
