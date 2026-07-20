import type { CrmRole } from "./rbac.js";
import type { Membership, MembershipRepository } from "./types.js";
import type { CrmPrismaClient } from "../database/prisma.js";

export class PrismaMembershipRepository implements MembershipRepository {
  constructor(private readonly prisma: CrmPrismaClient) {}

  async findByUserId(userId: string): Promise<Membership | null> {
    const membership = await this.prisma.userMembership.findUnique({
      where: { userId },
      select: {
        userId: true,
        role: true,
        isActive: true,
      },
    });

    if (!membership) return null;

    return {
      userId: membership.userId,
      role: membership.role as CrmRole,
      isActive: membership.isActive,
    };
  }

  async close(): Promise<void> {
    return undefined;
  }
}
