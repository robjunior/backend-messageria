backend/src/controllers/integrationController.ts
```
import { Request, Response } from "express";
import {
  createIntegration,
  listIntegrations,
  getIntegration,
  updateIntegration,
  deleteIntegration,
} from "../services/integrationService";
import { IntegrationConfig } from "../types/integration";

/**
 * Lista todas as integrações de uma organização.
 * Espera header: x-tenant-id
 */
export const listOrgIntegrations = async (req: Request, res: Response) => {
  try {
    const orgId = req.header("x-tenant-id");
    if (!orgId) {
      return res.status(400).json({ error: "Missing x-tenant-id header" });
    }
    const integrations = await listIntegrations(orgId);
    res.status(200).json({ integrations });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to list integrations", details: error.message });
  }
};

/**
 * Cria uma nova integração para a organização.
 * Espera header: x-tenant-id
 * Body: { type, provider, credentials, ... }
 */
export const createOrgIntegration = async (req: Request, res: Response) => {
  try {
    const orgId = req.header("x-tenant-id");
    if (!orgId) {
      return res.status(400).json({ error: "Missing x-tenant-id header" });
    }
    const { type, provider, credentials, name, description, metadata, active } = req.body;
    if (!type || !provider || !credentials) {
      return res.status(400).json({ error: "type, provider, and credentials are required" });
    }
    const integration = await createIntegration(orgId, {
      type,
      provider,
      credentials,
      name,
      description,
      metadata,
      active: typeof active === "boolean" ? active : true,
    });
    res.status(201).json({ integration });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to create integration", details: error.message });
  }
};

/**
 * Busca uma integração específica da organização.
 * Espera header: x-tenant-id
 */
export const getOrgIntegration = async (req: Request, res: Response) => {
  try {
    const orgId = req.header("x-tenant-id");
    if (!orgId) {
      return res.status(400).json({ error: "Missing x-tenant-id header" });
    }
    const { id } = req.params;
    const integration = await getIntegration(orgId, id);
    if (!integration) {
      return res.status(404).json({ error: "Integration not found" });
    }
    res.status(200).json({ integration });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to get integration", details: error.message });
  }
};

/**
 * Atualiza uma integração da organização.
 * Espera header: x-tenant-id
 * Body: campos a atualizar
 */
export const updateOrgIntegration = async (req: Request, res: Response) => {
  try {
    const orgId = req.header("x-tenant-id");
    if (!orgId) {
      return res.status(400).json({ error: "Missing x-tenant-id header" });
    }
    const { id } = req.params;
    const updates = req.body as Partial<Omit<IntegrationConfig, "id" | "orgId" | "createdAt">>;
    const updated = await updateIntegration(orgId, id, updates);
    if (!updated) {
      return res.status(404).json({ error: "Integration not found" });
    }
    res.status(200).json({ integration: updated });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to update integration", details: error.message });
  }
};

/**
 * Remove uma integração da organização.
 * Espera header: x-tenant-id
 */
export const deleteOrgIntegration = async (req: Request, res: Response) => {
  try {
    const orgId = req.header("x-tenant-id");
    if (!orgId) {
      return res.status(400).json({ error: "Missing x-tenant-id header" });
    }
    const { id } = req.params;
    const deleted = await deleteIntegration(orgId, id);
    if (!deleted) {
      return res.status(404).json({ error: "Integration not found" });
    }
    res.status(200).json({ success: true, id });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to delete integration", details: error.message });
  }
};
