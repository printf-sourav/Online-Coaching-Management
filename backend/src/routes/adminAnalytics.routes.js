import express from "express";
import {
  getOverviewAnalytics,
  getMonthlyRevenue,
  getRevenueByTeacher,
} from "../controllers/adminAnalytics.controller.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/overview", requireAuth, requireAdmin, getOverviewAnalytics);
router.get("/monthly", requireAuth, requireAdmin, getMonthlyRevenue);
router.get("/teachers", requireAuth, requireAdmin, getRevenueByTeacher);

export default router;