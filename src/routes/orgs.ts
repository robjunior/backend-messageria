import { Router } from "express";
import * as orgController from "../controllers/orgController";

const router = Router();

// Create a new organization and add the authenticated user as admin
router.post("/", orgController.createOrg);

// Invite a user to an organization
router.post("/:orgId/invite", orgController.inviteUserToOrg);

// Accept an organization invite
router.post("/accept-invite", orgController.acceptInvite);

// (Future) List orgs, invite users, etc.

export default router;
