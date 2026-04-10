import express from "express";
import { requireAuth, requireStudent, requireTeacher } from "../middleware/auth.js";
import {
  requestDemo,
  getMyDemos,
  getDemoStatus,
  confirmDemo,
  completeDemo,
  getTeacherDemoRequests,
} from "../controllers/demo.controller.js";

const router = express.Router();

// ── Student routes ────────────────────────────────────────────────────────────
router.get("/", requireAuth, requireStudent, getMyDemos);
router.get("/status/:tutorId", requireAuth, requireStudent, getDemoStatus);
router.post("/:tutorId", requireAuth, requireStudent, requestDemo);

// ── Teacher routes ────────────────────────────────────────────────────────────
router.get("/requests", requireAuth, requireTeacher, getTeacherDemoRequests);
router.patch("/:demoId/confirm", requireAuth, requireTeacher, confirmDemo);
router.patch("/:demoId/complete", requireAuth, requireTeacher, completeDemo);

export default router;
