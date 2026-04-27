import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import User from "../models/User.model.js";
import Teacher from "../models/Teacher.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { apiError } from "../utils/apiError.js";
import Student from "../models/Student.model.js";
import Class from "../models/Class.model.js";
import Assignment from "../models/assignment.model.js";
import Submission from "../models/submission.model.js";
import Enrollment from "../models/Enrollment.model.js";
import Payment from "../models/Payment.model.js";
import Feedback from "../models/Feedback.model.js";
import PlatformReview from "../models/PlatformReview.model.js";
import Attendance from "../models/Attendance.model.js";
import Announcement from "../models/Announcement.model.js";
import Demo from "../models/Demo.model.js";
import { escapeRegex } from "../utils/helpers.js";

export const createTeacher = asyncHandler(async(req,res)=>{
    const {name, email, password, subjects, experience, bio, phone, salary, grades} = req.body
    
    if (!name || !email || !password  ) {
        throw new apiError(400, "All fields are required");
    }
    if (password.length < 6) {
        throw new apiError(400, "Password must be at least 6 characters");
    }
    
    const existing_user = await User.findOne({email})
    if(existing_user){
        throw new apiError(400,"email already exsist")
    }

    const user = await User.create({
    name,
    email,
    password,
    role: "teacher",
    isVerified: true,
    isActive: true,
    phone: phone || "",
  });

  const teacherId = `TCH-${Date.now()}`
  const teacher = await Teacher.create({
    userId: user._id,
    teacherId,
    subjects: Array.isArray(subjects) ? subjects : (subjects ? [subjects] : []),
    experience: Number(experience) || 0,
    bio: bio || "",
    salary: Number(salary) || 0,
    grades: grades || "",
  });

    return res.status(201).json(
    new ApiResponse(
      201,
      {
        teacherId: teacher.teacherId,
        name: user.name,
        email: user.email,
      },
      "Teacher created successfully"
    )
  );
})

export const getAllTeachers = asyncHandler(async (req,res) => {
    const teachers = await Teacher.find({})
      .populate("userId", "name email phone isActive createdAt")
      .sort({ createdAt: -1 })
      .lean();

    // Compute live student counts per teacher from Enrollment
    const teacherIds = teachers.map(t => t._id);
    const enrollAgg = await Enrollment.aggregate([
      { $match: { tutorId: { $in: teacherIds }, status: { $in: ["active", "approved", "pending"] } } },
      { $group: { _id: "$tutorId", count: { $sum: 1 } } },
    ]);
    const enrollMap = {};
    enrollAgg.forEach(e => { enrollMap[e._id.toString()] = e.count; });

    const result = teachers.map(t => ({
      ...t,
      totalStudents: enrollMap[t._id.toString()] ?? 0,
    }));

    return res.status(200).json(
        new ApiResponse(200, result, "Teachers fetched successfully")
    );
})

export const getAllStudents = asyncHandler(async (req, res) => {
    const students = await Student.find()
      .populate("userId", "name email isActive createdAt")
      .sort({ createdAt: -1 })
      .lean();

    // Attach per-student attendance percentage
    const studentIds = students.map(s => s._id);
    const attAgg = await Attendance.aggregate([
      { $match: { studentId: { $in: studentIds } } },
      { $group: {
          _id: "$studentId",
          total: { $sum: 1 },
          attended: { $sum: { $cond: [{ $in: ["$status", ["present", "late"]] }, 1, 0] } },
      }},
    ]);
    const attMap = {};
    attAgg.forEach(a => { attMap[a._id.toString()] = a; });

    const result = students.map(s => {
      const att = attMap[s._id.toString()];
      const attendancePercentage = att && att.total > 0
        ? Number(((att.attended / att.total) * 100).toFixed(1))
        : 0;
      return { ...s, attendancePercentage, totalClasses: att?.total ?? 0 };
    });

    return res.status(200).json(
        new ApiResponse(200, result, "Students fetched successfully")
    );
});

// ─── GET /api/admin/students/search?q=… ─────────────────────────────────────
export const searchStudents = asyncHandler(async (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) return res.status(200).json(new ApiResponse(200, [], "No query"));

  const regex = new RegExp(escapeRegex(q), "i");
  // Find matching User docs
  const users = await User.find({ name: regex, role: "student" }, "_id name email").limit(20);
  const userIds = users.map(u => u._id);

  const students = await Student.find({ userId: { $in: userIds } })
    .populate("userId", "name email isActive createdAt")
    .limit(20)
    .lean();

  const results = students.map(s => ({
    _id: s._id,
    name: s.userId?.name || "—",
    email: s.userId?.email || "—",
    studentId: s.studentId,
    grade: s.grade || "—",
    parentName: s.parentName || "—",
    parentPhone: s.parentPhone || "—",
    feeStatus: s.feeStatus || "—",
    isActive: s.userId?.isActive ?? true,
    joinedAt: s.createdAt,
  }));

  return res.status(200).json(new ApiResponse(200, results, "Search results"));
});

// ─── GET /api/admin/students/:studentId/details ──────────────────────────────
export const getAdminStudentDetails = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(studentId))
    throw new apiError(400, "Invalid student ID");

  const student = await Student.findById(studentId)
    .populate("userId", "name email phone isActive createdAt")
    .lean();
  if (!student) throw new apiError(404, "Student not found");

  // All enrollments for this student
  const enrollments = await Enrollment.find({ studentId })
    .populate({ path: "tutorId", populate: { path: "userId", select: "name email" } })
    .sort({ createdAt: -1 })
    .lean();

  // All payments for this student
  const payments = await Payment.find({ studentId })
    .sort({ createdAt: -1 })
    .lean();

  // Map enrollments
  const enrollmentList = enrollments.map(e => ({
    _id: e._id,
    tutorName: e.tutorId?.userId?.name || "—",
    tutorEmail: e.tutorId?.userId?.email || "—",
    planName: e.planName || "—",
    price: e.price || 0,
    status: e.status,
    startDate: e.startDate,
    endDate: e.endDate || null,
    grade: e.grade || student.grade || "—",
    subject: e.subject || "—",
    nextBillingDate: e.nextBillingDate || null,
  }));

  // Map payments
  const paymentList = payments.map(p => ({
    _id: p._id,
    amount: p.amount,
    status: p.status,
    type: p.type || "initial",
    billingMonth: p.billingMonth || "—",
    invoiceNumber: p.invoiceNumber || "—",
    razorpayPaymentId: p.razorpayPaymentId || "—",
    razorpayOrderId: p.razorpayOrderId || "—",
    paidAt: p.paidAt || null,
    dueDate: p.dueDate || null,
    isAutoGenerated: !!p.isAutoGenerated,
    createdAt: p.createdAt,
  }));

  const totalPaid    = paymentList.filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const totalPending = paymentList.filter(p => p.status === "pending").reduce((s, p) => s + p.amount, 0);

  return res.status(200).json(new ApiResponse(200, {
    profile: {
      _id: student._id,
      name: student.userId?.name || "—",
      email: student.userId?.email || "—",
      phone: student.userId?.phone || "—",
      studentId: student.studentId,
      grade: student.grade || "—",
      parentName: student.parentName || "—",
      parentPhone: student.parentPhone || "—",
      feeStatus: student.feeStatus || "—",
      isActive: student.userId?.isActive ?? true,
      joinedAt: student.createdAt,
    },
    enrollments: enrollmentList,
    payments: paymentList,
    summary: { totalPaid, totalPending, totalPayments: paymentList.length, activeEnrollments: enrollmentList.filter(e => e.status === "active").length },
  }, "Student details fetched"));
});


// ─── PUT /api/admin/enrollments/:enrollmentId/billing ────────────────────────
// Admin: update nextBillingDate on an enrollment
export const updateEnrollmentBilling = asyncHandler(async (req, res) => {
  const { enrollmentId } = req.params;
  const { nextBillingDate } = req.body;

  if (!mongoose.Types.ObjectId.isValid(enrollmentId))
    throw new apiError(400, "Invalid enrollment ID");

  const date = nextBillingDate ? new Date(nextBillingDate) : null;
  if (nextBillingDate && isNaN(date))
    throw new apiError(400, "Invalid date format");

  const enrollment = await Enrollment.findByIdAndUpdate(
    enrollmentId,
    { nextBillingDate: date },
    { new: true }
  );
  if (!enrollment) throw new apiError(404, "Enrollment not found");

  return res.status(200).json(new ApiResponse(200,
    { nextBillingDate: enrollment.nextBillingDate },
    "Next billing date updated"
  ));
});

// ─── PUT /api/admin/payments/:paymentId/due-date ─────────────────────────────
// Admin: update dueDate on a payment
export const updatePaymentDueDate = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;
  const { dueDate } = req.body;

  if (!mongoose.Types.ObjectId.isValid(paymentId))
    throw new apiError(400, "Invalid payment ID");

  const date = dueDate ? new Date(dueDate) : null;
  if (dueDate && isNaN(date))
    throw new apiError(400, "Invalid date format");

  const payment = await Payment.findByIdAndUpdate(
    paymentId,
    { dueDate: date },
    { new: true }
  );
  if (!payment) throw new apiError(404, "Payment not found");

  return res.status(200).json(new ApiResponse(200,
    { dueDate: payment.dueDate },
    "Payment due date updated"
  ));
});

// ─── DELETE /api/admin/teachers/:teacherId ───────────────────────────────────
export const deleteTeacher = asyncHandler(async (req, res) => {
  const { teacherId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(teacherId))
    throw new apiError(400, "Invalid teacher ID");

  const teacher = await Teacher.findById(teacherId);
  if (!teacher) throw new apiError(404, "Teacher not found");

  // Cancel all active / pending enrollments for this teacher
  await Enrollment.updateMany(
    { tutorId: teacher._id, status: { $in: ["active", "pending"] } },
    { $set: { status: "cancelled", endDate: new Date() } }
  );

  // Delete associated User account
  await User.findByIdAndDelete(teacher.userId);

  // Delete Teacher doc
  await Teacher.findByIdAndDelete(teacher._id);

  return res.status(200).json(
    new ApiResponse(200, { teacherId: teacher._id }, "Teacher removed successfully")
  );
});

// ─── PUT /api/admin/teachers/:teacherId ──────────────────────────────────────
export const updateTeacher = asyncHandler(async (req, res) => {
  const { teacherId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(teacherId))
    throw new apiError(400, "Invalid teacher ID");

  const teacher = await Teacher.findById(teacherId);
  if (!teacher) throw new apiError(404, "Teacher not found");

  const { name, email, phone, subjects, experience, bio, salary } = req.body;

  // Validate email uniqueness if changed
  if (email) {
    const existing = await User.findOne({ email, _id: { $ne: teacher.userId } });
    if (existing) throw new apiError(400, "Email already in use by another account");
    await User.findByIdAndUpdate(teacher.userId, { email });
  }
  if (name) await User.findByIdAndUpdate(teacher.userId, { name });
  if (phone !== undefined) await User.findByIdAndUpdate(teacher.userId, { phone });

  if (subjects !== undefined)
    teacher.subjects = Array.isArray(subjects) ? subjects.map(s => s.trim()).filter(Boolean) : [];
  if (experience !== undefined) teacher.experience = Number(experience) || 0;
  if (bio !== undefined) teacher.bio = bio;
  if (salary !== undefined) teacher.salary = Number(salary) || 0;
  await teacher.save();

  const updatedUser = await User.findById(teacher.userId).select("name email phone");
  return res.status(200).json(new ApiResponse(200, {
    teacherId: teacher._id,
    name: updatedUser?.name,
    email: updatedUser?.email,
    phone: updatedUser?.phone,
    subjects: teacher.subjects,
    experience: teacher.experience,
    bio: teacher.bio,
    salary: teacher.salary,
  }, "Teacher updated successfully"));
});

// ─── PUT /api/admin/teachers/:teacherId/subjects ─────────────────────────────
export const setTeacherSubjects = asyncHandler(async (req, res) => {
  const { teacherId } = req.params;
  const { subjects } = req.body;

  if (!Array.isArray(subjects) || subjects.length === 0)
    throw new apiError(400, "subjects must be a non-empty array");

  const teacher = await Teacher.findById(teacherId);
  if (!teacher) throw new apiError(404, "Teacher not found");

  teacher.subjects = subjects.map(s => String(s).trim()).filter(Boolean);
  await teacher.save();

  return res.status(200).json(new ApiResponse(200, { subjects: teacher.subjects }, "Subjects updated successfully"));
});

// ─── POST /api/admin/teachers/:teacherId/plans ───────────────────────────────
export const addTeacherPlan = asyncHandler(async (req, res) => {
  const { teacherId } = req.params;
  const { name, price, features } = req.body;

  if (!name?.trim()) throw new apiError(400, "Plan name is required");
  if (price == null || isNaN(price)) throw new apiError(400, "Plan price is required");

  const teacher = await Teacher.findById(teacherId);
  if (!teacher) throw new apiError(404, "Teacher not found");

  const featureList = Array.isArray(features)
    ? features.map(f => String(f).trim()).filter(Boolean)
    : [];

  teacher.plans.push({ name: name.trim(), price: Number(price), features: featureList });
  await teacher.save();

  const newPlan = teacher.plans[teacher.plans.length - 1];
  return res.status(201).json(new ApiResponse(201, newPlan, "Plan added successfully"));
});

// ─── PUT /api/admin/teachers/:teacherId/plans/:planId ────────────────────────
export const updateTeacherPlan = asyncHandler(async (req, res) => {
  const { teacherId, planId } = req.params;
  const { name, price, features } = req.body;

  const teacher = await Teacher.findById(teacherId);
  if (!teacher) throw new apiError(404, "Teacher not found");

  const plan = teacher.plans.id(planId);
  if (!plan) throw new apiError(404, "Plan not found");

  if (name != null) plan.name = String(name).trim();
  if (price != null) plan.price = Number(price);
  if (Array.isArray(features))
    plan.features = features.map(f => String(f).trim()).filter(Boolean);

  await teacher.save();
  return res.status(200).json(new ApiResponse(200, plan, "Plan updated successfully"));
});

// ─── DELETE /api/admin/teachers/:teacherId/plans/:planId ─────────────────────
export const deleteTeacherPlan = asyncHandler(async (req, res) => {
  const { teacherId, planId } = req.params;

  const teacher = await Teacher.findById(teacherId);
  if (!teacher) throw new apiError(404, "Teacher not found");

  const plan = teacher.plans.id(planId);
  if (!plan) throw new apiError(404, "Plan not found");

  plan.deleteOne();
  await teacher.save();
  return res.status(200).json(new ApiResponse(200, { planId }, "Plan deleted successfully"));
});

// ─── GET /api/admin/teachers/:teacherId/plans ─────────────────────────────────
export const getTeacherPlans = asyncHandler(async (req, res) => {
  const { teacherId } = req.params;

  const teacher = await Teacher.findById(teacherId).select("plans subjects");
  if (!teacher) throw new apiError(404, "Teacher not found");

  return res.status(200).json(new ApiResponse(200, { plans: teacher.plans, subjects: teacher.subjects }, "Teacher plans fetched"));
});

export const getPlatformStats = asyncHandler(async(req,res)=>{
    const totalUsers= await User.countDocuments();
    const totalTeachers = await Teacher.countDocuments();
    const totalStudents = await Student.countDocuments();
    const totalClasses = await Class.countDocuments();
    const totalAssignments = await Assignment.countDocuments();
    const totalSubmissions = await Submission.countDocuments();

    return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalUsers,
        totalTeachers,
        totalStudents,
        totalClasses,
        totalAssignments,
        totalSubmissions,
      },
      "Platform statistics fetched successfully"
    )
  );
})

// ─── GET /api/admin/classes ────────────────────────────────────────────────
export const getAllClasses = asyncHandler(async (req, res) => {
  const classColors = [
    "var(--grad-primary)", "var(--grad-accent)", "var(--grad-rose)",
    "var(--grad-amber)", "var(--grad-sky)",
  ];

  const classes = await Class.find({})
    .populate({ path: "tutorId", populate: { path: "userId", select: "name" } })
    .sort({ date: -1 })
    .limit(200)
    .lean();

  const formatted = classes.map((c, i) => {
    // Map DB status to UI status (scheduled → upcoming for display)
    const uiStatus = c.status === "scheduled" ? "upcoming" : c.status;

    return {
      id: c._id,
      name: c.subject,
      topic: c.topic || "",
      teacher: c.tutorId?.userId?.name || "Teacher",
      students: c.studentIds?.length || 0,
      time: c.date
        ? new Date(c.date).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
        : "",
      status: uiStatus,
      zoomLink: c.meetingLink || "#",
      color: classColors[i % classColors.length],
    };
  });

  return res.status(200).json(new ApiResponse(200, formatted, "Classes fetched"));
});

// ─── GET /api/admin/reviews ───────────────────────────────────────────────────
export const getAllReviews = asyncHandler(async (req, res) => {
  const feedbacks = await Feedback.find({})
    .populate({ path: "studentId", populate: { path: "userId", select: "name" } })
    .populate({ path: "teacherId", populate: { path: "userId", select: "name" } })
    .sort({ createdAt: -1 });

  const list = feedbacks.map(f => ({
    id: f._id,
    studentName: f.studentId?.userId?.name || "Student",
    teacherName: f.teacherId?.userId?.name || "Teacher",
    rating: f.rating,
    text: f.text,
    featured: !!f.featured,
    date: f.createdAt
      ? new Date(f.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
      : "",
  }));

  return res.status(200).json(new ApiResponse(200, list, "Reviews fetched"));
});

// ─── PUT /api/admin/reviews/:id/feature ───────────────────────────────────────
export const toggleFeaturedReview = asyncHandler(async (req, res) => {
  const fb = await Feedback.findById(req.params.id);
  if (!fb) throw new apiError(404, "Review not found");

  fb.featured = !fb.featured;
  await fb.save();

  return res.status(200).json(
    new ApiResponse(200, { id: fb._id, featured: fb.featured }, `Review ${fb.featured ? "featured" : "unfeatured"}`)
  );
});

// ─── GET /api/admin/reviews/featured (PUBLIC — no auth) ───────────────────────
export const getFeaturedReviews = asyncHandler(async (req, res) => {
  const feedbacks = await Feedback.find({ featured: true })
    .populate({ path: "studentId", populate: { path: "userId", select: "name" } })
    .populate({ path: "teacherId", populate: { path: "userId", select: "name" } })
    .sort({ createdAt: -1 })
    .limit(12);

  const grads = [
    "var(--grad-primary)", "var(--grad-accent)", "var(--grad-rose)",
    "var(--grad-sky)", "var(--grad-amber)",
  ];

  const list = feedbacks.map((f, i) => ({
    name: f.studentId?.userId?.name || "Student",
    role: `Student of ${f.teacherId?.userId?.name || "Teacher"}`,
    text: f.text,
    rating: f.rating,
    avatar: (f.studentId?.userId?.name || "S").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase(),
    grad: grads[i % grads.length],
  }));

  return res.status(200).json(new ApiResponse(200, list, "Featured reviews fetched"));
});

// ─── GET /api/admin/platform-reviews ──────────────────────────────────────────
export const getAllPlatformReviews = asyncHandler(async (req, res) => {
  const reviews = await PlatformReview.find()
    .populate({ path: "studentId", populate: { path: "userId", select: "name" } })
    .sort({ createdAt: -1 });

  const list = reviews.map(r => ({
    id: r._id,
    studentName: r.studentId?.userId?.name || "Student",
    rating: r.rating,
    text: r.text,
    featured: !!r.featured,
    date: r.createdAt
      ? new Date(r.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
      : "",
  }));

  return res.status(200).json(new ApiResponse(200, list, "Platform reviews fetched"));
});

// ─── PUT /api/admin/platform-reviews/:id/feature ──────────────────────────────
export const toggleFeaturedPlatformReview = asyncHandler(async (req, res) => {
  const review = await PlatformReview.findById(req.params.id);
  if (!review) throw new apiError(404, "Platform review not found");

  review.featured = !review.featured;
  await review.save();

  return res.status(200).json(
    new ApiResponse(200, { id: review._id, featured: review.featured }, `Platform review ${review.featured ? "featured" : "unfeatured"}`)
  );
});

// ─── GET /api/admin/platform-reviews/featured (PUBLIC) ────────────────────────
export const getFeaturedPlatformReviews = asyncHandler(async (req, res) => {
  const reviews = await PlatformReview.find({ featured: true })
    .populate({ path: "studentId", populate: { path: "userId", select: "name" } })
    .sort({ createdAt: -1 })
    .limit(12);

  const grads = [
    "var(--grad-primary)", "var(--grad-accent)", "var(--grad-rose)",
    "var(--grad-sky)", "var(--grad-amber)",
  ];

  const list = reviews.map((r, i) => ({
    name: r.studentId?.userId?.name || "Student",
    role: "Platform Review",
    text: r.text,
    rating: r.rating,
    avatar: (r.studentId?.userId?.name || "S").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase(),
    grad: grads[i % grads.length],
  }));

  return res.status(200).json(new ApiResponse(200, list, "Featured platform reviews fetched"));
});

// ─── GET /api/admin/enrollments  — all enrollments (optionally filter by status) ─
export const getAllEnrollments = asyncHandler(async (req, res) => {
  const { status } = req.query; // optional ?status=requested
  const filter = status ? { status } : {};

  const enrollments = await Enrollment.find(filter)
    .populate({ path: "studentId", populate: { path: "userId", select: "name email mobileNumber phone" } })
    .populate({ path: "tutorId",   populate: { path: "userId", select: "name email" } })
    .sort({ createdAt: -1 })
    .lean();

  const list = enrollments.map(e => ({
    _id: e._id,
    studentName:   e.studentId?.userId?.name  || "—",
    studentEmail:  e.studentId?.userId?.email || "—",
    studentMobile: e.studentId?.userId?.mobileNumber || e.studentId?.userId?.phone || "—",
    studentDbId:   e.studentId?._id,
    tutorName:     e.tutorId?.userId?.name    || "—",
    tutorEmail:    e.tutorId?.userId?.email   || "—",
    tutorDbId:     e.tutorId?._id,
    price:         e.price    || 0,
    status:        e.status,
    grade:         e.grade    || "—",
    board:         e.board    || "—",
    school:        e.school   || "",
    subjectsEnrolled: e.subjectsEnrolled || [],
    parentName:    e.parentName  || "—",
    parentPhone:   e.parentPhone || "—",
    preferredDays: e.preferredDays || [],
    notes:         e.notes   || "",
    startDate:     e.startDate,
    endDate:       e.endDate || null,
    nextBillingDate: e.nextBillingDate || null,
    createdAt:     e.createdAt,
  }));

  return res.status(200).json(new ApiResponse(200, list, "Enrollments fetched"));
});

// ─── PUT /api/admin/enrollments/:enrollmentId  — update status / price ─────────
export const updateEnrollmentByAdmin = asyncHandler(async (req, res) => {
  const { enrollmentId } = req.params;
  const { status, price, notes } = req.body;

  if (!mongoose.Types.ObjectId.isValid(enrollmentId))
    throw new apiError(400, "Invalid enrollment ID");

  const allowed = ["requested", "approved", "active", "cancelled", "expired", "pending", "overdue"];
  if (status && !allowed.includes(status)) throw new apiError(400, "Invalid status");

  const updateFields = {};
  if (status != null) updateFields.status = status;
  if (price  != null) updateFields.price  = Number(price);
  if (notes  != null) updateFields.notes  = notes;
  if (status === "cancelled") updateFields.endDate = new Date();

  const updated = await Enrollment.findByIdAndUpdate(
    enrollmentId,
    { $set: updateFields },
    { new: true, runValidators: false }
  );

  if (!updated) throw new apiError(404, "Enrollment not found");

  return res.status(200).json(new ApiResponse(200, { _id: updated._id, status: updated.status, price: updated.price }, "Enrollment updated"));
});

export const approveEnrollment = asyncHandler(async (req, res) => {
    const { enrollmentId, price } = req.body;

    if (!mongoose.Types.ObjectId.isValid(enrollmentId)) {
        throw new apiError(400, "Invalid enrollment ID");
    }

    const enrollment = await Enrollment.findById(enrollmentId);

    if (!enrollment) {
        throw new apiError(404, "Enrollment not found");
    }

    enrollment.price = price;
    enrollment.status = "approved";
    await enrollment.save();

    return res.status(200).json(new ApiResponse(200, enrollment, "Enrollment approved and price set"));
});

export const createEnrollmentByAdmin = asyncHandler(async (req, res) => {
    const { studentEmail, tutorId, price, grade, board, school, subjectsEnrolled, parentName, parentPhone, preferredDays, notes } = req.body;

    const studentUser = await User.findOne({ email: studentEmail });
    if (!studentUser) {
        throw new apiError(404, "Student not found");
    }

    let student = await Student.findOne({ userId: studentUser._id });
    if (!student) {
        student = await Student.create({
            userId: studentUser._id,
            // any other required student fields
        });
    }

    if (!mongoose.Types.ObjectId.isValid(tutorId)) {
        throw new apiError(400, "Invalid tutor ID");
    }
    
    const teacher = await Teacher.findById(tutorId);
    if (!teacher) {
        throw new apiError(404, "Teacher not found");
    }

    const enrollment = await Enrollment.create({
        studentId: student._id,
        tutorId: teacher._id,
        price,
        status: "approved",
        grade: String(grade).trim(),
        board: board || "CBSE",
        school: school || "",
        subjectsEnrolled: Array.isArray(subjectsEnrolled) ? subjectsEnrolled : [],
        parentName: String(parentName).trim(),
        parentPhone: String(parentPhone).trim(),
        preferredDays: Array.isArray(preferredDays) ? preferredDays : [],
        notes: notes || "",
    });

    return res.status(201).json(new ApiResponse(201, enrollment, "Enrollment created by admin"));
});

export const scheduleDemoByAdmin = asyncHandler(async (req, res) => {
    const { studentEmail, tutorId, dateTime } = req.body;

    const studentUser = await User.findOne({ email: studentEmail });
    if (!studentUser) {
        throw new apiError(404, "Student not found");
    }

    let student = await Student.findOne({ userId: studentUser._id });
    if (!student) {
        student = await Student.create({
            userId: studentUser._id,
        });
    }

    if (!mongoose.Types.ObjectId.isValid(tutorId)) {
        throw new apiError(400, "Invalid tutor ID");
    }
    
    const demo = await Demo.create({
        studentId: student._id,
        tutorId,
        dateTime,
        status: "scheduled"
    });

    return res.status(201).json(new ApiResponse(201, demo, "Demo scheduled by admin"));
});

// ─── Announcements ────────────────────────────────────────────────────────────
export const createAnnouncement = asyncHandler(async (req, res) => {
  const { title, message, audience, priority } = req.body;
  if (!title?.trim() || !message?.trim()) throw new apiError(400, "Title and message are required");

  const announcement = await Announcement.create({
    title: title.trim(),
    message: message.trim(),
    audience: audience || "all",
    priority: priority || "normal",
    createdBy: req.user._id,
  });

  return res.status(201).json(new ApiResponse(201, announcement, "Announcement published"));
});

export const getAnnouncements = asyncHandler(async (req, res) => {
  const announcements = await Announcement.find()
    .sort({ createdAt: -1 })
    .limit(50)
    .populate({ path: "createdBy", select: "name" })
    .lean();

  const list = announcements.map(a => ({
    _id: a._id,
    title: a.title,
    message: a.message,
    audience: a.audience,
    priority: a.priority,
    author: a.createdBy?.name || "Admin",
    date: new Date(a.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    createdAt: a.createdAt,
  }));

  return res.status(200).json(new ApiResponse(200, list, "Announcements fetched"));
});
