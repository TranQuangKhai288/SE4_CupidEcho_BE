import { Socket } from "socket.io";
import jwt from "jsonwebtoken"; // Giả sử bạn dùng jsonwebtoken để xác thực
import { promisify } from "util";
interface DecodedToken {
  _id: string;
  [key: string]: any;
}

// Middleware xác thực cho Socket.IO

const socketAuthMiddleware = async (
  socket: Socket,
  next: (err?: Error) => void
) => {
  const token = socket.handshake.auth.token || socket.handshake.query.token;
  //   console.log(socket.handshake.query.token, "socket.handshake.query");
  if (!token) {
    console.log("Token cho socket không được cung cấp");
    return next(new Error("Token không được cung cấp"));
  }
  async function decodeToken(
    token: string,
    accessTokenSecret: string
  ): Promise<DecodedToken> {
    return new Promise((resolve, reject) => {
      jwt.verify(token, accessTokenSecret, (err, decoded) => {
        if (err) {
          reject(err);
        } else {
          resolve(decoded as DecodedToken);
        }
      });
    });
  }
  try {
    const accessTokenSecret = process.env.ACCESS_TOKEN;
    if (!accessTokenSecret) {
      console.log("ACCESS_TOKEN không được cung cấp");
      return next(new Error("ERROR - ACCESS_TOKEN không được cung cấp"));
    }

    const decoded = await decodeToken(token, accessTokenSecret);

    // Lưu userId vào socket để sử dụng trong các sự kiện sau này
    socket.handshake.auth.userId = decoded.id;
    console.log("Xác thực token thành công");

    console.log("userId", socket.handshake.auth.userId);
    next();
  } catch (error) {
    console.log(error, "Lỗi khi xác thực token");
    next(new Error("Token không hợp lệ"));
  }
};

export default socketAuthMiddleware;
