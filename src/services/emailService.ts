import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

export async function sendVerificationEmail(to: string, link: string) {
  try {
    const transporter = nodemailer.createTransport({
      service: "Gmail", // hoặc SMTP của bạn
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const res = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: "Verify account",
      html: `
      <h2>Verify email</h2>
      <p>Click the link below to verify your email:</p>
      <a href="${link}">${link}</a>
    `,
    });
    console.log(res, "restransporter");
  } catch (e) {
    console.log(e, "err restransporter");
  }
}

export async function sendVerificationEmailByOTP(to: string, otp: string) {
  try {
    const transporter = nodemailer.createTransport({
      service: "Gmail", // hoặc SMTP của bạn
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const res = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: "Verify account",
      html: `
      <h2>OTP for reset your password</h2>
      <p>Your verification code is: <b>${otp}</b></p>`,
    });
  } catch (e) {
    console.log(e, "err restransporter");
  }
}
