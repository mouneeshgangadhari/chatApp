import mongoose from "mongoose";

export const connectDB = async () => {
  const MONGODB_URI="mongodb+srv://<UserName>:<Password>@cluster0.h0mmm.mongodb.net/chat_db";

  try {
    const conn = await mongoose.connect(MONGODB_URI);

    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.log("MongoDB connection error:", error);
  }
};
