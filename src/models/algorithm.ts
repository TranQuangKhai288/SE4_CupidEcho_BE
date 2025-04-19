import mongoose from "mongoose";
const algorithmSchema = new mongoose.Schema({
  minUser: { type: Number, required: true, default: 20 }, // Số lượng người tối thiểu ban đầu
  maxWaitTime: { type: Number, required: true, default: 30000 }, // Thời gian chờ de giam minUser: 30 giây
  userTimeout: { type: Number, required: true, default: 120000 }, // Timeout cá nhân: 2 phút
});

const Algorithm = mongoose.model("Algorithm", algorithmSchema);

export default Algorithm;
