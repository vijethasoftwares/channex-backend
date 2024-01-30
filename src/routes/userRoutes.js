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
const { default: mongoose } = require("mongoose");
const Razorpay = require("razorpay");
const { slotFound } = require("../utils/findSlot");

const razorpay = new Razorpay({
  key_id: "rzp_test_3FLuLisPuowtZP",
  key_secret: "paGWw3r0v1ty8K3U9YDxOu8f",
});

router.post("/create-booking", async (req, res) => {
  const {
    paymentStatus,
    paymentAmount,
    roomCategory,
    bookingType,
    bookingStatus,
    paymentMethod,
    primaryGuestName,
    guestPhoneNumber,
    guestEmail,
    from,
    to,
    propertyId,
    roomType,
    userId,
    numberOfGuests,
  } = req.body;

  try {
    const rooms = await Room.find({ propertyId, roomType, roomCategory });

    if (!rooms.length) {
      return res.status(400).json({
        message: `No ${roomCategory} ${roomType} rooms available on the selected property.`,
      });
    }

    const overlappingBookings = await Booking.find({
      propertyId,
      roomType,
      roomCategory,
      from: { $lte: new Date(to) },
      to: { $gte: new Date(from) },
    });

    const bookingTotalGuests = overlappingBookings.reduce((acc, curr) => {
      return acc + curr.numberOfGuests;
    }, 0);
    const totalGuess = bookingTotalGuests + numberOfGuests;
    const totalMaxOccupancy = rooms.reduce((acc, curr) => {
      return acc + curr.maxOccupancy;
    }, 0);
    if (totalGuess > totalMaxOccupancy) {
      res.status(400).json({ message: "No rooms available" });
    }

    // const roomsSize = rooms.reduce((total, room) => total + room.vacancy, 0);

    // console.log(roomsSize, "roomsSize");

    // const overlappingBookings = bookings.filter((booking) => {
    //   const bookingFrom = new Date(booking.from);
    //   const bookingTo = new Date(booking.to);
    //   const requestedFrom = new Date(from);
    //   const requestedTo = new Date(to);

    //   return bookingFrom < requestedTo && bookingTo > requestedFrom;
    // });

    // const totalGuests = overlappingBookings.reduce(
    //   (total, booking) => total + booking.numberOfGuest,
    //   0
    // );
    // console.log();
    // console.log(totalGuests, "totalGuests");
    // console.log(numberOfGuest, "number of guest");

    // 2 triple rooms having 5 vacancy for 4 guests
    // room 1 - 2 vacancy - 4 guests - 2 guests
    // room 2 - 3 vacancy - 2 guests - 0 guests
    // const roomsWithVacancy = rooms.filter((room) => room.vacancy > 0);
    // let nog = numberOfGuest;

    // if (roomsSize >= totalGuests + numberOfGuest) {
    //   const updatedVacancy = await Promise.all(
    //     roomsWithVacancy.map((room) => {
    //       if (nog <= 0) {
    //         return Promise.resolve(room);
    //       }

    //       const guestsToAssign = Math.min(nog, room.vacancy);
    //       nog -= guestsToAssign;
    //       const newVacancy = room.vacancy - guestsToAssign;

    //       return Room.findByIdAndUpdate(
    //         room._id,
    //         { vacancy: newVacancy },
    //         { new: true }
    //       );
    //     })
    //   );

    const newBooking = new Booking({
      paymentStatus,
      paymentAmount,
      roomCategory,
      bookingType,
      bookingStatus,
      paymentMethod,
      guestName: primaryGuestName,
      guestPhoneNumber,
      guestEmail,
      from: new Date(from),
      to: new Date(to),
      propertyId,
      roomType,
      user: userId,
      numberOfGuests,
    });

    await newBooking.save();
    return res.status(201).json({
      message: "Booking created successfully.",
      booking: newBooking,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "An error occurred while creating the booking.",
    });
  }
});

router.delete(
  "/delete-booking/:bookingId",
  authenticateToken,
  async (req, res) => {
    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Access denied. User not authenticated." });
    }
    const id = req.params.bookingId;
    const response = await Booking.findByIdAndDelete(id);
    if (response) {
      return res.status(200).json({
        message: "Booking deleted successfully.",
      });
    } else {
      return res.status(400).json({
        message: "Booking not found.",
      });
    }
  }
);

router.get("/search-rooms", async (req, res) => {
  try {
    // Extract query parameters from the request
    console.log(req.query, "query");
    const {
      roomType,
      maxOccupancy,
      lat,
      lon,
      amenities,
      priceMin,
      priceMax,
      isFeatured,
      isOccupied,
      paymentStatus,
      guests,
      from,
      months,
    } = req.query;
    let numberOfPeople = guests;
    // Build a filter object based on the query parameters
    const filter = {};

    if (roomType) {
      filter.roomType = roomType;
    }

    if (maxOccupancy) {
      filter.maxOccupancy = maxOccupancy;
    }

    if (amenities) {
      // Convert amenities string to an array
      filter.amenities = amenities.split(",");
    }

    if (Number(priceMin) && Number(priceMax)) {
      filter.price = { $gte: parseFloat(priceMin), $lte: parseFloat(priceMax) };
    } else if (Number(priceMin)) {
      filter.price = { $gte: parseFloat(priceMin) };
    } else if (Number(priceMax)) {
      filter.price = { $lte: parseFloat(priceMax) };
    }

    if (isFeatured) {
      filter.isFeatured = isFeatured === "true";
    }

    if (isOccupied) {
      filter.isOccupied = isOccupied === "true";
    }

    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }

    // Find rooms based on the filter criteria
    const rooms = await Room.find({ ...filter });
    const filteredRooms = [];
    let filteredResults = [];
    if (from && months) {
      for (let i = 0; i < rooms.length; i++) {
        const bookings = await Booking.find({
          propertyId: rooms[i].propertyId,
          roomType: roomType,
        });
        let filteredBookings = [];
        for (let i = 0; i < bookings.length; i++) {
          console.log(
            new Date(from).getTime() >= new Date(bookings[i].from).getTime() &&
              new Date(from).getTime() <= new Date(bookings[i].from).getTime()
          );
          if (
            new Date(from).getTime() >= new Date(bookings[i].from).getTime() &&
            new Date(from).getTime() <= new Date(bookings[i].from).getTime()
          ) {
            filteredBookings.push(bookings[i]);
          }
        }
        let bookingsQuantity = 0;
        for (let i = 0; i < filteredBookings.length; i++) {
          bookingsQuantity =
            filteredBookings[i].numberOfPeople + bookingsQuantity;
        }
        const loopRooms = await Room.find({
          ...filter,
          propertyId: rooms[i].propertyId,
          roomType: roomType,
        });
        if (loopRooms.length > 0) {
          let roomsSize = loopRooms.length * loopRooms[0]?.maxOccupancy;
          console.log(
            roomsSize,
            bookingsQuantity + numberOfPeople,
            "dateformat"
          );
          if (roomsSize >= bookingsQuantity + numberOfPeople) {
            console.log(lat, lon, "lon");
            let p = await Property.aggregate([
              {
                $geoNear: {
                  near: {
                    type: "Point",
                    coordinates: [Number(lat), Number(lon)],
                  },
                  maxDistance: 20000,
                  distanceField: "distance",
                },
              },
              { $match: { _id: rooms[i].propertyId } },
              {
                $project: {
                  location: 0,
                },
              },
            ]);
            if (p && p.length > 0) {
              console.log(p, "p");
              let room = { ...rooms[i]._doc, property: { ...p[0] } };
              filteredResults.push(room);
            }
          }
        } else {
          console.log(lat, lon, "lat");
          let p = await Property.aggregate([
            {
              $geoNear: {
                near: {
                  type: "Point",
                  coordinates: [Number(lat), Number(lon)],
                },
                maxDistance: 20000,
                distanceField: "distance",
              },
            },
            { $match: { _id: rooms[i].propertyId } },
            {
              $project: {
                location: 0,
              },
            },
          ]);
          if (p && p.length > 0) {
            console.log(p, "p");
            let room = { ...rooms[i]._doc, property: { ...p[0] } };
            //filteredResults.push(room)
          }
        }
      }
    }
    return res.status(200).json({ rooms, filteredResults });
  } catch (error) {
    console.error("Error getting filtered rooms:", error);
    return res
      .status(500)
      .json({ message: "Failed to retrieve filtered rooms." });
  }
});

router.get("/get-room/:roomId", async (req, res) => {
  try {
    const roomData = await Room.findById(req.params.roomId);
    let p = await Property.findOne(roomData.propertyId);
    let room = { ...roomData._doc, property: { ...p._doc } };
    if (!room) {
      return res.status(404).json({ message: "Room not found." });
    }
    return res.status(200).json({ room });
  } catch (error) {
    console.error("Error getting room by ID:", error);
    return res.status(500).json({ message: "Failed to retrieve room." });
  }
});

// Create Payment For Rooms By User
router.get("/create-payment/:amount/:roomId/:userId", async (req, res) => {
  try {
    // Extract payment status and booking details from the request
    const { amount, userId, roomId } = req.params;
    // Check if the room with the given roomId is occupied

    // Check if the payment amount matches the room price

    // Fetch additional room information
    const room = await Room.findById(roomId);
    const { name, description } = room;

    // Fetch additional user information
    if (mongoose.isValidObjectId(userId)) {
      const user = await User.findById(userId);
    }

    console.log(process.env.RAZOR_PAY_KEY_ID, "first");
    // Create a Razorpay order
    const options = {
      amount: Number(amount) * 100,
      currency: "INR",
      receipt: "booking_receipt",
      notes: {
        paymentCreatedBy: "userId",
        roomTitle: "name",
        roomDescription: "description",
        userName: "user",
        userEmail: "user",
        userContact: "user",
      },
    };

    const order = await razorpay.orders.create(options);

    // Verify the payment status and handle accordingly
    if (order.status === "created") {
      // Send only the required data in the response
      console.log(process.env.RAZOR_PAY_KEY_ID, "razorpay");
      const response = {
        message: "Payment status created & captured successfully.",
        payment: {
          key_id: `${process.env.RAZOR_PAY_KEY_ID}`,
          orderId: order.id,
          PaymentCreatedForRoom: roomId,
          paymentAmount: order.amount,
          paymentStatus: order.status,
          paymentCreatedBy: "userId",
          roomTitle: "name",
          roomDescription: "description",
          userName: "user",
          userEmail: "user",
          userContact: "user",
        },
      };

      return res.status(200).json(response);
    } else {
      // Handle payment failure or other payment status accordingly
      return res.status(400).json({ message: "Payment failed." });
    }
  } catch (error) {
    console.error("Error capturing payment status:", error);
    return res
      .status(500)
      .json({ message: "Failed to capture payment status." });
  }
});

router.post("/capture-payment", authenticateToken, async (req, res) => {
  try {
    // Extract payment capture details from the request
    const { userId, roomId, paymentId, paymentAmount } = req.body;

    // Find the room by its ID
    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({ message: "Room not found." });
    }

    // Check if the room is already occupied
    if (room.isOccupied) {
      return res.status(400).json({ message: "Room is already occupied." });
    }

    // Update the room with payment details
    room.isOccupied = true;
    room.paymentId = paymentId;
    room.paymentAmount = paymentAmount;
    room.paymentcreatedBy = userId;

    // Save the updated room to the database
    await room.save();

    return res
      .status(200)
      .json({ message: "Payment captured successfully.", updatedRoom: room });
  } catch (error) {
    console.error("Error capturing payment:", error);
    return res.status(500).json({ message: "Failed to capture payment." });
  }
});

// Update room by ID
router.put("/update-room/:roomId", authenticateToken, async (req, res) => {
  try {
    // Extract updated room details from the request body
    const updatedRoom = req.body;

    // Check if the user is authenticated and has a valid token
    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Access denied. User not authenticated." });
    }

    // Check if the user has the role of "Manager" in the database
    const userWithRoleManager = await User.findOne({
      _id: updatedRoom.managerId,
      role: "Manager",
    });
    if (!userWithRoleManager) {
      return res.status(403).json({
        message: "Access denied. Only Managers can create properties.",
      });
    }

    // Find and update the room by its ID
    const room = await Room.findByIdAndUpdate(req.params.roomId, updatedRoom, {
      new: true,
    });
    if (!room) {
      return res.status(404).json({ message: "Room not found." });
    }

    return res
      .status(200)
      .json({ message: "Room updated successfully.", room });
  } catch (error) {
    console.error("Error updating room by ID:", error);
    return res.status(500).json({ message: "Failed to update room." });
  }
});

router.get("/load-user", authenticateToken, async (req, res) => {
  try {
    // Extract updated room details from the request body
    // Check if the user is authenticated and has a valid token
    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Access denied. User not authenticated." });
    }
    return res.status(200).json({
      message: "User loaded successfully.",
      user: req.user,
    });
  } catch (error) {
    console.error("Error updating room by ID:", error);
    return res.status(500).json({ message: "Failed to update room." });
  }
});

module.exports = router;
