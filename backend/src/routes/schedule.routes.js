import express from "express";
import { requireAuth, requireTeacher, requireStudent } from "../middleware/auth.js";
import {
  getMySchedule,
  addSlot,
  updateSlot,
  deleteSlot,
  getStudentSchedule,
  getStudentSlots,
  addStudentSlot,
  deleteStudentSlot,
} from "../controllers/schedule.controller.js";

const router = express.Router();

// ── Teacher — general (broadcast) schedule ────────────────────────────────────
router.get("/",        requireAuth, requireTeacher, getMySchedule);
router.post("/",       requireAuth, requireTeacher, addSlot);

// ── Teacher — per-student schedule slots ─────────────────────────────────────
// These must be declared BEFORE /:id to avoid route conflicts
router.get("/students",                  requireAuth, requireTeacher, getStudentSlots);
router.post("/student/:studentId",       requireAuth, requireTeacher, addStudentSlot);
router.delete("/student-slot/:slotId",   requireAuth, requireTeacher, deleteStudentSlot);

// ── Teacher — update / delete general slots ───────────────────────────────────
router.put("/:id",     requireAuth, requireTeacher, updateSlot);
router.delete("/:id",  requireAuth, requireTeacher, deleteSlot);

// ── Student ───────────────────────────────────────────────────────────────────
router.get("/student", requireAuth, requireStudent, getStudentSchedule);

export default router;
