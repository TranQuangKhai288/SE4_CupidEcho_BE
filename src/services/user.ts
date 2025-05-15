import { IUser, ICreateUser } from "../interfaces/user.interface";
import { ObjectId } from "mongoose";
import {
  IUserRepository,
  IProfileRepository,
  IConditionRepository,
} from "../repositories/interfaces";
import bcrypt from "bcrypt";
import { genneralAccessToken, genneralRefreshToken } from "./JWTService";

class UserService {
  constructor(
    private userRepository: IUserRepository,
    private profileRepository: IProfileRepository,
    private conditionRepository: IConditionRepository
  ) {}

  async checkUser(email: string): Promise<boolean> {
    try {
      const user = await this.userRepository.findByEmail(email);
      return !!user;
    } catch (e) {
      console.error(e, "Lỗi khi kiểm tra người dùng");
      throw new Error("Lỗi khi kiểm tra sự tồn tại của người dùng");
    }
  }

  async createUser(newUser: ICreateUser): Promise<any> {
    const { name, email, password } = newUser;
    try {
      const existingUser = await this.userRepository.findByEmail(email);
      if (existingUser) {
        return "Email đã tồn tại";
      }

      const hash = bcrypt.hashSync(password, 10);
      const defaultAvatar =
        "https://cdn-icons-png.freepik.com/512/8742/8742495.png";

      const createdUser = await this.userRepository.create({
        name,
        email,
        password: hash,
        avatar: defaultAvatar,
        isAdmin: false,
      } as ICreateUser);

      await this.profileRepository.create({
        userId: createdUser._id,
        gender: "another",
        location: {
          type: "Point",
          coordinates: [0, 0],
        },
        interests: [],
        birthDate: new Date(),
        zodiac: "Unknown",
      });

      await this.conditionRepository.create({
        userId: createdUser._id,
        desired_gender: "another",
        max_distance_km: 10,
        interest_weight: 3,
        distance_weight: 3,
        zodiac_weight: 2,
        age_weight: 2,
        max_age_difference: 2,
      });

      return createdUser;
    } catch (e) {
      console.log(e, "Lỗi khi tạo người dùng");
      return "Lỗi khi tạo người dùng";
    }
  }

  async loginUser({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<any> {
    try {
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        return "Người dùng không tồn tại";
      }

      const comparePassword = bcrypt.compareSync(password, user.password);
      if (!comparePassword) {
        return "Mật khẩu không đúng";
      }

      if (!user._id) {
        return "Lỗi: ID người dùng không xác định";
      }

      const access_token = await genneralAccessToken({
        id: user._id.toString(),
        isAdmin: user.isAdmin,
      });

      const refresh_token = await genneralRefreshToken({
        id: user._id.toString(),
        isAdmin: user.isAdmin,
      });

      return {
        data: user,
        access_token,
        refresh_token,
      };
    } catch (e) {
      console.log(e, "Lỗi khi đăng nhập");
      return "Lỗi khi đăng nhập";
    }
  }

  async updateUser(id: string, data: Partial<IUser>): Promise<any> {
    try {
      const existingUser = await this.userRepository.findById(id);
      if (!existingUser) {
        return "Người dùng không tồn tại";
      }

      if (data.password) {
        const hash = bcrypt.hashSync(data.password, 10);
        data.password = hash;
      }

      const updatedUser = await this.userRepository.update(id, data);
      if (!updatedUser) {
        return "Người dùng không tồn tại";
      }

      if (data.gender) {
        await this.profileRepository.update(id, { gender: data.gender });
      }

      return updatedUser;
    } catch (e) {
      console.log(e, "Lỗi khi cập nhật người dùng");
      return "Lỗi khi cập nhật người dùng";
    }
  }

  async deleteUser(id: string): Promise<any> {
    try {
      const user = await this.userRepository.findById(id);
      if (!user) {
        return "Người dùng không tồn tại";
      }
      await this.userRepository.delete(id);
      return { message: "Người dùng đã bị xóa" };
    } catch (e) {
      console.log(e, "Lỗi khi xóa người dùng");
      return "Lỗi khi xóa người dùng";
    }
  }

  async getDetailsUser(id: string): Promise<any> {
    try {
      const user = await this.userRepository.findById(id);
      if (!user) {
        return "Người dùng không tồn tại";
      }
      return user;
    } catch (e) {
      console.log(e, "Lỗi khi lấy chi tiết người dùng");
      return "Lỗi khi lấy chi tiết người dùng";
    }
  }

  async getUsers(page: number, limit: number): Promise<any> {
    try {
      const result = await this.userRepository.findAll(page, limit);
      return result;
    } catch (e) {
      console.log(e, "Lỗi khi lấy danh sách người dùng");
      return "Lỗi khi lấy danh sách người dùng";
    }
  }

  async getRecommendUsers(id: string, limit: number): Promise<any> {
    try {
      const users = await this.userRepository.findRecommendUsers(id, limit);
      return users;
    } catch (e) {
      console.log(e, "Lỗi khi lấy danh sách người dùng gợi ý");
      return "Lỗi khi lấy danh sách người dùng gợi ý";
    }
  }
}

export default UserService;
