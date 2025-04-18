import mongoose from "mongoose";
const algorithmSchema = new mongoose.Schema({
  zodiacSign: { type: String, required: true, unique: true },
  compatibility: {
    type: Map,
    of: Number, // Giá trị điểm số tương thích
    required: true,
  },
});

const Algorithm = mongoose.model("Algorithm", algorithmSchema);

export default Algorithm;
