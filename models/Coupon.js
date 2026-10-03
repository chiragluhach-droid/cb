import mongoose from "mongoose";

const CouponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    percentOff: { type: Number, default: 0 },
    flatOff: { type: Number, default: 0 }, // INR
    maxUses: { type: Number, default: 0 }, // 0 = unlimited
    uses: { type: Number, default: 0 },
    expiresAt: Date,
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Coupon || mongoose.model("Coupon", CouponSchema);
