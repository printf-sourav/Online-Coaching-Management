import express from "express";
import { createClass, getTeacherClasses, updateClass, deleteClass, getClass } from "../controllers/class.controller.js";
import { requireAuth, requireTeacher } from "../middleware/auth.js";

const router = express.Router();

router.post("/",   requireAuth, requireTeacher, createClass);
router.get("/",    requireAuth, requireTeacher, getTeacherClasses);
router.get("/:id", requireAuth, getClass);
router.put("/:id", requireAuth, requireTeacher, updateClass);
router.delete("/:id", requireAuth, requireTeacher, deleteClass);

export default router;