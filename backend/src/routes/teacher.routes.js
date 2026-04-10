import express from "express";
import { requireAuth, requireTeacher } from "../middleware/auth.js";
import {
  getTeacherDashboard,
  getPublicTeachersList,
  getMyPlans,
  addTopic,
  getTopics,
  deleteTopic,
  addPerformanceNote,
  getPerformanceNotes,
  deletePerformanceNote,
  getTeacherFeedback,
  getAvailability,
  updateAvailability,
} from "../controllers/teacher.controller.js";

const router = express.Router();

// Public — anyone can browse teachers (no auth required)
router.get("/list", getPublicTeachersList);

// Teacher-only routes
router.get("/dashboard", requireAuth, requireTeacher, getTeacherDashboard);

// Teachers can VIEW their own plans (set by admin)
router.get("/plans", requireAuth, requireTeacher, getMyPlans);

// Topics covered
router.get("/topics", requireAuth, requireTeacher, getTopics);
router.post("/topics", requireAuth, requireTeacher, addTopic);
router.delete("/topics/:id", requireAuth, requireTeacher, deleteTopic);

// Performance notes
router.get("/performance-notes", requireAuth, requireTeacher, getPerformanceNotes);
router.post("/performance-notes", requireAuth, requireTeacher, addPerformanceNote);
router.delete("/performance-notes/:id", requireAuth, requireTeacher, deletePerformanceNote);

// Feedback received from students
router.get("/feedback", requireAuth, requireTeacher, getTeacherFeedback);

// Availability
router.get("/availability", requireAuth, requireTeacher, getAvailability);
router.put("/availability", requireAuth, requireTeacher, updateAvailability);

export default router;