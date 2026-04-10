import crypto from "crypto";
import razorpay from "../config/razorpay.js";
import Payment from "../models/Payment.model.js";
import Enrollment from "../models/Enrollment.model.js";
import Student from "../models/Student.model.js";
import Teacher from "../models/Teacher.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { sendPaymentReceiptEmail } from "../utils/sendEmail.js";
import { generateInvoicePDF } from "../utils/generateInvoice.js";

// ── Helper: add exactly one month to a Date ───────────────────────────────
function addOneMonth(date) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1);
  return d;
}

function billingMonthStr(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export const initiatePayment = asyncHandler(async (req, res) => {
  const { enrollmentId, paymentId: existingPaymentId } = req.body;

  // Guard: reject immediately if Razorpay keys are not configured
  if (
    !process.env.RAZORPAY_KEY_ID ||
    !process.env.RAZORPAY_KEY_SECRET ||
    process.env.RAZORPAY_KEY_ID.includes('xxxxx') ||
    process.env.RAZORPAY_KEY_ID === 'rzp_test_xxxxx'
  ) {
    throw new apiError(503, "Payment gateway is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in the server environment.");
  }

  let student = await Student.findOne({ userId: req.user._id });
  if (!student) {
    student = await Student.create({
      userId: req.user._id,
      studentId: `STU-${req.user._id}`,
    });
  }

  // ── Case: paying an existing auto-generated monthly invoice ──
  if (existingPaymentId) {
    const existing = await Payment.findById(existingPaymentId);
    if (!existing) throw new apiError(404, "Payment record not found");
    if (existing.status === "paid") throw new apiError(400, "This invoice is already paid");

    const amount = existing.amount * 100;
    let order;
    try {
      order = await razorpay.orders.create({ amount, currency: "INR", receipt: `receipt_${Date.now()}` });
    } catch (err) {
      throw new apiError(502, `Razorpay error: ${err?.error?.description || err?.message || "Could not create order"}`);
    }
    existing.razorpayOrderId = order.id;
    await existing.save();

    return res.status(200).json(
      new ApiResponse(200, {
        orderId: order.id,
        key: process.env.RAZORPAY_KEY_ID,
        amount,
        paymentId: existing._id,
      })
    );
  }

  // ── Case: initial enrollment payment ──
  const enrollment = await Enrollment.findById(enrollmentId);
  if (!enrollment) throw new apiError(404, "Enrollment not found");

  if (enrollment.status !== 'approved') {
    throw new apiError(400, "Enrollment not approved by admin");
  }

  const amount = enrollment.price * 100;
  let order;
  try {
    order = await razorpay.orders.create({ amount, currency: "INR", receipt: `receipt_${Date.now()}` });
  } catch (err) {
    throw new apiError(502, `Razorpay error: ${err?.error?.description || err?.message || "Could not create order"}`);
  }

  const now = new Date();
  const payment = await Payment.create({
    studentId: student._id,
    enrollmentId,
    amount: enrollment.price,
    razorpayOrderId: order.id,
    type: "initial",
    billingMonth: billingMonthStr(now),
    dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
  });

  return res.status(200).json(
    new ApiResponse(200, {
      orderId: order.id,
      key: process.env.RAZORPAY_KEY_ID,
      amount,
      paymentId: payment._id,
    })
  );
});

export const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentId } = req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    throw new apiError(400, "Payment verification failed");
  }

  const payment = await Payment.findById(paymentId);
  if (!payment) throw new apiError(404, "Payment record not found");

  payment.status = "paid";
  payment.razorpayPaymentId = razorpay_payment_id;
  payment.razorpaySignature = razorpay_signature;
  payment.paidAt = new Date();
  payment.invoiceNumber = `INV-${Date.now()}`;
  await payment.save();

  // Send receipt email — non-critical, never block payment on email failure
  sendPaymentReceiptEmail(req.user.email, payment).catch(err =>
    console.warn("[Payment] Receipt email failed (non-fatal):", err?.message)
  );

  const nextBillingDate = addOneMonth(new Date());
  const enrollment = await Enrollment.findByIdAndUpdate(
    payment.enrollmentId,
    { status: "active", nextBillingDate },
    { new: true }
  );

  // Activate student-teacher relationship now that payment is confirmed
  if (enrollment) {
    await Student.findByIdAndUpdate(enrollment.studentId, {
      $addToSet: { enrolledTutors: enrollment._id },
    });
    // Only increment totalStudents on initial payment
    if (payment.type === "initial") {
      await Teacher.findByIdAndUpdate(enrollment.tutorId, {
        $inc: { totalStudents: 1 },
      });
    }
  }

  return res.status(200).json(
    new ApiResponse(200, {}, "Payment successful")
  );
});

export const downloadInvoice = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);

  if (!payment) {
    throw new apiError(404, "Payment not found");
  }

  if (payment.status !== "paid") {
    throw new apiError(400, "Invoice available only for paid payments");
  }

  generateInvoicePDF(payment, res);
});

export const getPaymentHistory = asyncHandler(async (req, res) => {
  let student = await Student.findOne({ userId: req.user._id });
  if (!student) {
    student = await Student.create({
      userId: req.user._id,
      studentId: `STU-${req.user._id}`,
    });
  }

  const payments = await Payment.find({ studentId: student._id })
    .populate({ path: "enrollmentId", select: "tutorId planName price status nextBillingDate",
      populate: { path: "tutorId", populate: { path: "userId", select: "name" } } })
    .sort({ createdAt: -1 });

  const list = payments.map(p => ({
    id: p._id,
    amount: p.amount,
    currency: p.currency,
    status: p.status,
    type: p.type,
    billingMonth: p.billingMonth,
    dueDate: p.dueDate,
    isAutoGenerated: p.isAutoGenerated,
    invoiceNumber: p.invoiceNumber,
    paidAt: p.paidAt,
    createdAt: p.createdAt,
    enrollmentId: p.enrollmentId?._id,
    planName: p.enrollmentId?.planName,
    teacherName: p.enrollmentId?.tutorId?.userId?.name || "Teacher",
    enrollmentStatus: p.enrollmentId?.status,
  }));

  // Also return pending auto-generated invoices
  const pendingInvoices = list.filter(p => p.status === "pending" && p.isAutoGenerated);

  // Return the earliest nextBillingDate from active enrollments (shown when no pending invoice exists)
  const activeEnrollments = await Enrollment.find({
    studentId: student._id,
    status: "active",
    nextBillingDate: { $exists: true, $ne: null },
  }).sort({ nextBillingDate: 1 }).limit(1).select("nextBillingDate");
  const nextBillingDate = activeEnrollments[0]?.nextBillingDate ?? null;

  return res.status(200).json(
    new ApiResponse(200, { payments: list, pendingInvoices, nextBillingDate })
  );
});