const mongoose = require("mongoose");

// Define the Room schema
const invoiceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
    required: true,
  },
  ts_issued: {
    type: Date,
    required: true,
  },
  ts_paid: {
    type: Date,
    required: true,
  },
  ts_cancelled: {
    type: Date,
    required: true,
  },
  invoiceAmount: {
    type: Number,
    default: null,
  },
  createdAt: {
    type: Date,
    default: new Date(),
  },
});

// Create the Room model
const Invoice = mongoose.model("Invoice", invoiceSchema);

module.exports = Invoice;
