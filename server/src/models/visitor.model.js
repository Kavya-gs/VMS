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
        checkInTime: {
            type: Date,
            default: Date.now,
        },
        checkOutTime: {
            type: Date,
        },
    },
    {timestamps: true}
);

const Visitor = mongoose.model("Visitor", visitorSchema);

export default Visitor;