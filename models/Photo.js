import mongoose from "mongoose";

const PhotoSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, required: true },
    date: { type: String, required: true },
    angle: { type: String, enum: ["front", "side", "back"], default: "front" },
    data: { type: String, required: true }, // compressed JPEG data URL (resized client-side)
  },
  { timestamps: true }
);

export default mongoose.models.Photo || mongoose.model("Photo", PhotoSchema);
