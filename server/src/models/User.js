import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  email: {
    type: String,
    unique: true,
  },
  password: String,
  phone: {
    type: String,
    default: null,
  },
  role: {
    type: String,
    enum: ["admin", "security", "visitor"],
    default: "visitor",
  },
  otpCodeHash: {
    type: String,
    default: null,
  },
  otpExpiresAt: {
    type: Date,
    default: null,
  },
  otpRequestedAt: {
    type: Date,
    default: null,
  },
  passwordResetOtpHash: {
    type: String,
    default: null,
  },
  passwordResetOtpExpiresAt: {
    type: Date,
    default: null,
  },
});

export default mongoose.model("User", userSchema);
