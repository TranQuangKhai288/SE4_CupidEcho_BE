import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import routes from "./routes";
import { Database, Redis } from "./config";
import { Server } from "socket.io";
import http from "http";
import { setupSocketEvents } from "./sockets";
import socketAuthMiddleware from "./middlewares/socketAuthMiddleware";
import {
  initializeMatchingSystem,
  stopMatchingSystem,
} from "./services/galeShapley/matching";
import { StreamChat } from "stream-chat";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";
const { STREAM_API_SECRET, STREAM_API_KEY } = process.env;
// Tạo server HTTP
const server = http.createServer(app);

// Khởi tạo Socket.IO
const io = new Server(server, {
  cors: {
    origin: CORS_ORIGIN,
    credentials: true,
  },
});
io.use(socketAuthMiddleware);

// Xử lý sự kiện Socket.IO
setupSocketEvents(io);

// Cấu hình middleware
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
const serverClient = StreamChat.getInstance(
  STREAM_API_KEY || "",
  STREAM_API_SECRET
);

routes(app);
app.get("/stream-token", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.query.userId as string;

    if (!userId) {
      res.status(400).json({ error: "Missing userId" });
      return;
    }
    const token = serverClient.createToken(userId);
    res.status(200).json({ userId, token });
  } catch (error) {
    res.status(500).json({
      status: "ERR",
      message: "Error when getting Zodiac score by ID",
    });
  }
});

// Kết nối database và Redis
const startServices = async () => {
  try {
    await Database.getInstance();
    await Redis.getInstance();
    console.log("✅ Database and Redis connected successfully");
  } catch (err) {
    console.error("❌ Failed to connect to MongoDB or Redis:", err);
    // process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async () => {
  console.log("🛑 Shutting down server...");

  // Stop matching system
  stopMatchingSystem();

  // Disconnect Redis
  try {
    const redis = await Redis.getInstance();
    await redis.disconnect();
    console.log("✅ Redis disconnected");
  } catch (error) {
    console.error("❌ Error disconnecting Redis:", error);
  }

  // Close server
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// Khởi động server
startServices()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`⚡ Server đang chạy tại http://localhost:${PORT}`);

      // Log IPv4 address của server
      const interfaces = require("os").networkInterfaces();
      for (const interfaceName in interfaces) {
        const networkInterface = interfaces[interfaceName];
        for (const addressInfo of networkInterface) {
          if (addressInfo.family === "IPv4" && !addressInfo.internal) {
            console.log(`🌐 IP Address: http://${addressInfo.address}:${PORT}`);
          }
        }
      }

      // Khởi tạo matching system SAU KHI server đã start
      console.log("🎯 Initializing matching system...");
      initializeMatchingSystem(io);
      console.log("✅ Matching system initialized successfully");
    });
  })
  .catch((err) => {
    console.error("❌ Failed to start server:", err);
    // process.exit(1);
  });
