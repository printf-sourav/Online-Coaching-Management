import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import helmet from "helmet"
import morgan from "morgan"
import compression from "compression"
const app = express()
import rateLimit from "express-rate-limit";

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 5, 
    message: "Too many auth attempts, please try again later"
});

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/refresh", authLimiter);


app.use(express.json());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(helmet());
app.use(morgan("dev"));
app.use(compression());
app.use(cookieParser())

import authRoutes from "./routes/auth.routes.js"
import enrollmentRoutes from "./routes/enrollment.routes.js"
import classRoutes from "./routes/class.routes.js"
import attendanceRoutes from "./routes/attendance.routes.js"
import adminRoutes from "./routes/admin.routes.js"
import paymentRoutes from "./routes/payment.routes.js"
import adminAnalyticsRoutes from "./routes/adminAnalytics.routes.js"
import studentRoutes from "./routes/students.routes.js"
import teacherRoutes from "./routes/teacher.routes.js"
import notificationRoutes from "./routes/notificaton.routes.js"
import demoRoutes from "./routes/demo.routes.js"
import scheduleRoutes from "./routes/schedule.routes.js"
import assignmentRoutes from "./routes/assignment.routes.js"
import submissionRoutes from "./routes/submission.routes.js"
import feeRoutes from "./routes/fee.routes.js"

import errorHandler from "./middleware/errorHandler.js"

app.use("/api/auth", authRoutes)
app.use("/api/enrollments", enrollmentRoutes)
app.use("/api/classes", classRoutes)
app.use("/api/attendance", attendanceRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/payments", paymentRoutes)
app.use("/api/admin/analytics", adminAnalyticsRoutes)
app.use("/api/student", studentRoutes)
app.use("/api/teacher", teacherRoutes)
app.use("/api/notifications", notificationRoutes)
app.use("/api/demos", demoRoutes)
app.use("/api/schedule", scheduleRoutes)
app.use("/api/teacher/assignments", assignmentRoutes)
app.use("/api/teacher/submissions", submissionRoutes)
app.use("/api/fees", feeRoutes)

app.use(errorHandler)





export {app}