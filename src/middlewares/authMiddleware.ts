import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import User from "../models/user";

interface DecodedToken {
  id: string;
}

export const authMiddlewareAuthentication: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tokenHeader = req.headers.authorization;
    if (!tokenHeader || !tokenHeader.startsWith("Bearer ")) {
      res.status(401).json({
        status: "Error",
        message: "Authentication failed",
      });
      return;
    }
    const token = tokenHeader.split(" ")[1];

    const accessTokenSecret = process.env.ACCESS_TOKEN;
    if (!accessTokenSecret) {
      res.status(500).json({
        status: "Error",
        message: "Internal server error",
      });
      return;
    }

    const decoded = await new Promise<DecodedToken>((resolve, reject) => {
      jwt.verify(token, accessTokenSecret, (err, decoded) => {
        if (err) {
          reject(err);
        } else {
          resolve(decoded as DecodedToken);
        }
      });
    });

    const user = await User.findOne({ _id: decoded.id });
    if (!user) {
      res.status(401).json({
        status: "Error",
        message: "User not found",
      });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({
      status: "Error",
      message: (err as Error).message,
    });
    return;
  }
};

export const authMiddlewareAdmin: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Lấy token từ header
    const tokenHeader = req.headers.authorization;
    if (!tokenHeader || !tokenHeader.startsWith("Bearer ")) {
      res.status(401).json({
        status: "Error",
        message: "Authentication failed",
      });
      return;
    }
    const token = tokenHeader.split(" ")[1];

    // Kiểm tra access token secret
    const accessTokenSecret = process.env.ACCESS_TOKEN;
    if (!accessTokenSecret) {
      res.status(500).json({
        status: "Error",
        message: "Internal server error",
      });
      return;
    }

    // Giải mã token bằng Promise để dùng async/await
    const decoded = await new Promise<DecodedToken>((resolve, reject) => {
      jwt.verify(token, accessTokenSecret, (err, decoded) => {
        if (err) {
          reject(err);
        } else {
          resolve(decoded as DecodedToken);
        }
      });
    });

    // Tìm user trong database
    const user = await User.findOne({ _id: decoded.id });
    if (!user || !user.isAdmin) {
      res.status(401).json({
        status: "Error",
        message: "User not found or not an admin",
      });
      return;
    }

    // Gán user vào req.user và gọi next()
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({
      status: "Error",
      message: (err as Error).message,
    });
    return;
  }
};
