import { Interest, Profile } from "../../models";
import { IProfile, IProfileDocument } from "../../interfaces/profile.interface";
import { IProfileRepository } from "../interfaces";

export class ProfileMongoRepository implements IProfileRepository {
  async create(profile: IProfile): Promise<IProfile> {
    const createdProfile = await Profile.create(profile);
    // const { _id, __v, ...profileData } = createdProfile;

    return createdProfile.toObject() as unknown as IProfile;
  }

  async findByUserId(userId: string): Promise<any | null> {
    const profile = await Profile.findOne({ userId })
      .populate("interests")
      .lean();

    // console.log(profile?.interests, "profile test");

    return profile;
  }

  async update(
    userId: string,
    data: Partial<IProfile>
  ): Promise<IProfile | null> {
    // Kiiểm tra zodiac và interests
    if (data.zodiac) {
      // if (!Profile.schema.path("zodiac").enumValues.includes(data.zodiac)) {
      //   throw new Error("Invalid zodiac value");
      // }
    }

    if (data.interests) {
      //kiểm tra các interest có tồn tại không
      const interests = await Interest.find({ _id: { $in: data.interests } });
      if (interests.length !== data.interests.length) {
        throw new Error("Invalid interest value");
      }
    }
    console.log("data", data);
    const updatedProfile = await Profile.findOneAndUpdate(
      { userId: userId },
      data,
      {
        new: true,
      }
    );

    //save lại profile
    if (updatedProfile) await updatedProfile.save();

    return updatedProfile as unknown as IProfile;
  }
}

export default new ProfileMongoRepository();
