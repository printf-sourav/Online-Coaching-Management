import mongoose from "mongoose";
import Class from "../models/Class.model.js"
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import Teacher from "../models/Teacher.model.js";
import Enrollment from "../models/Enrollment.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import Student from "../models/Student.model.js";
import { createNotification } from "../utils/notification.js";


const createClass = asyncHandler(async(req,res)=>{
    const tutorId = req.user._id

    
    const teacher = await Teacher.findOne({userId:tutorId});
    if(!teacher){
        throw new apiError(404,"Tutor not found")
    }

    const {subject,topic,date,timeSlot,meetingLink,classNotes} = req.body

    if(!subject||!topic||!date||!timeSlot||!meetingLink){
        throw new apiError(400,"All fields are required")
    }

    if(new Date(timeSlot.start)>new Date(timeSlot.end)){
        throw new apiError(400,"starting time is greater than ending time")
    }
    if(new Date(date) < new Date()){
        throw new apiError(400,"date cannot be in past")
    }

    const enrollments = await Enrollment.find({
        tutorId:teacher._id,
        status:{ $in: ["active", "pending"] }
    })

    const studentIds = enrollments.map((en)=>(en.studentId))
    const totalStudents = studentIds.length

    
    

    const newClass = await Class.create({
        tutorId:teacher._id,
        studentIds:studentIds,
        subject,
        topic,
        date:new Date(date),
        timeSlot:{
            start:new Date(timeSlot.start),
            end: new Date(timeSlot.end)
        },
        meetingLink:meetingLink,
        status:"scheduled",
        ...(classNotes ? { classNotes } : {})
    }) 

    for (const studentId of studentIds) {

        const student = await Student.findById(studentId);

        if (student) {
            await createNotification({
                userId: student.userId,
                title: "New Class Scheduled",
                message: `A new class for ${subject} has been scheduled.`,
                type: "class",
                link: `/student/classes/${newClass?._id || ""}`
            });
        }
    }

    return res.status(201).json(new ApiResponse(201,{
        classId:newClass._id,subject:subject,date:newClass.date,timeSlot:newClass.timeSlot,totalStudents:totalStudents
    },"Class created successfully"))
})


const getTeacherClasses = asyncHandler(async(req,res)=>{
    const tutorId = req.user._id
    const teacher = await Teacher.findOne({userId:tutorId})
    if(!teacher){
        throw new apiError(404,"Tutor not found")
    }

    const classes = await Class.find({
        tutorId:teacher._id,
        
    }).sort({date:-1})

    return res.status(200).json(new ApiResponse(200,{
        classes:classes
    },"Classes fetched"))
})

const getStudentClasses = asyncHandler(async(req,res)=>{
    const userId = req.user._id
    const student = await Student.findOne({userId:userId})

    if(!student){
        throw new apiError(404,"Student not found");
    }

    const classes = await Class.find({
        studentIds:student._id,
    }).sort({date:-1})
    

    return res.status(200).json(new ApiResponse(200,{
        classes:classes
    },"Classes fetched"))

})

const updateClass = asyncHandler(async(req,res)=>{
    const classId = req.params.id
    if(!mongoose.Types.ObjectId.isValid(classId)){
        throw new apiError(400,"Invalid classId")
    }
    const {topic,meetingLink,timeSlot,status} = req.body

    const teacher = await Teacher.findOne({userId:req.user._id});
    if(!teacher){
        throw new apiError(404,"Teacher not found")
    }
    const existingClass = await Class.findOne({
        _id:classId,
        tutorId:teacher._id
    })
    if(!existingClass){
        throw new apiError(404,"Class not found")
    }
    if(existingClass.status==="completed"){
        throw new apiError(403,"Completed class cannot be updated");
    }
    if(topic) existingClass.topic = topic
    if(meetingLink) existingClass.meetingLink = meetingLink
    if(timeSlot && timeSlot.start && timeSlot.end){
        existingClass.timeSlot = {
            start: new Date(timeSlot.start),
            end: new Date(timeSlot.end)
        }
    }
    if(status) existingClass.status = status

    await existingClass.save()

    return res.status(200).json(new ApiResponse(200,existingClass,"Class updated"))
})

const deleteClass = asyncHandler(async(req,res)=>{
    const classId = req.params.id
    if(!mongoose.Types.ObjectId.isValid(classId)){
        throw new apiError(400,"Invalid classId")
    }
    const teacher = await Teacher.findOne({userId:req.user._id})
    if(!teacher){
        throw new apiError(404,"Teacher not found")
    }

    const newClass = await Class.findOne({
        _id:classId,
        tutorId:teacher._id
    })
    if(!newClass){
        throw new apiError(404,"Class not found")
    }

    if(newClass.status==="completed"){
        throw new apiError(403,"Completed class cannot be deleted");
    }

    await Class.findByIdAndDelete(classId)

    return res.status(200).json( new ApiResponse(200,{},"class deleted"))
})

const getClass = asyncHandler(async(req,res)=>{
    const classId = req.params.id
    if(!mongoose.Types.ObjectId.isValid(classId)){
        throw new apiError(400,"Invalid classId")
    }

    const newClass = await Class.findById(classId)
    if(!newClass){
        throw new apiError(404,"Class not found")
    }

    return res.status(200).json(new ApiResponse(200,newClass,"class fetched"))
    
})





export {createClass,getTeacherClasses,getStudentClasses,updateClass,deleteClass,getClass}