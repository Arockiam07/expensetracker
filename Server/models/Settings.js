import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
      unique: true,
    },
    theme: {
      type: String,
      default: "system",
    },
    language: {
      type: String,
      default: "English (US)",
    },
    currency: {
      type: String,
      default: "INR — ₹",
    },
    accountStatus: {
      type: String,
      default: "Secured",
    },
    notifications: {
      type: Boolean,
      default: true,
    },
    dataSharing: {
      type: Boolean,
      default: true,
    },
    encryption: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Settings = mongoose.model("Settings", settingsSchema);
export default Settings;
