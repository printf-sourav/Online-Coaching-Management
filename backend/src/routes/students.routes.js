import express from "express";
import { requireAuth, requireStudent } from "../middleware/auth.js";
import {
  getStudentDashboard,
  getStudentClasses,
  getStudentAttendance,
  getStudentAssignments,
  submitAssignment,
  getStudentPayments,
  submitFeedback,
  getMyFeedback,
  submitPlatformReview,
  getMyPlatformReview,
  getMyPerformanceNotes,
} from "../controllers/student.controller.js";
import upload from "../middleware/multer.js";

const router = express.Router();

router.use(requireAuth, requireStudent);

router.get("/dashboard", getStudentDashboard);
router.get("/classes", getStudentClasses);
router.get("/attendance", getStudentAttendance);
router.get("/assignments", getStudentAssignments);
router.post("/assignments/:id/submit", upload.single("file"), submitAssignment);
router.get("/payments/history", getStudentPayments);
router.post("/feedback", submitFeedback);
router.get("/feedback", getMyFeedback);
router.post("/platform-review", submitPlatformReview);
router.get("/platform-review", getMyPlatformReview);
router.get("/performance-notes", getMyPerformanceNotes);

export default router;