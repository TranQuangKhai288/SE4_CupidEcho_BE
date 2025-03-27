import mongoose, { Schema, Document } from "mongoose";

import {
  ICondition,
  IConditionDocument,
} from "../interfaces/condition.interface";
// Định nghĩa interface cho document Condition

const conditionSchema = new Schema<IConditionDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    desired_gender: {
      type: String,
      enum: ["male", "female", "another"],
      default: "another",
    },
    max_distance_km: { type: Number, default: 10 },
    interest_weight: { type: Number, default: 4 },
    distance_weight: { type: Number, default: 2 },
    zodiac_weight: { type: Number, default: 2 },
    age_weight: { type: Number, default: 2 },
    max_age_difference: { type: Number, default: 2 },
    candidateList: [
      {
        candidateId: { type: Schema.Types.ObjectId, ref: "User" },
        score: { type: Number, min: 0, max: 10 },
      },
    ],
  },
  {
    timestamps: true,
    toObject: {
      transform: (doc, ret) => {
        ret.userId = ret.userId.toString(); // Chuyển userId thành string
        return ret;
      },
    },
    toJSON: {
      transform: (doc, ret) => {
        ret.userId = ret.userId.toString(); // Chuyển userId thành string
        return ret;
      },
    },
  }
);

const UserCondition = mongoose.model<IConditionDocument>(
  "Condition",
  conditionSchema
);
export default UserCondition;
export { IConditionDocument }; // Export kiểu để sử dụng nếu cần
