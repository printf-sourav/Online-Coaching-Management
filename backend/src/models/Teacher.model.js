import mongoose from "mongoose";



const availabilitySchema= new mongoose.Schema({
    day:{
        type:String,
        required:true
    },
    slots:[
        {
            start:String,
            end:String
        }
    ]
},{_id:false})

const planSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim:true
    },
    price:{
        type:Number,
        required:true,
    },
    features:[
        {type:String,trim:true}
    ]
},{_id:true})

const teacherSchema = new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
        index:true
    },
    teacherId:{
        type:String,
        required:true,
        unique:true,
        index:true
    },
    subjects:[{
        type:String,
        trim:true
    }],
    experience:{
        type:Number,
        default:0
    },
    bio:{
        type:String,
        trim:true,
        default:""
    },

    rating:{
        type:Number,
        default:0,
        min:0,
        max:5
    },
    totalStudents:{
        type:Number,
        default:0,
    },
    totalReviews:{
        type:Number,
        default:0
    },
    badge:{
        type:String,
        enum:["Top Rated","Expert","New"],
        default:"New"
    },
    availability: [availabilitySchema],
    plans:[planSchema],
    languages: [
      {
        type: String,
        trim: true,
      },
    ],

    zoomLink: {
      type: String,
      default: "",
    },

    salary: {
      type: Number,
      default: 0,
    },

    grades: {
      type: String,
      trim: true,
      default: "",
    },

},{timestamps:true})

const Teacher = mongoose.model("Teacher",teacherSchema)

export default Teacher