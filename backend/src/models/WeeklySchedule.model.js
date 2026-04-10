import mongoose from "mongoose";

/**
 * One document = one recurring weekly time-slot set by a teacher.
 * - studentId = null  →  general slot broadcast to ALL enrolled students
 * - studentId = <id>  →  private slot for that specific student only
 */
const weeklyScheduleSchema = new mongoose.Schema(
  {
    tutorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
      index: true,
    },
    // If set, this slot belongs only to this student (personal schedule)
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      default: null,
      index: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    day: {
      type: String,
      enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      required: true,
    },
    startTime: {
      type: String, // "HH:mm"  e.g. "16:00"
      required: true,
    },
    endTime: {
      type: String, // "HH:mm"  e.g. "17:00"
      default: "",
    },
    meetingLink: {
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

// A teacher should not have duplicate day+startTime for the same subject+student combo
weeklyScheduleSchema.index({ tutorId: 1, studentId: 1, day: 1, startTime: 1 });

const WeeklySchedule = mongoose.model("WeeklySchedule", weeklyScheduleSchema);
export default WeeklySchedule;
