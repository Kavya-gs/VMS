import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    visitorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Visitor",
    },
    type: {
      type: String,
      enum: ["check-in-request", "check-in-approved", "check-out", "rejection", "expiry-alert"],
      required: true,
    },
    title: String,
    message: {
      type: String,
      required: true,
    },
    visitorName: String,
    visitorEmail: String,
    purpose: String,
    personToMeet: String,
    read: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

export default mongoose.model("Notification", notificationSchema);
