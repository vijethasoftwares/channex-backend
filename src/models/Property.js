const { randomUUID } = require("crypto");
const mongoose = require("mongoose");
const { ObjectId } = require("mongodb");

// Define the Property schema
const propertySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["Hostel/PG", "Hotel", "Family Apartment"],
    required: true,
  },
  owner_user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    default: new ObjectId(),
  },
  coOfLocation: {
    type: { type: String, default: "Point" },
    coordinates: { type: [Number], index: "2dsphere" },
  },
  location: {
    type: {
      type: String,
    },
  },
  landmark: {
    type: String,
  },
  city: {
    type: String,
  },
  state: {
    type: String,
  },
  nearbyPlaces: {
    type: [
      {
        type: String,
      },
    ],
  },
  permissions: {
    type: [
      {
        type: String,
      },
    ],
  },
  manager: {
    name: {
      type: String,
    },
    phoneNumber: {
      type: String,
    },
    email: {
      type: String,
    },
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  isParkingSpaceAvailable: {
    type: Boolean,
    default: false,
  },
  isCoupleFriendly: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ["Available", "Not Available"],
    default: "Available",
  },
  facilities: {
    type: [
      {
        type: String,
      },
    ],
  },
  foodMenu: {
    type: [
      {
        type: Object,
      },
    ],
  },
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  images: {
    type: [
      {
        label: {
          type: String,
        },
        url: {
          type: String,
        },
      },
    ],
  },
  // complaints: [
  //   {
  //     userId: {
  //       type: String,
  //       required: true,
  //       trim: true,
  //       minlength: 1,
  //     },
  //     complaintText: {
  //       type: String,
  //       required: true,
  //       default: "",
  //     },
  //     isResolved: {
  //       type: Boolean,
  //       required: true,
  //       default: false,
  //     },
  //     date: {
  //       type: Date,
  //       required: true,
  //       default: new Date(),
  //     },
  //   },
  // ],
  createdAt: {
    type: Date,
    default: new Date(),
  },
});

// Create the Property model
propertySchema.index({ coOfLocation: "2dsphere" });
const Property = mongoose.model("Property", propertySchema);

module.exports = Property;
