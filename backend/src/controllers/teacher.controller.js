import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import Teacher from "../models/Teacher.model.js";
import Class from "../models/Class.model.js";
import Assignment from "../models/assignment.model.js";
import Submission from "../models/submission.model.js";
import Enrollment from "../models/Enrollment.model.js";
import Student from "../models/Student.model.js";
import User from "../models/User.model.js";
import Attendance from "../models/Attendance.model.js";
import Topic from "../models/Topic.model.js";
import PerformanceNote from "../models/PerformanceNote.model.js";
import Feedback from "../models/Feedback.model.js";
import Notification from "../models/Notification.model.js";

const CLASS_COLORS = [
  "var(--grad-primary)", "var(--grad-accent)", "var(--grad-rose)",
  "var(--grad-amber)", "var(--grad-sky)",
];

// ─── GET /api/teacher/list (public — any auth'd user) ────────────────────────
export const getPublicTeachersList = asyncHandler(async (req, res) => {
  const teachers = await Teacher.find({})
    .populate("userId", "name")
    .lean();

  // Fetch featured reviews for all teachers in a single query
  const teacherIds = teachers.map(t => t._id);
  const featuredFeedbacks = await Feedback.find({
    teacherId: { $in: teacherIds },
    featured: true,
    text: { $ne: "" },
  })
    .populate({ path: "studentId", populate: { path: "userId", select: "name" } })
    .lean();

  // Group by teacherId
  const reviewsByTeacher = {};
  for (const fb of featuredFeedbacks) {
    const tid = String(fb.teacherId);
    if (!reviewsByTeacher[tid]) reviewsByTeacher[tid] = [];
    if (reviewsByTeacher[tid].length < 2) {
      reviewsByTeacher[tid].push({
        id: fb._id,
        rating: fb.rating,
        text: fb.text,
        studentName: fb.studentId?.userId?.name || "Student",
      });
    }
  }

  const avatarGrads = [
    "linear-gradient(135deg,#7c5cfc,#c084fc)",
    "linear-gradient(135deg,#0EA5E9,#38BDF8)",
    "linear-gradient(135deg,#22C55E,#86EFAC)",
    "linear-gradient(135deg,#F97316,#FBBF24)",
    "linear-gradient(135deg,#EC4899,#F9A8D4)",
  ];

  const list = teachers.map((t, idx) => ({
    id: t._id,
    name: t.userId?.name || "Teacher",
    subject: t.subjects?.[0] || "",
    subjects: t.subjects || [],
    speciality: (t.subjects || []).join(" · ") || t.subjects?.[0] || "",
    experience: t.experience ? `${t.experience} years` : "",
    experienceYears: t.experience || 0,
    rating: t.rating || 0,
    totalStudents: t.totalStudents || 0,
    totalReviews: t.totalReviews || 0,
    bio: t.bio || "",
    about: t.bio || "",
    badge: t.badge || "New",
    badgeCls: t.badge === "Top Rated" ? "bd-success" : t.badge === "Expert" ? "bd-primary" : "bd-muted",
    avatar: (t.userId?.name || "T").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase(),
    avatarGrad: avatarGrads[idx % avatarGrads.length],
    topics: t.subjects || [],
    availability: t.availability || [],
    languages: t.languages || [],
    grades: t.grades || "",
    color: "var(--grad-primary)",
    featuredReviews: reviewsByTeacher[String(t._id)] || [],
    plans: t.plans || [],
  }));

  return res.status(200).json(
    new ApiResponse(200, list, "Teachers fetched successfully")
  );
});

// ─── GET /api/teacher/dashboard ──────────────────────────────────────────────
export const getTeacherDashboard = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({ userId: req.user._id });
  if (!teacher) throw new apiError(404, "Teacher not found");

  const user = req.user;
  const now = new Date();
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999);

  // ── Parallel query block 1: counts + today's classes + enrollments + assignments ──
  const [
    totalClasses,
    todayClasses,
    enrollments,
    totalAssignments,
    assignmentDocs,
    upcomingClassDocs,
  ] = await Promise.all([
    Class.countDocuments({ tutorId: teacher._id }),
    Class.find({ tutorId: teacher._id, date: { $gte: todayStart, $lte: todayEnd } })
      .sort({ date: 1 }).lean(),
    Enrollment.find({ tutorId: teacher._id, status: { $in: ["active", "approved", "pending"] } })
      .populate({ path: "studentId", populate: { path: "userId", select: "name" } }).lean(),
    Assignment.countDocuments({ teacherId: teacher._id }),
    Assignment.find({ teacherId: teacher._id })
      .populate("classId", "subject")
      .sort({ dueDate: 1 })
      .limit(10)
      .lean(),
    Class.find({ tutorId: teacher._id, date: { $gte: now } })
      .sort({ date: 1 })
      .limit(5)
      .select("subject topic date timeSlot status meetingLink studentIds")
      .lean(),
  ]);

  // ── Format today's classes ──
  const classesFormatted = todayClasses.map((c, i) => ({
    id: c._id,
    name: c.subject,
    topic: c.topic || "",
    students: c.studentIds?.length || 0,
    time: c.timeSlot?.start
      ? new Date(c.timeSlot.start).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
      : (c.date ? new Date(c.date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : ""),
    status: c.status,
    zoomLink: c.meetingLink || "#",
    color: CLASS_COLORS[i % CLASS_COLORS.length],
  }));

  // ── Enrolled student IDs ──
  const studentIds = enrollments.map(e => e.studentId?._id).filter(Boolean);

  // ── Parallel query block 2: batch attendance + batch submissions + batch assignment counts ──
  const teacherAssignmentIds = assignmentDocs.map(a => a._id);

  const [attAgg, submissionsByStudent, pendingEval, gradedSubmissions, recentSubmissions] =
    await Promise.all([
      // Batch attendance aggregation for all enrolled students at once
      Attendance.aggregate([
        { $match: { teacherId: teacher._id, studentId: { $in: studentIds } } },
        {
          $group: {
            _id: "$studentId",
            total: { $sum: 1 },
            attended: { $sum: { $cond: [{ $in: ["$status", ["present", "late"]] }, 1, 0] } },
          },
        },
      ]),
      // Batch: last graded submission per student for this teacher's assignments
      Submission.aggregate([
        { $match: { assignmentId: { $in: teacherAssignmentIds }, status: "graded", grade: { $gt: 0 } } },
        { $sort: { createdAt: -1 } },
        { $group: { _id: "$studentId", grade: { $first: "$grade" }, assignmentId: { $first: "$assignmentId" } } },
      ]),
      // Pending evaluations
      Submission.countDocuments({ assignmentId: { $in: teacherAssignmentIds }, status: "submitted" }),
      // Graded
      Submission.countDocuments({ assignmentId: { $in: teacherAssignmentIds }, status: "graded" }),
      // Recent activity
      Submission.find({ assignmentId: { $in: teacherAssignmentIds } })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("studentId", "studentId")
        .lean(),
    ]);

  // Build lookup maps for O(1) access
  const attMap = {};
  attAgg.forEach(a => {
    attMap[a._id.toString()] = {
      total: a.total,
      attended: a.attended,
      pct: a.total > 0 ? Math.round((a.attended / a.total) * 100) : 0,
    };
  });

  const lastScoreMap = {};
  for (const s of submissionsByStudent) {
    const asgn = assignmentDocs.find(a => a._id.toString() === s.assignmentId?.toString());
    const maxPoints = asgn?.maxPoints || 10;
    lastScoreMap[s._id.toString()] = `${s.grade}/${maxPoints}`;
  }

  // ── Batch: homework status (pending submitted count per student) ──
  const hwAgg = teacherAssignmentIds.length > 0
    ? await Submission.aggregate([
        { $match: { assignmentId: { $in: teacherAssignmentIds }, status: "submitted" } },
        { $group: { _id: "$studentId", count: { $sum: 1 } } },
      ])
    : [];
  const hwMap = {};
  hwAgg.forEach(h => { hwMap[h._id.toString()] = h.count; });

  // ── Format students using lookup maps (no N+1!) ──
  const studentsFormatted = enrollments
    .filter(e => e.studentId)
    .map(e => {
      const s = e.studentId;
      const sid = s._id.toString();
      const name = s.userId?.name || "Student";
      const att = attMap[sid];
      const lastScore = lastScoreMap[sid] || "—";

      let homeworkStatus = "—";
      if (teacherAssignmentIds.length > 0) {
        homeworkStatus = (hwMap[sid] || 0) > 0 ? "pending" : "done";
      }

      return {
        id: s._id,
        enrollmentId: e._id,
        name,
        avatar: name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase(),
        grade: e.grade || s.grade || "—",
        board: e.board || "—",
        school: e.school || "—",
        subjectsEnrolled: e.subjectsEnrolled || [],
        parentName: e.parentName || s.parentName || "—",
        parentPhone: e.parentPhone || s.parentPhone || "—",
        preferredDays: e.preferredDays || [],
        attendance: att?.pct ?? 0,
        lastScore,
        status: e.status || "active",
        homeworkStatus,
        remarks: "",
      };
    });

  // ── Format assignments ──
  const submissionCountAgg = teacherAssignmentIds.length > 0
    ? await Submission.aggregate([
        { $match: { assignmentId: { $in: teacherAssignmentIds } } },
        { $group: { _id: "$assignmentId", count: { $sum: 1 } } },
      ])
    : [];
  const subCountMap = {};
  submissionCountAgg.forEach(s => { subCountMap[s._id.toString()] = s.count; });

  const assignmentsFormatted = assignmentDocs.map(a => ({
    id: a._id,
    class: a.classId?.subject || "All Students",
    title: a.title || a.description || "Assignment",
    due: a.dueDate
      ? new Date(a.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
      : "",
    submitted: subCountMap[a._id.toString()] || 0,
    total: a.studentIds?.length || 0,
    maxScore: a.maxPoints || 10,
    fileUrl: a.attachmentUrl || null,
  }));

  // ── Upcoming classes ──
  const upcomingClasses = upcomingClassDocs.map((c, i) => ({
    id: c._id,
    name: c.subject,
    subject: c.subject,
    topic: c.topic || "",
    students: c.studentIds?.length || 0,
    time: c.date
      ? new Date(c.date).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
      : "",
    status: c.status,
    zoomLink: c.meetingLink || "#",
    color: CLASS_COLORS[i % CLASS_COLORS.length],
  }));

  // ── Recent activity ──
  const recentActivity = recentSubmissions.map(s => ({
    action: "Assignment submitted",
    detail: "Student submitted",
    time: s.createdAt
      ? new Date(s.createdAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })
      : "",
    icon: "📝",
  }));

  return res.status(200).json(
    new ApiResponse(200, {
      name: user.name,
      subject: teacher.subjects?.[0] || "",
      employeeId: teacher.teacherId,
      totalClasses,
      totalStudents: studentsFormatted.length,
      classesToday: todayClasses.length,
      pendingEval,
      avgRating: teacher.rating || 0,
      totalAssignments,
      gradedSubmissions,
      upcomingClasses,
      classes: classesFormatted,
      students: studentsFormatted,
      assignments: assignmentsFormatted,
      recentActivity,
    }, "Teacher dashboard fetched successfully")
  );
});

// ─── GET /api/teacher/assignments ───────────────────────────────────────────
export const getTeacherAssignments = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({ userId: req.user._id });
  if (!teacher) throw new apiError(404, "Teacher not found");

  const assignmentDocs = await Assignment.find({ teacherId: teacher._id })
    .sort({ dueDate: -1 })
    .lean();

  // Batch fetch all submissions for these assignments
  const assignmentIds = assignmentDocs.map(a => a._id);
  const allSubmissions = await Submission.find({ assignmentId: { $in: assignmentIds } })
    .populate({ path: "studentId", populate: { path: "userId", select: "name" } })
    .sort({ createdAt: -1 })
    .lean();

  // Group submissions by assignment
  const subsByAssignment = {};
  for (const s of allSubmissions) {
    const aid = s.assignmentId.toString();
    if (!subsByAssignment[aid]) subsByAssignment[aid] = [];
    subsByAssignment[aid].push({
      id: s._id,
      studentName: s.studentId?.userId?.name || "Student",
      studentRollNo: s.studentId?.studentId || "",
      fileUrl: s.fileUrl || "",
      note: s.note || "",
      status: s.status,
      grade: s.grade ?? null,
      teacherRemark: s.teacherRemark || "",
      submittedAt: s.createdAt
        ? new Date(s.createdAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })
        : "",
    });
  }

  const list = assignmentDocs.map(a => {
    const subs = subsByAssignment[a._id.toString()] || [];
    return {
      id: a._id,
      title: a.title || a.description || "Assignment",
      description: a.description || "",
      due: a.dueDate
        ? new Date(a.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
        : "",
      dueRaw: a.dueDate,
      total: a.studentIds?.length || 0,
      submitted: subs.length,
      maxScore: a.maxPoints || 10,
      fileUrl: a.attachmentUrl || null,
      priority: a.priority || "medium",
      submissions: subs,
    };
  });

  return res.status(200).json(new ApiResponse(200, list, "Assignments fetched"));
});

// ─── GET /api/teacher/plans ──────────────────────────────────────────────────
export const getMyPlans = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({ userId: req.user._id }).select("plans subjects");
  if (!teacher) throw new apiError(404, "Teacher not found");
  return res.status(200).json(new ApiResponse(200, { plans: teacher.plans ?? [], subjects: teacher.subjects ?? [] }, "Plans fetched"));
});

// ─── Topics Covered ──────────────────────────────────────────────────────────

export const addTopic = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({ userId: req.user._id });
  if (!teacher) throw new apiError(404, "Teacher not found");

  const { studentId, topic, date, notes } = req.body;
  if (!studentId || !topic?.trim()) throw new apiError(400, "Student and topic are required");

  const doc = await Topic.create({
    teacherId: teacher._id,
    studentId,
    topic: topic.trim(),
    date: date || Date.now(),
    notes: notes?.trim() || "",
  });

  return res.status(201).json(new ApiResponse(201, doc, "Topic added"));
});

export const getTopics = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({ userId: req.user._id });
  if (!teacher) throw new apiError(404, "Teacher not found");

  const topics = await Topic.find({ teacherId: teacher._id })
    .populate({ path: "studentId", populate: { path: "userId", select: "name" } })
    .sort({ date: -1 })
    .lean();

  const list = topics.map(t => ({
    id: t._id,
    studentId: t.studentId?._id,
    studentName: t.studentId?.userId?.name || "Student",
    topic: t.topic,
    date: t.date ? new Date(t.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "",
    notes: t.notes,
  }));

  return res.status(200).json(new ApiResponse(200, list, "Topics fetched"));
});

export const deleteTopic = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({ userId: req.user._id });
  if (!teacher) throw new apiError(404, "Teacher not found");

  const topic = await Topic.findOneAndDelete({ _id: req.params.id, teacherId: teacher._id });
  if (!topic) throw new apiError(404, "Topic not found");

  return res.status(200).json(new ApiResponse(200, null, "Topic deleted"));
});

// ─── Performance Notes ───────────────────────────────────────────────────────

export const addPerformanceNote = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({ userId: req.user._id });
  if (!teacher) throw new apiError(404, "Teacher not found");

  const { studentId, score, note } = req.body;
  if (!studentId) throw new apiError(400, "Student is required");
  if (!note?.trim() && (score === undefined || score === null || score === "")) throw new apiError(400, "Score or note is required");

  const doc = await PerformanceNote.create({
    teacherId: teacher._id,
    studentId,
    score: score !== "" && score !== undefined && score !== null ? Number(score) : null,
    note: note?.trim() || "",
  });

  // Create a notification for the student
  const [studentDoc, teacherUser] = await Promise.all([
    Student.findById(studentId).populate("userId", "name"),
    User.findById(teacher.userId).select("name"),
  ]);

  if (studentDoc?.userId) {
    const teacherName = teacherUser?.name || "Your teacher";
    let msg = `${teacherName} added a remark`;
    if (doc.score != null) msg += ` · Score: ${doc.score}%`;
    if (doc.note) msg += `${doc.score != null ? "" : ":"} ${doc.note}`;
    await Notification.create({
      userId: studentDoc.userId._id,
      title: `📝 New remark from ${teacherName}`,
      message: msg.trim(),
      type: "remark",
    });
  }

  return res.status(201).json(new ApiResponse(201, doc, "Performance note added"));
});

export const getPerformanceNotes = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({ userId: req.user._id });
  if (!teacher) throw new apiError(404, "Teacher not found");

  const notes = await PerformanceNote.find({ teacherId: teacher._id })
    .populate({ path: "studentId", populate: { path: "userId", select: "name" } })
    .sort({ createdAt: -1 })
    .lean();

  const list = notes.map(n => ({
    id: n._id,
    studentId: n.studentId?._id,
    studentName: n.studentId?.userId?.name || "Student",
    score: n.score,
    note: n.note,
    date: n.createdAt ? new Date(n.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "",
  }));

  return res.status(200).json(new ApiResponse(200, list, "Notes fetched"));
});

export const deletePerformanceNote = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({ userId: req.user._id });
  if (!teacher) throw new apiError(404, "Teacher not found");

  const note = await PerformanceNote.findOneAndDelete({ _id: req.params.id, teacherId: teacher._id });
  if (!note) throw new apiError(404, "Note not found");

  return res.status(200).json(new ApiResponse(200, null, "Note deleted"));
});

// ─── GET /api/teacher/feedback ───────────────────────────────────────────────
export const getTeacherFeedback = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({ userId: req.user._id });
  if (!teacher) throw new apiError(404, "Teacher not found");

  const feedbacks = await Feedback.find({ teacherId: teacher._id })
    .populate({ path: "studentId", populate: { path: "userId", select: "name" } })
    .sort({ createdAt: -1 })
    .lean();

  const list = feedbacks.map(f => ({
    id: f._id,
    studentName: f.studentId?.userId?.name || "Student",
    rating: f.rating,
    text: f.text,
    date: f.createdAt
      ? new Date(f.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
      : "",
  }));

  const avgRating = list.length > 0
    ? +(list.reduce((s, f) => s + f.rating, 0) / list.length).toFixed(1)
    : 0;

  return res.status(200).json(
    new ApiResponse(200, { feedbacks: list, avgRating, totalReviews: list.length }, "Feedback fetched")
  );
});

// ─── GET /api/teacher/availability ───────────────────────────────────────────
export const getAvailability = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({ userId: req.user._id });
  if (!teacher) throw new apiError(404, "Teacher not found");

  return res.status(200).json(
    new ApiResponse(200, teacher.availability || [], "Availability fetched")
  );
});

// ─── PUT /api/teacher/availability ───────────────────────────────────────────
export const updateAvailability = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({ userId: req.user._id });
  if (!teacher) throw new apiError(404, "Teacher not found");

  const { availability } = req.body;
  if (!Array.isArray(availability)) throw new apiError(400, "availability must be an array");

  const validDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  for (const entry of availability) {
    if (!validDays.includes(entry.day)) throw new apiError(400, `Invalid day: ${entry.day}`);
    if (!Array.isArray(entry.slots)) throw new apiError(400, "slots must be an array");
    for (const slot of entry.slots) {
      if (!slot.start || !slot.end) throw new apiError(400, "Each slot needs start and end times");
    }
  }

  teacher.availability = availability;
  await teacher.save();

  return res.status(200).json(
    new ApiResponse(200, teacher.availability, "Availability updated")
  );
});