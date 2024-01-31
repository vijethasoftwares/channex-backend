// Purpose: Mongoose Model for Complaints collection in MongoDB
//   _id?: ObjectId;
//   owner_user_id?: string;
//   propertyId: string;
//   bookingId?: string;
//   userId: string;
//   userName: string;
//   userPhoneNumber: number;
//   userEmailAddress?: string;
//   complaintType: string;
//   complaintDetails: string;
//   complaintStatus: string;
//   complaintRemarks?: string;
//   createdAt?: Date;

const mongoose = require("mongoose");
const { ObjectId } = require("mongodb");

// Define the Complaints schema

const complaintSchema = new mongoose.Schema({
  owner_user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Property",
    required: true,
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
    required: true,
  },
  userId: {
    ref: "User",
    required: true,
    type: String,
  },
  userName: {
    type: String,
    required: true,
  },
  userPhoneNumber: {
    type: Number,
  },
  userEmailAddress: {
    type: String,
  },
  complaintType: {
    type: String,
    required: true,
  },
  complaintDetails: {
    type: String,
    required: true,
  },
  complaintStatus: {
    type: String,
    required: true,
    default: "Pending",
  },
  isResolved: {
    type: Boolean,
    required: true,
    default: false,
  },
  complaintRemarks: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: new Date(),
  },
});

// Export the Complaints model
module.exports = mongoose.model("Complaint", complaintSchema);
