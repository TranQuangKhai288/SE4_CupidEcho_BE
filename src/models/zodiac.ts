import mongoose from "mongoose";
const zodiacCompatibilitySchema = new mongoose.Schema({
  zodiacSign: { type: String, required: true, unique: true },
  compatibility: {
    type: Map,
    of: Number, // Giá trị điểm số tương thích
    required: true,
  },
});

const ZodiacCompatibility = mongoose.model(
  "ZodiacCompatibility",
  zodiacCompatibilitySchema
);

export default ZodiacCompatibility;
