import mongoose from "mongoose";

// Admin-facing to-dos
const AlertSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    type: { type: String, enum: ["review", "inactive", "plateau", "progress", "goal_reached", "renewal", "health"], required: true },
    message: String,
    resolved: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

export default mongoose.models.Alert || mongoose.model("Alert", AlertSchema);
