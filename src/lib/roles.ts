export const CANONICAL_APP_ROLES = [
  "resident",
  "farmer",
  "restaurant",
  "lgu_admin",
  "super_admin",
] as const;

export type AppRole = (typeof CANONICAL_APP_ROLES)[number];
export type LegacyAppRole = AppRole | "hotel_restaurant";

const canonicalRoleSet = new Set<string>(CANONICAL_APP_ROLES);

export function normalizeAppRole(role: unknown): AppRole | null {
  if (role === "hotel_restaurant") return "restaurant";
  if (typeof role !== "string" || !canonicalRoleSet.has(role)) return null;
  return role as AppRole;
}

export function isAdministrativeRole(role: unknown): role is "lgu_admin" | "super_admin" {
  const normalizedRole = normalizeAppRole(role);
  return normalizedRole === "lgu_admin" || normalizedRole === "super_admin";
}

export function isSuperAdminRole(role: unknown): role is "super_admin" {
  return normalizeAppRole(role) === "super_admin";
}
