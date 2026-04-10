import mongoose from "mongoose";


const studentSchema = new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
        index:true
    },
    studentId:{
        type:String,
        required:true,
        unique:true,
        index:true
    },
    grade:{
        type:String,
        required:false,
        trim:true,
        default:""
    },
    section:{
        type:String,
        trim:true,
        default:""
    },
    parentName: {
      type: String,
      trim: true,
      default: "",
    },

    parentPhone: {
      type: String,
      trim: true,
      default: "",
    },
    feeStatus:{
        type:String,
        enum:["paid","due","overdue"],
        default:"due"
    },
    enrolledTutors:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Enrollment",
    }]
},{timestamps:true})


const Student = mongoose.model("Student",studentSchema)
export default Student