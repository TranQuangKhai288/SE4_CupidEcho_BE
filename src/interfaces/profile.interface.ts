import { ObjectId } from "mongoose";

export interface IProfile {
  userId: string;
  gender: string;
  address?: {
    formattedAddress: string;
    city: string;
    country: string;
  };
  location: {
    type: string;
    coordinates: number[];
  };
  interests: string[];
  birthDate: Date | undefined;
  zodiac: string;
  isActivated?: boolean;
}

export interface IProfileDocument
  extends Omit<IProfile, "userId" | "interests"> {
  userId: ObjectId;
  interests: ObjectId[];
}
