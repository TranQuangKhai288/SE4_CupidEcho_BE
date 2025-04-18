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
import { runMatchingProcess } from "./services/galeShapley/matching";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";

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

routes(app);

// Kết nối database và Redis
const startServices = async () => {
  try {
    await Database.getInstance();
    await Redis.getInstance();
  } catch (err) {
    console.error("Failed to connect to MongoDB or Redis:", err);
    process.exit(1);
  }
};

// Chạy thuật toán ghép đôi định kỳ
setInterval(async () => {
  try {
    // Chạy thuật toán ghép đôi
    await runMatchingProcess(io);
  } catch (error) {
    console.error("Error running matching process:", error);
  }
}, 1000 * 5); // Chạy mỗi 5 seconds

// Graceful shutdown
const shutdown = async () => {
  console.log("Shutting down server...");
  await Redis.getInstance().then((redis) => redis.disconnect());
  server.close(() => {
    console.log("Server closed");
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
      //log ipV4 address của server
      const interfaces = require("os").networkInterfaces();
      for (const interfaceName in interfaces) {
        const networkInterface = interfaces[interfaceName];
        for (const addressInfo of networkInterface) {
          if (addressInfo.family === "IPv4" && !addressInfo.internal) {
            console.log(`IP Address: http://${addressInfo.address}:${PORT}`);
          }
        }
      }
    });
  })
  .catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
