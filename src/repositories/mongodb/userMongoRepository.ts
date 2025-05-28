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

  async findById(id: string): Promise<any | null> {
    const user = await User.findById(id);
    if (!user) return null;
    const { password, ...userWithoutPassword } = user.toObject();
    return userWithoutPassword;
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
  async findRecommendUsers(
    id: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    recommended: IUser[];
    pagination: {
      page: number;
      limit: number;
      hasNextPage: boolean;
    };
  }> {
    const userId = new mongoose.Types.ObjectId(id);

    const userProfile = await mongoose.model("Profile").findOne({ userId });
    const userCondition = await mongoose.model("Condition").findOne({ userId });
    const existingRelationships = await mongoose
      .model("Relationship")
      .find({
        $or: [
          { senderId: userId },
          {
            receiverId: userId,
          },
        ],
      })
      .select("senderId receiverId")
      .lean();

    const relatedUserIds = new Set<string>();
    existingRelationships.forEach((rel) => {
      relatedUserIds.add(rel.senderId.toString());
      relatedUserIds.add(rel.receiverId.toString());
    });
    relatedUserIds.delete(userId.toString());

    if (!userProfile || !userProfile.location || !userCondition) {
      return {
        recommended: [],
        pagination: { page, limit, hasNextPage: false },
      };
    }

    const maxDistanceMeters = userCondition.max_distance_km * 1000;
    const userDetails = await mongoose.model("User").findById(id).lean();
    if (!userDetails) {
      return {
        recommended: [],
        pagination: { page, limit, hasNextPage: false },
      };
    }

    const matchingProfiles = await mongoose.model("Profile").aggregate([
      {
        $geoNear: {
          near: userProfile.location,
          distanceField: "distance",
          maxDistance: maxDistanceMeters,
          spherical: true,
          query: {
            userId: {
              $ne: userId,
              $nin: Array.from(relatedUserIds).map(
                (id) => new mongoose.Types.ObjectId(id)
              ),
            },
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

    const calculateScore = (profile: any) => {
      const commonInterests =
        profile.interests?.filter((interest: { toString: () => any }) =>
          userProfile.interests?.some(
            (i: { toString: () => any }) => i.toString() === interest.toString()
          )
        ).length || 0;
      const interestScore = commonInterests * userCondition.interest_weight;
      const distanceScore =
        ((userCondition.max_distance_km * 1000 - profile.distance) /
          (userCondition.max_distance_km * 1000)) *
        userCondition.distance_weight;
      const zodiacScore =
        profile.zodiac === userProfile.zodiac ? userCondition.zodiac_weight : 0;
      const profileAge = profile.birthDate
        ? Math.round(
            (new Date().getTime() - new Date(profile.birthDate).getTime()) /
              (365 * 24 * 60 * 60 * 1000)
          )
        : 0;
      const userAge = userProfile.birthDate
        ? Math.round(
            (new Date().getTime() - new Date(userProfile.birthDate).getTime()) /
              (365 * 24 * 60 * 60 * 1000)
          )
        : 0;
      const ageDiff = Math.abs(profileAge - userAge);
      const ageScore =
        ageDiff <= userCondition.max_age_difference
          ? userCondition.age_weight
          : 0;

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
        zodiac: profile.zodiac,
        distance: Math.round((profile.distance / 1000) * 10) / 10,
        age: profileAge,
        isFallback: false,
      };
    };

    const scoredProfiles = matchingProfiles.map(calculateScore);

    // Nếu chưa đủ thì lấy thêm fallback users
    let extraProfiles: any[] = [];
    if (scoredProfiles.length < limit * page) {
      const excludeIds = scoredProfiles.map((u) => u._id.toString());
      excludeIds.push(userId.toString());
      relatedUserIds.forEach((id) => excludeIds.push(id));

      const fallbackGender =
        userCondition.desired_gender === "male"
          ? "female"
          : userCondition.desired_gender === "female"
          ? "male"
          : { $exists: true };

      extraProfiles = await mongoose.model("Profile").aggregate([
        {
          $match: {
            userId: {
              $nin: excludeIds.map((id) => new mongoose.Types.ObjectId(id)),
            },
            gender: fallbackGender,
          },
        },
        { $sample: { size: limit * page - scoredProfiles.length } },
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
            location: 1,
            userInfo: 1,
          },
        },
      ]);

      const getDistanceInKm = (loc1: any, loc2: any) => {
        if (!loc1 || !loc2) return null;
        const R = 6371;
        const dLat =
          ((loc2.coordinates[1] - loc1.coordinates[1]) * Math.PI) / 180;
        const dLon =
          ((loc2.coordinates[0] - loc1.coordinates[0]) * Math.PI) / 180;
        const lat1 = (loc1.coordinates[1] * Math.PI) / 180;
        const lat2 = (loc2.coordinates[1] * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      };

      const mappedExtra = extraProfiles.map((profile) => {
        const distance = getDistanceInKm(
          userProfile.location,
          profile.location
        );
        const profileAge = profile.birthDate
          ? Math.round(
              (new Date().getTime() - new Date(profile.birthDate).getTime()) /
                (365 * 24 * 60 * 60 * 1000)
            )
          : 0;
        const userAge = userProfile.birthDate
          ? Math.round(
              (new Date().getTime() -
                new Date(userProfile.birthDate).getTime()) /
                (365 * 24 * 60 * 60 * 1000)
            )
          : 0;
        const ageDiff = Math.abs(profileAge - userAge);
        const commonInterests =
          profile.interests?.filter((interest: { toString: () => any }) =>
            userProfile.interests?.some(
              (i: { toString: () => any }) =>
                i.toString() === interest.toString()
            )
          ).length || 0;
        const interestScore = commonInterests * userCondition.interest_weight;
        const distanceScore =
          distance != null
            ? ((userCondition.max_distance_km - distance) /
                userCondition.max_distance_km) *
              userCondition.distance_weight
            : 0;
        const zodiacScore =
          profile.zodiac === userProfile.zodiac
            ? userCondition.zodiac_weight
            : 0;
        const ageScore =
          ageDiff <= userCondition.max_age_difference
            ? userCondition.age_weight
            : 0;
        const totalScore =
          interestScore + distanceScore + zodiacScore + ageScore;

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
          zodiac: profile.zodiac,
          distance: distance != null ? Math.round(distance * 10) / 10 : 0,
          age: profileAge,
          isFallback: true,
        };
      });

      scoredProfiles.push(...mappedExtra);
    }

    const sorted = scoredProfiles.sort((a, b) => b.score - a.score);
    const startIndex = (page - 1) * limit;
    const paginated = sorted.slice(startIndex, startIndex + limit);

    return {
      recommended: paginated as unknown as IUser[],
      pagination: {
        page,
        limit,
        hasNextPage: startIndex + limit < sorted.length,
      },
    };
  }
}

export default new UserMongoRepository();
