import { Router } from "express";
import * as scheduledController from "../controllers/scheduledController";
import { authenticateJWT } from "../middleware/authMiddleware";

const router = Router();

// List all scheduled messages
router.get("/", authenticateJWT, scheduledController.getAllScheduled);

// Schedule a new message
router.post("/", authenticateJWT, scheduledController.scheduleMessage);

// Update a scheduled message by ID
router.put("/:id", authenticateJWT, scheduledController.updateScheduled);

// Delete (cancel) a scheduled message by ID
router.delete("/:id", authenticateJWT, scheduledController.deleteScheduled);

export default router;
