import mongoose, { Schema, Document } from "mongoose";
import { IDatePlan } from "../interfaces/dateplan.interface";

const datePlanSchema = new Schema<IDatePlan>(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
    },
    location: {
      formattedAddress: { type: String, required: true },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    dateTime: { type: Date, required: true },
    activities: [{ type: String }],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

datePlanSchema.index({ participants: 1 });
datePlanSchema.index({ location: "2dsphere" });

const DatePlan = mongoose.model<IDatePlan>("DatePlan", datePlanSchema);
export default DatePlan;
