import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import Teacher from "../models/Teacher.model.js";
import Enrollment from "../models/Enrollment.model.js";
import Attendance  from "../models/Attendance.model.js";
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
    });
    const enrolledIds = new Set(enrollments.map(e => e.studentId.toString()));

    const sessionDate = new Date(date);
    // Normalise to midnight so the unique index (teacherId+studentId+date) is consistent
    sessionDate.setHours(0, 0, 0, 0);

    const attendanceRecords = records.map(item => {
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

    // Upsert — update existing record for same day or create a new one
    await Attendance.bulkWrite(
        attendanceRecords.map(r => ({
            updateOne: {
                filter: { teacherId: r.teacherId, studentId: r.studentId, date: r.date },
                update: { $set: { status: r.status, markedAt: new Date() } },
                upsert: true,
            },
        }))
    );

    for (const record of attendanceRecords) {
        const student = await Student.findById(record.studentId);
        if (student) {
            await createNotification({
                userId: student.userId,
                title: "Attendance Marked",
                message: `Your attendance on ${new Date(date).toDateString()} is marked as ${record.status}.`,
                type: "attendance",
                link: "/student/attendance",
            });
        }
    }

    return res.status(201).json(
        new ApiResponse(201, { totalMarked: attendanceRecords.length }, "Attendance marked successfully")
    );
})

const getStudentAttendance = asyncHandler(async(req,res)=>{
    const userId = req.user._id
    const student = await Student.findOne({userId})
    if(!student){
        throw new apiError(404,"Student not found")
    }


    const attendance = await Attendance.find({studentId: student._id}).sort({date:-1})

    const totalClasses = attendance.length
    
    
    const presentCount = attendance.filter((c)=>(c.status==="present")).length
    const absentCount = attendance.filter((c)=>(c.status==="absent")).length
    const lateCount = attendance.filter((c)=>(c.status==="late")).length
    
    let percentage = 0
    if(totalClasses > 0){
        percentage = ((presentCount + lateCount) / totalClasses) * 100;
    }
    percentage = Number(percentage.toFixed(2));



    return res.status(200).json(new ApiResponse(200,{
        totalClasses:totalClasses,
        present: presentCount,
        absent: absentCount,
        late: lateCount,
        attendancePercentage: percentage
    })
)
})

// ─── GET /api/attendance/teacher  — teacher's full attendance history ───────────
const getTeacherAttendance = asyncHandler(async (req, res) => {
    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) throw new apiError(404, "Teacher not found");

    const attendance = await Attendance.find({ teacherId: teacher._id })
        .populate("studentId", "userId")
        .sort({ date: -1 });

    const totalRecords = attendance.length;
    const present = attendance.filter(a => a.status === "present").length;
    const absent  = attendance.filter(a => a.status === "absent").length;
    const late    = attendance.filter(a => a.status === "late").length;
    const percentage = totalRecords > 0
        ? Number((((present + late) / totalRecords) * 100).toFixed(2))
        : 0;

    return res.status(200).json(
        new ApiResponse(200, {
            summary: { totalMarked: totalRecords, present, absent, late, attendancePercentage: percentage },
            records: attendance,
        }, "Teacher attendance fetched successfully")
    );
})

// ─── GET /api/attendance/student/:studentId  — teacher views one student ────────
const getStudentAttendanceByTeacher = asyncHandler(async (req, res) => {
    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) throw new apiError(404, "Teacher not found");

    const { studentId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(studentId))
        throw new apiError(400, "Invalid student ID");

    const records = await Attendance.find({
        teacherId: teacher._id,
        studentId,
    }).sort({ date: -1 });

    const total   = records.length;
    const present = records.filter(r => r.status === "present").length;
    const absent  = records.filter(r => r.status === "absent").length;
    const late    = records.filter(r => r.status === "late").length;
    const percentage = total > 0 ? Number((((present + late) / total) * 100).toFixed(2)) : 0;

    return res.status(200).json(
        new ApiResponse(200, {
            summary: { total, present, absent, late, percentage },
            records: records.map(r => ({
                _id: r._id,
                date: r.date,
                status: r.status,
                markedAt: r.markedAt,
            })),
        }, "Student attendance fetched")
    );
})

export { markAttendance, getStudentAttendance, getTeacherAttendance, getStudentAttendanceByTeacher }