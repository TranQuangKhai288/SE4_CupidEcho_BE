import { Request, Response } from "express";
import { userServices } from "../services";
import { IUser } from "../interfaces/user.interface";
import { IApiResponse } from "../interfaces/response.interface";
// import { sendEmail } from "../services/emailService";
import * as crypto from "crypto";

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

    const createdUser = await userServices.createUser(req.body);
    if (typeof createdUser === "string") {
      res.status(400).json({
        status: "ERR",
        message: createdUser,
      } as IApiResponse<null>);
      return;
    }
    res.status(201).json({
      status: "OK",
      message: "User created successfully",
      data: createdUser,
    } as unknown as IApiResponse<IUser>);
    console.log("User created successfully");
  } catch (error) {
    res.status(500).json({
      status: "ERR",
      message: "An error occurred while creating the user",
    } as IApiResponse<null>);
  }
};

// const verifyEmail = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const { token, name, email, password, gender } = req.query as {
//       [key: string]: string;
//     };

//     // Kiểm tra token
//     if (
//       !emailVerificationTokens[email] ||
//       emailVerificationTokens[email] !== token
//     ) {
//       res.status(400).json({
//         status: "ERR",
//         message: "Invalid or expired verification token",
//       } as IApiResponse<null>);
//       return;
//     }

//     // Token hợp lệ => Xóa token
//     delete emailVerificationTokens[email];

//     // Tạo user
//     const user: IUser = { name, email, password };
//     const createdUser = await userServices.createUser(user);

//     res.status(201).json({
//       status: "OK",
//       message: "Email verified and user created successfully",
//       data: createdUser,
//     } as unknown as IApiResponse<IUser>);
//   } catch (error) {
//     res.status(500).json({
//       status: "ERR",
//       message: "An error occurred during email verification",
//     } as IApiResponse<null>);
//   }
// };

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

export default {
  createUser,
  loginUser,
  // verifyEmail,
};
