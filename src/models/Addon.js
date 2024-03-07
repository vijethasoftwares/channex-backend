const mongoose = require("mongoose");

//addon payment schema
const AddonSchema = new mongoose.Schema({
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
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
  guestFolioId: {
    type: String,
    required: true,
  },
  guestName: {
    type: String,
    required: true,
  },
  roomNumber: {
    type: Number,
  },
  addonType: {
    type: String,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
  cgst: {
    type: Number,
    required: true,
  },
  sgst: {
    type: Number,
    required: true,
  },
  grandTotal: {
    type: Number,
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ["Paid", "Not Paid"],
    required: true,
  },
  paymentId: {
    type: String,
  },
  paymentDate: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: new Date(),
  },
});

const Addon = mongoose.model("Addon", AddonSchema);

module.exports = Addon;
