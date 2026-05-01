import Assignment from "../models/assignment.model.js";
import Attendance from "../models/Attendance.model.js";
import Student from "../models/Student.model.js";
import Submission from "../models/submission.model.js";
import Class from "../models/Class.model.js";
import Demo from "../models/Demo.model.js";
import Enrollment from "../models/Enrollment.model.js";
import Teacher from "../models/Teacher.model.js";
import WeeklySchedule from "../models/WeeklySchedule.model.js";
import Payment from "../models/Payment.model.js";
import User from "../models/User.model.js";
import Topic from "../models/Topic.model.js";
import PerformanceNote from "../models/PerformanceNote.model.js";
import Feedback from "../models/Feedback.model.js";
import PlatformReview from "../models/PlatformReview.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { sendAssignmentSubmissionEmail } from "../utils/sendEmail.js";

// ─── GET /api/student/dashboard ──────────────────────────────────────────────
export const getStudentDashboard = asyncHandler(async (req, res) => {
  // Lazily create the Student record if it doesn't exist yet
  let student = await Student.findOne({ userId: req.user._id });
  if (!student) {
    student = await Student.create({
      userId: req.user._id,
      studentId: `STU-${req.user._id}`,
    });
  }

  const user = req.user; // already attached by requireAuth middleware

  // ── Fetch dashboard sources in parallel (reduces endpoint latency) ─────────
  const [
    attendanceRecordsRaw,
    enrollmentsForSubject,
    enrolledForScheduleRaw,
    demoClasses,
    topicDocs,
    assignments,
    submissions,
    perfNoteDocs,
  ] = await Promise.all([
    Attendance.find({ studentId: student._id })
      .populate("classId", "subject topic date")
      .sort({ date: -1 })
      .lean(),
    Enrollment.find({
      studentId: student._id,
      status: { $in: ["active", "pending", "approved"] },
    }).populate("tutorId", "subjects").lean(),
    Enrollment.find({ studentId: student._id, status: { $in: ["active", "pending"] } })
      .populate({ path: "tutorId", populate: { path: "userId", select: "name" } }),
    Demo.find({ studentId: student._id, status: "confirmed" })
      .populate({ path: "tutorId", populate: { path: "userId", select: "name" } })
      .sort({ scheduledAt: 1 })
      .lean(),
    Topic.find({ studentId: student._id })
      .populate({ path: "teacherId", populate: { path: "userId", select: "name" } })
      .sort({ date: -1 })
      .limit(20),
    Assignment.find({ studentIds: student._id })
      .populate("classId", "subject")
      .sort({ dueDate: 1 })
      .lean(),
    Submission.find({ studentId: student._id }).lean(),
    PerformanceNote.find({ studentId: student._id })
      .populate({ path: "teacherId", populate: { path: "userId", select: "name" } })
      .sort({ createdAt: -1 })
      .limit(10),
  ]);

  const totalAttendance = attendanceRecordsRaw.length;
  const presentCount = attendanceRecordsRaw.filter(a => a.status === "present").length;
  const lateCount = attendanceRecordsRaw.filter(a => a.status === "late").length;
  const attendancePercentage =
    totalAttendance > 0
      ? Number((((presentCount + lateCount) / totalAttendance) * 100).toFixed(1))
      : 0;

  // Build a teacherId -> subject(s) lookup
  const teacherSubjectMap = {};
  enrollmentsForSubject.forEach(e => {
    const tid = e.tutorId?._id?.toString?.() || e.tutorId?.toString?.();
    if (tid) {
      const subjects = e.subjectsEnrolled?.length
        ? e.subjectsEnrolled
        : e.tutorId?.subjects?.length
          ? e.tutorId.subjects
          : [e.planName || "General"];
      teacherSubjectMap[tid] = subjects;
    }
  });

  const subjectMap = {};
  attendanceRecordsRaw.forEach(a => {
    let subject = a.classId?.subject;
    if (!subject) {
      const tid = a.teacherId?.toString?.();
      const subjects = teacherSubjectMap[tid];
      subject = subjects?.length ? subjects.join(", ") : "General";
    }
    if (!subjectMap[subject]) subjectMap[subject] = { total: 0, attended: 0 };
    subjectMap[subject].total += 1;
    if (a.status === "present" || a.status === "late") subjectMap[subject].attended += 1;
  });
  const attendanceRecords = Object.entries(subjectMap).map(([subject, v]) => ({
    subject,
    total: v.total,
    attended: v.attended,
    pct: v.total > 0 ? Math.round((v.attended / v.total) * 100) : 0,
  }));

  // ── Classes ─────────────────────────────────────────────────────────────────
  // Get tutor IDs from enrollments (active + pending) so we don't miss classes
  // created before a student's payment was confirmed
  const enrolledTutorIds = enrollmentsForSubject.map(e => e.tutorId?._id || e.tutorId).filter(Boolean);

  const allClasses = await Class.find({
    $or: [
      { studentIds: student._id },
      { tutorId: { $in: enrolledTutorIds } },
    ],
  })
    .populate("tutorId", "userId subjects")
    .sort({ date: -1 })
    .lean();

  const totalClasses = totalAttendance; // each attendance record = one class held for this student
  const classesAttended = presentCount + lateCount;

  const now = new Date();
  const upcomingRegular = allClasses
    .filter(c => c.date >= now || c.status === "live")
    .slice(0, 5)
    .map(c => ({
      id: c._id,
      subject: c.subject,
      topic: c.topic,
      time: c.date ? new Date(c.date).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "",
      zoomLink: c.meetingLink || "#",
      meetingId: c.meetingId || "",
      password: c.classPassword || "",
      duration: c.timeSlot?.end && c.timeSlot?.start
        ? `${Math.round((new Date(c.timeSlot.end) - new Date(c.timeSlot.start)) / 60000)} min`
        : "",
      status: c.status,
      isDemo: false,
    }));

  const upcomingDemos = demoClasses
    .filter(d => d.scheduledAt && new Date(d.scheduledAt) >= new Date(Date.now() - 2 * 60 * 60 * 1000)) // past 2h grace
    .map(d => {
      const t = d.tutorId;
      const isLiveNow = d.scheduledAt && Math.abs(new Date(d.scheduledAt) - now) < 30 * 60 * 1000; // ±30 min
      return {
        id: d._id,
        subject: t?.subjects?.[0] || "Free Demo",
        topic: `Free Demo with ${t?.userId?.name || "Tutor"}`,
        time: d.scheduledAt ? new Date(d.scheduledAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "TBD",
        teacher: t?.userId?.name || "Tutor",
        zoomLink: d.zoomLink || "#",
        meetingId: "",
        password: "",
        duration: "30 min",
        status: isLiveNow ? "live" : "scheduled",
        isDemo: true,
      };
    });

  const upcomingClasses = [...upcomingRegular, ...upcomingDemos]
    .sort((a, b) => {
      // live first, then by time
      if (a.status === "live" && b.status !== "live") return -1;
      if (b.status === "live" && a.status !== "live") return 1;
      return 0;
    });

  // Weekly recurring schedule from teacher-set slots
  const DAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const enrolledForSchedule = enrolledForScheduleRaw.filter(e => e.tutorId);

  const tutorNameMap = {};
  enrolledForSchedule.forEach(e => {
    if (e.tutorId?._id) tutorNameMap[e.tutorId._id.toString()] = e.tutorId?.userId?.name || "Tutor";
  });

  const weeklySlots = await WeeklySchedule.find({
    tutorId: { $in: enrolledForSchedule.map(e => e.tutorId._id) },
  }).lean();

  weeklySlots.sort(
    (a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day) || a.startTime.localeCompare(b.startTime)
  );

  const scheduleMap = {};
  weeklySlots.forEach(s => {
    if (!scheduleMap[s.day]) scheduleMap[s.day] = [];
    scheduleMap[s.day].push({
      subject: s.subject,
      time: s.endTime ? `${s.startTime}–${s.endTime}` : s.startTime,
      teacher: tutorNameMap[s.tutorId.toString()] || "Tutor",
      meetingLink: s.meetingLink || "",
      notes: s.notes || "",
    });
  });

  // Also fold one-off class dates into the schedule view
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  allClasses
    .filter(c => c.date && c.status !== "completed")
    .forEach(c => {
      const day = days[new Date(c.date).getDay()];
      // Don't duplicate — skip if a weekly slot already covers same day+subject
      const alreadyCovered = (scheduleMap[day] || []).some(sl => sl.subject === c.subject);
      if (!alreadyCovered) {
        if (!scheduleMap[day]) scheduleMap[day] = [];
        scheduleMap[day].push({
          subject: c.subject,
          time: c.timeSlot?.start
            ? new Date(c.timeSlot.start).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
            : "",
          teacher: "",
          meetingLink: c.meetingLink || "",
          notes: "",
        });
      }
    });

  const schedule = DAY_ORDER
    .filter(d => scheduleMap[d])
    .map(day => ({ day, slots: scheduleMap[day] }));

  // Topics covered — from Topic model (already fetched above)
  const topicsCovered = topicDocs.map(t => ({
    subject: t.topic,
    topic: t.topic,
    date: t.date ? new Date(t.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "",
    teacher: t.teacherId?.userId?.name || "Teacher",
    notes: t.notes || "",
  }));

  // ── Assignments ──────────────────────────────────────────────────────────────
  const submissionMap = {};
  submissions.forEach(s => { submissionMap[s.assignmentId.toString()] = s; });

  const assignmentList = assignments.map(a => {
    const sub = submissionMap[a._id.toString()];
    let subject = a.classId?.subject;
    if (!subject) {
      const tid = a.teacherId?.toString?.();
      const subjects = teacherSubjectMap[tid];
      subject = subjects?.length ? subjects.join(", ") : "General";
    }
    return {
      id: a._id,
      subject,
      teacherName: a.teacherId?.userId?.name || "Teacher",
      title: a.title || a.description || "Assignment",
      due: a.dueDate ? new Date(a.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "",
      status: sub ? sub.status : "pending",
      priority: a.priority || "medium",
      points: a.maxPoints || 10,
      grade: sub?.grade ?? null,
      teacherRemark: sub?.teacherRemark || "",
      color: "var(--color-primary)",
    };
  });

  const submittedCount = submissions.length;
  const gradedCount = submissions.filter(s => s.status === "graded").length;
  const pendingAssignments = assignments.length - submittedCount;

  // Teacher remarks — combine graded submission remarks + performance notes
  const submissionRemarks = submissions
    .filter(s => s.status === "graded" && s.teacherRemark)
    .slice(0, 5)
    .map(s => {
      // Try to find the teacher for this assignment
      const assignment = assignments.find(a => a._id.toString() === s.assignmentId?.toString());
      const tid = assignment?.teacherId?.toString();
      let teacherName = "Teacher";
      let subject = "Class";
      if (tid && teacherSubjectMap[tid]) {
        subject = teacherSubjectMap[tid].join(", ");
      }
      return {
        teacher: teacherName,
        subject,
        remark: s.teacherRemark,
        date: s.updatedAt ? new Date(s.updatedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "",
        rating: 4,
      };
    });

  // Performance notes already fetched above
  const perfRemarks = perfNoteDocs
    .filter(n => n.note)
    .map(n => ({
      teacher: n.teacherId?.userId?.name || "Teacher",
      subject: n.score !== null && n.score !== undefined ? `Score: ${n.score}%` : "Note",
      remark: n.note,
      date: n.createdAt ? new Date(n.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "",
      rating: n.score >= 80 ? 5 : n.score >= 60 ? 4 : n.score >= 40 ? 3 : n.score !== null ? 2 : 4,
    }));

  const remarks = [...perfRemarks, ...submissionRemarks];

  // ── Monthly Performance (last 12 months from graded submissions) ──
  const MONTH_NAMES_P = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const monthPerfMap = {};
  for (let i = 11; i >= 0; i--) {
    const md = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${md.getFullYear()}-${md.getMonth()}`;
    monthPerfMap[key] = { month: MONTH_NAMES_P[md.getMonth()], total: 0, count: 0 };
  }

  // assignment lookup map (already fetched above)
  const asgMap = {};
  assignments.forEach(a => {
    const tid = a.teacherId?.toString?.();
    asgMap[a._id.toString()] = {
      maxPoints: a.maxPoints ?? 10,
      subject: a.classId?.subject || (teacherSubjectMap[tid]?.[0] ?? "General"),
    };
  });

  const subjScoreAcc = {};
  submissions
    .filter(s => s.status === "graded" && typeof s.grade === "number" && s.grade >= 0)
    .forEach(s => {
      const asgn = asgMap[s.assignmentId?.toString()];
      if (!asgn) return;
      const pct = asgn.maxPoints > 0 ? (s.grade / asgn.maxPoints) * 100 : 0;
      // Monthly bucket
      const date = new Date(s.updatedAt || s.createdAt);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      if (monthPerfMap[key]) { monthPerfMap[key].total += pct; monthPerfMap[key].count++; }
      // Subject bucket
      const subj = asgn.subject;
      if (!subjScoreAcc[subj]) subjScoreAcc[subj] = { total: 0, count: 0 };
      subjScoreAcc[subj].total += pct; subjScoreAcc[subj].count++;
    });

  // Also include PerformanceNote scores in monthly and subject buckets
  perfNoteDocs
    .filter(n => typeof n.score === "number" && n.score >= 0)
    .forEach(n => {
      const date = new Date(n.createdAt);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      if (monthPerfMap[key]) { monthPerfMap[key].total += n.score; monthPerfMap[key].count++; }
    });

  const performanceMonthly = Object.values(monthPerfMap).map(m => ({
    month: m.month,
    score: m.count > 0 ? Number((m.total / m.count).toFixed(1)) : null,
  }));

  // Supplement subjects with attendance % for subjects that have no graded submissions
  attendanceRecords.forEach(r => {
    if (!subjScoreAcc[r.subject]) subjScoreAcc[r.subject] = { total: r.pct, count: 1 };
  });
  const subjectPerformance = Object.entries(subjScoreAcc)
    .filter(([s]) => s && s !== "General")
    .map(([subject, v]) => ({ subject, score: Number((v.total / v.count).toFixed(1)) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        name: user.name,
        grade: student.grade,
        rollNo: student.studentId,
        attendance: attendancePercentage,
        totalClasses,
        classesAttended,
        pendingAssignments,
        submittedAssignments: submittedCount,
        gradedAssignments: gradedCount,
        upcomingClasses,
        schedule,
        attendanceRecords,
        topicsCovered,
        assignments: assignmentList,
        remarks,
        performanceMonthly,
        subjectPerformance,
        avgScore: (() => {
          const graded = submissions.filter(s => s.status === "graded" && typeof s.grade === "number" && s.grade >= 0);
          if (!graded.length) return 0;
          const total = graded.reduce((sum, s) => {
            const asgn = asgMap[s.assignmentId?.toString()];
            return sum + (asgn?.maxPoints > 0 ? (s.grade / asgn.maxPoints) * 100 : 0);
          }, 0);
          return Number((total / graded.length).toFixed(1));
        })(),
      },
      "Student dashboard fetched successfully"
    )
  );
});

// ─── GET /api/student/classes ─────────────────────────────────────────────────
export const getStudentClasses = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ userId: req.user._id });
  if (!student) throw new apiError(404, "Student not found");

  const classes = await Class.find({ studentIds: student._id })
    .populate("tutorId", "userId subjects")
    .sort({ date: -1 });

  return res.status(200).json(
    new ApiResponse(200, classes, "Classes fetched successfully")
  );
});

// ─── GET /api/student/attendance ─────────────────────────────────────────────
export const getStudentAttendance = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ userId: req.user._id });
  if (!student) throw new apiError(404, "Student not found");

  const records = await Attendance.find({ studentId: student._id })
    .populate("classId", "subject topic date")
    .sort({ date: -1 });

  return res.status(200).json(
    new ApiResponse(200, records, "Attendance fetched successfully")
  );
});

// ─── GET /api/student/assignments ─────────────────────────────────────────────
export const getStudentAssignments = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ userId: req.user._id });
  if (!student) throw new apiError(404, "Student not found");

  const assignments = await Assignment.find({ studentIds: student._id })
    .populate("classId", "subject")
    .sort({ dueDate: 1 });

  const submissions = await Submission.find({ studentId: student._id });
  const submissionMap = {};
  submissions.forEach(s => { submissionMap[s.assignmentId.toString()] = s; });

  const list = assignments.map(a => ({
    ...a.toObject(),
    submission: submissionMap[a._id.toString()] || null,
  }));

  return res.status(200).json(
    new ApiResponse(200, list, "Assignments fetched successfully")
  );
});

// ─── POST /api/student/assignments/:id/submit ─────────────────────────────────
export const submitAssignment = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ userId: req.user._id });
  if (!student) throw new apiError(404, "Student not found");

  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) throw new apiError(404, "Assignment not found");

  const existing = await Submission.findOne({
    assignmentId: assignment._id,
    studentId: student._id,
  });
  if (existing) throw new apiError(400, "Already submitted");

  const isLate = new Date() > new Date(assignment.dueDate);

  const submission = await Submission.create({
    assignmentId: assignment._id,
    studentId: student._id,
    fileUrl: "",
    note: req.body.note || "",
    status: isLate ? "late" : "submitted",
  });

  // Email the file to the teacher (fire-and-forget, non-blocking)
  (async () => {
    try {
      const [teacherDoc, studentDoc] = await Promise.all([
        Teacher.findById(assignment.teacherId).populate("userId", "name email"),
        Student.findById(student._id).populate("userId", "name"),
      ]);
      const teacherEmail = teacherDoc?.userId?.email;
      const teacherName = teacherDoc?.userId?.name || "Teacher";
      const studentName = studentDoc?.userId?.name || "Student";
      if (teacherEmail) {
        await sendAssignmentSubmissionEmail({
          teacherEmail,
          teacherName,
          studentName,
          assignmentTitle: assignment.title,
          note: req.body.note || "",
          isLate,
          fileBuffer: req.file?.buffer,
          fileName: req.file?.originalname,
          fileMime: req.file?.mimetype,
        });
      }
    } catch (emailErr) {
      console.error("Failed to email assignment submission:", emailErr.message);
    }
  })();

  return res.status(201).json(
    new ApiResponse(201, {
      submissionId: submission._id,
      status: submission.status,
      submittedAt: submission.submittedAt,
    }, "Assignment submitted successfully")
  );
});

// ─── GET /api/student/payments/history ───────────────────────────────────────
export const getStudentPayments = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ userId: req.user._id });
  if (!student) throw new apiError(404, "Student not found");

  const payments = await Payment.find({ studentId: student._id })
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, payments, "Payment history fetched successfully")
  );
});

// ─── POST /api/student/feedback ──────────────────────────────────────────────
export const submitFeedback = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ userId: req.user._id });
  if (!student) throw new apiError(404, "Student not found");

  const { teacherId, rating, text } = req.body;
  if (!teacherId) throw new apiError(400, "Teacher is required");
  if (!rating || rating < 1 || rating > 5) throw new apiError(400, "Rating must be 1-5");

  const existing = await Feedback.findOne({ studentId: student._id, teacherId });
  if (existing) {
    existing.rating = rating;
    existing.text = text || "";
    await existing.save();

    // Recalculate teacher aggregate rating
    const allFb = await Feedback.find({ teacherId });
    const avg = allFb.length > 0 ? +(allFb.reduce((s, f) => s + f.rating, 0) / allFb.length).toFixed(1) : 0;
    await Teacher.findByIdAndUpdate(teacherId, { rating: avg, totalReviews: allFb.length });

    return res.status(200).json(new ApiResponse(200, existing, "Feedback updated"));
  }

  const fb = await Feedback.create({
    studentId: student._id,
    teacherId,
    rating,
    text: text || "",
  });

  // Recalculate teacher aggregate rating
  const allFb = await Feedback.find({ teacherId });
  const avg = allFb.length > 0 ? +(allFb.reduce((s, f) => s + f.rating, 0) / allFb.length).toFixed(1) : 0;
  await Teacher.findByIdAndUpdate(teacherId, { rating: avg, totalReviews: allFb.length });

  return res.status(201).json(new ApiResponse(201, fb, "Feedback submitted"));
});

// ─── GET /api/student/feedback ───────────────────────────────────────────────
export const getMyFeedback = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ userId: req.user._id });
  if (!student) throw new apiError(404, "Student not found");

  const feedbacks = await Feedback.find({ studentId: student._id })
    .populate({ path: "teacherId", populate: { path: "userId", select: "name" } })
    .sort({ createdAt: -1 });

  const list = feedbacks.map(f => ({
    id: f._id,
    teacherId: f.teacherId?._id,
    teacherName: f.teacherId?.userId?.name || "Teacher",
    rating: f.rating,
    text: f.text,
    date: f.createdAt ? new Date(f.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "",
  }));

  return res.status(200).json(new ApiResponse(200, list, "Feedback fetched"));
});

// ─── POST /api/student/platform-review ────────────────────────────────────────
export const submitPlatformReview = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ userId: req.user._id });
  if (!student) throw new apiError(404, "Student not found");

  const { rating, text } = req.body;
  if (!rating || rating < 1 || rating > 5) throw new apiError(400, "Rating must be 1-5");

  const existing = await PlatformReview.findOne({ studentId: student._id });
  if (existing) {
    existing.rating = rating;
    existing.text = text || "";
    await existing.save();
    return res.status(200).json(new ApiResponse(200, existing, "Platform review updated"));
  }

  const review = await PlatformReview.create({
    studentId: student._id,
    rating,
    text: text || "",
  });

  return res.status(201).json(new ApiResponse(201, review, "Platform review submitted"));
});

// ─── GET /api/student/platform-review ─────────────────────────────────────────
export const getMyPlatformReview = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ userId: req.user._id });
  if (!student) throw new apiError(404, "Student not found");

  const review = await PlatformReview.findOne({ studentId: student._id });
  return res.status(200).json(new ApiResponse(200, review || null, "Platform review fetched"));
});

// ─── GET /api/student/performance-notes ───────────────────────────────────────
export const getMyPerformanceNotes = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ userId: req.user._id });
  if (!student) throw new apiError(404, "Student not found");

  const notes = await PerformanceNote.find({ studentId: student._id })
    .populate({ path: "teacherId", populate: { path: "userId", select: "name" } })
    .sort({ createdAt: -1 });

  const list = notes.map(n => ({
    id: n._id,
    teacherName: n.teacherId?.userId?.name || "Teacher",
    score: n.score,
    note: n.note,
    createdAt: n.createdAt,
  }));

  return res.status(200).json(new ApiResponse(200, list, "Performance notes fetched"));
});