import express from "express";
import { gradeSubmission } from "../controllers/submission.controller.js";
import { requireAuth, requireTeacher } from "../middleware/auth.js";

const router = express.Router();

router.put("/:id", requireAuth, requireTeacher, gradeSubmission);

export default router;
