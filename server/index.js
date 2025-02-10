// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const bodyParser = require("body-parser");
const os = require("os");
const User = require("./models/User");
const connectDB = require("./ db");
const { updateSearchIndex } = require("./models/User");
const Message = require("./models/Message");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
connectDB();

// Create a new user
app.post("/register-user", async (req, res) => {
  try {
    const { userName, password } = req.body;
    console.log(userName, password);
    const user = new User({ userName, password });
    await user.save();
    res.status(201).json({ userId: user._id });
  } catch (err) {
    res.status(500).json({ error: "Failed to create user" });
  }
});
// Login a user
app.post("/login", async (req, res) => {
  try {
    const { userName, password } = req.body;
    console.log(userName, password);
    const user = await User.findOne({ userName, password });
    if (user) {
      res.status(200).json({ userId: user._id });
    } else {
      console.log("Invalid username or password");
      res.status(401).json({ error: "Invalid username or password" });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to login" });
  }
});

app.get("/get-users", async (req, res) => {
  try {
    const users = await User.find({}, "userName");
    res.status(200).json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Fetch chat history
app.get("/get-messages", async (req, res) => {
  try {
    const { userId, chatPartnerId } = req.query;

    if (!userId || !chatPartnerId) {
      return res.status(400).json({ error: "userId and chatPartnerId are required" });
    }
      
    // Fetch messages between the two users
   
    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: chatPartnerId },
        { senderId: chatPartnerId, receiverId: userId },
      ],
    }).sort({ timestamp: 1 }); // Sort by timestamp in ascending order

    res.status(200).json(messages);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Socket.io setup
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const connectedUsers = new Map(); // userId -> socketId mapping

// Handle new socket connection
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Store user connection and join room
  socket.on("user_connected", (userId) => {
    if (!userId) {
      console.error("Error: userId is null");
      return;
    }

    connectedUsers.set(userId, socket.id);
    socket.join(userId); // Each user joins a room with their userId
    console.log(`User ${userId} connected and joined room: ${userId}`);
  });

  // Handle sending messages
  socket.on("send_message",async (data) => {
    console.log("Received message:", data);

    const { userId, chatPartnerId, message, timestamp } = data;

    // Validate IDs
    if (!userId || !chatPartnerId) {
      console.error("Error: userId or chatPartnerId is missing", data);
      return;
    }
    console.log(`Sending message from ${userId} to ${chatPartnerId}`);

    try {
      // Fetch sender and receiver names
      const sender = await User.findById(userId);
      const receiver = await User.findById(chatPartnerId);

      if (!sender || !receiver) {
        console.error("Error: sender or receiver not found");
        return;
      }

      // Save the message to the database
      const newMessage = new Message({
        senderId: userId,
        senderName: sender.userName,
        receiverId: chatPartnerId,
        receiverName: receiver.userName,
        message: message,
        timestamp: timestamp,
      });
      await newMessage.save();

      console.log("Message saved to database:", newMessage);

    // Send message to both users in their respective rooms
    io.to(userId).emit("receive_message", data); // Send to sender
    io.to(chatPartnerId).emit("receive_message", data); // Send to receiver
    }catch(err){
      console.error("Failed to save message:", err);
    }
  });
 // Handle typing status
 socket.on("typing", (userId) => {
  const chatPartnerId = Array.from(connectedUsers.entries()).find(
    ([id, socketId]) => socketId === socket.id
  )?.[0];

  if (chatPartnerId) {
    io.to(chatPartnerId).emit("typing", userId); // Notify chat partner
  }
});

socket.on("stop_typing", (userId) => {
  const chatPartnerId = Array.from(connectedUsers.entries()).find(
    ([id, socketId]) => socketId === socket.id
  )?.[0];

  if (chatPartnerId) {
    io.to(chatPartnerId).emit("stop_typing", userId); // Notify chat partner
  }
});
  // Handle user disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    // Remove user from connectedUsers map
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
  });
});

const PORT = 5010;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const networkInterfaces = os.networkInterfaces();
for (const interfaceName in networkInterfaces) {
  const addresses = networkInterfaces[interfaceName];
  for (const address of addresses) {
    if (address.family === "IPv4" && !address.internal) {
      console.log(`Server is running on IP: ${address.address}`);
    }
  }
}
