import mongoose from "mongoose";

const demoSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    tutorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
      index: true,
    },
    scheduledAt: {
      type: Date,
    },
    zoomLink: {
      type: String,
      trim: true,
      default: "",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

// One demo request per student-tutor pair (any non-cancelled status counts)
demoSchema.index({ studentId: 1, tutorId: 1 }, { unique: true });

const Demo = mongoose.model("Demo", demoSchema);
export default Demo;
