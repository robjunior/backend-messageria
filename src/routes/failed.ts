import { Router } from "express";
import * as failedController from "../controllers/failedController";

const router = Router();

// List all failed messages
router.get("/", failedController.listFailedMessages);

export default router;
