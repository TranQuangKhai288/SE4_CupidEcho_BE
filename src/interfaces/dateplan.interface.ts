import mongoose, { Schema, Document } from "mongoose";

export interface IDatePlan extends Document {
  participants: [mongoose.Types.ObjectId]; // Danh sách 2 người tham gia
  status: string; // Trạng thái kế hoạch (pending, confirmed, completed, cancelled)
  location: {
    formattedAddress: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  dateTime: Date; // Thời gian diễn ra buổi hẹn
  activities: string[]; // Các hoạt động trong buổi hẹn (ăn uống, xem phim, v.v.)
  createdBy: mongoose.Types.ObjectId; // Người tạo kế hoạch
  createdAt: Date;
  updatedAt: Date;
}
