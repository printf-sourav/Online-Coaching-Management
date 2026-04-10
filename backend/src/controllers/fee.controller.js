import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import StudentFee from "../models/StudentFee.model.js";
import Student from "../models/Student.model.js";
import mongoose from "mongoose";
import crypto from "crypto";
import razorpay from "../config/razorpay.js";

// ─── ADMIN: Set / Create fee for a student ───────────────────────────────────
export const setStudentFee = asyncHandler(async (req, res) => {
  const { studentId, totalFee, description, dueDate, enrollmentId } = req.body;

  if (!studentId || totalFee == null) {
    throw new apiError(400, "studentId and totalFee are required");
  }
  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    throw new apiError(400, "Invalid student ID");
  }

  const student = await Student.findById(studentId);
  if (!student) throw new apiError(404, "Student not found");

  const fee = await StudentFee.create({
    studentId,
    setBy: req.user._id,
    totalFee: Number(totalFee),
    paidAmount: 0,
    description: description || "",
    dueDate: dueDate ? new Date(dueDate) : undefined,
    enrollmentId: enrollmentId || undefined,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, fee, "Fee set successfully"));
});

// ─── ADMIN: Update an existing fee record ────────────────────────────────────
export const updateStudentFee = asyncHandler(async (req, res) => {
  const { feeId } = req.params;
  const { totalFee, paidAmount, description, dueDate, status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(feeId)) {
    throw new apiError(400, "Invalid fee ID");
  }

  const fee = await StudentFee.findById(feeId);
  if (!fee) throw new apiError(404, "Fee record not found");

  if (totalFee != null) fee.totalFee = Number(totalFee);
  if (paidAmount != null) fee.paidAmount = Number(paidAmount);
  if (description != null) fee.description = description;
  if (dueDate != null) fee.dueDate = new Date(dueDate);
  if (status) fee.status = status;

  await fee.save(); // pre-save hook auto-computes status

  return res
    .status(200)
    .json(new ApiResponse(200, fee, "Fee updated successfully"));
});

// ─── ADMIN: Delete a fee record ──────────────────────────────────────────────
export const deleteStudentFee = asyncHandler(async (req, res) => {
  const { feeId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(feeId))
    throw new apiError(400, "Invalid fee ID");

  const fee = await StudentFee.findByIdAndDelete(feeId);
  if (!fee) throw new apiError(404, "Fee record not found");

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Fee deleted successfully"));
});

// ─── ADMIN: Get all fees for a specific student ──────────────────────────────
export const getStudentFees = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(studentId))
    throw new apiError(400, "Invalid student ID");

  const fees = await StudentFee.find({ studentId })
    .populate("enrollmentId", "tutorId grade subjectsEnrolled")
    .sort({ createdAt: -1 })
    .lean();

  const totalFee = fees.reduce((s, f) => s + f.totalFee, 0);
  const totalPaid = fees.reduce((s, f) => s + f.paidAmount, 0);
  const totalPending = totalFee - totalPaid;

  return res.status(200).json(
    new ApiResponse(200, {
      fees,
      summary: { totalFee, totalPaid, totalPending },
    }, "Fees fetched successfully")
  );
});

// ─── ADMIN: Record a payment against a fee ───────────────────────────────────
export const recordFeePayment = asyncHandler(async (req, res) => {
  const { feeId } = req.params;
  const { amount } = req.body;

  if (!mongoose.Types.ObjectId.isValid(feeId))
    throw new apiError(400, "Invalid fee ID");
  if (!amount || amount <= 0)
    throw new apiError(400, "Valid payment amount is required");

  const fee = await StudentFee.findById(feeId);
  if (!fee) throw new apiError(404, "Fee record not found");

  fee.paidAmount = Math.min(fee.totalFee, fee.paidAmount + Number(amount));
  await fee.save();

  return res
    .status(200)
    .json(new ApiResponse(200, fee, "Payment recorded successfully"));
});

// ─── STUDENT: Get my own fee details ─────────────────────────────────────────
export const getMyFees = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ userId: req.user._id });
  if (!student) {
    return res.status(200).json(
      new ApiResponse(200, { fees: [], summary: { totalFee: 0, totalPaid: 0, totalPending: 0 } }, "No fee records")
    );
  }

  const fees = await StudentFee.find({ studentId: student._id })
    .populate("enrollmentId", "tutorId grade subjectsEnrolled")
    .sort({ createdAt: -1 })
    .lean();

  const totalFee = fees.reduce((s, f) => s + f.totalFee, 0);
  const totalPaid = fees.reduce((s, f) => s + f.paidAmount, 0);
  const totalPending = totalFee - totalPaid;

  return res.status(200).json(
    new ApiResponse(200, {
      fees,
      summary: { totalFee, totalPaid, totalPending },
    }, "Fees fetched successfully")
  );
});

// ─── STUDENT: Initiate Razorpay payment for a fee ────────────────────────────
export const initiateFeePayment = asyncHandler(async (req, res) => {
  const { feeId, amount } = req.body;

  if (
    !process.env.RAZORPAY_KEY_ID ||
    !process.env.RAZORPAY_KEY_SECRET ||
    process.env.RAZORPAY_KEY_ID.includes("xxxxx") ||
    process.env.RAZORPAY_KEY_ID === "rzp_test_xxxxx"
  ) {
    throw new apiError(503, "Payment gateway is not configured. Please contact admin.");
  }

  if (!feeId || !mongoose.Types.ObjectId.isValid(feeId)) {
    throw new apiError(400, "Valid feeId is required");
  }

  const student = await Student.findOne({ userId: req.user._id });
  if (!student) throw new apiError(404, "Student record not found");

  const fee = await StudentFee.findById(feeId);
  if (!fee) throw new apiError(404, "Fee record not found");

  if (String(fee.studentId) !== String(student._id)) {
    throw new apiError(403, "This fee does not belong to you");
  }

  if (fee.status === "paid") {
    throw new apiError(400, "This fee is already fully paid");
  }

  const pending = fee.totalFee - fee.paidAmount;
  const payAmount = amount ? Math.min(Number(amount), pending) : pending;

  if (payAmount <= 0) {
    throw new apiError(400, "No pending amount to pay");
  }

  let order;
  try {
    order = await razorpay.orders.create({
      amount: Math.round(payAmount * 100),
      currency: "INR",
      receipt: `fee_${Date.now()}`,
      notes: { feeId: String(feeId), studentId: String(student._id) },
    });
  } catch (err) {
    throw new apiError(502, `Razorpay error: ${err?.error?.description || err?.message || "Could not create order"}`);
  }

  fee.razorpayOrderId = order.id;
  await fee.save();

  return res.status(200).json(
    new ApiResponse(200, {
      orderId: order.id,
      key: process.env.RAZORPAY_KEY_ID,
      amount: Math.round(payAmount * 100),
      feeId: fee._id,
    }, "Order created")
  );
});

// ─── STUDENT: Verify Razorpay payment for a fee ─────────────────────────────
export const verifyFeePayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, feeId, amount } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !feeId) {
    throw new apiError(400, "Missing payment verification fields");
  }

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    throw new apiError(400, "Payment verification failed – signature mismatch");
  }

  const fee = await StudentFee.findById(feeId);
  if (!fee) throw new apiError(404, "Fee record not found");

  if (fee.razorpayOrderId !== razorpay_order_id) {
    throw new apiError(400, "Order ID mismatch");
  }

  const creditAmount = amount ? Number(amount) / 100 : fee.totalFee - fee.paidAmount;
  fee.paidAmount = Math.min(fee.totalFee, fee.paidAmount + creditAmount);
  fee.razorpayPaymentId = razorpay_payment_id;
  fee.razorpaySignature = razorpay_signature;
  fee.paidAt = new Date();
  await fee.save();

  return res.status(200).json(
    new ApiResponse(200, fee, "Payment verified and recorded successfully")
  );
});
