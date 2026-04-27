import Notification from "../models/Notification.model.js";

// Lazily resolved io reference (set in server.js via app.set("io", io))
let _app = null;

/**
 * Let the notification module know about the Express app
 * so it can access app.get("io") for real-time emit.
 * Called once from server.js after io is initialised.
 */
export function setApp(app) {
  _app = app;
}

export const createNotification = async ({
  userId,
  title,
  message,
  type,
  link = "",
}) => {
  const notification = await Notification.create({
    userId,
    title,
    message,
    type,
    link,
  });

  // Real-time emit
  const io = _app?.get?.("io");
  if (io) {
    io.to(`user:${userId}`).emit("notification", notification);
  }

  return notification;
};