import mongoose from "mongoose"
import { asyncHandler } from "../utils/asyncHandler.js"
import { apiError } from "../utils/apiError.js";
import Teacher from "../models/Teacher.model.js";
import Assignment from "../models/assignment.model.js";
import Submission from "../models/submission.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { createNotification } from "../utils/notification.js";
import Student from "../models/Student.model.js";



export const gradeSubmission = asyncHandler(async(req,res)=>{
    const submissionId = req.params.id;
    const { grade, teacherRemark } = req.body

    if(!mongoose.Types.ObjectId.isValid(submissionId)){
        throw new apiError(400,"Invalid submissionId")
    }
    if (grade === undefined || grade === null || grade === '') {
        throw new apiError(400, "Grade is required");
    }
    const numericGrade = Number(grade);
    if (isNaN(numericGrade) || numericGrade < 0) {
        throw new apiError(400, "Grade must be a non-negative number");
    }
    if (numericGrade > 10) {
        throw new apiError(400, "Grade cannot exceed 10");
    }

    const teacher = await Teacher.findOne({userId:req.user._id})
    if(!teacher){
        throw new apiError(404,"Teacher not found")
    }

    const submission = await Submission.findById(submissionId);
    if(!submission){
        throw new apiError(404,"Submission not found")
    }

    const assignment = await Assignment.findOne({
        _id:submission.assignmentId,
        teacherId:teacher._id
    })
    if(!assignment){
        throw new apiError(403,"Not authorized to grade this submission")
    }

    submission.grade = numericGrade;
    submission.teacherRemark = teacherRemark || "";
    submission.status = "graded";
    await submission.save()

    const student = await Student.findById(submission.studentId);
    if (student) {
        await createNotification({
            userId: student.userId,
            title: "Assignment Graded",
            message: `Your assignment has been graded: ${numericGrade}/${assignment.maxPoints || 10}`,
            type: "assignment",
            link: `/student/assignments/${assignment._id}`,
        });
    }
    return res.status(200).json(new ApiResponse(200,{
        submissionId:submission._id,
        grade: numericGrade,
        status:submission.status
    }, "Submission graded successfully"))
})