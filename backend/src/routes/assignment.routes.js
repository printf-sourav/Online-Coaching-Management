import express from "express";
import upload from "../middleware/multer.js";
import { createAssignment, submitAssignment } from "../controllers/assignment.controller.js";
import { getTeacherAssignments } from "../controllers/teacher.controller.js";
import { requireAuth, requireStudent, requireTeacher } from "../middleware/auth.js";

const router = express.Router();

// Teacher routes
router.get("/", requireAuth, requireTeacher, getTeacherAssignments);
router.post("/", requireAuth, requireTeacher, upload.single("file"), createAssignment);

// Student routes
router.post("/:id/submit", requireAuth, requireStudent, upload.single("file"), submitAssignment);

export default router;