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

// const refreshTokenJwtService = (token: string) => {
//   return new Promise((resolve, reject) => {
//     try {
//       if (!process.env.REFRESH_TOKEN) {
//         throw new Error("REFRESH_TOKEN is not defined in environment variables");
//       }
//       jwt.verify(
//         token,
//         process.env.REFRESH_TOKEN as string,
//         async (err: jwt.VerifyErrors | null, decoded: any) => {
//           if (err) {
//             resolve({
//               status: "ERR",
//               message: err.message,
//             });
//           }
//           const access_token = await genneralAccessToken({
//             id: user?.,
//             isAdmin: user?.isAdmin,
//           });
//           resolve({
//             status: "OK",
//             message: "SUCESS",
//             access_token,
//           });
//         }
//       );
//     } catch (e) {
//       reject(e);
//     }
//   });
// };
