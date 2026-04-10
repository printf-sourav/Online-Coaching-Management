import WeeklySchedule from "../models/WeeklySchedule.model.js";
import Teacher from "../models/Teacher.model.js";
import Student from "../models/Student.model.js";
import Enrollment from "../models/Enrollment.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { createNotification } from "../utils/notification.js";

const DAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ─── GET /api/schedule  (teacher) ────────────────────────────────────────────
// Returns the teacher's general (broadcast) weekly schedule only
export const getMySchedule = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({ userId: req.user._id });
  if (!teacher) throw new apiError(404, "Teacher profile not found");

  const slots = await WeeklySchedule.find({ tutorId: teacher._id, studentId: null })
    .sort({ day: 1, startTime: 1 })
    .lean();

  // Sort by canonical day order
  slots.sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day) || a.startTime.localeCompare(b.startTime));

  return res.status(200).json(new ApiResponse(200, slots, "Schedule fetched"));
});

// ─── POST /api/schedule  (teacher) ───────────────────────────────────────────
// Add a new recurring weekly slot
export const addSlot = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({ userId: req.user._id });
  if (!teacher) throw new apiError(404, "Teacher profile not found");

  const { subject, day, startTime, endTime, meetingLink, notes } = req.body;

  if (!subject?.trim()) throw new apiError(400, "Subject is required");
  if (!day || !DAY_ORDER.includes(day)) throw new apiError(400, `Day must be one of: ${DAY_ORDER.join(", ")}`);
  if (!startTime) throw new apiError(400, "Start time is required");

  // Check for duplicate (only among general slots)
  const existing = await WeeklySchedule.findOne({ tutorId: teacher._id, studentId: null, day, startTime });
  if (existing) throw new apiError(400, `You already have a class at ${day} ${startTime}. Update or remove it first.`);

  const slot = await WeeklySchedule.create({
    tutorId: teacher._id,
    studentId: null,
    subject: subject.trim(),
    day,
    startTime,
    endTime: endTime || "",
    meetingLink: meetingLink || "",
    notes: notes || "",
  });

  // Notify all actively enrolled students
  const enrollments = await Enrollment.find({ tutorId: teacher._id, status: "active" })
    .populate({ path: "studentId", populate: { path: "userId", select: "_id name" } });

  for (const en of enrollments) {
    const userId = en.studentId?.userId?._id;
    if (userId) {
      await createNotification({
        userId,
        title: "New Class Added to Your Schedule 📅",
        message: `Your teacher added ${subject} every ${day} at ${startTime}${endTime ? `–${endTime}` : ""} to your weekly schedule.`,
        type: "class",
        link: "/student/schedule",
      });
    }
  }

  return res.status(201).json(new ApiResponse(201, slot, "Schedule slot added and students notified"));
});

// ─── PUT /api/schedule/:id  (teacher) ────────────────────────────────────────
// Update an existing slot
export const updateSlot = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({ userId: req.user._id });
  if (!teacher) throw new apiError(404, "Teacher profile not found");

  const slot = await WeeklySchedule.findOne({ _id: req.params.id, tutorId: teacher._id });
  if (!slot) throw new apiError(404, "Schedule slot not found");

  const { subject, day, startTime, endTime, meetingLink, notes } = req.body;

  if (subject)     slot.subject     = subject.trim();
  if (day)         slot.day         = day;
  if (startTime)   slot.startTime   = startTime;
  if (endTime !== undefined)     slot.endTime     = endTime;
  if (meetingLink !== undefined) slot.meetingLink = meetingLink;
  if (notes !== undefined)       slot.notes       = notes;

  await slot.save();

  return res.status(200).json(new ApiResponse(200, slot, "Slot updated"));
});

// ─── DELETE /api/schedule/:id  (teacher) ─────────────────────────────────────
// Remove a slot
export const deleteSlot = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({ userId: req.user._id });
  if (!teacher) throw new apiError(404, "Teacher profile not found");

  const slot = await WeeklySchedule.findOneAndDelete({ _id: req.params.id, tutorId: teacher._id });
  if (!slot) throw new apiError(404, "Schedule slot not found");

  return res.status(200).json(new ApiResponse(200, {}, "Slot removed"));
});

// ─── GET /api/schedule/student  (student) ────────────────────────────────────
// Returns merged schedule: general teacher slots + personal student-specific slots
// Grouped by day: [{ day, slots: [...] }]
export const getStudentSchedule = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ userId: req.user._id });
  if (!student) return res.status(200).json(new ApiResponse(200, [], "No enrollments"));

  // Find all active + pending enrollments
  const enrollments = await Enrollment.find({ studentId: student._id, status: { $in: ["active", "pending"] } })
    .populate({ path: "tutorId", populate: { path: "userId", select: "name" } });

  if (enrollments.length === 0) {
    return res.status(200).json(new ApiResponse(200, [], "No enrollments"));
  }

  const tutorIds = enrollments.map(e => e.tutorId?._id).filter(Boolean);
  const tutorNameMap = {};
  enrollments.forEach(e => {
    if (e.tutorId?._id) {
      tutorNameMap[e.tutorId._id.toString()] = e.tutorId?.userId?.name || "Tutor";
    }
  });

  // Fetch general slots (no specific student) + personal slots for this student
  const slots = await WeeklySchedule.find({
    tutorId: { $in: tutorIds },
    $or: [{ studentId: null }, { studentId: student._id }],
  })
    .sort({ day: 1, startTime: 1 })
    .lean();

  const flatSlots = slots.map(s => ({
    _id: s._id,
    subject: s.subject,
    day: s.day,
    time: s.startTime + (s.endTime ? ` – ${s.endTime}` : ""),
    startTime: s.startTime,
    endTime: s.endTime || "",
    meetingLink: s.meetingLink || "",
    notes: s.notes || "",
    teacher: tutorNameMap[s.tutorId.toString()] || "Tutor",
    tutorId: s.tutorId,
    isPersonal: !!s.studentId,
  }));

  // Sort then group by day
  flatSlots.sort(
    (a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day) || a.startTime.localeCompare(b.startTime)
  );

  const grouped = DAY_ORDER.reduce((acc, day) => {
    const daySlots = flatSlots.filter(s => s.day === day);
    if (daySlots.length > 0) acc.push({ day, slots: daySlots });
    return acc;
  }, []);

  return res.status(200).json(new ApiResponse(200, grouped, "Student schedule fetched"));
});

// ─── GET /api/schedule/students  (teacher) ───────────────────────────────────
// Returns all student-specific schedule slots for this teacher, grouped by student
export const getStudentSlots = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({ userId: req.user._id });
  if (!teacher) throw new apiError(404, "Teacher profile not found");

  const slots = await WeeklySchedule.find({ tutorId: teacher._id, studentId: { $ne: null } })
    .populate({ path: "studentId", populate: { path: "userId", select: "name" } })
    .lean();

  // Group by student
  const byStudent = {};
  for (const s of slots) {
    const sid = s.studentId?._id?.toString();
    if (!sid) continue;
    if (!byStudent[sid]) {
      byStudent[sid] = {
        studentId: s.studentId._id,
        studentName: s.studentId?.userId?.name || "Student",
        slots: [],
      };
    }
    byStudent[sid].slots.push({
      _id: s._id,
      day: s.day,
      subject: s.subject,
      startTime: s.startTime,
      endTime: s.endTime || "",
      meetingLink: s.meetingLink || "",
      notes: s.notes || "",
    });
  }

  // Sort slots within each student by day + time
  const result = Object.values(byStudent).map(entry => ({
    ...entry,
    slots: entry.slots.sort(
      (a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day) || a.startTime.localeCompare(b.startTime)
    ),
  }));

  return res.status(200).json(new ApiResponse(200, result, "Student schedule slots fetched"));
});

// ─── POST /api/schedule/student/:studentId  (teacher) ────────────────────────
// Teacher creates a personal schedule slot for a specific student
export const addStudentSlot = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({ userId: req.user._id });
  if (!teacher) throw new apiError(404, "Teacher profile not found");

  const { studentId } = req.params;
  const { subject, day, startTime, endTime, meetingLink, notes } = req.body;

  if (!subject?.trim()) throw new apiError(400, "Subject is required");
  if (!day || !DAY_ORDER.includes(day)) throw new apiError(400, `Day must be one of: ${DAY_ORDER.join(", ")}`);
  if (!startTime) throw new apiError(400, "Start time is required");

  // Verify the student is enrolled with this teacher
  const enrollment = await Enrollment.findOne({
    tutorId: teacher._id,
    studentId,
    status: { $in: ["active", "pending"] },
  }).populate({ path: "studentId", populate: { path: "userId", select: "_id name" } });

  if (!enrollment) throw new apiError(404, "Student is not enrolled with you");

  // Check for duplicate personal slot
  const existing = await WeeklySchedule.findOne({ tutorId: teacher._id, studentId, day, startTime });
  if (existing) throw new apiError(400, `This student already has a slot at ${day} ${startTime}`);

  const slot = await WeeklySchedule.create({
    tutorId: teacher._id,
    studentId,
    subject: subject.trim(),
    day,
    startTime,
    endTime: endTime || "",
    meetingLink: meetingLink || "",
    notes: notes || "",
  });

  // Notify the student
  const userId = enrollment.studentId?.userId?._id;
  if (userId) {
    await createNotification({
      userId,
      title: "Your Personal Class Schedule Updated 📅",
      message: `Your teacher has added a ${subject} class every ${day} at ${startTime}${endTime ? `–${endTime}` : ""} to your personal schedule.`,
      type: "class",
      link: "/student/schedule",
    });
  }

  return res.status(201).json(new ApiResponse(201, slot, "Personal schedule slot added"));
});

// ─── DELETE /api/schedule/student-slot/:slotId  (teacher) ────────────────────
// Teacher removes a student-specific slot
export const deleteStudentSlot = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({ userId: req.user._id });
  if (!teacher) throw new apiError(404, "Teacher profile not found");

  const slot = await WeeklySchedule.findOneAndDelete({
    _id: req.params.slotId,
    tutorId: teacher._id,
    studentId: { $ne: null },
  });
  if (!slot) throw new apiError(404, "Slot not found");

  return res.status(200).json(new ApiResponse(200, {}, "Personal schedule slot removed"));
});
