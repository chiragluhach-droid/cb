import mongoose from "mongoose";

const DailyLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String, required: true }, // YYYY-MM-DD (IST)
    meals: { type: Map, of: Boolean, default: {} }, // mealIndex -> done
    swaps: { type: Map, of: Number, default: {} }, // mealIndex -> swap index (0 = original)
    waterMl: { type: Number, default: 0 },
    steps: { type: Number, default: 0 },
    weightKg: Number,
    workoutDone: { type: Boolean, default: false },
    mood: String,
  },
  { timestamps: true }
);
DailyLogSchema.index({ user: 1, date: 1 }, { unique: true });

export default mongoose.models.DailyLog || mongoose.model("DailyLog", DailyLogSchema);
