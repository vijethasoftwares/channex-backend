const mongoose = require("mongoose");
const { ObjectId } = require("mongodb");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: false,
    unique: true,
    index: {
      unique: true,
      partialFilterExpression: { email: { $type: "string" } },
    },
  },
  name: {
    type: String,
  },
  password: {
    type: String,
    default: "",
  },
  role: {
    type: String,
    enum: ["Admin", "Owner", "Manager", "User"],
    default: "User",
  },
  email: {
    type: String,
    required: false,
    index: {
      unique: true,
      partialFilterExpression: { email: { $type: "string" } },
    },
  },
  phoneNumber: {
    type: String,
    unique: true,
  },
  phoneOtp: {
    type: String,
    default: "",
  },
  profilePicture: {
    type: String,
    default: "https://placehold.co/500x500",
  },
  dateOfBirth: Date,
  address: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
  },
  emailVerificationToken: String,
  emailVerificationExpire: Date,
  isVerified: {
    type: Boolean,
    default: false,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    default: new ObjectId(),
  },
});

// Method to generate email verification token
userSchema.methods.getEmailVerificationToken = function () {
  // You can use any token generation logic you prefer here
  // For simplicity, let's use a random string for the token
  const tokenLength = 32;
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < tokenLength; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    token += characters.charAt(randomIndex);
  }
  return token;
};

module.exports = mongoose.model("User", userSchema);
