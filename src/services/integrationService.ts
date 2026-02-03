backend/src/services/integrationService.ts
```
import { v4 as uuidv4 } from "uuid";
import { getRedis } from "./redisService";
import { IntegrationConfig } from "../types/integration";

/**
 * Gera a chave Redis para integrações de uma organização.
 * Exemplo: org:ORGID:integrations
 */
function orgIntegrationKey(orgId: string): string {
  return `org:${orgId}:integrations`;
}

/**
 * Cria uma nova integração para uma organização.
 */
export async function createIntegration(
  orgId: string,
  integration: Omit<IntegrationConfig, "id" | "orgId" | "createdAt" | "updatedAt">
): Promise<IntegrationConfig> {
  const redis = getRedis();
  const id = uuidv4();
  const now = new Date().toISOString();
  const config: IntegrationConfig = {
    ...integration,
    id,
    orgId,
    createdAt: now,
    updatedAt: now,
  };
  await redis.hset(orgIntegrationKey(orgId), id, JSON.stringify(config));
  return config;
}

/**
 * Lista todas as integrações de uma organização.
 */
export async function listIntegrations(orgId: string): Promise<IntegrationConfig[]> {
  const redis = getRedis();
  const results = await redis.hvals(orgIntegrationKey(orgId));
  return results.map((str: string) => JSON.parse(str));
}

/**
 * Busca uma integração específica de uma organização.
 */
export async function getIntegration(orgId: string, integrationId: string): Promise<IntegrationConfig | null> {
  const redis = getRedis();
  const str = await redis.hget(orgIntegrationKey(orgId), integrationId);
  return str ? (JSON.parse(str) as IntegrationConfig) : null;
}

/**
 * Atualiza uma integração de uma organização.
 */
export async function updateIntegration(
  orgId: string,
  integrationId: string,
  updates: Partial<Omit<IntegrationConfig, "id" | "orgId" | "createdAt">>
): Promise<IntegrationConfig | null> {
  const redis = getRedis();
  const existing = await getIntegration(orgId, integrationId);
  if (!existing) return null;
  const updated: IntegrationConfig = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  await redis.hset(orgIntegrationKey(orgId), integrationId, JSON.stringify(updated));
  return updated;
}

/**
 * Remove uma integração de uma organização.
 */
export async function deleteIntegration(orgId: string, integrationId: string): Promise<boolean> {
  const redis = getRedis();
  const result = await redis.hdel(orgIntegrationKey(orgId), integrationId);
  return result > 0;
}

/**
 * Busca a integração ativa de um tipo/canal para uma organização.
 */
export async function getActiveIntegrationByType(
  orgId: string,
  type: IntegrationConfig["type"]
): Promise<IntegrationConfig | null> {
  const integrations = await listIntegrations(orgId);
  return integrations.find((i) => i.type === type && i.active) || null;
}
