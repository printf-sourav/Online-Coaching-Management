import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import Teacher from "../models/Teacher.model.js";
import Enrollment from "../models/Enrollment.model.js";
import Attendance from "../models/Attendance.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import Student from "../models/Student.model.js";
import { createNotification } from "../utils/notification.js";

// ─── POST /api/attendance  { date, records: [{ studentId, status }] } ─────────
const markAttendance = asyncHandler(async (req, res) => {
  const { date, records } = req.body;

  if (!date) throw new apiError(400, "Date is required");
  if (!Array.isArray(records) || records.length === 0)
    throw new apiError(400, "Attendance records must be a non-empty array");

  const teacher = await Teacher.findOne({ userId: req.user._id });
  if (!teacher) throw new apiError(404, "Teacher not found");

  // All students enrolled with this teacher
  const enrollments = await Enrollment.find({
    tutorId: teacher._id,
    status: { $in: ["active", "pending"] },
  })
    .select("studentId")
    .lean();

  const enrolledIds = new Set(enrollments.map((e) => e.studentId.toString()));

  const sessionDate = new Date(date);
  sessionDate.setHours(0, 0, 0, 0);

  // Validate all records first before any DB writes
  const attendanceRecords = records.map((item) => {
    if (!mongoose.Types.ObjectId.isValid(item.studentId))
      throw new apiError(400, "Invalid student ID: " + item.studentId);
    if (!["present", "absent", "late"].includes(item.status))
      throw new apiError(400, "Invalid status: " + item.status);
    if (!enrolledIds.has(item.studentId.toString()))
      throw new apiError(400, "Student not enrolled with this teacher: " + item.studentId);
    return {
      studentId: new mongoose.Types.ObjectId(item.studentId),
      teacherId: teacher._id,
      status: item.status,
      date: sessionDate,
    };
  });

  // Upsert in bulk
  await Attendance.bulkWrite(
    attendanceRecords.map((r) => ({
      updateOne: {
        filter: { teacherId: r.teacherId, studentId: r.studentId, date: r.date },
        update: { $set: { status: r.status, markedAt: new Date() } },
        upsert: true,
      },
    }))
  );

  // Batch fetch student userIds for notifications (eliminates N+1)
  const studentDocIds = attendanceRecords.map((r) => r.studentId);
  const students = await Student.find({ _id: { $in: studentDocIds } })
    .select("_id userId")
    .lean();

  const studentUserMap = {};
  students.forEach((s) => {
    studentUserMap[s._id.toString()] = s.userId;
  });

  // Fire-and-forget notifications (non-blocking)
  const dateStr = new Date(date).toDateString();
  const notificationPromises = attendanceRecords
    .filter((r) => studentUserMap[r.studentId.toString()])
    .map((r) =>
      createNotification({
        userId: studentUserMap[r.studentId.toString()],
        title: "Attendance Marked",
        message: `Your attendance on ${dateStr} is marked as ${r.status}.`,
        type: "attendance",
        link: "/student/attendance",
      }).catch(() => {}) // swallow notification failures
    );

  // Don't await — let notifications send in background
  Promise.all(notificationPromises).catch(() => {});

  return res.status(201).json(
    new ApiResponse(201, { totalMarked: attendanceRecords.length }, "Attendance marked successfully")
  );
});

const getStudentAttendance = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ userId: req.user._id });
  if (!student) throw new apiError(404, "Student not found");

  // Use aggregation instead of loading all records into memory
  const [summary] = await Attendance.aggregate([
    { $match: { studentId: student._id } },
    {
      $group: {
        _id: null,
        totalClasses: { $sum: 1 },
        present: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
        absent: { $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] } },
        late: { $sum: { $cond: [{ $eq: ["$status", "late"] }, 1, 0] } },
      },
    },
  ]);

  const totalClasses = summary?.totalClasses || 0;
  const present = summary?.present || 0;
  const absent = summary?.absent || 0;
  const late = summary?.late || 0;
  const percentage = totalClasses > 0
    ? Number((((present + late) / totalClasses) * 100).toFixed(2))
    : 0;

  return res.status(200).json(
    new ApiResponse(200, {
      totalClasses,
      present,
      absent,
      late,
      attendancePercentage: percentage,
    })
  );
});

// ─── GET /api/attendance/teacher  — teacher's full attendance history ───────────
const getTeacherAttendance = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({ userId: req.user._id });
  if (!teacher) throw new apiError(404, "Teacher not found");

  // Use aggregation for summary, lean query for records
  const [summary, records] = await Promise.all([
    Attendance.aggregate([
      { $match: { teacherId: teacher._id } },
      {
        $group: {
          _id: null,
          totalMarked: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ["$status", "late"] }, 1, 0] } },
        },
      },
    ]),
    Attendance.find({ teacherId: teacher._id })
      .populate("studentId", "userId")
      .sort({ date: -1 })
      .lean(),
  ]);

  const s = summary[0] || { totalMarked: 0, present: 0, absent: 0, late: 0 };
  const percentage = s.totalMarked > 0
    ? Number((((s.present + s.late) / s.totalMarked) * 100).toFixed(2))
    : 0;

  return res.status(200).json(
    new ApiResponse(200, {
      summary: { ...s, attendancePercentage: percentage },
      records,
    }, "Teacher attendance fetched successfully")
  );
});

// ─── GET /api/attendance/student/:studentId  — teacher views one student ────────
const getStudentAttendanceByTeacher = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({ userId: req.user._id });
  if (!teacher) throw new apiError(404, "Teacher not found");

  const { studentId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(studentId))
    throw new apiError(400, "Invalid student ID");

  const [summary, records] = await Promise.all([
    Attendance.aggregate([
      { $match: { teacherId: teacher._id, studentId: new mongoose.Types.ObjectId(studentId) } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ["$status", "late"] }, 1, 0] } },
        },
      },
    ]),
    Attendance.find({ teacherId: teacher._id, studentId })
      .sort({ date: -1 })
      .select("_id date status markedAt")
      .lean(),
  ]);

  const s = summary[0] || { total: 0, present: 0, absent: 0, late: 0 };
  const percentage = s.total > 0
    ? Number((((s.present + s.late) / s.total) * 100).toFixed(2))
    : 0;

  return res.status(200).json(
    new ApiResponse(200, {
      summary: { ...s, percentage },
      records,
    }, "Student attendance fetched")
  );
});

export { markAttendance, getStudentAttendance, getTeacherAttendance, getStudentAttendanceByTeacher };