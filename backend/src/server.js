import "./config/loadEnv.js";
import connectDB from "./db/index.js";
import { app } from "./app.js";
import { createServer } from "http";
import { Server } from "socket.io";
import initSocket from "./sockets/index.js";
import { startScheduler } from "./utils/scheduler.js";
import {
  getAllowedOrigins,
  isOriginAllowed,
} from "./config/allowedOrigins.js";
import { setApp as setNotificationApp } from "./utils/notification.js";

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    const httpServer = createServer(app);
    const socketOrigins = getAllowedOrigins();

    const io = new Server(httpServer, {
      cors: {
        origin: (origin, cb) => {
          cb(null, isOriginAllowed(origin, socketOrigins));
        },
        credentials: true,
      },
      pingTimeout: 60000,
    });

    initSocket(io);

    // Make io accessible to request handlers via app.get("io")
    app.set("io", io);
    setNotificationApp(app);

    httpServer.listen(PORT, () => {
      console.log(`Server running on port: ${PORT}`);
      startScheduler();
    });
  })
  .catch((err) => {
    console.error("MONGODB connection failed:", err.message);
    process.exit(1);
  });

// ── Graceful shutdown ─────────────────────────────────────────────────────────
function shutdown(signal) {
  console.log(`\n${signal} received — shutting down gracefully…`);
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// Prevent unhandled promise rejections from silently killing the process
process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err?.message || err);
});