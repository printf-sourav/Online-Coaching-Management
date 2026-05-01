import User from "../models/User.model.js";
import PendingUser from "../models/pendingUser.model.js";
import Student from "../models/Student.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { generateAccessToken, generateRefreshToken } from "../utils/generateToken.js";
import { sendVerificationEmail, sendPasswordResetEmail } from "../utils/sendEmail.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";

const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const hashOTP = (otp) =>
  crypto.createHash("sha256").update(otp).digest("hex");

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
};

export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, mobileNumber } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) throw new apiError(400, "Email already registered");

  await PendingUser.deleteOne({ email });

  const otp = generateOTP();

  await PendingUser.create({
    name,
    email,
    password,
    mobileNumber,
    otp: hashOTP(otp),
    otpExpire: Date.now() + 10 * 60 * 1000,
  });

  await sendVerificationEmail(email, otp);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "OTP sent to email"));
});

export const verifyRegister = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const pending = await PendingUser.findOne({ email });
  if (!pending) throw new apiError(400, "No registration request found");

  if (
    pending.otp !== hashOTP(otp) ||
    pending.otpExpire < Date.now()
  ) {
    throw new apiError(400, "Invalid or expired OTP");
  }

  const user = await User.create({
    name: pending.name,
    email: pending.email,
    password: pending.password,
    mobileNumber: pending.mobileNumber,
    role: "student",
    isVerified: true,
    isActive: true,
  });

  await Student.create({
    userId: user._id,
    studentId: `STU-${Date.now()}`,
  });

  await PendingUser.deleteOne({ email });

  return res
    .status(201)
    .json(new ApiResponse(201, {}, "Account created successfully"));
});

export const resendVerificationOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const pending = await PendingUser.findOne({ email });
  if (!pending) throw new apiError(400, "No pending registration found");

  const otp = generateOTP();

  pending.otp = hashOTP(otp);
  pending.otpExpire = Date.now() + 10 * 60 * 1000;

  await pending.save();
  await sendVerificationEmail(email, otp);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "OTP resent successfully"));
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    throw new apiError(400, "Email and password are required");

  const user = await User.findOne({ email }).select("+password +refreshToken");

  if (!user) throw new apiError(404, "User not found");
  if (!user.isVerified)
    throw new apiError(403, "Please verify your email first");
  if (!user.isActive)
    throw new apiError(403, "Account is deactivated");

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new apiError(400, "Invalid credentials");

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  const hashedRefreshToken = hashToken(refreshToken);

  // Faster than document save() and avoids unrelated validators/hooks
  await User.updateOne({ _id: user._id }, { $set: { refreshToken: hashedRefreshToken } });

  const userProfile = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar || "",
    phone: user.phone || "",
    mobileNumber: user.mobileNumber || "",
    dob: user.dob || null,
    gender: user.gender || "",
    bio: user.bio || "",
    isVerified: user.isVerified,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        { accessToken, refreshToken, user: userProfile },
        "User logged in successfully"
      )
    );
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken;

  if (!token) throw new apiError(401, "No refresh token found");

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const user = await User.findById(decoded.id).select("+refreshToken");
    if (!user || !user.refreshToken)
      throw new apiError(401, "Invalid refresh token");

    if (hashToken(token) !== user.refreshToken)
      throw new apiError(401, "Refresh token mismatch");

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    user.refreshToken = hashToken(newRefreshToken);
    await user.save();

    return res
      .status(200)
      .cookie("accessToken", newAccessToken, cookieOptions)
      .cookie("refreshToken", newRefreshToken, cookieOptions)
      .json(
        new ApiResponse(
          200,
          { accessToken: newAccessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );
  } catch {
    throw new apiError(401, "Invalid or expired refresh token");
  }
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) throw new apiError(404, "User not found");

  const otp = generateOTP();

  user.resetOTP = hashOTP(otp);
  user.resetOTPExpire = Date.now() + 10 * 60 * 1000;

  await user.save();
  await sendPasswordResetEmail(email, otp);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password reset OTP sent"));
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const user = await User.findOne({ email }).select(
    "+resetOTP +resetOTPExpire"
  );

  if (!user) throw new apiError(404, "User not found");

  if (
    user.resetOTP !== hashOTP(otp) ||
    user.resetOTPExpire < Date.now()
  ) {
    throw new apiError(400, "Invalid or expired OTP");
  }

  user.password = newPassword;
  user.resetOTP = undefined;
  user.resetOTPExpire = undefined;

  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password reset successfully"));
});

export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken;

  if (token) {
    const hashed = hashToken(token);
    await User.updateOne(
      { refreshToken: hashed },
      { $unset: { refreshToken: 1 } }
    );
  }

  return res
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .status(200)
    .json(new ApiResponse(200, {}, "Logout successful"));
});

export const getMe = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, req.user));
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, dob, gender, bio, avatar } = req.body;

  const updateFields = {};
  if (name   != null) updateFields.name   = String(name).trim();
  if (phone  != null) updateFields.phone  = String(phone).trim();
  if (dob   !== undefined) updateFields.dob = dob || null;
  if (gender != null) updateFields.gender  = gender;
  if (bio    != null) updateFields.bio     = String(bio).trim().slice(0, 300);
  // Uploaded file takes priority; fall back to URL string from body
  if (req.file)                 updateFields.avatar = req.file.path;
  else if (avatar != null)      updateFields.avatar = String(avatar).trim();

  const updated = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updateFields },
    { new: true, runValidators: true }
  ).select("-password -refreshToken -emailOTP -emailOTPExpire -resetOTP -resetOTPExpire");

  return res.status(200).json(new ApiResponse(200, updated, "Profile updated successfully"));
});