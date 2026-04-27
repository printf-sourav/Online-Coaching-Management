import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const connectionIns = await mongoose.connect(process.env.MONGO_URI);
    console.log(
      `\n MongoDB connected! DB host: ${connectionIns.connection.host}`
    );
  } catch (error) {
    console.error("MONGODB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;