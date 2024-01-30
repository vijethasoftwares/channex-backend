const express = require("express");
const router = express.Router();
const Room = require("../models/Rooms");
const User = require("../models/User");
const authenticateToken = require("../middleware/authMiddleware");
const Razorpay = require("razorpay");
const { slotFound } = require("../utils/findSlot");
const UserRoles = require("../config/consts");

const razorpay = new Razorpay({
  key_id: `${process.env.RAZORPAY_ID}`,
  key_secret: `${process.env.RAZORPAY_KEY}`,
});

// Create a new room
router.post("/create-room", authenticateToken, async (req, res) => {
  try {
    // Extract room details from the request body
    console.log(req.body, "body");
    const {
      roomNumber,
      roomCategory,
      roomType,
      roomSize,
      roomPricePerMonth,
      propertyType,
      maxOccupancy,
      vacancy,
      roomDescription,
      propertyId,
      guestDetails,
      roomPricePerDay,
      images,
      roomFacilities,
    } = req.body;
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
    const newRoom = new Room({
      roomNumber: roomNumber,
      vacancy: vacancy,
      roomCategory: roomCategory,
      roomType: roomType,
      roomSize: roomSize,
      description: roomDescription,
      propertyType,
      facilities: roomFacilities,
      guestDetails: guestDetails,
      images: images,
      propertyId: propertyId,
      maxOccupancy: maxOccupancy,
      pricePerDay: roomPricePerDay,
      pricePerMonth: roomPricePerMonth,
    });
    console.log(newRoom, "newRoom");

    // Save the room to the database

    await newRoom.save();

    return res
      .status(201)
      .json({ message: "Room created successfully.", room: newRoom });
  } catch (error) {
    console.error("Error creating room:", error);
    return res.status(500).json({
      message: error?.message.includes("duplicate key error")
        ? "Room already exists"
        : error?.message || "Failed to create room.",
    });
  }
});

// Get all rooms
router.get("/get-all-rooms", async (req, res) => {
  try {
    const rooms = await Room.find();
    return res.status(200).json({ rooms });
  } catch (error) {
    console.error("Error getting rooms:", error);
    return res.status(500).json({ message: "Failed to retrieve rooms." });
  }
});

router.get("/get-property-rooms/:id", async (req, res) => {
  try {
    const rooms = await Room.find({ propertyId: req.params.id });
    return res
      .status(200)
      .json({ rooms, message: "rooms fetched successfully" });
  } catch (error) {
    console.error("Error getting rooms:", error);
    return res.status(500).json({ message: "Failed to retrieve rooms." });
  }
});

// Get room by ID
router.get("/get-room/:id", async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: "Room not found." });
    }
    return res.status(200).json({ room });
  } catch (error) {
    console.error("Error getting room by ID:", error);
    return res.status(500).json({ message: "Failed to retrieve room." });
  }
});

// Get rooms by manager user ID
router.get("/get-rooms-by-manager/:managerId", async (req, res) => {
  try {
    const { managerId } = req.params;

    // Find all rooms associated with the manager's ID
    const rooms = await Room.find({ managerId });

    return res.status(200).json({ rooms });
  } catch (error) {
    console.error("Error getting rooms by manager ID:", error);
    return res
      .status(500)
      .json({ message: "Failed to retrieve rooms by manager ID." });
  }
});

// Get rooms with filters
router.get("/get-rooms", async (req, res) => {
  try {
    // Extract query parameters from the request
    const {
      roomType,
      maxOccupancy,
      amenities,
      priceMin,
      priceMax,
      isFeatured,
      isOccupied,
      paymentStatus,
      from,
      to,
    } = req.query;

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

    if (priceMin && priceMax) {
      filter.price = { $gte: parseFloat(priceMin), $lte: parseFloat(priceMax) };
    } else if (priceMin) {
      filter.price = { $gte: parseFloat(priceMin) };
    } else if (priceMax) {
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
    console.log(from, to, "from", "to");
    if (from && to) {
      for (let i = 0; i < rooms.length; i++) {
        if (slotFound(from, to, rooms[i])) {
          filteredRooms.push(rooms[i]);
        }
      }
    }

    return res.status(200).json({ rooms, filteredRooms });
  } catch (error) {
    console.error("Error getting filtered rooms:", error);
    return res
      .status(500)
      .json({ message: "Failed to retrieve filtered rooms." });
  }
});

// Get reviews of a room by room ID
router.get("/get-room-reviews/:roomId", async (req, res) => {
  try {
    const { roomId } = req.params;

    // Find the room by its ID
    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({ message: "Room not found." });
    }

    // Extract the reviews from the room
    const reviews = room.reviews;

    return res.status(200).json({ reviews });
  } catch (error) {
    console.error("Error getting room reviews:", error);
    return res
      .status(500)
      .json({ message: "Failed to retrieve room reviews." });
  }
});

router.delete("/deleteAllRooms", async (req, res) => {
  try {
    // delete all rooms
    const room = await Room.deleteMany();
    if (!room) {
      return res.status(404).json({ message: "Room not found." });
    }
    return res.status(200).json(room);
  } catch (error) {
    console.error("Error getting room reviews:", error);
    return res
      .status(500)
      .json({ message: "Failed to retrieve room reviews." });
  }
});

// Update room by ID
router.patch("/update-room/:id", authenticateToken, async (req, res) => {
  try {
    // Extract updated room details from the request body
    const updatedRoom = req.body;
    // console.log(updatedRoom, "updatedRoom");

    // Check if the user is authenticated and has a valid token
    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Access denied. User not authenticated." });
    }

    // Check if the user has the role of "Manager" in the database
    const userWithRoleOwner = req.user.role === UserRoles.OWNER;
    const userWithRoleManager = req.user.role === UserRoles.MANAGER;
    if (!userWithRoleManager && !userWithRoleOwner) {
      return res.status(403).json({
        message: "Access denied. Only Managers and Owners can update rooms.",
      });
    }

    // Find and update the room by its ID
    const room = await Room.updateOne({ _id: req.params.id }, updatedRoom);
    console.log(room, "room");
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

// Delete room by ID
router.delete("/delete-room/:id", authenticateToken, async (req, res) => {
  // Check if the user is authenticated and has a valid token
  if (!req.user) {
    return res
      .status(401)
      .json({ message: "Access denied. User not authenticated." });
  }
  // Check if the user has the role of "Manager" in the database
  const userWithRoleManager = req.user.role === UserRoles.MANAGER;
  const userWithRoleOwner = req.user.role == UserRoles.OWNER;
  if (!userWithRoleManager && !userWithRoleOwner) {
    return res.status(403).json({
      message: "Access denied. Only Managers and Owners can delete rooms.",
    });
  }

  try {
    const { id } = req.params;
    // Find the room by its ID
    const room = await Room.findById(id);

    if (!room) {
      return res.status(404).json({ message: "Room not found." });
    }

    // Delete the room from the database
    await Room.deleteOne({ _id: id });

    return res.status(200).json({ message: "Room deleted successfully." });
  } catch (error) {
    console.error("Error deleting room by ID:", error);
    return res.status(500).json({ message: "Failed to delete room by ID." });
  }
});

router.post("/addComplaint", authenticateToken, async (req, res) => {
  try {
    // Extract payment capture details from the request
    const { userId, complaintText, isResolved, roomId } = req.body;

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
    room.complaints = [
      ...room.complaints,
      {
        userId: userId,
        complaintText: complaintText,
        isResolved: isResolved,
        date: new Date(),
      },
    ];
    // Save the updated room to the database
    await room.save();

    return res
      .status(200)
      .json({ message: "Complaint added successfully.", updatedRoom: room });
  } catch (error) {
    console.error("Error capturing payment:", error);
    return res.status(500).json({ message: "Failed to capture payment." });
  }
});

router.post("/addComplaint", authenticateToken, async (req, res) => {
  try {
    // Extract payment capture details from the request
    const { userId, complaintText, isResolved, roomId } = req.body;

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
    (room.permissions = ["24/7 entry"]),
      (room.complaints = [
        ...room.complaints,
        {
          userId: userId,
          complaintText: complaintText,
          isResolved: isResolved,
          date: new Date(),
        },
      ]);
    // Save the updated room to the database
    await room.save();

    return res
      .status(200)
      .json({ message: "Complaint added successfully.", updatedRoom: room });
  } catch (error) {
    console.error("Error capturing payment:", error);
    return res.status(500).json({ message: "Failed to capture payment." });
  }
});

router.get("/getComplaints", authenticateToken, async (req, res) => {
  try {
    // Extract payment capture details from the request
    // Find the room by its ID
    const properties = await Property.find({ managerId: req.user._id });
    let complaints = [];
    for (let i = 0; i < properties.length; i++) {
      complaints.push(...properties[i].complaints);
    }
    return res
      .status(404)
      .json({ message: "complaints", complaints: complaints });
  } catch (error) {
    console.error("Error capturing payment:", error);
    return res.status(500).json({ message: "Failed to capture payment." });
  }
});

router.put("/updateComplaint", authenticateToken, async (req, res) => {
  try {
    // Extract the submitted data
    const { userId, complaintText, isResolved, roomId } = req.body;

    // Find the room by its ID
    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({ message: "Room not found." });
    }
    console.log(room, "complaints");
    // Update the room with complaint resolve details
    let complaints = [
      ...room.complaints,
      room.complaints.map((obj) => {
        if (obj._id === roomId) {
          return {
            ...obj,
            userId: userId,
            complaintText: complaintText,
            isResolved: isResolved,
            date: new Date(),
          };
        }
        return obj;
      }),
    ];
    room.complaints = [
      {
        userId: userId,
        complaintText: complaintText,
        isResolved: isResolved,
        date: new Date(),
      },
    ];
    // Save the updated room to the database
    (room.permissions = ["24/7 entry"]), await room.save();

    return res
      .status(200)
      .json({ message: "Complaint added successfully.", updatedRoom: room });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Failed to save complaint." });
  }
});

router.get(
  "/get-complaints/:managerId",
  authenticateToken,
  async (req, res) => {
    try {
      // Extract payment capture details from the request
      // Find the room by its ID
      const rooms = await Property.find({ managerId: req.params.managerId });
      return res.status(404).json({ message: "rooms", rooms: rooms });
    } catch (error) {
      console.error("Error capturing payment:", error);
      return res.status(500).json({ message: "Failed to capture payment." });
    }
  }
);

module.exports = router;

// Update payment status of a room by room ID
router.put(
  "/update-payment-status/:roomId",
  authenticateToken,
  async (req, res) => {
    try {
      const { roomId } = req.params;
      const { paymentStatus } = req.body;

      // Find the room by its ID
      const room = await Room.findById(roomId);

      if (!room) {
        return res.status(404).json({ message: "Room not found." });
      }

      // Update the payment status of the room
      room.paymentStatus = paymentStatus;
      await room.save();

      return res
        .status(200)
        .json({ message: "Payment status updated successfully.", room });
    } catch (error) {
      console.error("Error updating payment status:", error);
      return res
        .status(500)
        .json({ message: "Failed to update payment status." });
    }
  }
);

// Create Payment For Rooms By User
router.post("/create-payment", authenticateToken, async (req, res) => {
  try {
    // Extract payment status and booking details from the request
    const { amount, userId, roomId } = req.body;
    // Check if the room with the given roomId is occupied
    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({ message: "Room not found." });
    }

    if (room.isOccupied) {
      return res.status(400).json({ message: "Room is already occupied." });
    }

    // Check if the payment amount matches the room price
    const roomPrice = room.price;
    if (Number(amount) !== roomPrice) {
      return res
        .status(400)
        .json({ message: "Payment amount does not match room price." });
    }

    // Fetch additional room information
    const { name, description } = room;

    // Fetch additional user information
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Create a Razorpay order
    const options = {
      amount: Number(amount) * 100,
      currency: "INR",
      receipt: "booking_receipt",
      notes: {
        paymentCreatedBy: userId,
        roomTitle: name,
        roomDescription: description,
        userName: user.Name,
        userEmail: user.email,
        userContact: user.phoneNumber,
      },
    };

    const order = await razorpay.orders.create(options);

    // Verify the payment status and handle accordingly
    if (order.status === "created") {
      // Send only the required data in the response
      const response = {
        message: "Payment status created & captured successfully.",
        payment: {
          key_id: `${process.env.RAZORPAY_ID}`,
          orderId: order.id,
          PaymentCreatedForRoom: roomId,
          paymentAmount: order.amount,
          paymentStatus: order.status,
          paymentCreatedBy: userId,
          roomTitle: name,
          roomDescription: description,
          userName: user.Name,
          userEmail: user.email,
          userContact: user.contact,
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

// Capture Payment for Room
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
