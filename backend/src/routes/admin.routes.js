import express from "express";
import { requireAdmin, requireAuth } from "../middleware/auth.js";

import {
  createTeacher,
  getAllStudents,
  getAllTeachers,
  getPlatformStats,
  updateTeacher,
  deleteTeacher,
  getAllClasses,
  getAllReviews,
  toggleFeaturedReview,
  getFeaturedReviews,
  getAllPlatformReviews,
  toggleFeaturedPlatformReview,
  getFeaturedPlatformReviews,
  searchStudents,
  getAdminStudentDetails,
  updateEnrollmentBilling,
  updatePaymentDueDate,
  approveEnrollment,
  createEnrollmentByAdmin,
  scheduleDemoByAdmin,
  getAllEnrollments,
  updateEnrollmentByAdmin,
  createAnnouncement,
  getAnnouncements,
} from "../controllers/admin.controller.js";


const router = express.Router()

router.post("/create-teacher", requireAuth, requireAdmin, createTeacher);

router.get("/teachers", requireAuth, requireAdmin, getAllTeachers);
router.put("/teachers/:teacherId", requireAuth, requireAdmin, updateTeacher);
router.delete("/teachers/:teacherId", requireAuth, requireAdmin, deleteTeacher);
router.get("/students", requireAuth, requireAdmin, getAllStudents);
router.get("/students/search", requireAuth, requireAdmin, searchStudents);
router.get("/students/:studentId/details", requireAuth, requireAdmin, getAdminStudentDetails);
router.get("/classes", requireAuth, requireAdmin, getAllClasses);
router.get("/stats", requireAuth, requireAdmin, getPlatformStats);

// ── Reviews / testimonials management ─────────────────────────────────────────
router.get("/reviews/featured", getFeaturedReviews);                // PUBLIC — no auth
router.get("/reviews", requireAuth, requireAdmin, getAllReviews);
router.put("/reviews/:id/feature", requireAuth, requireAdmin, toggleFeaturedReview);

// ── Platform reviews management ───────────────────────────────────────────────
router.get("/platform-reviews/featured", getFeaturedPlatformReviews);          // PUBLIC
router.get("/platform-reviews", requireAuth, requireAdmin, getAllPlatformReviews);
router.put("/platform-reviews/:id/feature", requireAuth, requireAdmin, toggleFeaturedPlatformReview);

// ── Billing / fee date overrides (admin only) ──────────────────────────────────
router.put("/enrollments/:enrollmentId/billing", requireAuth, requireAdmin, updateEnrollmentBilling);
router.put("/payments/:paymentId/due-date", requireAuth, requireAdmin, updatePaymentDueDate);

// ── Enrollment management (admin) ─────────────────────────────────────────────
router.get("/enrollments", requireAuth, requireAdmin, getAllEnrollments);
router.put("/enrollments/:enrollmentId", requireAuth, requireAdmin, updateEnrollmentByAdmin);
router.post("/enrollments/approve", requireAuth, requireAdmin, approveEnrollment);
router.post("/enrollments/create", requireAuth, requireAdmin, createEnrollmentByAdmin);

// ── Demo scheduling (admin) ───────────────────────────────────────────────────
router.post("/demos/schedule", requireAuth, requireAdmin, scheduleDemoByAdmin);

// ── Announcements ─────────────────────────────────────────────────────────────
router.get("/announcements", requireAuth, requireAdmin, getAnnouncements);
router.post("/announcements", requireAuth, requireAdmin, createAnnouncement);

export default router