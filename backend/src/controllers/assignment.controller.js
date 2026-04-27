import mongoose from "mongoose";
import Assignment from "../models/assignment.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import Teacher from "../models/Teacher.model.js";
import { apiError } from "../utils/apiError.js";
import Student from "../models/Student.model.js";
import Submission from "../models/submission.model.js";
import Enrollment from "../models/Enrollment.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { createNotification } from "../utils/notification.js";
import { sendAssignmentSubmissionEmail } from "../utils/sendEmail.js";

export const createAssignment = asyncHandler(async (req, res) => {
  // Support both JSON body (studentIds) and FormData (studentIds[])
  const rawStudentIds = req.body.studentIds || req.body["studentIds[]"] || [];
  const studentIds = Array.isArray(rawStudentIds)
    ? rawStudentIds
    : rawStudentIds
      ? [rawStudentIds]
      : [];

  const { title, description, dueDate, priority, maxPoints } = req.body;

  const teacher = await Teacher.findOne({ userId: req.user._id });
  if (!teacher) throw new apiError(404, "Teacher not found");

  if (!title) throw new apiError(400, "Title is required");
  if (!dueDate) throw new apiError(400, "Due date is required");
  if (new Date(dueDate) < new Date())
    throw new apiError(400, "Due date cannot be in the past");

  // Resolve target student IDs
  let targetStudentIds = [];

  if (studentIds.length > 0) {
    // Assign to specific students — validate they are enrolled
    const enrolledIds = (
      await Enrollment.find({
        tutorId: teacher._id,
        studentId: { $in: studentIds },
        status: { $in: ["active", "pending"] },
      })
        .select("studentId")
        .lean()
    ).map((e) => e.studentId.toString());

    targetStudentIds = studentIds.filter((id) =>
      enrolledIds.includes(id.toString())
    );
    if (!targetStudentIds.length) {
      throw new apiError(400, "None of the selected students are enrolled with you");
    }
  } else {
    // Assign to ALL enrolled students
    const enrollments = await Enrollment.find({
      tutorId: teacher._id,
      status: { $in: ["active", "pending"] },
    })
      .select("studentId")
      .lean();
    targetStudentIds = enrollments.map((e) => e.studentId.toString());
    if (!targetStudentIds.length) {
      throw new apiError(400, "No students are enrolled with you");
    }
  }

  const attachmentUrl = req.file ? `/uploads/${req.file.filename}` : "";

  const assignment = await Assignment.create({
    teacherId: teacher._id,
    studentIds: targetStudentIds,
    title,
    description: description || "",
    dueDate: new Date(dueDate),
    priority: priority || "medium",
    maxPoints: maxPoints ? Number(maxPoints) : 10,
    attachmentUrl,
  });

  // Batch fetch student userIds for notifications (eliminates N+1)
  const students = await Student.find({ _id: { $in: targetStudentIds } })
    .select("_id userId")
    .lean();

  // Fire-and-forget notifications
  const notificationPromises = students.map((s) =>
    createNotification({
      userId: s.userId,
      title: "New Assignment",
      message: `New assignment "${title}" has been posted.`,
      type: "assignment",
      link: `/student/assignments/${assignment._id}`,
    }).catch(() => {})
  );

  Promise.all(notificationPromises).catch(() => {});

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        assignmentId: assignment._id,
        title: assignment.title,
        dueDate: assignment.dueDate,
        studentCount: targetStudentIds.length,
        file: attachmentUrl,
      },
      "Assignment created successfully"
    )
  );
});

export const submitAssignment = asyncHandler(async (req, res) => {
  const assignmentId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
    throw new apiError(400, "Invalid assignmentId");
  }

  const student = await Student.findOne({ userId: req.user._id });
  if (!student) throw new apiError(404, "Student not found");

  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) throw new apiError(404, "Assignment not found");

  const isStudentAllowed = assignment.studentIds.some(
    (id) => id.toString() === student._id.toString()
  );
  if (!isStudentAllowed) {
    throw new apiError(403, "You are not allowed to submit this assignment");
  }

  const existingSubmission = await Submission.findOne({
    assignmentId,
    studentId: student._id,
  });
  if (existingSubmission) {
    throw new apiError(400, "Assignment already submitted");
  }

  if (!req.file) throw new apiError(400, "File is required");

  const isLate = new Date() > new Date(assignment.dueDate);

  const submission = await Submission.create({
    assignmentId,
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
    new ApiResponse(
      201,
      {
        submissionId: submission._id,
        status: submission.status,
        submittedAt: submission.submittedAt,
      },
      "Assignment submitted successfully"
    )
  );
});
