const { UUID } = require("mongodb");
const mongoose = require("mongoose");

// mongoose.Collection.createIndex({ roomNumber: 1 }, { unique: true });

// Define the Room schema
const roomSchema = new mongoose.Schema({
  roomNumber: {
    type: Number,
    required: true,
  },
  roomCategory: {
    type: String,
    enum: ["A/C", "Non A/C"],
    required: true,
  },
  roomType: {
    type: String,
    enum: ["Single", "Double", "Triple", "Dormitory"],
  },
  pricePerMonth: {
    type: Number,
  },
  pricePerDay: {
    type: Number,
  },
  roomSize: {
    type: Number,
    required: true,
  },
  maxOccupancy: {
    type: Number,
    required: true,
  },
  vacancy: {
    type: Number,
    required: true,
  },
  guests: [
    {
      _id: {
        type: String,
      },
      bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Booking",
      },
      folioId: {
        type: String,
      },
      isPrimary: {
        default: false,
        type: Boolean,
      },
      name: {
        type: String,
      },
      email: {
        type: String,
      },
      phone: {
        type: String,
      },
      idProofBackImage: {
        type: Object,
      },
      idProofFrontImage: {
        type: Object,
      },
      roomNumber: {
        type: Number,
      },
    },
  ],
  isFeatured: {
    type: Boolean,
    default: false,
  },
  isOccupied: {
    type: Boolean,
    default: false,
  },
  description: {
    type: String,
  },
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Property",
    required: true,
  },
  propertyType: {
    type: String,
    enum: ["Hostel/PG", "Hotel", "Family Apartment"],
    required: true,
  },
  images: {
    bedImage: {
      type: [
        {
          type: Object,
        },
      ],
    },
    roomImage: {
      type: [
        {
          type: Object,
        },
      ],
    },
    washroomImage: {
      type: [
        {
          type: Object,
        },
      ],
    },
    additionalImages: {
      type: [
        {
          type: Object,
        },
      ],
    },
  },
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  facilities: {
    type: [
      {
        type: String,
        enum: [
          "TV",
          "GEYSER",
          "HOT WATER",
          "KETTLE",
          "AC",
          "fridge",
          "Washing machine",
        ],
      },
    ],
  },
  reviews: [
    {
      userName: {
        type: String,
      },
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      reviewText: {
        type: String,
      },
      stars: {
        type: Number,
        min: 1,
        max: 5,
      },
    },
  ],
  complaints: [
    {
      userId: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
      },
      complaintText: {
        type: String,
        required: true,
        default: "",
      },
      isResolved: {
        type: Boolean,
        required: true,
        default: false,
      },
      date: {
        type: Date,
        required: true,
        default: new Date(),
      },
    },
  ],
  createdAt: {
    type: Date,
    default: new Date(),
  },
});

roomSchema.index({ roomNumber: 1, propertyId: 1 }, { unique: true });

// Create the Room model
const Room = mongoose.model("Room", roomSchema);

module.exports = Room;
