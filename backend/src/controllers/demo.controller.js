import mongoose from "mongoose";
import Demo from "../models/Demo.model.js";
import Teacher from "../models/Teacher.model.js";
import Student from "../models/Student.model.js";
import User from "../models/User.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { createNotification } from "../utils/notification.js";

// ─── POST /api/demos/:tutorId  ────────────────────────────────────────────────
// Student requests a free demo with a tutor (one per tutor, no enrollment needed)
export const requestDemo = asyncHandler(async (req, res) => {
  const { tutorId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(tutorId)) {
    throw new apiError(400, "Invalid tutor ID");
  }

  const student = await Student.findOne({ userId: req.user._id });
  if (!student) throw new apiError(404, "Student profile not found");

  const teacher = await Teacher.findById(tutorId);
  if (!teacher) throw new apiError(404, "Tutor not found");

  // Check if a demo already exists for this student-tutor pair
  const existing = await Demo.findOne({ studentId: student._id, tutorId: teacher._id });
  if (existing) {
    if (existing.status === "cancelled") {
      // Allow re-request if previously cancelled
      existing.status = "pending";
      existing.scheduledAt = undefined;
      await existing.save();
      return res.status(200).json(
        new ApiResponse(200, _formatDemo(existing, teacher), "Demo re-requested successfully")
      );
    }
    throw new apiError(400, "You have already booked a demo with this tutor");
  }

  const demo = await Demo.create({
    studentId: student._id,
    tutorId: teacher._id,
    status: "pending",
  });

  return res.status(201).json(
    new ApiResponse(201, _formatDemo(demo, teacher), "Free demo booked! The tutor will confirm your session soon.")
  );
});

// ─── GET /api/demos  ──────────────────────────────────────────────────────────
// Student gets all their demo requests
export const getMyDemos = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ userId: req.user._id });
  if (!student) return res.status(200).json(new ApiResponse(200, [], "No demos"));

  const demos = await Demo.find({ studentId: student._id })
    .populate({ path: "tutorId", populate: { path: "userId", select: "name" } })
    .sort({ createdAt: -1 });

  const result = demos.map((d) => {
    const t = d.tutorId;
    return {
      demoId: d._id,
      tutorId: t?._id,
      tutorName: t?.userId?.name || "Tutor",
      subject: t?.subjects?.[0] || "—",
      status: d.status,
      scheduledAt: d.scheduledAt || null,
      zoomLink: d.zoomLink || null,
      requestedAt: d.createdAt,
    };
  });

  return res.status(200).json(new ApiResponse(200, result, "Demos fetched"));
});

// ─── GET /api/demos/status/:tutorId  ─────────────────────────────────────────
// Quick check: has this student booked a demo with a specific tutor?
export const getDemoStatus = asyncHandler(async (req, res) => {
  const { tutorId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(tutorId)) {
    throw new apiError(400, "Invalid tutor ID");
  }

  const student = await Student.findOne({ userId: req.user._id });
  if (!student) {
    return res.status(200).json(new ApiResponse(200, { booked: false }, "No demo"));
  }

  const demo = await Demo.findOne({ studentId: student._id, tutorId }).lean();

  return res.status(200).json(
    new ApiResponse(200, {
      booked: !!demo && demo.status !== "cancelled",
      status: demo?.status || null,
      scheduledAt: demo?.scheduledAt || null,
      requestedAt: demo?.createdAt || null,
    }, "Demo status fetched")
  );
});

// ─── PATCH /api/demos/:demoId/confirm  (teacher/admin) ───────────────────────
export const confirmDemo = asyncHandler(async (req, res) => {
  const { demoId } = req.params;
  const { scheduledAt, zoomLink, notes } = req.body;

  const demo = await Demo.findById(demoId)
    .populate({ path: "studentId", populate: { path: "userId", select: "name" } })
    .populate({ path: "tutorId", populate: { path: "userId", select: "name" } });
  if (!demo) throw new apiError(404, "Demo not found");

  demo.status = "confirmed";
  if (scheduledAt) demo.scheduledAt = new Date(scheduledAt);
  if (zoomLink)    demo.zoomLink   = zoomLink;
  if (notes)       demo.notes      = notes;
  await demo.save();

  // Notify the student
  const studentUserId = demo.studentId?.userId?._id ?? demo.studentId?.userId;
  const tutorName     = demo.tutorId?.userId?.name || "Your tutor";
  const subject       = demo.tutorId?.subjects?.[0] || "";

  if (studentUserId) {
    const dateStr = scheduledAt
      ? new Date(scheduledAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
      : "a time to be confirmed";
    await createNotification({
      userId: studentUserId,
      title: "Demo Class Confirmed! 🎉",
      message: `${tutorName} has confirmed your free demo${subject ? ` for ${subject}` : ""} on ${dateStr}.${zoomLink ? ` Join: ${zoomLink}` : ""}`,
      type: "class",
      link: "/student/classes",
    });
  }

  return res.status(200).json(new ApiResponse(200, demo, "Demo confirmed and student notified"));
});

// ─── PATCH /api/demos/:demoId/complete  (teacher/admin) ──────────────────────
export const completeDemo = asyncHandler(async (req, res) => {
  const { demoId } = req.params;

  const demo = await Demo.findById(demoId);
  if (!demo) throw new apiError(404, "Demo not found");

  demo.status = "completed";
  await demo.save();

  return res.status(200).json(new ApiResponse(200, demo, "Demo marked as completed"));
});

// ─── GET /api/demos/requests  (teacher) ──────────────────────────────────────
// Teacher sees all demo requests for their tutor profile
export const getTeacherDemoRequests = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({ userId: req.user._id });
  if (!teacher) throw new apiError(404, "Teacher profile not found");

  const demos = await Demo.find({ tutorId: teacher._id })
    .populate({ path: "studentId", populate: { path: "userId", select: "name" } })
    .sort({ createdAt: -1 });

  const result = demos.map((d) => {
    const s = d.studentId;
    return {
      demoId: d._id,
      studentId: s?._id,
      studentName: s?.userId?.name || "Student",
      status: d.status,
      scheduledAt: d.scheduledAt || null,
      zoomLink: d.zoomLink || null,
      requestedAt: d.createdAt,
      notes: d.notes,
    };
  });

  return res.status(200).json(new ApiResponse(200, result, "Demo requests fetched"));
});

// ─── helpers ──────────────────────────────────────────────────────────────────
function _formatDemo(demo, teacher) {
  return {
    demoId: demo._id,
    tutorId: teacher._id,
    status: demo.status,
    scheduledAt: demo.scheduledAt || null,
    requestedAt: demo.createdAt,
  };
}
