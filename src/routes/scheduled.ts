dev/backend/src/routes/scheduled.ts
import { Router } from "express";
import * as scheduledController from "../controllers/scheduledController";

const router = Router();

// List all scheduled messages
router.get("/", scheduledController.getAllScheduled);

// Schedule a new message
router.post("/", scheduledController.scheduleMessage);

// Update a scheduled message by ID
router.put("/:id", scheduledController.updateScheduled);

// Delete (cancel) a scheduled message by ID
router.delete("/:id", scheduledController.deleteScheduled);

export default router;
