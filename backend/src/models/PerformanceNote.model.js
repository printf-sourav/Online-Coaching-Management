import mongoose from "mongoose";

const performanceNoteSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.ObjectId,
      ref: "Teacher",
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    note: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("PerformanceNote", performanceNoteSchema);
