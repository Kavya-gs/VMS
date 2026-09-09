import mongoose from "mongoose";

const visitorPaymentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    purpose: { type: String, required: true, trim: true },
    personToMeet: { type: String, required: true, trim: true },
    expectedCheckIn: { type: Date, required: true },
    expectedCheckOut: { type: Date, required: true },
    stripeCheckoutSessionId: { type: String, unique: true, sparse: true },
    stripePaymentIntentId: String,
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "succeeded", "failed", "cancelled", "completed"],
      default: "pending",
    },
    visitorId: { type: mongoose.Schema.Types.ObjectId, ref: "Visitor" },
  },
  { timestamps: true },
);

export default mongoose.model("VisitorPayment", visitorPaymentSchema);