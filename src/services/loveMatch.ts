import { LoveMatch } from "../models";
import { Types } from "mongoose";

const getAllLoveMatches = async () => {
  return await LoveMatch.find()
    .populate("fromUser", "-password")
    .populate("toUser", "-password")
    .sort({ createdAt: -1 });
};

const getLoveMatchById = async (id: string) => {
  if (!Types.ObjectId.isValid(id)) return null;
  return await LoveMatch.findById(id)
    .populate("fromUser", "-password")
    .populate("toUser", "-password");
};

const createLoveMatch = async (fromUser: string, toUser: string) => {
  // Check if the like already exists
  const existing = await LoveMatch.findOne({ fromUser, toUser });
  if (existing) return existing;

  // Check if the toUser already liked fromUser before → mutual like
  const reciprocal = await LoveMatch.findOne({
    fromUser: toUser,
    toUser: fromUser,
  });

  let isMatched = false;

  if (reciprocal) {
    // Set both documents as matched
    reciprocal.isMatched = true;
    await reciprocal.save();
    isMatched = true;
  }

  const newMatch = new LoveMatch({ fromUser, toUser, isMatched });
  return await newMatch.save();
};

const updateLoveMatch = async (id: string, updateData: any) => {
  if (!Types.ObjectId.isValid(id)) return null;
  return await LoveMatch.findByIdAndUpdate(id, updateData, {
    new: true,
  });
};

const deleteLoveMatch = async (id: string) => {
  if (!Types.ObjectId.isValid(id)) return false;
  const deleted = await LoveMatch.findByIdAndDelete(id);
  return !!deleted;
};

const getLikesSentByUser = async (userId: string) => {
  return await LoveMatch.find({ fromUser: userId }).populate(
    "toUser",
    "-password"
  );
};

const getLikesReceivedByUser = async (userId: string) => {
  return await LoveMatch.find({ toUser: userId }).populate(
    "fromUser",
    "-password"
  );
};

const getMatchedUsers = async (userId: string) => {
  return await LoveMatch.find({
    $or: [{ fromUser: userId }, { toUser: userId }],
    isMatched: true,
  })
    .populate("fromUser", "-password")
    .populate("toUser", "-password");
};

export const loveMatchService = {
  getAllLoveMatches,
  getLoveMatchById,
  createLoveMatch,
  updateLoveMatch,
  deleteLoveMatch,
  getLikesSentByUser,
  getLikesReceivedByUser,
  getMatchedUsers,
};
