import express from "express";
import { IUser } from "../../interfaces/user.interface";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}
