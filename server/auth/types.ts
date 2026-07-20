import type { CrmRole, Permission } from "./rbac.js";

export type VerifiedTokenUser = {
  id: string;
  email: string | null;
};

export type Membership = {
  userId: string;
  role: CrmRole;
  isActive: boolean;
};

export type AuthenticatedUser = {
  id: string;
  email: string | null;
  role: CrmRole;
  membershipStatus: "active";
  permissions: Permission[];
};

export type AuthVerifier = {
  verify(accessToken: string): Promise<VerifiedTokenUser>;
};

export type MembershipRepository = {
  findByUserId(userId: string): Promise<Membership | null>;
  close(): Promise<void>;
};
