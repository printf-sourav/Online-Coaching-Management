import { markAttendance, getStudentAttendance, getTeacherAttendance, getStudentAttendanceByTeacher } from "../controllers/Attendance.controller.js";

import express from "express";
import { requireAuth, requireStudent, requireTeacher } from "../middleware/auth.js";


const router = express.Router()

router.post("/",                       requireAuth, requireTeacher, markAttendance)
router.get("/student",                 requireAuth, requireStudent, getStudentAttendance)
router.get("/teacher",                 requireAuth, requireTeacher, getTeacherAttendance)
router.get("/student/:studentId",      requireAuth, requireTeacher, getStudentAttendanceByTeacher)


export default router