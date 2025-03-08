import User from "../models/user.model.js";
import Message from "../models/message.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    // Ensure at least text or image is provided
    if (!text && !image) {
      return res.status(400).json({ error: "Message must contain text or an image" });
    }

    let imageUrl = null;

    // Upload image if present
    if (image) {
      try {
        console.log("Uploading image to Cloudinary...");
        const uploadResponse = await cloudinary.uploader.upload(image, {
          folder: "messages",
          allowed_formats: ["jpg", "png", "webp"],
          transformation: [{ width: 800, height: 800, crop: "limit" }], // Resizes image
        });
        console.log("Cloudinary Upload Response:", uploadResponse);
        imageUrl = uploadResponse.secure_url;
      } catch (error) {
        console.error("Cloudinary Upload Error:", error);
        return res.status(500).json({ error: "Image upload failed. Try again later." });
      }
    }

    // Create message instance
    const newMessage = new Message({
      senderId,
      receiverId,
      text: text?.trim() || null, // Store text only if it's not empty
      image: imageUrl,
    });

    // Save the message
    await newMessage.save();

    // Emit message via WebSocket if receiver is online
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error in sendMessage controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
