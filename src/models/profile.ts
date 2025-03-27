import mongoose, { Schema, Document } from "mongoose";
import { IProfile, IProfileDocument } from "../interfaces/profile.interface";
import {
  updateAllCandidateLists,
  updateCandidateList,
} from "../services/candidate";
import UserCondition from "./condition";

const profileSchema = new Schema<IProfileDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    gender: {
      type: String,
      required: true,
      enum: ["male", "female", "another"],
    },
    address: {
      formattedAddress: { type: String },
      city: { type: String },
      country: { type: String },
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: false,
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: false,
        default: [0, 0],
      },
    },
    interests: [{ type: Schema.Types.ObjectId, ref: "Interest", default: [] }],
    birthDate: { type: Date },
    zodiac: {
      type: String,
      default: "Unknown",
      enum: [
        "Aries",
        "Taurus",
        "Gemini",
        "Cancer",
        "Leo",
        "Virgo",
        "Libra",
        "Scorpio",
        "Sagittarius",
        "Capricorn",
        "Aquarius",
        "Pisces",
        "Unknown",
      ],
    },
    isActivated: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toObject: {
      transform: (doc, ret) => {
        ret.userId = ret.userId.toString(); // Chuyển userId thành string
        if (ret.interests) {
          ret.interests = ret.interests.map((id: mongoose.Types.ObjectId) =>
            id.toString()
          );
        }
        return ret as IProfile; // Đảm bảo ép kiểu trong schema
      },
    },
    toJSON: {
      transform: (doc, ret) => {
        ret.userId = ret.userId.toString(); // Chuyển userId thành string
        if (ret.interests) {
          ret.interests = ret.interests.map((id: mongoose.Types.ObjectId) =>
            id.toString()
          );
        }
        return ret as IProfile; // Đảm bảo ép kiểu trong schema
      },
    },
  }
);

profileSchema.index({ location: "2dsphere" });
profileSchema.index({ interests: 1 });

// Cập nhật danh sách ghép đôi khi có thay đổi về thông tin cá nhân
// profileSchema.post("save", async function (doc) {
//   console.log("update Candidate List");
//   await updateCandidateList(doc.userId.toString());
//   // Cập nhật danh sách của những người khác có thể bị ảnh hưởng
//   await UserCondition.updateMany(
//     { "candidateList.candidateId": doc.userId },
//     { $pull: { candidateList: { candidateId: doc.userId } } }
//   );
//   await updateAllCandidateLists(); // Tạm thời, có thể tối ưu sau
// });

const Profile = mongoose.model<IProfileDocument>("Profile", profileSchema);
export default Profile;
