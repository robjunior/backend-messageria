dev/backend/src/services/tenantService.ts
import { Request } from "express";

/**
 * Extracts the tenant ID from the request headers.
 * Throws an error if the tenant ID is missing.
 */
export function getTenantId(req: Request): string {
  const tenantId = req.header("x-tenant-id");
  if (!tenantId) {
    throw new Error("Missing tenant ID (x-tenant-id header required)");
  }
  return tenantId;
}

/**
 * Constructs a tenant-specific Redis key.
 * Example: tenantKey("acme", "scheduled_messages") => "tenant:acme:scheduled_messages"
 */
export function tenantKey(tenantId: string, base: string): string {
  return `tenant:${tenantId}:${base}`;
}
