import { Router } from "express";
import * as orgController from "../controllers/orgController";

const router = Router();

// Create a new organization and add the authenticated user as admin
router.post("/", orgController.createOrg);

// (Future) Accept invite, list orgs, invite users, etc.

export default router;
