const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema({
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
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  userPhoneNumber: { type: Number, required: true },
  userEmailAddress: { type: String, required: false },
  avatar: { type: String, required: false },
  rating: { type: Number, required: true },
  review: { type: String, required: true },
  createdAt: { type: Date, required: false, default: new Date() },
});

// export model
module.exports = mongoose.model("Review", ReviewSchema);
