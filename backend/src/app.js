import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { getAllowedOrigins, isOriginAllowed } from "./config/allowedOrigins.js";

// ── Route imports ────────────────────────────────────────────────────────────
import authRoutes from "./routes/auth.routes.js";
import enrollmentRoutes from "./routes/enrollment.routes.js";
import classRoutes from "./routes/class.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import adminAnalyticsRoutes from "./routes/adminAnalytics.routes.js";
import studentRoutes from "./routes/students.routes.js";
import teacherRoutes from "./routes/teacher.routes.js";
import notificationRoutes from "./routes/notificaton.routes.js";
import demoRoutes from "./routes/demo.routes.js";
import scheduleRoutes from "./routes/schedule.routes.js";
import assignmentRoutes from "./routes/assignment.routes.js";
import submissionRoutes from "./routes/submission.routes.js";
import feeRoutes from "./routes/fee.routes.js";
import errorHandler from "./middleware/errorHandler.js";

// ── App setup ────────────────────────────────────────────────────────────────
const app = express();
const allowedOrigins = getAllowedOrigins();
const isProd = process.env.NODE_ENV === "production";

// ── Security middleware ──────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin, allowedOrigins)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// Body parsers with size limits to prevent payload attacks
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());
app.use(compression());

// Logging — only use "dev" format in development, skip in production for perf
if (!isProd) {
  app.use(morgan("dev"));
} else {
  // Minimal logging in production — only errors
  app.use(
    morgan("combined", {
      skip: (_req, res) => res.statusCode < 400,
    })
  );
}

// ── Rate limiting ────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many auth attempts, please try again later" },
});

// General API rate limiter — prevents abuse across all endpoints
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please slow down" },
});

app.use("/api", apiLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/refresh", authLimiter);
app.use("/api/auth/forgot-password", authLimiter);

// ── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin/analytics", adminAnalyticsRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/demos", demoRoutes);
app.use("/api/schedule", scheduleRoutes);
app.use("/api/teacher/assignments", assignmentRoutes);
app.use("/api/teacher/submissions", submissionRoutes);
app.use("/api/fees", feeRoutes);

// ── 404 handler for unmatched routes ─────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ── Error handler (must be last) ─────────────────────────────────────────────
app.use(errorHandler);

export { app };