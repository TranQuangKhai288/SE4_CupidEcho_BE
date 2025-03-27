import mongoose, { Schema } from "mongoose";

const interestSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  description: String, // Tùy chọn mô tả sở thích
  groupId: {
    type: Schema.Types.ObjectId, // Tham chiếu đến InterestGroups
    ref: "InterestGroup",
    required: true,
  },
});

const Interest = mongoose.model("Interest", interestSchema);

export default Interest;
