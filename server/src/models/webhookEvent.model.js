import mongoose from "mongoose";

const webhookEventSchema = new mongoose.Schema(
  {
    stripeEventId: { type: String, unique: true, required: true },
    type: String,
    processedAt: Date,
  },
  { timestamps: true },
);

export default mongoose.model("WebhookEvent", webhookEventSchema);