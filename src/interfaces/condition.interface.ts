import { ObjectId } from "mongoose";

export interface ICondition {
  userId: string; // Chỉ dùng string, bỏ ObjectId
  desired_gender: string;
  max_distance_km: number;
  interest_weight: number;
  distance_weight: number;
  zodiac_weight: number;
  age_weight: number;
  max_age_difference: number;
  candidateList?: { candidateId: string; score: number }[]; // Danh sách candidates
}

export interface IConditionDocument extends Omit<ICondition, "userId"> {
  userId: ObjectId;
}
