import mongoose from "mongoose";
import Enrollment from "../models/Enrollment.model.js";
import Teacher from "../models/Teacher.model.js";
import Student from "../models/Student.model.js";
import User from "../models/User.model.js";
import Demo from "../models/Demo.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { createNotification } from "../utils/notification.js";

export const getMyEnrollments = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ userId: req.user._id });
  if (!student) {
    return res.status(200).json(new ApiResponse(200, [], "No enrollments"));
  }

  const enrollments = await Enrollment.find({
    studentId: student._id,
    status: { $in: ["active", "pending", "requested", "approved"] },
  }).populate({
    path: "tutorId",
    populate: { path: "userId", select: "name avatar" },
  });

  const result = enrollments.map((e) => {
    const t = e.tutorId;
    const userName = t?.userId?.name || "Tutor";
    const initials = userName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
    return {
      enrollmentId: e._id,
      tutorId: t?._id,
      tutorName: userName,
      avatar: initials,
      subject: t?.subjects?.[0] || "—",
      planName: e.planName,
      price: e.price,
      status: e.status,
      demoUsed: e.demoUsed || false,
      grade: e.grade || "—",
      board: e.board || "—",
      school: e.school || "—",
      subjectsEnrolled: e.subjectsEnrolled || [],
      parentName: e.parentName || "—",
      parentPhone: e.parentPhone || "—",
      preferredDays: e.preferredDays || [],
      notes: e.notes || "",
      enrolledDate: e.createdAt
        ? new Date(e.createdAt).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "—",
    };
  });

  return res.status(200).json(new ApiResponse(200, result, "Enrollments fetched"));
});

export const enrollInTutor = asyncHandler(async(req,res)=>{
    const { planId, grade, board, school, subjectsEnrolled, parentName, parentPhone, preferredDays, notes } = req.body;
    const tutorId = req.params.id

    if (!mongoose.Types.ObjectId.isValid(tutorId)) {
        throw new apiError(400, "Invalid tutor ID");
    }

    if (!mongoose.Types.ObjectId.isValid(planId)) {
        throw new apiError(400, "Invalid plan ID");
    }

    const student = await Student.findOne({userId:req.user._id})

    if(!student){
        throw new apiError(404,"Student not found")
    }

    const teacher = await Teacher.findById(tutorId)
    if(!teacher){
        throw new apiError(404,"Teacher not found")
    }


    const selectedPlan = teacher.plans.id(planId)
    if(!selectedPlan){
        throw new apiError(404,"plan not found")
    }

    const existingEnrollment = await Enrollment.findOne({
        studentId: student._id,
        tutorId: teacher._id,
        status: { $in: ["active", "pending"] },
    })

    if (existingEnrollment) {
        if (existingEnrollment.status === "active") {
            throw new apiError(400, "You are already enrolled with this tutor");
        }
        // Pending enrollment already exists — return it so the frontend can proceed to payment
        return res.status(200).json(
            new ApiResponse(200, {
                enrollmentId: existingEnrollment._id,
                tutorId: teacher._id,
                planName: existingEnrollment.planName,
                price: existingEnrollment.price,
                status: existingEnrollment.status,
            }, "Pending enrollment already exists — complete payment to activate")
        );
    }

    // Ensure the student has booked a demo with this tutor before enrolling
    const demo = await Demo.findOne({
        studentId: student._id,
        tutorId: teacher._id,
        status: { $ne: "cancelled" },
    });
    if (!demo) {
        throw new apiError(403, "Please book a free demo class with this tutor before enrolling");
    }

    // Optionally back-fill Student profile fields if not set yet
    const studentUpdates = {};
    if (grade && !student.grade) studentUpdates.grade = grade;
    if (parentName && !student.parentName) studentUpdates.parentName = parentName;
    if (parentPhone && !student.parentPhone) studentUpdates.parentPhone = parentPhone;
    if (Object.keys(studentUpdates).length) {
        await Student.findByIdAndUpdate(student._id, { $set: studentUpdates });
    }

    const enrollment = await Enrollment.create({
        studentId:student._id,
        tutorId:teacher._id,
        planId:selectedPlan._id,
        planName: selectedPlan.name,
        price: selectedPlan.price,
        status: "pending",  // becomes "active" after payment verification
        grade: String(grade).trim(),
        board: board || "CBSE",
        school: school || "",
        subjectsEnrolled: Array.isArray(subjectsEnrolled) ? subjectsEnrolled : [],
        parentName: String(parentName).trim(),
        parentPhone: String(parentPhone).trim(),
        preferredDays: Array.isArray(preferredDays) ? preferredDays : [],
        notes: notes || "",
    });
    // enrolledTutors push + totalStudents increment happen in payment.controller verifyPayment

    return res.status(201).json(
    new ApiResponse(
      201,
      {
        enrollmentId: enrollment._id,
        tutorId: teacher._id,
        planName: selectedPlan.name,
        price: selectedPlan.price,
        status: enrollment.status,
      },
      "Enrollment created — complete payment to activate"
    )
)
    
})

export const cancellEnrollment = asyncHandler(async(req,res)=>{

    const enrollmentId = req.params.id

    if (!mongoose.Types.ObjectId.isValid(enrollmentId)) {
        throw new apiError(400, "Invalid enrollment ID");
    }

    const student = await Student.findOne({userId:req.user._id})

    if(!student){
        throw new apiError(404,"Student not found")
    }

    const enrollment = await Enrollment.findOne({
        _id: enrollmentId,
        studentId: student._id,
    })
    if (!enrollment) {
        throw new apiError(404, "Enrollment not found");
    }
    if (enrollment.status === "cancelled") {
        throw new apiError(400, "Enrollment is already cancelled");
    }

    const previousStatus = enrollment.status;
    enrollment.status = "cancelled";
    enrollment.endDate = Date.now();
    await enrollment.save()

    // Only decrement totalStudents if it was active (not still pending)
    if (previousStatus === "active") {
        await Teacher.findByIdAndUpdate(enrollment.tutorId, {
            $inc: { totalStudents: -1 }
        });

        // Remove enrollment ref from student's enrolledTutors array
        await Student.findByIdAndUpdate(student._id, {
            $pull: { enrolledTutors: enrollment._id }
        });
    }

    return res.status(200).json(
    new ApiResponse(
      200,
      {
        enrollmentId: enrollment._id,
        status: enrollment.status,
        endDate: enrollment.endDate,
      },
      "Enrollment cancelled successfully"
    )
  );
})

export const bookDemo = asyncHandler(async(req,res)=>{
    const tutorId = req.params.id

    if (!mongoose.Types.ObjectId.isValid(tutorId)) {
        throw new apiError(400, "Invalid tutor ID");
    }

    const student = await Student.findOne({userId:req.user._id})
    if (!student) {
        throw new apiError(404, "Student profile not found");
    }

    const enrollment = await Enrollment.findOne({
        studentId:student._id,
        tutorId,
    })

    if (!enrollment) {
        throw new apiError(404, "Enrollment not found");
    }
    if (enrollment.demoUsed) {
        throw new apiError(400, "Demo already booked for this tutor");
    }

    enrollment.demoUsed = true;
    enrollment.demoBookedAt = new Date();
    await enrollment.save();
    
    return res.status(200).json(
    new ApiResponse(
      200,
      {
        enrollmentId: enrollment._id,
        demoBookedAt: enrollment.demoBookedAt,
      },
      "Demo booked successfully"
    )
    );

})

export const requestEnrollment = asyncHandler(async (req, res) => {
    const { tutorId, grade, board, school, subjectsEnrolled, parentName, parentPhone, preferredDays, notes, mobileNumber } = req.body;

    if (!mongoose.Types.ObjectId.isValid(tutorId)) {
        throw new apiError(400, "Invalid tutor ID");
    }

    const studentUser = await User.findById(req.user._id);
    if (!studentUser) {
        throw new apiError(404, "User not found");
    }

    // Update user's mobile number if provided
    if (mobileNumber && !studentUser.mobileNumber) {
        studentUser.mobileNumber = mobileNumber;
        await studentUser.save();
    }

    const student = await Student.findOne({ userId: req.user._id });

    if (!student) {
        throw new apiError(404, "Student not found");
    }

    const teacher = await Teacher.findById(tutorId);
    if (!teacher) {
        throw new apiError(404, "Teacher not found");
    }

    const existingEnrollment = await Enrollment.findOne({
        studentId: student._id,
        tutorId: teacher._id,
        status: { $in: ["active", "pending", "requested", "approved"] },
    });

    if (existingEnrollment) {
        throw new apiError(400, "You have already sent a request to this tutor");
    }

    const enrollment = await Enrollment.create({
        studentId: student._id,
        tutorId: teacher._id,
        status: "requested",
        grade: String(grade).trim(),
        board: board || "CBSE",
        school: school || "",
        subjectsEnrolled: Array.isArray(subjectsEnrolled) ? subjectsEnrolled : [],
        parentName: String(parentName).trim(),
        parentPhone: String(parentPhone).trim(),
        preferredDays: Array.isArray(preferredDays) ? preferredDays : [],
        notes: notes || "",
    });

    // Notify all admins about the new enrollment request
    const teacherName = teacher.userId ? (await User.findById(teacher.userId).select("name"))?.name : "a teacher";
    const studentName = studentUser.name || "A student";
    const admins = await User.find({ role: "admin" }).select("_id");
    for (const admin of admins) {
      createNotification({
        userId: admin._id,
        title: "New Enrollment Request",
        message: `${studentName} has requested enrollment with ${teacherName} (Grade ${grade || '—'}).`,
        type: "enrollment",
        link: "/admin/students",
      }).catch(() => {}); // fire-and-forget, don't block response
    }

    return res.status(201).json(new ApiResponse(201, enrollment, "Enrollment request sent successfully"));
});