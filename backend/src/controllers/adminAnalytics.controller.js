import Payment from "../models/Payment.model.js";
import StudentFee from "../models/StudentFee.model.js";
import Enrollment from "../models/Enrollment.model.js";
import Teacher from "../models/Teacher.model.js";
import Student from "../models/Student.model.js";
import Class from "../models/Class.model.js";
import Assignment from "../models/assignment.model.js";
import Submission from "../models/submission.model.js";
import Attendance from "../models/Attendance.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export const getOverviewAnalytics = asyncHandler(async (req, res) => {
  const now = new Date();

  /* ── Totals ── */
  const [totalRevenueAgg, monthlyRevenueAgg, pendingPaymentAgg, paidCount, totalCount, activeEnrollments, totalTeachers, totalStudents, pendingEnrollmentAgg, avgAttendanceAgg,
    // StudentFee aggregations
    sfTotalRevenueAgg, sfMonthlyRevenueAgg, sfPendingAgg, sfPaidCount, sfTotalCount,
  ] =
    await Promise.all([
      Payment.aggregate([{ $match: { status: "paid" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
      Payment.aggregate([
        { $match: { status: "paid", paidAt: { $gte: new Date(now.getFullYear(), now.getMonth(), 1), $lte: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59) } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      // Pending fees from Payment documents with status 'pending'
      Payment.aggregate([{ $match: { status: "pending" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
      Payment.countDocuments({ status: "paid" }),
      Payment.countDocuments({ status: { $in: ["paid", "pending"] } }),
      Enrollment.countDocuments({ status: "active" }),
      Teacher.countDocuments(),
      Student.countDocuments(),
      // Pending fees from enrollments that never got a Payment document (amount owed but not invoiced yet)
      Enrollment.aggregate([{ $match: { status: "pending" } }, { $group: { _id: null, total: { $sum: "$price" } } }]),
      // Platform-wide avg attendance
      Attendance.aggregate([
        { $group: { _id: "$studentId", total: { $sum: 1 }, attended: { $sum: { $cond: [{ $in: ["$status", ["present", "late"]] }, 1, 0] } } } },
        { $project: { pct: { $cond: [{ $gt: ["$total", 0] }, { $multiply: [{ $divide: ["$attended", "$total"] }, 100] }, 0] } } },
        { $group: { _id: null, avg: { $avg: "$pct" } } },
      ]),
      // ── StudentFee (admin-set fees) aggregations ──
      // Total revenue: sum paidAmount from all fees that have any payment
      StudentFee.aggregate([{ $match: { paidAmount: { $gt: 0 } } }, { $group: { _id: null, total: { $sum: "$paidAmount" } } }]),
      // This month's revenue: paidAt within current month
      StudentFee.aggregate([
        { $match: { paidAmount: { $gt: 0 }, paidAt: { $gte: new Date(now.getFullYear(), now.getMonth(), 1), $lte: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59) } } },
        { $group: { _id: null, total: { $sum: "$paidAmount" } } },
      ]),
      StudentFee.aggregate([{ $match: { status: { $in: ["pending", "partial"] } } }, { $group: { _id: null, total: { $sum: { $subtract: ["$totalFee", "$paidAmount"] } } } }]),
      StudentFee.countDocuments({ status: "paid" }),
      StudentFee.countDocuments({ status: { $in: ["paid", "pending", "partial"] } }),
    ]);

  const totalRevenue   = (totalRevenueAgg[0]?.total || 0) + (sfTotalRevenueAgg[0]?.total || 0);
  const monthlyRevenue = (monthlyRevenueAgg[0]?.total || 0) + (sfMonthlyRevenueAgg[0]?.total || 0);
  const avgAttendance  = Number((avgAttendanceAgg[0]?.avg ?? 0).toFixed(1));
  // Pending fees = pending Payment docs + pending Enrollment prices + pending StudentFee
  const pendingFromPayments   = pendingPaymentAgg[0]?.total     || 0;
  const pendingFromEnrollments = pendingEnrollmentAgg[0]?.total  || 0;
  const pendingFromStudentFees = sfPendingAgg[0]?.total          || 0;
  const pendingFees    = pendingFromPayments + pendingFromEnrollments + pendingFromStudentFees;
  // Collection rate: combine both Payment and StudentFee counts
  const combinedPaid  = paidCount + sfPaidCount;
  const combinedTotal = totalCount + sfTotalCount;
  const denominator   = combinedTotal > 0 ? combinedTotal : activeEnrollments;
  const collectionRate = denominator > 0 ? Math.round((combinedPaid / denominator) * 100) : 0;

  /* ── Reports data (enrollment trend, subject perf, utilization, class stats) ── */
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [
    studentTrend, teacherTrend,
    subjectScoreAgg, subjectClassAgg, subjectEnrollAgg, subjectTeacherAgg,
    teachersWithStudents,
    classDurationAgg,
    totalAssignedAgg, totalSubmitted,
  ] = await Promise.all([
    Student.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
    Teacher.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
    // Subject avg score from graded submissions
    Submission.aggregate([
      { $match: { status: "graded", grade: { $gt: 0 } } },
      { $lookup: { from: "assignments", localField: "assignmentId", foreignField: "_id", as: "asgn" } },
      { $unwind: { path: "$asgn", preserveNullAndEmptyArrays: false } },
      { $lookup: { from: "classes", localField: "asgn.classId", foreignField: "_id", as: "cls" } },
      { $unwind: { path: "$cls", preserveNullAndEmptyArrays: false } },
      { $group: { _id: "$cls.subject",
          avgScore: { $avg: { $multiply: [{ $divide: ["$grade", { $ifNull: ["$asgn.maxPoints", 10] }] }, 100] } },
          count: { $sum: 1 } } },
      { $sort: { count: -1 } }, { $limit: 8 },
      { $project: { _id: 0, subject: "$_id", avgScore: { $round: ["$avgScore", 1] }, count: 1 } },
    ]),
    // Fallback: subjects from classes with 0 score
    Class.aggregate([
      { $match: { subject: { $exists: true, $nin: [null, ""] } } },
      { $group: { _id: "$subject", count: { $sum: 1 } } },
      { $sort: { count: -1 } }, { $limit: 8 },
      { $project: { _id: 0, subject: "$_id", avgScore: { $literal: 0 }, count: 1 } },
    ]),
    // Fallback 2: subjects from active enrollments (subjectsEnrolled array)
    Enrollment.aggregate([
      { $match: { status: "active", subjectsEnrolled: { $exists: true, $ne: [] } } },
      { $unwind: "$subjectsEnrolled" },
      { $group: { _id: "$subjectsEnrolled", count: { $sum: 1 } } },
      { $sort: { count: -1 } }, { $limit: 8 },
      { $project: { _id: 0, subject: "$_id", avgScore: { $literal: 0 }, count: 1 } },
    ]),
    // Fallback 3: subjects from teacher profiles
    Teacher.aggregate([
      { $unwind: "$subjects" },
      { $group: { _id: "$subjects", count: { $sum: 1 } } },
      { $sort: { count: -1 } }, { $limit: 8 },
      { $project: { _id: 0, subject: "$_id", avgScore: { $literal: 0 }, count: 1 } },
    ]),
    // Teachers with ≥1 active enrollment
    Enrollment.aggregate([{ $match: { status: "active" } }, { $group: { _id: "$tutorId" } }, { $count: "count" }]),
    // Avg class duration in minutes
    Class.aggregate([
      { $match: { "timeSlot.start": { $exists: true }, "timeSlot.end": { $exists: true } } },
      { $project: { dur: { $divide: [{ $subtract: ["$timeSlot.end", "$timeSlot.start"] }, 60000] } } },
      { $group: { _id: null, avg: { $avg: "$dur" } } },
    ]),
    // Total assignment slots
    Assignment.aggregate([{ $project: { c: { $size: "$studentIds" } } }, { $group: { _id: null, total: { $sum: "$c" } } }]),
    // Total submissions
    Submission.countDocuments({ status: { $in: ["submitted", "graded", "late"] } }),
  ]);

  // Enrollment trend map
  const enrollMap = {};
  for (let i = 5; i >= 0; i--) {
    const d2 = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d2.getFullYear()}-${d2.getMonth() + 1}`;
    enrollMap[key] = { month: MONTH_NAMES[d2.getMonth()], students: 0, teachers: 0 };
  }
  for (const r of studentTrend) {
    const key = `${r._id.year}-${r._id.month}`;
    if (enrollMap[key]) enrollMap[key].students = r.count;
  }
  for (const r of teacherTrend) {
    const key = `${r._id.year}-${r._id.month}`;
    if (enrollMap[key]) enrollMap[key].teachers = r.count;
  }
  const enrollmentTrend = Object.values(enrollMap);

  // Subject performance: prefer graded data → class names → enrollment subjects → teacher subjects
  const subjectPerformance =
    subjectScoreAgg.length  > 0 ? subjectScoreAgg  :
    subjectClassAgg.length  > 0 ? subjectClassAgg  :
    subjectEnrollAgg.length > 0 ? subjectEnrollAgg :
    subjectTeacherAgg;

  // Teacher utilization
  const activeTeacherCount = teachersWithStudents[0]?.count ?? 0;
  const teacherUtilization = {
    full: activeTeacherCount,
    available: Math.max(0, totalTeachers - activeTeacherCount),
    onLeave: 0,
  };

  const avgClassDuration = Math.round(classDurationAgg[0]?.avg ?? 0);
  const assignedTotal = totalAssignedAgg[0]?.total ?? 0;
  const assignmentCompletion = assignedTotal > 0 ? Math.round((totalSubmitted / assignedTotal) * 100) : 0;

  /* ── Revenue trend (last 6 months) — combine Payment + StudentFee ── */
  const [trendAgg, sfTrendAgg] = await Promise.all([
    Payment.aggregate([
      { $match: { status: { $in: ["paid", "pending"] }, $or: [{ paidAt: { $gte: sixMonthsAgo } }, { createdAt: { $gte: sixMonthsAgo } }] } },
      {
        $group: {
          _id: {
            year:   { $year:  { $ifNull: ["$paidAt", "$createdAt"] } },
            month:  { $month: { $ifNull: ["$paidAt", "$createdAt"] } },
            status: "$status",
          },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
    StudentFee.aggregate([
      { $match: { status: { $in: ["paid", "partial", "pending"] }, $or: [{ paidAt: { $gte: sixMonthsAgo } }, { createdAt: { $gte: sixMonthsAgo } }] } },
      {
        $group: {
          _id: {
            year:   { $year:  { $ifNull: ["$paidAt", "$createdAt"] } },
            month:  { $month: { $ifNull: ["$paidAt", "$createdAt"] } },
            status: "$status",
          },
          totalPaid:    { $sum: "$paidAmount" },
          totalPending: { $sum: { $subtract: ["$totalFee", "$paidAmount"] } },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
  ]);

  // Build an ordered map for the 6 months
  const trendMap = {};
  for (let i = 5; i >= 0; i--) {
    const d2 = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d2.getFullYear()}-${d2.getMonth() + 1}`;
    trendMap[key] = { month: MONTH_NAMES[d2.getMonth()], collected: 0, pending: 0 };
  }
  for (const r of trendAgg) {
    const key = `${r._id.year}-${r._id.month}`;
    if (trendMap[key]) {
      if (r._id.status === "paid")    trendMap[key].collected += r.total;
      if (r._id.status === "pending") trendMap[key].pending   += r.total;
    }
  }
  // Add StudentFee data to trend
  for (const r of sfTrendAgg) {
    const key = `${r._id.year}-${r._id.month}`;
    if (trendMap[key]) {
      if (r._id.status === "paid")                     trendMap[key].collected += r.totalPaid;
      if (r._id.status === "partial")                   trendMap[key].collected += r.totalPaid;
      if (r._id.status === "pending" || r._id.status === "partial") trendMap[key].pending += r.totalPending;
    }
  }
  // Add pending enrollment fees (no Payment doc yet) into the current month's pending bucket
  const currKey = `${now.getFullYear()}-${now.getMonth() + 1}`;
  if (trendMap[currKey]) trendMap[currKey].pending += pendingFromEnrollments;
  const revenueTrend = Object.values(trendMap);

  /* ── Recent payments (last 10 — paid or pending from Payment + StudentFee) ── */
  const [recentRaw, recentFeeRaw] = await Promise.all([
    Payment.find({ status: { $in: ["paid", "pending"] } })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate({ path: "studentId", populate: { path: "userId", select: "name" } })
      .lean(),
    StudentFee.find({ status: { $in: ["paid", "partial"] }, paidAmount: { $gt: 0 } })
      .sort({ paidAt: -1, updatedAt: -1 })
      .limit(10)
      .populate({ path: "studentId", populate: { path: "userId", select: "name" } })
      .lean(),
  ]);

  // Also grab pending enrollments that have NO payment document at all
  const pendingEnrollsRaw = await Enrollment.find({ status: "pending" })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate({ path: "studentId", populate: { path: "userId", select: "name" } })
    .lean();

  const paymentIds = new Set(recentRaw.map(p => String(p.enrollmentId)));
  const enrollOnlyPending = pendingEnrollsRaw.filter(e => !paymentIds.has(String(e._id)));

  const recentPayments = [
    ...recentRaw.map(p => ({
      student: p.studentId?.userId?.name || "Unknown",
      amount:  p.amount,
      date:    (p.paidAt || p.createdAt)
        ? new Date(p.paidAt || p.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
        : "—",
      method: p.razorpayPaymentId ? "Online" : "Manual",
      status: p.status === "paid" ? "completed" : "pending",
      txnId:  p.razorpayPaymentId || p.invoiceNumber || p.razorpayOrderId || "—",
      _sortDate: new Date(p.paidAt || p.createdAt),
    })),
    // Include admin-set fee payments (StudentFee)
    ...recentFeeRaw.map(f => ({
      student: f.studentId?.userId?.name || "Unknown",
      amount:  f.paidAmount,
      date:    (f.paidAt || f.updatedAt)
        ? new Date(f.paidAt || f.updatedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
        : "—",
      method: f.razorpayPaymentId ? "Online" : "Manual",
      status: f.status === "paid" ? "completed" : "partial",
      txnId:  f.razorpayPaymentId || f.razorpayOrderId || "—",
      _sortDate: new Date(f.paidAt || f.updatedAt),
    })),
    ...enrollOnlyPending.map(e => ({
      student: e.studentId?.userId?.name || "Unknown",
      amount:  e.price || 0,
      date:    e.createdAt
        ? new Date(e.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
        : "—",
      method: "—",
      status: "enrolled (unpaid)",
      txnId:  "—",
      _sortDate: new Date(e.createdAt),
    })),
  ]
    .sort((a, b) => b._sortDate - a._sortDate)
    .slice(0, 10)
    .map(({ _sortDate, ...rest }) => rest);

  return res.status(200).json(
    new ApiResponse(200, {
      totalRevenue,
      monthlyRevenue,
      pendingFees,
      collectionRate,
      avgAttendance,
      revenueTrend,
      recentPayments,
      totalPayments: paidCount + sfPaidCount,
      activeEnrollments,
      totalTeachers,
      totalStudents,
      enrollmentTrend,
      subjectPerformance,
      teacherUtilization,
      avgClassDuration,
      assignmentCompletion,
      totalClassesConducted: await Class.countDocuments(),
    })
  );
});

export const getMonthlyRevenue = asyncHandler(async (req, res) => {
  const [paymentRevenue, feeRevenue] = await Promise.all([
    Payment.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: { year: { $year: "$paidAt" }, month: { $month: "$paidAt" } }, total: { $sum: "$amount" } } },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
    StudentFee.aggregate([
      { $match: { status: { $in: ["paid", "partial"] }, paidAmount: { $gt: 0 } } },
      { $group: { _id: { year: { $year: { $ifNull: ["$paidAt", "$updatedAt"] } }, month: { $month: { $ifNull: ["$paidAt", "$updatedAt"] } } }, total: { $sum: "$paidAmount" } } },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
  ]);

  // Merge both into a single map
  const map = {};
  for (const r of paymentRevenue) {
    const key = `${r._id.year}-${r._id.month}`;
    map[key] = { _id: r._id, total: (map[key]?.total || 0) + r.total };
  }
  for (const r of feeRevenue) {
    const key = `${r._id.year}-${r._id.month}`;
    map[key] = { _id: r._id, total: (map[key]?.total || 0) + r.total };
  }
  const monthlyRevenue = Object.values(map).sort((a, b) =>
    a._id.year !== b._id.year ? a._id.year - b._id.year : a._id.month - b._id.month
  );

  return res.status(200).json(
    new ApiResponse(200, { monthlyRevenue })
  );
});

export const getRevenueByTeacher = asyncHandler(async (req, res) => {
  const revenueByTeacher = await Payment.aggregate([
    { $match: { status: "paid" } },
    {
      $lookup: {
        from: "enrollments",
        localField: "enrollmentId",
        foreignField: "_id",
        as: "enrollment",
      },
    },
    { $unwind: "$enrollment" },
    {
      $group: {
        _id: "$enrollment.tutorId",
        totalRevenue: { $sum: "$amount" },
      },
    },
    {
      $lookup: {
        from: "teachers",
        localField: "_id",
        foreignField: "_id",
        as: "teacher",
      },
    },
    { $unwind: "$teacher" },
    {
      $project: {
        _id: 0,
        teacherId: "$teacher._id",
        totalRevenue: 1,
      },
    },
  ]);

  return res.status(200).json(
    new ApiResponse(200, { revenueByTeacher })
  );
});