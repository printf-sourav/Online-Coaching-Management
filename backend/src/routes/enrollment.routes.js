import express from "express"


import { enrollInTutor,cancellEnrollment,bookDemo, getMyEnrollments, requestEnrollment } from "../controllers/enrollment.controller.js";
import { requireAuth, requireStudent } from "../middleware/auth.js";
import { validateEnrollment } from "../middleware/validateEnrollment.js";
const router = express.Router();

router.use(requireAuth,requireStudent)
router.get("/", getMyEnrollments)
router.post("/request", requestEnrollment);
router.post("/:id",validateEnrollment,enrollInTutor)
router.delete("/:id",cancellEnrollment)
router.post("/:id/demo",bookDemo)

export default router