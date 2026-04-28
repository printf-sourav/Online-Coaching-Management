import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri || typeof uri !== "string") {
      throw new Error(
        "MONGO_URI is not set. Add it to backend/.env (copy from .env.example) or export it in your shell."
      );
    }
    const connectionIns = await mongoose.connect(uri);
    console.log(
      `\n MongoDB connected! DB host: ${connectionIns.connection.host}`
    );
  } catch (error) {
    console.error("MONGODB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;