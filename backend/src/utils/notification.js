import Notification from "../models/Notification.model.js";

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

  // 🔥 Real-time emit
  const io = global.io;   // we’ll set this in server.js

  if (io) {
    io.to(`user:${userId}`).emit("notification", notification);
  }

  return notification;
};