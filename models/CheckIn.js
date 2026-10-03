import mongoose from "mongoose";

const CheckInSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, required: true },
    date: { type: String, required: true },
    weightKg: { type: Number, required: true },
    waistCm: Number,
    chestCm: Number,
    hipsCm: Number,
    armCm: Number,
    thighCm: Number,
    energy: Number, // 1-5
    hunger: Number, // 1-5
    note: String,
  },
  { timestamps: true }
);

export default mongoose.models.CheckIn || mongoose.model("CheckIn", CheckInSchema);
