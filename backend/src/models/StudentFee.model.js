import mongoose from "mongoose";

const studentFeeSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    // Which admin set this fee
    setBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    totalFee: {
      type: Number,
      required: true,
      min: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Optional: description of the fee (e.g. "Grade 10 - Mathematics - Mr. Sharma")
    description: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["paid", "pending", "partial"],
      default: "pending",
    },
    dueDate: {
      type: Date,
    },
    // Soft reference to enrollment if fee is enrollment-specific
    enrollmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Enrollment",
    },
    // Razorpay payment tracking
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    paidAt: Date,
  },
  { timestamps: true }
);

// Ensure pending amount is always derived
studentFeeSchema.virtual("pendingAmount").get(function () {
  return Math.max(0, this.totalFee - this.paidAmount);
});

// Auto-update status based on amounts
studentFeeSchema.pre("save", function () {
  if (this.paidAmount >= this.totalFee) {
    this.status = "paid";
  } else if (this.paidAmount > 0) {
    this.status = "partial";
  } else {
    this.status = "pending";
  }
});

studentFeeSchema.set("toJSON", { virtuals: true });
studentFeeSchema.set("toObject", { virtuals: true });

export default mongoose.model("StudentFee", studentFeeSchema);
