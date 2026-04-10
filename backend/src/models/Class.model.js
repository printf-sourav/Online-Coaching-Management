import mongoose from "mongoose"



const timeSlotSchema = new mongoose.Schema(
  {
    start: {
      type: Date,
      required: true,
    },
    end: {
      type: Date,
      required: true,
    },
  },
  { _id: false }
);
const classSchema = new mongoose.Schema({
    tutorId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Teacher",
        required:true,
        index:true
    },
    studentIds:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Student"
        }
    ],
    subject:{
        type:String,
        required:true,
        trim:true
    },
    topic:{
        type:String,
        required:true
    },
    date:{
        type:Date,
        required:true,
        index:true
    },
    timeSlot:{
        type:timeSlotSchema,
        required:true
    },
    meetingLink:{
        type:String,
        trim:true,
        required:true
    },
    status:{
        type:String,
        enum:["scheduled","live","completed","cancelled"],
        default:"scheduled",
        index:true
    },
    topicsCovered:{
        type:String,
        trim:true,
        defailt:""
    },
    classNotes:{
        type:String,
        trim:true,
        default:""
    }
},{timestamps:true})


classSchema.index({tutorId:1,date:1})

classSchema.index({studentIds:1,date:1})

const Class = mongoose.model("Class",classSchema)

export default Class