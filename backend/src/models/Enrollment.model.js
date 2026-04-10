import mongoose from "mongoose";




const enrollmentSchema = new mongoose.Schema({
    studentId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Student",
        required:true,
        index:true

    },
    tutorId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Teacher",
        required:true,
        index:true
    },
    price:{
        type:Number,
    },
    startDate:{
        type:Date,
        required:true,
        default:Date.now
    },
    endDate:{
        type:Date,
    },
    status:{
        type:String,
        enum:["active","cancelled","expired","pending","overdue", "requested", "approved"],
        default: "requested",
        index: true,
    },
    demoUsed:{
        type:Boolean,
        default:false,
    },

    demoBookedAt:{
        type:Date,
    },

    // ── Student academic / contact details collected at enrolment time ──────────
    grade: {
        type: String,
        required: true,
        trim: true,
    },
    board: {
        type: String,
        enum: ["CBSE", "ICSE", "State Board", "IB", "Other"],
        default: "CBSE",
    },
    school: {
        type: String,
        trim: true,
        default: "",
    },
    subjectsEnrolled: {
        type: [String],
        default: [],
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
    preferredDays: {
        type: [String],
        default: [],
    },
    notes: {
        type: String,
        default: "",
    },

    // ── Auto-billing ────────────────────────────────────────────────────────────
    nextBillingDate: {
        type: Date,   // next date a monthly invoice will be auto-generated
    },

},{timestamps:true})

enrollmentSchema.index(
    {studentId:1,tutorId:1,status:1},
    {unique:true,partialFilterExpression:{status:"active"}}
)

const Enrollment = mongoose.model("Enrollment",enrollmentSchema)

export default Enrollment
