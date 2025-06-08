import { Request, Response } from "express";
import { userServices } from "../services";
import { IUser } from "../interfaces/user.interface";
import { IApiResponse } from "../interfaces/response.interface";
// import { sendEmail } from "../services/emailService";
import * as crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { User } from "../models";
import Redis from "../config/redis";
dotenv.config();

// Bộ nhớ tạm thời cho token xác nhận (nên thay bằng Redis hoặc DB)
const emailVerificationTokens: { [key: string]: string } = {};

const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // Kiểm tra đầu vào
    if (!name || !email || !password || !confirmPassword) {
      res.status(400).json({
        status: "ERR",
        message: "All fields are required",
      } as IApiResponse<null>);
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({
        status: "ERR",
        message: "Passwords do not match",
      } as IApiResponse<null>);
      return;
    }

    const reg = /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
    if (!reg.test(email)) {
      res.status(400).json({
        status: "ERR",
        message: "Invalid email format",
      } as IApiResponse<null>);
      return;
    }

    // Kiểm tra email đã tồn tại
    const existingUser = await userServices.checkUser(email);
    if (existingUser) {
      res.status(400).json({
        status: "ERR",
        message: "Email already exists",
      } as IApiResponse<null>);
      return;
    }

    // Tạo user

    const verifyEmail = await userServices.verifyEmail(req.body);
    if (typeof verifyEmail === "string") {
      res.status(400).json({
        status: "ERR",
        message: verifyEmail,
      } as IApiResponse<null>);
      return;
    }
    res.status(201).json({
      status: "OK",
      message: verifyEmail.message,
    } as unknown as IApiResponse<any>);
    console.log("Mailed");
  } catch (error) {
    res.status(500).json({
      status: "ERR",
      message: "An error occurred while creating the user",
    } as IApiResponse<null>);
  }
};

const verifiedEmail = async (req: Request, res: Response) => {
  const { token } = req.query;
  try {
    const decoded: any = jwt.verify(token as string, process.env.EMAIL_SECRET!);

    const { name, email, password } = decoded;
    const createdUser = await userServices.createUser({
      name,
      email,
      password,
    });

    res.status(200).json({
      status: "OK",
      message: "Xác minh email thành công, tài khoản đã được tạo.",
      data: createdUser,
    });
    return;
  } catch (err) {
    console.error("Token hết hạn hoặc không hợp lệ", err);
    res.status(400).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    return;
  }
};

const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        status: "ERR",
        message: "Email and password are required",
      } as IApiResponse<null>);
      return;
    }

    const reg = /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
    if (!reg.test(email)) {
      res.status(400).json({
        status: "ERR",
        message: "Invalid email format",
      } as IApiResponse<null>);
      return;
    }

    const response = await userServices.loginUser({ email, password });
    if (typeof response === "string") {
      res.status(400).json({
        status: "ERR",
        message: response,
      } as IApiResponse<null>);
      return;
    }

    const { data, access_token, refresh_token } = response;
    res.cookie("refresh_token", refresh_token, {
      httpOnly: true,
      secure: false, // Đặt true nếu dùng HTTPS
      sameSite: "strict",
      path: "/",
    });

    res.status(200).json({
      status: "OK",
      message: "Login successful",
      data,
      access_token,
      refresh_token,
    } as unknown as IApiResponse<IUser>);
    console.log("Login successful");
  } catch (error) {
    res.status(500).json({
      status: "ERR",
      message: "An error occurred during login",
    } as IApiResponse<null>);
  }
};

const verifiedOTP = async (req: Request, res: Response) => {
  try {
    console.log("verifiedOTP");
    const redis = await Redis.getInstance();
    const { email, otp } = req.body;
    const savedOTP = await redis.getClient().get(`otp:${email}`);
    console.log(savedOTP, "savedOTP");
    console.log(otp, "otp");
    if (savedOTP === otp) {
      await redis.getClient().del(`otp:${email}`);

      res.status(200).json({
        status: "OK",
        message: "OTP verified. You can reset your password now.",
      });
      return;
    } else {
      res.status(400).json({
        status: "ERR",
        message: "OTP unverified. Let check your gmail again",
      });
      return;
    }
  } catch (err) {
    res.status(400).json({ status: "ERR", message: "Invalid or expired OTP" });

    return;
  }
};

const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, newPassword } = req.body;
    const hash = bcrypt.hashSync(newPassword, 10);
    const user = await User.findOneAndUpdate(
      { email: email },
      {
        password: hash,
      }
    );
    console.log(user, "updatepass");

    res.json({ status: "OK", message: "Password reset successfully!" });
    return;
  } catch (err) {
    res.status(400).json({ status: "ERR", message: "Invalid or expired OTP" });

    return;
  }
};

export default {
  createUser,
  loginUser,
  verifiedEmail,
  verifiedOTP,
  resetPassword,
};
