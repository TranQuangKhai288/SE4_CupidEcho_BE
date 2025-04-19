import mongoose, { Schema } from "mongoose";
const matchHistorySchema = new mongoose.Schema({
  userId1: { type: Schema.Types.ObjectId, required: true },
  userId2: { type: Schema.Types.ObjectId, required: true },
  conversationId: { type: Schema.Types.ObjectId, required: true },
  timestamp: { type: Date, default: Date.now },
});
const MatchHistory = mongoose.model("MatchHistory", matchHistorySchema);

export default MatchHistory;
