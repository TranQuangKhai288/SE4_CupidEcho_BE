import { IProfile, IProfileDocument } from "../../interfaces/profile.interface";

export interface IProfileRepository {
  findByUserId(userId: string): Promise<IProfileDocument | null>;
  create(profile: IProfile): Promise<IProfile>;
  update(userId: string, data: Partial<IProfile>): Promise<IProfile | null>;
}
