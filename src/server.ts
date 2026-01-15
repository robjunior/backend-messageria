import http from "http";
import { Server as SocketIOServer } from "socket.io";
import dotenv from "dotenv";
import app from "./app";

dotenv.config();

const port = process.env.PORT || 4000;

// Create HTTP server
const server = http.createServer(app);

// Create Socket.IO server
const io = new SocketIOServer(server, {
  cors: {
    origin: "*", // Adjust for production
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// Example Socket.IO connection handler
io.on("connection", (socket) => {
  console.log("A client connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Make io accessible throughout the app if needed
export { io, server };

// Start server
server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log(`Socket.IO server running on http://localhost:${port}`);
});
