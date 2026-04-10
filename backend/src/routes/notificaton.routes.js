import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { getNotifications, markAllAsRead, markAsRead } from "../controllers/notification.controller.js";

const router = express.Router();

router.get("/", requireAuth, getNotifications);
router.put("/:id/read", requireAuth, markAsRead);
router.put("/read-all", requireAuth, markAllAsRead);

export default router;