import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";

import { connectDB } from "./lib/db.js";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import { app, server } from "./lib/socket.js";

dotenv.config();  // Load environment variables at the top
const PORT = process.env.PORT || 8080;

connectDB();  // Ensure MongoDB connects first

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// Serve frontend in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(path.resolve(), "../frontend/dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(path.resolve(), "../frontend/dist", "index.html"));
  });
}

server.listen(PORT, () => {
  console.log(`🚀 Server running on port: ${PORT}`);
});
