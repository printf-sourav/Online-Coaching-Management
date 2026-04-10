import express from "express";
import { requireAuth, requireAdmin, requireStudent } from "../middleware/auth.js";
import {
  setStudentFee,
  updateStudentFee,
  deleteStudentFee,
  getStudentFees,
  recordFeePayment,
  getMyFees,
  initiateFeePayment,
  verifyFeePayment,
} from "../controllers/fee.controller.js";

const router = express.Router();

// ── Admin routes (set / manage fees) ──────────────────────────────────────────
router.post("/admin/set", requireAuth, requireAdmin, setStudentFee);
router.put("/admin/:feeId", requireAuth, requireAdmin, updateStudentFee);
router.delete("/admin/:feeId", requireAuth, requireAdmin, deleteStudentFee);
router.get("/admin/student/:studentId", requireAuth, requireAdmin, getStudentFees);
router.post("/admin/:feeId/pay", requireAuth, requireAdmin, recordFeePayment);

// ── Student routes (view own fees + pay via Razorpay) ─────────────────────────
router.get("/my", requireAuth, requireStudent, getMyFees);
router.post("/pay/initiate", requireAuth, requireStudent, initiateFeePayment);
router.post("/pay/verify", requireAuth, requireStudent, verifyFeePayment);

export default router;
