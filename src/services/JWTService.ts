import jwt from "jsonwebtoken";

// const dotenv = require("dotenv");
// dotenv.config();

export const genneralAccessToken = async (payload: any) => {
  if (!process.env.ACCESS_TOKEN) {
    throw new Error("ACCESS_TOKEN is not defined in environment variables");
  }
  const access_token = jwt.sign(
    {
      ...payload,
    },
    process.env.ACCESS_TOKEN,
    { expiresIn: "1d" }
  );

  return access_token;
};

export const genneralRefreshToken = async (payload: any) => {
  if (!process.env.REFRESH_TOKEN) {
    throw new Error("REFRESH_TOKEN is not defined in environment variables");
  }
  const refresh_token = jwt.sign(
    {
      ...payload,
    },
    process.env.REFRESH_TOKEN,
    { expiresIn: "365d" }
  );

  return refresh_token;
};

// Hàm để làm mới access token
export const refreshAccessToken = async (refreshToken: string) => {
  try {
    // Kiểm tra nếu REFRESH_TOKEN không được định nghĩa
    if (!process.env.REFRESH_TOKEN) {
      throw new Error("REFRESH_TOKEN is not defined in environment variables");
    }

    // Xác minh refresh token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN) as any;

    // Loại bỏ các thuộc tính không cần thiết (iat và exp) khỏi payload
    const { exp, iat, ...cleanedPayload } = decoded;

    // Tạo access token mới với payload đã làm sạch
    if (!process.env.ACCESS_TOKEN) {
      throw new Error("ACCESS_TOKEN is not defined in environment variables");
    }

    const newAccessToken = jwt.sign(
      cleanedPayload, // Chỉ giữ lại các trường cần thiết như id, isAdmin
      process.env.ACCESS_TOKEN,
      { expiresIn: "1d" } // Thời hạn của access token mới
    );

    // Trả về access token, refresh token và payload đã làm sạch
    return {
      accessToken: newAccessToken,
      refreshToken, // Trả về refresh token cũ nếu cần thiết
      payload: cleanedPayload, // Payload đã làm sạch
    };

    // return newAccessToken;
  } catch (error) {
    throw new Error("Invalid or expired refresh token");
  }
};
