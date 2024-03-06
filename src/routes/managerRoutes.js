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
const UserRoles = require("../config/consts");
const { groupBy, groupByProperties } = require("../utils/utils");
const KSR = require("../models/KSR");

router.get("/get-bookings/:propertyId", authenticateToken, async (req, res) => {
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
      req.user.role == UserRoles.OWNER || req.user.role == UserRoles.MANAGER;
    if (!userHasAccess) {
      return res.status(403).json({
        message: "Access denied. Only owners and managers can view bookings.",
      });
    }
    const bookings = await Booking.find({
      propertyId: req.params.propertyId,
      user: req.user._id,
    });
    return res.status(200).json({
      message: "successfully fetched bookings",
      bookings: bookings,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ message: "Failed to process request." });
  }
});

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
      req.user.role === UserRoles.OWNER || req.user.role === UserRoles.MANAGER;
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
    const {
      numberOfGuest,
      roomType,
      roomCategory,
      from,
      to,
      checkedIn,
      folioId,
      selectedProperty,
    } = req.body;

    console.log(checkedIn, "checkedIn");

    try {
      const userHasAccess =
        req.user.role == "Owner" || req.user.role == "Manager";
      if (!userHasAccess) {
        return res.status(403).json({
          message: "Access denied. Only owners and managers can view bookings.",
        });
      }
      const rooms = await Room.find({ roomType, roomCategory });
      if (!rooms.length) {
        return res.status(400).json({
          message: `No ${roomCategory} ${roomType} rooms available on the selected property.`,
        });
      }

      //map over check-in and there is folio number of booking so take that no and add /01 or/02 according to the number of guests and add to room
      const updatedGuests = checkedIn.map((guest, index) => {
        return {
          ...guest,
          folioId: `${folioId}/${index + 1}`,
          bookingId: new ObjectId(req.params.id),
        };
      });

      const guestsByRoom = groupByProperties(updatedGuests, ["roomNumber"]);
      // const updateUserToRomm = await guestsByRoom.map(async (obj) => {
      //   const getRoom = await Room.updateOne(
      //     {
      //       propertyId: new ObjectId(selectedProperty),
      //       roomType: roomType,
      //       roomCategory: roomCategory,
      //       roomNumber: obj.roomNumber,
      //     },
      //     {
      //       //push to guests obj
      //       $push: {
      //         guests: obj.data,
      //       },
      //     }
      //   );
      // });

      const updateUserToRoom = await guestsByRoom.map(async (obj) => {
        // Find the room
        const room = await Room.findOne({
          propertyId: new ObjectId(selectedProperty),
          roomType: roomType,
          roomCategory: roomCategory,
          roomNumber: obj.roomNumber,
        });

        // Iterate over the guests in the data object
        for (const guestData of obj.data) {
          // Check if the guest already exists in the guests array
          const guestIndex = room.guests.findIndex(
            (guest) => guest.phone == guestData.phone
          );

          if (guestIndex !== -1) {
            // The guest already exists, update it
            room.guests[guestIndex] = guestData;
          } else {
            // The guest doesn't exist, push it
            room.guests.push(guestData);
          }
        }

        // Save the room
        await room.save();
      });

      const updatedBooking = await Booking.updateOne(
        { _id: req.params.id },
        {
          $set: {
            numberOfGuest,
            roomType,
            roomCategory,
            from,
            to,
            checkedIn: updatedGuests,
            //set time also in the booking model for check-in
            checkedInAt: new Date(),
            isCheckedIn: true,
          },
        }
      );
      console.log(updatedBooking, "updatedBooking");
      return res.status(200).json({
        message: "successfully updated booking",
        updatedBooking,
      });
    } catch (error) {
      console.error("Error:", error);
      return res
        .status(500)
        .json({ message: "Failed to update booking", error });
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
      const booking = await Booking.findById(req.params.id);
      const guests = booking.checkedIn;
      const guestsByRoom = groupByProperties(guests, ["roomNumber"]);
      const updateUserToRomm = guestsByRoom.map(async (obj) => {
        const getRoom = await Room.updateOne(
          { roomNumber: obj.roomNumber },
          {
            //push to guests obj
            //data object contains multiple guests in the room
            $pull: {
              guests: { _id: { $in: obj.data.map((guest) => guest._id) } },
            },
          }
        );
      });

      const updatedBooking = await Booking.updateOne(
        { _id: req.params.id },
        {
          $set: {
            checkedOutAt: new Date(),
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

router.patch("/update-booking/:id", authenticateToken, async (req, res) => {
  if (!req.user) {
    return res
      .status(401)
      .json({ message: "Access denied. User not authenticated." });
  }
  const userHasAccess = req.user.role == "Owner" || req.user.role == "Manager";
  if (!userHasAccess) {
    return res.status(403).json({
      message: "Access denied. Only owners and managers can view bookings.",
    });
  }

  const payload = req.body;

  try {
    // const rooms = await Room.find({
    //   propertyId: payload.propertyId,
    //   roomType: payload.roomType,
    // });

    // if (!rooms.length) {
    //   return res.status(400).json({
    //     message: `No ${payload?.roomCategory} ${payload?.roomType} rooms available on the selected property.`,
    //   });
    // }
    // const roomsSize = rooms.reduce((total, room) => total + room.vacancy, 0);

    // const bookings = await Booking.find({
    //   propertyId: payload.propertyId,
    //   roomType: payload.roomType,
    //   from: { $lte: new Date(payload.to) },
    //   to: { $gte: new Date(payload.from) },
    // });

    // const overlappingBookings = bookings.filter((booking) => {
    //   const bookingFrom = new Date(booking.from);
    //   const bookingTo = new Date(booking.to);
    //   const requestedFrom = new Date(payload.from);
    //   const requestedTo = new Date(payload.to);

    //   return bookingFrom < requestedTo && bookingTo > requestedFrom;
    // });

    // const totalGuests = overlappingBookings.reduce(
    //   (total, booking) => total + booking.numberOfGuest,
    //   0
    // );

    const updatedBooking = await Booking.updateOne(
      { _id: req.params.id },
      payload
    );
    return res.status(201).json({
      message: "Booking updated successfully.",
    });

    // if (roomsSize >= totalGuests) {

    // } else {
    //   return res.status(400).json({
    //     message: "Not enough rooms available.",
    //   });
    // }
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ message: "Failed to update booking" });
  }
});
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

router.post("/inventory/ksr/create", authenticateToken, async (req, res) => {
  const { foodMenu, propertyId } = req.body;

  try {
    const userHasAccess =
      req.user.role == UserRoles.OWNER || req.user.role == UserRoles.MANAGER;
    if (!userHasAccess) {
      return res.status(403).json({
        message:
          "Access denied. Only owners and managers can create Kitchen Stock Register.",
      });
    }
    const property = await Property.findOne({
      _id: propertyId,
      owner_user_id: req.user._id,
    });
    if (!property) {
      return res.status(404).json({
        message: "Property not found",
      });
    }
    const ksr = await KSR.findOne({ propertyId: propertyId });
    if (ksr) {
      ksr.foodMenu = foodMenu;
      await ksr.save();
      return res.status(200).json({
        message: "KSR updated successfully",
        ksr,
      });
    }
    const newKSR = new KSR({
      propertyId: propertyId,
      foodMenu: foodMenu,
    });
    await newKSR.save();

    return res.status(201).json({
      message: "KSR created successfully",
      ksr: newKSR,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ message: "Failed to update KSR" });
  }
});

router.get(
  "/inventory/ksr/:propertyId",
  authenticateToken,
  async (req, res) => {
    try {
      const userHasAccess =
        req.user.role == UserRoles.OWNER || req.user.role == UserRoles.MANAGER;
      if (!userHasAccess) {
        return res.status(403).json({
          message:
            "Access denied. Only owners and managers can view Kitchen Stock Register.",
        });
      }
      const rooms = await Room.find({
        propertyId: req.params.propertyId,
        //guetss array should not be empty
        "guests.0": { $exists: true },
      });
      const ksr = await KSR.findOne({ propertyId: req.params.propertyId });
      if (!ksr) {
        return res.status(404).json({
          message: "KSR not found",
        });
      }
      return res.status(200).json({
        message: "KSR fetched successfully",
        foodMenu: ksr.foodMenu,
        rooms,
      });
    } catch (error) {
      console.error("Error:", error);
      return res.status(500).json({ message: "Failed to fetch KSR" });
    }
  }
);

router.get(
  "/get-room-details/:propertyId",
  authenticateToken,
  async (req, res) => {
    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Access denied. User not authenticated." });
    }
    try {
      const userHasAccess =
        req.user.role == UserRoles.OWNER || req.user.role == UserRoles.MANAGER;
      if (!userHasAccess) {
        return res.status(403).json({
          message: "Access denied. Only owners and managers can view bookings.",
        });
      }
      const bookings = await Booking.aggregate([
        {
          $match: {
            propertyId: new ObjectId(req.params.propertyId),
          },
        },
        {
          $lookup: {
            from: "rooms",
            localField: "roomType",
            foreignField: "roomType",
            as: "room",
          },
        },
      ]);
      console.log(bookings, "bookings");
    } catch (error) {
      console.error("Error:", error);
      return res.status(500).json({ message: "Failed to process request." });
    }
  }
);

module.exports = router;

const flattenObject = (obj, parent, res = {}) => {
  for (let key in obj) {
    let propName = parent ? parent + "." + key : key;
    if (typeof obj[key] == "object" && obj[key] !== null) {
      flattenObject(obj[key], propName, res);
    } else {
      res[propName] = obj[key];
    }
  }
  return res;
};
