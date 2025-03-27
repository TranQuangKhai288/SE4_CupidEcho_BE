import { User } from "../../models";
import { IUser, ICreateUser } from "../../interfaces/user.interface";
import { IUserRepository } from "../interfaces";
import mongoose, { PipelineStage } from "mongoose";

export class UserMongoRepository implements IUserRepository {
  async findByEmail(email: string): Promise<IUser | null> {
    const user = await User.findOne({ email });
    return user ? user.toObject() : null;
  }

  async create(user: ICreateUser): Promise<IUser> {
    const createdUser = await User.create(user);
    return createdUser.toObject(); // _id đã là string
  }

  async findById(id: string): Promise<IUser | null> {
    const user = await User.findById(id);
    return user ? user.toObject() : null;
  }

  async update(id: string, data: Partial<IUser>): Promise<IUser | null> {
    const updatedUser = await User.findByIdAndUpdate(id, data, { new: true });
    return updatedUser ? updatedUser.toObject() : null;
  }

  async delete(id: string): Promise<void> {
    await User.findByIdAndDelete(id);
  }

  async findAll(
    page: number,
    limit: number
  ): Promise<{ users: IUser[]; pagination: { page: number; limit: number } }> {
    const users = await User.find()
      .skip((page - 1) * limit)
      .limit(limit);
    return {
      users: users.map((user) => user.toObject()),
      pagination: { page, limit },
    };
  }

  async findRecommendUsers(id: string, limit: number = 10): Promise<IUser[]> {
    const userId = new mongoose.Types.ObjectId(id);
    console.log("userId", userId);
    console.log("limit", limit);
    // Lấy thông tin profile và condition của user hiện tại
    const userProfile = await mongoose.model("Profile").findOne({ userId });
    const userCondition = await mongoose.model("Condition").findOne({ userId });

    if (!userProfile || !userProfile.location || !userCondition) {
      return [];
    }

    // Tính toán số người dùng từ maxDistance km sang m
    const maxDistanceMeters = userCondition.max_distance_km * 1000;

    // Lấy thông tin người dùng hiện tại để truyền vào pipeline
    const userDetails = await mongoose.model("User").findById(id).lean();
    if (!userDetails) {
      return [];
    }

    // Lấy danh sách các profile phù hợp theo khoảng cách và giới tính trước
    // $geoNear phải là giai đoạn đầu tiên trong pipeline
    const matchingProfiles = await mongoose.model("Profile").aggregate([
      {
        $geoNear: {
          near: userProfile.location,
          distanceField: "distance",
          maxDistance: maxDistanceMeters,
          spherical: true,
          query: {
            userId: { $ne: userId },
            gender:
              userCondition.desired_gender === "another"
                ? { $exists: true }
                : userCondition.desired_gender,
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      { $unwind: "$userInfo" },
      {
        $project: {
          _id: 1,
          userId: 1,
          gender: 1,
          interests: 1,
          birthDate: 1,
          zodiac: 1,
          distance: 1,
          userInfo: 1,
        },
      },
    ]);

    // Tính điểm cho mỗi profile dựa trên các tiêu chí
    const scoredProfiles = matchingProfiles.map((profile) => {
      // Điểm sở thích - dựa trên số lượng sở thích chung
      const commonInterests =
        profile.interests?.filter((interest: { toString: () => any }) =>
          userProfile.interests?.some(
            (i: { toString: () => any }) => i.toString() === interest.toString()
          )
        ).length || 0;
      const interestScore = commonInterests * userCondition.interest_weight;

      // Điểm khoảng cách - càng gần càng tốt
      const distanceScore =
        ((userCondition.max_distance_km * 1000 - profile.distance) /
          (userCondition.max_distance_km * 1000)) *
        userCondition.distance_weight;

      // Điểm cung hoàng đạo - trùng khớp
      const zodiacScore =
        profile.zodiac === userProfile.zodiac ? userCondition.zodiac_weight : 0;

      // Điểm tuổi - càng gần càng tốt
      const profileAge = profile.birthDate
        ? (new Date().getTime() - new Date(profile.birthDate).getTime()) /
          (365 * 24 * 60 * 60 * 1000)
        : 0;
      const userAge = userProfile.birthDate
        ? (new Date().getTime() - new Date(userProfile.birthDate).getTime()) /
          (365 * 24 * 60 * 60 * 1000)
        : 0;
      const ageDiff = Math.abs(profileAge - userAge);
      const ageScore =
        ageDiff <= userCondition.max_age_difference
          ? userCondition.age_weight
          : 0;

      // Tổng điểm
      const totalScore = interestScore + distanceScore + zodiacScore + ageScore;

      return {
        _id: profile.userInfo._id,
        name: profile.userInfo.name,
        email: profile.userInfo.email,
        avatar: profile.userInfo.avatar,
        phone: profile.userInfo.phone,
        isAdmin: profile.userInfo.isAdmin,
        createdAt: profile.userInfo.createdAt,
        updatedAt: profile.userInfo.updatedAt,
        score: totalScore,
      };
    });

    // Sắp xếp theo điểm cao nhất và lấy limit phần tử
    scoredProfiles.sort((a, b) => b.score - a.score);

    // Lấy ngẫu nhiên limit người từ top 20
    const topProfiles = scoredProfiles.slice(
      0,
      Math.min(20, scoredProfiles.length)
    );
    const shuffled = [...topProfiles].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, limit) as unknown as IUser[];
  }
}

export default new UserMongoRepository();
