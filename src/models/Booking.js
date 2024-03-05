// updated booking model
const { UUID } = require("mongodb");
const mongoose = require("mongoose");

// Define the Room schema
const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Property",
    required: true,
  },
  folioId: {
    type: String,
  },
  bookingType: {
    type: String,
    enum: ["Online", "Walk In", "Call"],
  },
  bookingStatus: {
    type: String,
    enum: ["Confirmed", "Not Confirmed"],
  },
  guestName: {
    type: String,
  },
  guestPhoneNumber: {
    type: Number,
  },
  guestEmail: {
    type: String,
  },
  checkedIn: [
    {
      _id: {
        type: String,
        // default: new UUID().toString(),
      },

      folioId: {
        type: String,
      },
      isPrimary: {
        type: Boolean,
        default: true,
      },
      name: {
        type: String,
      },
      phone: {
        type: Number,
      },
      email: {
        type: String,
      },
      dob: {
        type: Date,
      },
      idProofFrontImage: {
        label: String,
        url: String,
      },
      idProofBackImage: {
        label: String,
        url: String,
      },
      roomNumber: {
        type: Number,
      },
    },
  ],
  checkedInAt: {
    type: Date,
  },
  checkedOutAt: {
    type: Date,
  },
  roomCategory: {
    type: String,
    enum: ["A/C", "Non A/C"],
  },
  roomType: {
    type: String,
    enum: ["Single", "Double", "Triple", "Dormitory"],
  },
  from: {
    type: Date,
    required: true,
  },
  to: {
    type: Date,
    required: true,
  },
  noOfMonths: {
    type: Number,
  },
  paymentMethod: {
    type: String,
  },
  paymentStatus: {
    type: String,
    enum: ["Paid", "Not Paid"],
    default: "Not Paid",
  },
  paymentAmount: {
    type: Number,
    default: 0,
  },
  numberOfGuests: {
    type: Number,
    default: 1,
  },
  roomAssigned: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Room",
  },
  isCheckedIn: {
    type: Boolean,
    default: false,
  },
  isCheckedOut: {
    type: Boolean,
    default: false,
  },
  invoiceId: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: new Date(),
  },
});

// Create the Room model
const Booking = mongoose.model("Booking", bookingSchema);

module.exports = Booking;
