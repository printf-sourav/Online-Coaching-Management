import express from "express";
import {
  registerUser,
  verifyRegister,
  resendVerificationOTP,
  loginUser,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
  logout,
  getMe,
  updateProfile,
} from "../controllers/auth.controller.js";

import { requireAuth } from "../middleware/auth.js";
import { uploadAvatar } from "../middleware/multer.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/verify-register", verifyRegister);
router.post("/resend-otp", resendVerificationOTP);

router.post("/login", loginUser);
router.post("/refresh-token", refreshAccessToken);
router.post("/logout", logout);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.get("/me", requireAuth, getMe);
router.put("/profile", requireAuth, uploadAvatar.single("avatar"), updateProfile);

export default router;