import mongoose from "mongoose";

const pendingUserSchema = new mongoose.Schema({
  name: String,
  email: {
    type: String,
    unique: true,
  },
  password: String,
  mobileNumber: { type: String, trim: true, default: '' },
  otp: String,
  otpExpire: {
    otpExpire: {
  type: Date,
  expires: 600 
}
  },
}, { timestamps: true });

export default mongoose.model("PendingUser", pendingUserSchema);