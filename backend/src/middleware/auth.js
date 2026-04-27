import jwt from "jsonwebtoken";
import User from "../models/User.model.js";
import { apiError } from "../utils/apiError.js";

/**
 * Validates the JWT access token and attaches req.user.
 * Accepts tokens from cookies or Authorization header (Bearer <token>).
 */
export const requireAuth = async (req, _res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.slice(7)
        : null);

    if (!token) throw new apiError(401, "Unauthorized — no token provided");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select(
      "-password -refreshToken -emailOTP -emailOTPExpire -resetOTP -resetOTPExpire"
    );

    if (!user) throw new apiError(401, "User no longer exists");
    if (!user.isActive) throw new apiError(403, "Account is deactivated");

    req.user = user;
    next();
  } catch (err) {
    // Differentiate JWT errors for clearer client feedback
    if (err instanceof jwt.TokenExpiredError) {
      return next(new apiError(401, "Token expired — please refresh"));
    }
    if (err instanceof jwt.JsonWebTokenError) {
      return next(new apiError(401, "Invalid token"));
    }
    next(err.statusCode ? err : new apiError(401, err.message || "Unauthorized"));
  }
};

/**
 * Role-based middleware factories.
 * Must be used AFTER requireAuth.
 */
export const requireAdmin = (req, _res, next) => {
  if (req.user?.role !== "admin") {
    return next(new apiError(403, "Admin access only"));
  }
  next();
};

export const requireTeacher = (req, _res, next) => {
  if (req.user?.role !== "teacher") {
    return next(new apiError(403, "Teacher access only"));
  }
  next();
};

export const requireStudent = (req, _res, next) => {
  if (req.user?.role !== "student") {
    return next(new apiError(403, "Student access only"));
  }
  next();
};