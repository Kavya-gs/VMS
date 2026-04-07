import mongoose from "mongoose";

const visitorSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
        },
        phone: {
            type: String,
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
        }
    },
    {timestamps: true}
);

const Visitor = mongoose.model("Visitor", visitorSchema);

export default Visitor;