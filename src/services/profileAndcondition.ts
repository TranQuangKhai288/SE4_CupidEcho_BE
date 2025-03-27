import { IProfile } from "../interfaces/profile.interface";
import { ICondition } from "../interfaces/condition.interface";
import {
  IProfileRepository,
  IConditionRepository,
} from "../repositories/interfaces";

class ProfileAndConditionService {
  constructor(
    private profileRepository: IProfileRepository,
    private conditionRepository: IConditionRepository
  ) {}

  async updateProfile(id: string, data: IProfile) {
    try {
      const checkProfile = await this.profileRepository.findByUserId(id);
      if (checkProfile === null) {
        return "The user profile is not defined";
      }

      const updatedUser = await this.profileRepository.update(id, data);
      console.log("User updated", updatedUser);
      return updatedUser;
    } catch (e) {
      console.log(e, "Error when update user");
      return "Error when update user";
    }
  }

  async getProfile(userId: string) {
    try {
      const profile = await this.profileRepository.findByUserId(userId);
      if (profile === null) {
        return "The profile is not defined";
      }

      return profile;
    } catch (e) {
      console.log(e, "Error when get details user");
      return "Error when get details user";
    }
  }

  async getCondition(userId: string) {
    try {
      const condition = await this.conditionRepository.findByUserId(userId);
      if (condition === null) {
        return "The condition is not defined";
      }
      return condition;
    } catch (e) {
      console.log(e, "Error when get details user");
      return "Error when get details user";
    }
  }

  async updateCondition(userId: string, data: ICondition) {
    try {
      const checkCondition = await this.conditionRepository.findByUserId(
        userId
      );
      if (checkCondition === null) {
        return "The user condition is not defined";
      }

      const updatedCondition = await this.conditionRepository.update(
        userId,
        data
      );
      console.log("User condition updated", updatedCondition);
      return updatedCondition;
    } catch (e) {
      console.log(e, "Error when update user condition");
      return "Error when update user condition";
    }
  }
}

export default ProfileAndConditionService;
