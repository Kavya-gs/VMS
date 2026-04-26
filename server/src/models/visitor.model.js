import mongoose from "mongoose";

const visitorSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            trim: true,
        },
        email: {
            type: String,
            trim: true,
        },
        phone: {
            type: String,
            trim: true,
        },
        purpose: {
            type: String,
            required: true,
        },
        personToMeet: {
            type: String,
            required: true,
        },
        expectedCheckIn: {
            type: Date,
            required: true,
        },
        expectedCheckOut: {
            type: Date,
            required: true,
        },
        checkInTime: {
            type: Date,
            default: Date.now,
        },
        checkOutTime: {
            type: Date,
        },
        expiryNotified: {
            type: Boolean,
            default: false,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        status: {
            type: String,
            enum: ["pending", "approved", "rejected", "checked-in", "checked-out"],
            default: "pending",
        },
        qrToken: {
            type: String,
            default: null,
        },
        qrTokenExpiry: {
            type: Date,
            default: null,
        },
        temporaryCardId: {
            type: String,
            default: null,
        },
        photo: {
            type: String,
            default: null,
        },
        cardIssuedAt: {
            type: Date,
            default: null,
        },
        checkoutAuthorizedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        checkoutChannel: {
            type: String,
            enum: ["self-service", "staff-assisted", "security-scan"],
            default: null,
        },
        checkInType: {
            type: String,
            enum: ["self", "security", "admin"],
            default: "self",
        },
        checkInApprovedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        otpVerified: {
            type: Boolean,
            default: false,
        },
    },
    {timestamps: true}
);

const Visitor = mongoose.model("Visitor", visitorSchema);

export default Visitor;