const express = require("express");
const router = express.Router();
const unirest = require("unirest");
const authenticateToken = require("../middleware/authMiddleware");
const User = require("../models/User");
const transporter = require("../config/nodemailer");
const Property = require("../models/Property");
const Booking = require("../models/Booking");
const Room = require("../models/Rooms");
const findSlot = require("../utils/findSlot");
const { ObjectId } = require("mongodb");

router.get(
  "/getAllBookings/:propertyId",
  authenticateToken,
  async (req, res) => {
    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Access denied. User not authenticated." });
    }
    // Check if the user has the role of "owner" or "manager" in the database
    try {
      // Extract payment capture details from the request
      // Find the room by its ID
      const userHasAccess =
        req.user.role == "Owner" || req.user.role == "Manager";
      if (!userHasAccess) {
        return res.status(403).json({
          message: "Access denied. Only owners and managers can view bookings.",
        });
      }
      const testproperties = await Booking.aggregate([
        { $match: { propertyId: new ObjectId("658139e08ce18c0808dadf9a") } },
        {
          $lookup: {
            from: "users", //your schema name from mongoDB
            localField: "user", //user_id from user(main) model
            foreignField: "_id", //user_id from user(sub) model
            as: "users", //result var name
          },
        },
      ]);
      // Assuming managers should see all bookings and owners only their own properties' bookings
      const bookings =
        userHasAccess &&
        (req.user.role == "Manager" || req.user.role == "Owner")
          ? await Booking.find({ propertyId: req.params.propertyId })
          : await Booking.find();
      return res.status(200).json({
        message: "Rooms",
        bookings: bookings,
        testProperties: testproperties,
      });
    } catch (error) {
      console.error("Error:", error);
      return res.status(500).json({ message: "Failed to process request." });
    }
  }
);

router.get("/get-booking/:id", authenticateToken, async (req, res) => {
  if (!req.user) {
    return res
      .status(401)
      .json({ message: "Access denied. User not authenticated." });
  }
  // Check if the user has the role of "owner" or "manager" in the database
  try {
    // Extract payment capture details from the request
    // Find the room by its ID
    const userHasAccess =
      req.user.role == "Owner" || req.user.role == "Manager";
    if (!userHasAccess) {
      return res.status(403).json({
        message: "Access denied. Only owners and managers can view bookings.",
      });
    }
    const booking = await Booking.findById(req.params.id);
    const rooms = await Room.find({
      propertyId: booking.propertyId,
      roomCategory: booking.roomCategory,
      roomType: booking.roomType,
      //   vacancy: { $gte: booking.numberOfGuest },
    });
    console.log(rooms, "rooms");

    if (!rooms.length || rooms.length == 0) {
      return res.status(200).json({
        message: "No rooms available with enough vacancy.",
        booking,
        rooms: 0,
      });
    }

    return res
      .status(200)
      .json({ message: "successfully fetched booking", booking, rooms });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ message: "Failed to load booking" });
  }
});

router.patch(
  "/update-booking/check-in/:id",
  authenticateToken,
  async (req, res) => {
    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Access denied. User not authenticated." });
    }
    const { numberOfGuest, roomType, roomCategory, from, to, checkedIn } =
      req.body;

    try {
      const userHasAccess =
        req.user.role == "Owner" || req.user.role == "Manager";
      if (!userHasAccess) {
        return res.status(403).json({
          message: "Access denied. Only owners and managers can view bookings.",
        });
      }
      const updatedBooking = await Booking.updateOne(
        { _id: req.params.id },
        {
          $set: {
            numberOfGuest,
            roomType,
            roomCategory,
            from,
            to,
            checkedIn,
            isCheckedIn: true,
          },
        }
      );
      console.log(updatedBooking, "updatedBooking");
      return res
        .status(200)
        .json({ message: "successfully updated booking", updatedBooking });
    } catch (error) {
      console.error("Error:", error);
      return res.status(500).json({ message: "Failed to update booking" });
    }
  }
);

router.patch(
  "/update-booking/check-out/:id",
  authenticateToken,
  async (req, res) => {
    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Access denied. User not authenticated." });
    }

    try {
      const userHasAccess =
        req.user.role == "Owner" || req.user.role == "Manager";
      if (!userHasAccess) {
        return res.status(403).json({
          message: "Access denied. Only owners and managers can view bookings.",
        });
      }
      const updatedBooking = await Booking.updateOne(
        { _id: req.params.id },
        {
          $set: {
            isCheckedOut: true,
          },
        }
      );
      console.log(updatedBooking, "updatedBooking");
      return res
        .status(200)
        .json({ message: "successfully updated booking", updatedBooking });
    } catch (error) {
      console.error("Error:", error);
      return res.status(500).json({ message: "Failed to update booking" });
    }
  }
);

router.post("/edit-booking/:id", authenticateToken, async (req, res) => {
  try {
    // Extract booking details from the request body
    let date = new Date();
    const {
      paymentStatus,
      invoiceId,
      paymentAmount,
      from,
      propertyId,
      months,
      to,
      roomType,
      userId,
      numberOfPeople,
      roomAssigned,
      checkedIn,
    } = req.body;
    const booking = await Booking.findById(req.params.id);
    booking.paymentStatus = paymentStatus;
    booking.invoiceId = invoiceId;
    booking.paymentAmount = paymentAmount;
    booking.from = new Date(from);
    booking.to = new Date(from);
    booking.propertyId = propertyId;
    booking.roomType = roomType;
    booking.user = userId;
    booking.numberOfPeople = numberOfPeople;
    (booking.roomAssigned = roomAssigned), (booking.checkedIn = checkedIn);
    // Save the booking to the database
    await booking.save();
    return res
      .status(200)
      .json({ message: "Booking edited successfully", booking: booking });
  } catch (error) {
    console.error("Error creating booking:", error);
    return res.status(500).json({ message: "Failed to create booking." });
  }
});

router.post("/add-user/:bookingId", authenticateToken, async (req, res) => {
  try {
    // Extract room details from the request body
    console.log(req.body, "body");
    const { username, phoneNumber, email } = req.body;
    // Check if the user is authenticated and has a valid token
    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Access denied. User not authenticated." });
    }
    // Check if the user has the role of "Manager" in the database
    const userWithRoleManager = req.user.role == "Manager" ? true : false;
    const userWithRoleOwner = req.user.role == "Owner" ? true : false;
    if (!(userWithRoleManager || userWithRoleOwner)) {
      return res.status(403).json({
        message: "Access denied. Only Managers can create properties.",
      });
    }
    // Create a new room document
    const user = new User({
      username: username,
      phoneNumber: phoneNumber,
      email: email,
    });

    // Save the room to the database

    await user.save();

    const booking = await Booking.updateOne(
      { _id: req.params.bookingId },
      {
        $set: {
          user: user._id,
        },
      }
    );
    console.log(booking, user._id, "booking");
    return res
      .status(201)
      .json({ message: "Room created successfully.", user: user });
  } catch (error) {
    console.error("Error creating room:", error);
    return res.status(500).json({ message: "Failed to create room." });
  }
});

module.exports = router;
