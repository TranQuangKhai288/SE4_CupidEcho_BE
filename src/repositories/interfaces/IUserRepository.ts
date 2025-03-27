import { IUser, ICreateUser } from "../../interfaces/user.interface";

export interface IUserRepository {
  findByEmail(email: string): Promise<IUser | null>;
  create(user: ICreateUser): Promise<IUser>;
  findById(id: string): Promise<IUser | null>;
  update(id: string, data: Partial<IUser>): Promise<IUser | null>;
  delete(id: string): Promise<void>;
  findAll(
    page: number,
    limit: number
  ): Promise<{ users: IUser[]; pagination: { page: number; limit: number } }>;
  findRecommendUsers(id: string, limit: number): Promise<IUser[]>;
}
