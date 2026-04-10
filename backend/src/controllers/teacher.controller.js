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

// ─── GET /api/teacher/list (public — any auth'd user) ────────────────────────
export const getPublicTeachersList = asyncHandler(async (req, res) => {
  const teachers = await Teacher.find({})
    .populate("userId", "name")
    .lean();

  // Fetch featured reviews for all teachers in one query
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

export const getTeacherDashboard = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({ userId: req.user._id });
  if (!teacher) throw new apiError(404, "Teacher not found");

  const user = req.user;

  // Today boundaries
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999);
  const now        = new Date();

  // ── Classes ──────────────────────────────────────────────────────────────────
  const totalClasses = await Class.countDocuments({ tutorId: teacher._id });

  const todayClasses = await Class.find({
    tutorId: teacher._id,
    date: { $gte: todayStart, $lte: todayEnd },
  }).sort({ date: 1 });

  const classesToday = todayClasses.length;

  const classColors = [
    "var(--grad-primary)", "var(--grad-accent)", "var(--grad-rose)",
    "var(--grad-amber)", "var(--grad-sky)",
  ];

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
    color: classColors[i % classColors.length],
  }));

  // ── Students ─────────────────────────────────────────────────────────────────
  // Fetch all enrolled students
  const enrollments = await Enrollment.find({ tutorId: teacher._id, status: { $in: ["active", "approved", "pending"] } })
    .populate({ path: "studentId", populate: { path: "userId", select: "name" } });

  // For each student, calculate attendance % and last assignment score
  const studentsFormatted = (await Promise.all(enrollments.map(async e => {
    const s = e.studentId;
    if (!s) return null;
    const name = s.userId?.name || "Student";
    // Attendance %
    const attRecords = await Attendance.find({ teacherId: teacher._id, studentId: s._id });
    const totalAtt = attRecords.length;
    const presentAtt = attRecords.filter(a => a.status === "present" || a.status === "late").length;
    const attendance = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 0;
    // Last assignment score — only from THIS teacher's assignments
    const teacherAssignmentIds = await Assignment.find({ teacherId: teacher._id }).distinct("_id");
    const lastSubmission = teacherAssignmentIds.length > 0
      ? await Submission.findOne({ studentId: s._id, assignmentId: { $in: teacherAssignmentIds }, status: "graded" })
          .sort({ createdAt: -1 })
      : null;
    let lastScore = "—";
    if (lastSubmission && typeof lastSubmission.grade === "number" && lastSubmission.grade > 0) {
      let maxScore = 10;
      if (lastSubmission.assignmentId) {
        const assignment = await Assignment.findById(lastSubmission.assignmentId).select("maxPoints");
        if (assignment && typeof assignment.maxPoints === "number") {
          maxScore = assignment.maxPoints;
        }
      }
      lastScore = `${lastSubmission.grade}/${maxScore}`;
    }

    // HW status — check if student has any pending submissions for this teacher's assignments
    let homeworkStatus = "—";
    if (teacherAssignmentIds.length > 0) {
      const pendingCount = await Submission.countDocuments({
        studentId: s._id,
        assignmentId: { $in: teacherAssignmentIds },
        status: "submitted",
      });
      const totalAssigned = await Assignment.countDocuments({
        teacherId: teacher._id,
        $or: [{ studentIds: s._id }, { studentIds: { $size: 0 } }, { studentIds: { $exists: false } }],
      });
      if (totalAssigned === 0) {
        homeworkStatus = "—";
      } else if (pendingCount > 0) {
        homeworkStatus = "pending";
      } else {
        homeworkStatus = "done";
      }
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
      attendance,
      lastScore,
      status: e.status || "active",
      homeworkStatus,
      remarks: "",
    };
  }))).filter(Boolean);

  const totalStudents = studentsFormatted.length;

  // ── Assignments ───────────────────────────────────────────────────────────────
  const totalAssignments = await Assignment.countDocuments({ teacherId: teacher._id });

  const assignmentDocs = await Assignment.find({ teacherId: teacher._id })
    .populate("classId", "subject")
    .sort({ dueDate: 1 })
    .limit(10);

  const assignmentsFormatted = await Promise.all(
    assignmentDocs.map(async (a) => {
      const submittedCount = await Submission.countDocuments({ assignmentId: a._id });
      return {
        id: a._id,
        class: a.classId?.subject || "All Students",
        title: a.title || a.description || "Assignment",
        due: a.dueDate
          ? new Date(a.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
          : "",
        submitted: submittedCount,
        total: a.studentIds?.length || 0,
        maxScore: a.maxPoints || 10,
        fileUrl: a.attachmentUrl || null,
      };
    })
  );

  // ── Pending evaluations ───────────────────────────────────────────────────────
  const pendingEval = await Submission.countDocuments({
    assignmentId: { $in: assignmentDocs.map(a => a._id) },
    status: "submitted",
  });

  // ── Graded submissions ────────────────────────────────────────────────────────
  const gradedSubmissions = await Submission.countDocuments({
    assignmentId: { $in: assignmentDocs.map(a => a._id) },
    status: "graded",
  });

  // ── Upcoming classes (next 5) ─────────────────────────────────────────────────
  const upcomingClassDocs = await Class.find({
    tutorId: teacher._id,
    date: { $gte: now },
  })
    .sort({ date: 1 })
    .limit(5)
    .select("subject topic date timeSlot status meetingLink studentIds");

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
    color: classColors[i % classColors.length],
  }));

  // ── Recent activity (last 5 submissions/classes) ──────────────────────────────
  const recentSubmissions = await Submission.find({
    assignmentId: { $in: assignmentDocs.map(a => a._id) },
  })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate("studentId", "studentId");

  const recentActivity = recentSubmissions.map(s => ({
    action: "Assignment submitted",
    detail: `Student submitted`,
    time: s.createdAt
      ? new Date(s.createdAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })
      : "",
    icon: "📝",
  }));

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        name: user.name,
        subject: teacher.subjects?.[0] || "",
        employeeId: teacher.teacherId,
        totalClasses,
        totalStudents,
        classesToday,
        pendingEval,
        avgRating: teacher.rating || 0,
        totalAssignments,
        gradedSubmissions,
        upcomingClasses,
        classes: classesFormatted,
        students: studentsFormatted,
        assignments: assignmentsFormatted,
        recentActivity,
      },
      "Teacher dashboard fetched successfully"
    )
  );
});

// ─── GET /api/teacher/assignments ───────────────────────────────────────────
export const getTeacherAssignments = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({ userId: req.user._id });
  if (!teacher) throw new apiError(404, "Teacher not found");

  const assignmentDocs = await Assignment.find({ teacherId: teacher._id })
    .sort({ dueDate: -1 });

  const list = await Promise.all(
    assignmentDocs.map(async (a) => {
      const submissions = await Submission.find({ assignmentId: a._id })
        .populate("studentId", "studentId")
        .populate({ path: "studentId", populate: { path: "userId", select: "name" } })
        .sort({ createdAt: -1 });

      return {
        id: a._id,
        title: a.title || a.description || "Assignment",
        description: a.description || "",
        due: a.dueDate
          ? new Date(a.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
          : "",
        dueRaw: a.dueDate,
        total: a.studentIds?.length || 0,
        submitted: submissions.length,
        maxScore: a.maxPoints || 10,
        fileUrl: a.attachmentUrl || null,
        priority: a.priority || "medium",
        submissions: submissions.map(s => ({
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
        })),
      };
    })
  );

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
    .sort({ date: -1 });

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

  // Create a notification for the student so they see it in Teacher Updates
  const studentDoc = await Student.findById(studentId).populate("userId", "name");
  if (studentDoc?.userId) {
    const teacherUser = await User.findById(teacher.userId).select("name");
    const teacherName = teacherUser?.name || "Your teacher";
    let msg = `${teacherName} added a remark`;
    if (doc.score != null) msg += ` · Score: ${doc.score}%`;
    if (doc.note) msg += `${doc.score != null ? '' : ':'} ${doc.note}`;
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
    .sort({ createdAt: -1 });

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
    .sort({ createdAt: -1 });

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

  // Validate each entry: { day: String, slots: [{ start, end }] }
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