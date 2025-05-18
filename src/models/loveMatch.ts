// models/Like.ts
import mongoose from "mongoose";

const LoveMatchSchema = new mongoose.Schema({
  fromUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  toUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isMatched: {
    type: Boolean,
    default: false, // set to true if both sides like each other
  },
});
const LoveMatchModel = mongoose.model("LoveMatch", LoveMatchSchema);

export default LoveMatchModel;
