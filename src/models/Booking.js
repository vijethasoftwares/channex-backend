// updated booking model
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
  checkedIn: {
    primaryGuest: {
      roomNumber: {
        type: Number,
      },
      guest: {
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
      },
    },
    additionalGuests: [
      {
        roomNumber: {
          type: Number,
        },
        guest: {
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
        },
      },
    ],
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
  numberOfGuest: {
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
});

// Create the Room model
const Booking = mongoose.model("Booking", bookingSchema);

module.exports = Booking;
