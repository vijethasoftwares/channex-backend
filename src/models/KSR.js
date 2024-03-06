const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema(
  {
    name: String,
    price: Number,
    quantity: Number,
  },
  { _id: false }
);

const KSRSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Property",
    required: true,
  },
  foodMenu: [
    {
      _id: false,
      name: String,
      items: [menuItemSchema],
    },
  ],
});

const KSR = mongoose.model("KSR", KSRSchema);

module.exports = KSR;
