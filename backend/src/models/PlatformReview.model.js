import mongoose from "mongoose";

const platformReviewSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.ObjectId,
      ref: "Student",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    text: {
      type: String,
      trim: true,
      default: "",
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

// One review per student
platformReviewSchema.index({ studentId: 1 }, { unique: true });

export default mongoose.model("PlatformReview", platformReviewSchema);
