import mongoose from "mongoose";

const topicSchema = new mongoose.Schema(
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
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Topic", topicSchema);
