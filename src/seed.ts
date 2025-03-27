import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import User from "./models/user";
import { IUser } from "./interfaces/user.interface";
import { IProfileDocument } from "./interfaces/profile.interface";
import { IConditionDocument } from "./interfaces/condition.interface";
// import { any } from "./interfaces/";
import Profile from "./models/profile";
import UserCondition from "./models/condition";
import ZodiacCompatibility from "./models/zodiac";
import Interest from "./models/interest";
import { ObjectId } from "mongoose";

dotenv.config();

const NUM_USERS = 5; // Tạo 100 user
const PASSWORD_HASH = bcrypt.hashSync("password123", 10); // Mật khẩu mặc định

const HOCHIMINH_LAT = 10.8231;
const HOCHIMINH_LNG = 106.6297;

// Hàm tạo vị trí ngẫu nhiên trong phạm vi TP.HCM
function getRandomLocation(): { latitude: number; longitude: number } {
  const latitudeOffset = (Math.random() - 0.5) * 0.05;
  const longitudeOffset = (Math.random() - 0.5) * 0.05;

  return {
    latitude: HOCHIMINH_LAT + latitudeOffset,
    longitude: HOCHIMINH_LNG + longitudeOffset,
  };
}

// Điều chỉnh trọng số để tổng bằng 10
function adjustWeights(weights: number[]): number[] {
  const total = weights.reduce((sum, w) => sum + w, 0);
  if (total === 0) return [2.5, 2.5, 2.5, 2.5];
  return weights.map((w) => Math.round((w / total) * 10 * 10) / 10);
}

// async function seedDatabase(): Promise<void> {
//   try {
//     mongoose.set("strictQuery", false);
//     await mongoose.connect(process.env.MONGO_DB as string);
//     console.log("🔗 Đã kết nối tới MongoDB");

//     // Lấy danh sách sở thích
//     const allInterests: any[] = await Interest.find();
//     if (allInterests.length === 0) {
//       console.log("⚠️ Không có sở thích nào trong database!");
//       return;
//     }

//     const users: IUser[] = [];
//     const profiles: IProfileDocument[] = [];
//     const conditions: IConditionDocument[] = [];

//     for (let i = 0; i < NUM_USERS; i++) {
//       const gender = faker.helpers.arrayElement(["male", "female"]);
//       const desired_gender = gender === "male" ? "female" : "male";
//       const email = faker.internet.email().toLowerCase();

//       // Tạo user
//       const user = new User({
//         name: faker.person.fullName(),
//         email,
//         password: PASSWORD_HASH,
//         avatar: faker.image.avatar(),
//         phone: faker.phone.number(),
//         isAdmin: false,
//       });
//       users.push(user);

//       // Chọn ngẫu nhiên 5-8 sở thích
//       const shuffledInterests = allInterests.sort(() => 0.5 - Math.random());
//       const selectedInterests = shuffledInterests
//         .slice(0, Math.floor(Math.random() * 4) + 5)
//         .map((i) => i._id as unknown as ObjectId);

//       // Tạo profile
//       const profile = new Profile({
//         userId: user._id,
//         gender,
//         birthDate: faker.date.birthdate({ min: 18, max: 50, mode: "age" }),
//         address: {
//           formattedAddress: faker.location.streetAddress(),
//           city: "Ho Chi Minh",
//           country: "Vietnam",
//         },
//         location: {
//           coordinates: [
//             getRandomLocation().longitude,
//             getRandomLocation().latitude,
//           ],
//         },
//         interests: selectedInterests,
//         zodiac: faker.helpers.arrayElement([
//           "Aries",
//           "Taurus",
//           "Gemini",
//           "Cancer",
//           "Leo",
//           "Virgo",
//           "Libra",
//           "Scorpio",
//           "Sagittarius",
//           "Capricorn",
//           "Aquarius",
//           "Pisces",
//         ]),
//         education: faker.helpers.arrayElement([
//           "Unknown",
//           "Primary school",
//           "Secondary school",
//           "High school",
//           "College",
//           "University",
//         ]),
//       });
//       profiles.push(profile);

//       // Tạo trọng số ghép đôi
//       const baseWeights = Array(4)
//         .fill(0)
//         .map(() => faker.number.int({ min: 0, max: 10 }));
//       const adjustedWeights = adjustWeights(baseWeights);

//       // Tạo điều kiện ghép đôi
//       const condition = new UserCondition({
//         userId: user._id,
//         desired_gender,
//         interest_weight: adjustedWeights[0],
//         distance_weight: adjustedWeights[1],
//         zodiac_weight: adjustedWeights[2],
//         education_weight: adjustedWeights[3],
//         max_distance_km: faker.number.int({ min: 2, max: 20 }),
//       });
//       conditions.push(condition);
//     }

//     // Lưu vào database
//     await User.insertMany(users);
//     await Profile.insertMany(profiles);
//     await UserCondition.insertMany(conditions);

//     console.log(`✅ Đã tạo ${NUM_USERS} user, profile & condition thành công!`);
//     console.log("👤 User IDs:", users.map((u) => `${u._id}`).join(", "));

//     // Kiểm tra số lượng dữ liệu
//     console.log(`📊 Số user: ${await User.countDocuments()}`);
//     console.log(`📊 Số profile: ${await Profile.countDocuments()}`);
//     console.log(`📊 Số condition: ${await UserCondition.countDocuments()}`);

//     mongoose.connection.close();
//   } catch (error) {
//     console.error("❌ Lỗi khi seed dữ liệu:", error);
//     mongoose.connection.close();
//   }
// }

// Chạy seed

async function seedDatabase(): Promise<void> {
  try {
    const zodiacData = {
      Aries: {
        Taurus: 5,
        Gemini: 10,
        Cancer: 4,
        Leo: 9,
        Virgo: 3.5,
        Libra: 7.5,
        Scorpio: 3,
        Sagittarius: 8.5,
        Capricorn: 6,
        Aquarius: 8,
        Pisces: 2,
      },
      Taurus: {
        Aries: 6,
        Gemini: 7.5,
        Cancer: 7,
        Leo: 8,
        Virgo: 5,
        Libra: 9.5,
        Scorpio: 6,
        Sagittarius: 2,
        Capricorn: 4,
        Aquarius: 9,
        Pisces: 3,
      },
      Gemini: {
        Aries: 8,
        Taurus: 7,
        Cancer: 8,
        Leo: 5,
        Virgo: 9,
        Libra: 9,
        Scorpio: 4,
        Sagittarius: 9,
        Capricorn: 5,
        Aquarius: 9,
        Pisces: 4,
      },
      Cancer: {
        Aries: 7,
        Taurus: 8,
        Gemini: 5,
        Leo: 9,
        Virgo: 6,
        Libra: 9,
        Scorpio: 9,
        Sagittarius: 4,
        Capricorn: 8,
        Aquarius: 5,
        Pisces: 10,
      },
      Leo: {
        Aries: 9,
        Taurus: 6,
        Gemini: 9,
        Cancer: 6,
        Virgo: 8,
        Libra: 5,
        Scorpio: 8,
        Sagittarius: 4,
        Capricorn: 9,
        Aquarius: 5,
        Pisces: 5,
      },
      Virgo: {
        Aries: 6,
        Taurus: 9,
        Gemini: 6,
        Cancer: 9,
        Leo: 5,
        Libra: 8,
        Scorpio: 6,
        Sagittarius: 5,
        Capricorn: 9,
        Aquarius: 7,
        Pisces: 9,
      },
      Libra: {
        Aries: 8,
        Taurus: 7,
        Gemini: 9,
        Cancer: 6,
        Leo: 8,
        Virgo: 5,
        Scorpio: 9,
        Sagittarius: 5,
        Capricorn: 8,
        Aquarius: 8,
        Pisces: 8,
      },
      Scorpio: {
        Aries: 9,
        Taurus: 9,
        Gemini: 5,
        Cancer: 9,
        Leo: 4,
        Virgo: 8,
        Libra: 5,
        Sagittarius: 8,
        Capricorn: 4,
        Aquarius: 9,
        Pisces: 10,
      },
      Sagittarius: {
        Aries: 9,
        Taurus: 5,
        Gemini: 9,
        Cancer: 4,
        Leo: 7,
        Virgo: 5,
        Libra: 9,
        Scorpio: 4,
        Capricorn: 7,
        Aquarius: 5,
        Pisces: 6,
      },
      Capricorn: {
        Aries: 6,
        Taurus: 9,
        Gemini: 4,
        Cancer: 8,
        Leo: 5,
        Virgo: 9,
        Libra: 5,
        Scorpio: 10,
        Sagittarius: 4,
        Aquarius: 8,
        Pisces: 4,
      },
      Aquarius: {
        Aries: 8,
        Taurus: 4,
        Gemini: 9,
        Cancer: 4,
        Leo: 8,
        Virgo: 4,
        Libra: 10,
        Scorpio: 4,
        Sagittarius: 10,
        Capricorn: 7,
        Pisces: 7,
      },
      Pisces: {
        Aries: 6,
        Taurus: 7,
        Gemini: 5,
        Cancer: 9,
        Leo: 5,
        Virgo: 6,
        Libra: 8,
        Scorpio: 9,
        Sagittarius: 4,
        Capricorn: 8,
        Aquarius: 7,
        Pisces: 10,
      },
    };

    mongoose.set("strictQuery", false);
    await mongoose.connect(process.env.MONGO_DB as string);
    console.log("🔗 Đã kết nối tới MongoDB");

    const dataToSave = Object.entries(zodiacData).map(([sign, scores]) => ({
      zodiacSign: sign,
      compatibility: scores,
    }));
    await ZodiacCompatibility.insertMany(dataToSave);
    mongoose.connection.close();
    console.log("✅ Đã tạo dữ liệu zodiac compatibility thành công!");
  } catch (error) {
    console.error("❌ Lỗi khi seed dữ liệu:", error);
  }
}
seedDatabase();
