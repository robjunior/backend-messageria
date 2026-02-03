import { Router } from "express";
import * as integrationController from "../controllers/integrationController";
import { authenticateJWT } from "../middleware/authMiddleware";

const router = Router();

// List all integrations for the organization
router.get("/", authenticateJWT, integrationController.listOrgIntegrations);

// Create a new integration for the organization
router.post("/", authenticateJWT, integrationController.createOrgIntegration);

// Get a specific integration by ID
router.get("/:id", authenticateJWT, integrationController.getOrgIntegration);

// Update an integration by ID
router.put("/:id", authenticateJWT, integrationController.updateOrgIntegration);

// Delete an integration by ID
router.delete("/:id", authenticateJWT, integrationController.deleteOrgIntegration);

export default router;
