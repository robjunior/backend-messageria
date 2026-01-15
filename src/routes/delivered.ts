import { Router } from "express";
import * as deliveredController from "../controllers/deliveredController";

const router = Router();

// List all delivered messages
router.get("/", deliveredController.getAllDelivered);

export default router;
