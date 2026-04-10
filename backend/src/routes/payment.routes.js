import express from "express";
import { downloadInvoice, getPaymentHistory, initiatePayment, verifyPayment } from "../controllers/payment.controller.js";
import { requireAuth, requireStudent } from "../middleware/auth.js";

const router = express.Router();

router.post("/initiate", requireAuth, requireStudent, initiatePayment);
router.post("/verify", requireAuth, requireStudent, verifyPayment);
router.get("/history", requireAuth, requireStudent, getPaymentHistory);
router.get("/:id/invoice", requireAuth, requireStudent, downloadInvoice);

export default router;