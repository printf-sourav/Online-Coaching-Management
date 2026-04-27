/**
 * One-time admin seeder
 * Usage:  npm run seed:admin
 *
 * Reads credentials from env (or the defaults below).
 * Set ADMIN_NAME / ADMIN_EMAIL / ADMIN_PASSWORD in your Railway or local environment,
 * or just edit the DEFAULTS block before running.
 */

import mongoose from "mongoose";
import User from "../models/User.model.js";

// ── DEFAULTS (override via env) ────────────────────────────────────────────
const NAME     = process.env.ADMIN_NAME     || "Super Admin";
const EMAIL    = process.env.ADMIN_EMAIL    || "admin@meritnook.com";
const PASSWORD = process.env.ADMIN_PASSWORD || "Admin@1234";
// ──────────────────────────────────────────────────────────────────────────

const URI = process.env.MONGO_URI;
if (!URI) {
  console.error("❌  MONGO_URI is not set. Make sure it is defined in the environment.");
  process.exit(1);
}

await mongoose.connect(URI);
console.log("✅  MongoDB connected");

const existing = await User.findOne({ email: EMAIL });
if (existing) {
  if (existing.role === "admin") {
    console.log(`ℹ️   Admin already exists → ${EMAIL}`);
  } else {
    console.log(`⚠️   A non-admin user with email ${EMAIL} already exists. Aborting.`);
  }
  await mongoose.disconnect();
  process.exit(0);
}

await User.create({
  name:       NAME,
  email:      EMAIL,
  password:   PASSWORD,   // hashed by the pre-save hook in User.model.js
  role:       "admin",
  isVerified: true,
  isActive:   true,
});

console.log(`🎉  Admin created!`);
console.log(`    Email    : ${EMAIL}`);
console.log(`    Password : ${PASSWORD}`);
console.log(`    (Change the password after first login)`);

await mongoose.disconnect();
process.exit(0);
