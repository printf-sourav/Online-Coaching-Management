import mongoose from "mongoose";



const attendanceSchema = new mongoose.Schema({
    classId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Class",
        required:false,   // optional — attendance is now class-free
        index:true
    },
    studentId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Student",
        required:true,
        index:true
    },
    teacherId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Teacher",
        required:true,
        index:true
    },
    status:{
        type:String,
        enum:["present","absent","late"],
        required:true
    },
    date:{
        type:Date,
        required:true,
        index:true
    },
    markedAt:{
        type:Date,
        default:Date.now
    },
},{timestamps:true})

// Prevent marking the same student's attendance twice on the same day by the same teacher
attendanceSchema.index(
  { teacherId: 1, studentId: 1, date: 1 },
  { unique: true }
);


const Attendance = mongoose.model("Attendance",attendanceSchema)

export default Attendance