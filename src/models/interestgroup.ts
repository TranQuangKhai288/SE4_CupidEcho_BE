import mongoose, { Schema } from "mongoose";

const interestGroupSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  description: String, // Tùy chọn mô tả nhóm sở thích
});

const InterestGroup = mongoose.model("InterestGroup", interestGroupSchema);

export default InterestGroup;
