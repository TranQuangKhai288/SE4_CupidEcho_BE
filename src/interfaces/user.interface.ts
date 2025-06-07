export interface IUser {
  _id: string;
  name: string;
  email: string;
  avatar?: string | null;
  password: string;
  phone?: string;
  gender?: string;
  isAdmin?: boolean;
  fcmToken?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICreateUser extends Omit<IUser, "_id"> {}
