import mongoose from "mongoose";

const pendingUserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    mobileNumber: {
      type: String,
      trim: true,
      default: "",
    },
    otp: {
      type: String,
      required: true,
    },
    otpExpire: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB TTL: auto-delete when otpExpire is reached
    },
  },
  { timestamps: true }
);

export default mongoose.model("PendingUser", pendingUserSchema);