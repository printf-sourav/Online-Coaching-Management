import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
  {
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
      index: true,
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },

    fileUrl: {
      type: String,
      default: "",
    },

    note: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: String,
      enum: ["submitted", "late", "graded"],
      default: "submitted",
      index: true,
    },

    grade: {
      type: Number,
      min: 0,
    },

    teacherRemark: {
      type: String,
      trim: true,
      default: "",
    },

    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

submissionSchema.index(
  { assignmentId: 1, studentId: 1 },
  { unique: true }
);

const Submission = mongoose.model("Submission", submissionSchema);

export default Submission;
