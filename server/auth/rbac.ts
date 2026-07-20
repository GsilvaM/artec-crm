export type CrmRole = "gestor" | "vendedor" | "atendimento";

export type Permission =
  | "self:read"
  | "users:manage"
  | "settings:read"
  | "settings:write"
  | "integrations:read"
  | "integrations:write"
  | "reports:read";

export const rolePermissions: Record<CrmRole, Permission[]> = {
  gestor: ["self:read", "users:manage", "settings:read", "settings:write", "integrations:read", "integrations:write", "reports:read"],
  vendedor: ["self:read"],
  atendimento: ["self:read"],
};

export function getPermissionsForRole(role: CrmRole): Permission[] {
  return rolePermissions[role];
}

export function roleHasPermission(role: CrmRole, permission: Permission): boolean {
  return rolePermissions[role].includes(permission);
}
