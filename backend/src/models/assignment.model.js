import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema({
    classId:{
        type:mongoose.Schema.ObjectId,
        ref:"Class",
        required: false,
        index: true,
    },
    teacherId:{
        type:mongoose.Schema.ObjectId,
        ref:"Teacher",
        required: true,
        index: true,
    },
    studentIds:[{
        type:mongoose.Schema.ObjectId,
        ref:"Student",
    }],
    title: {
        type: String,
        trim: true,
        required: true,
        default: "Assignment",
    },
    description: {
        type: String,
        trim: true,
        default: "",
    },
    dueDate: {
        type: Date,
        required: true,
        index: true,
    },
    maxPoints: {
        type: Number,
        default: 10,
    },
    priority: {
        type: String,
        enum: ["high", "medium", "low"],
        default: "medium",
    },
    attachmentUrl: {
        type: String,
        default: "",
    },

},{timestamps:true})


const Assignment = mongoose.model("Assignments",assignmentSchema)

export default Assignment