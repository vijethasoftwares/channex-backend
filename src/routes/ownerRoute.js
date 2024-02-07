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

// Protected admin route
router.get("/dashboard", authenticateToken, (req, res) => {
  // This route is protected, and only authenticated users with a valid token can access it.
  // You can access the user information from req.user.
  // Example: const userId = req.user.id;

  res.status(200).json({ message: "Welcome to the admin dashboard." });
});

router.post("/create-admin", authenticateToken, (req, res) => {
  // This route is protected, and only authenticated users with a valid token can access it.
  // You can access the user information from req.user.
  // Example: const userId = req.user.id;

  res.status(200).json({ message: "Welcome to the admin dashboard." });
});

router.post("/create-manager", authenticateToken, async (req, res) => {
  // This route is protected, and only authenticated users with a valid token can access it.
  // You can access the user information from req.user.
  // Example: const userId = req.user.id;
  if (!req.user) {
    return res
      .status(401)
      .json({ message: "Access denied. User not authenticated." });
  }
  // Check if the user has the role of "owner" in the database
  try {
    const { username, password, phoneNumber, name, email } = req.body;
    const userWithRoleOwner = await User.findOne({
      _id: req.user._id,
      role: "Owner",
    });
    if (!userWithRoleOwner) {
      return res
        .status(403)
        .json({ message: "Access denied. Only owners can create properties." });
    }
    // Check if the email is already registered

    // Create a new user
    const newUser = new User({
      username,
      password,
      name,
      phoneNumber,
      email,
      createdBy: req.user._id,
    });

    await newUser.save();

    // Generate an email verification token

    // Send a verification email
    const mailOptions = {
      from: `${process.env.SENDER_EMAIL}`,
      to: newUser.email,
      subject: "Credentials for your account",
      text: `phoneNumber for logging in: ${phoneNumber}, email for logging in: ${email} and password for logging in: ${password}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending verification email:", error);
        return res
          .status(500)
          .json({ message: "Failed to send verification email." });
      } else {
        console.log("Verification email sent:", info.response);
        return res
          .status(201)
          .json({ message: "User registered. Verification email sent." });
      }
    });

    var req = unirest("GET", "https://www.fast2sms.com/dev/bulkV2");

    req.query({
      authorization:
        "iI8bS2F1AnfoKHxpROrdel5VWBuNt6hLE0YsXwTmZJgqzj79yviVaRU1cXut8smbg0GLpKhrSfNxqvZD",
      message: `phoneNumber for logging in: ${phoneNumber}, email for logging in: ${email} and password for logging in: ${password}`,
      language: "english",
      route: "q",
      numbers: `${phoneNumber}`,
    });

    req.headers({
      "cache-control": "no-cache",
    });
    req.end(function (res) {
      if (res.error) throw new Error(res.error);
      console.log(res.body);
    });
  } catch (error) {
    console.error("Error registering user:", error);
    return res.status(500).json({ message: "Registration failed." });
  }
  // Save the property to the database

  res.status(200).json({ message: "Welcome to the admin dashboard." });
});

router.post("/update-manager/:id", authenticateToken, async (req, res) => {
  // This route is protected, and only authenticated users with a valid token can access it.
  // You can access the user information from req.user.
  // Example: const userId = req.user.id;
  if (!req.user) {
    return res
      .status(401)
      .json({ message: "Access denied. User not authenticated." });
  }
  // Check if the user has the role of "owner" in the database
  try {
    const {
      username,
      password,
      firstName,
      phoneNumber,
      lastName,
      email,
      propertyId,
    } = req.body;
    const userWithRoleOwner = await User.findOne({
      _id: req.user._id,
      role: "Owner",
    });
    if (!userWithRoleOwner) {
      return res
        .status(403)
        .json({ message: "Access denied. Only owners can create properties." });
    }
    // Check if the email is already registered

    // Create a new user
    const user = await User.findOneAndUpdate(
      { _id: req.params.id },
      {
        username,
        password,
        firstName,
        lastName,
        phoneNumber,
        email,
        createdBy: req.user._id,
      }
    );
    const property = await Property.findById(propertyId);
    property.managerId = req.params.id;
    await property.save();
    res.status(200).json({ message: "Updated manager successfully." });
  } catch (error) {
    console.error("Error registering user:", error);
    return res.status(500).json({ message: "Registration failed." });
  }
});

router.post("/create-admin", authenticateToken, (req, res) => {
  // This route is protected, and only authenticated users with a valid token can access it.
  // You can access the user information from req.user.
  // Example: const userId = req.user.id;

  res.status(200).json({ message: "Welcome to the admin dashboard." });
});

router.delete("/deleteManager/:id", authenticateToken, async (req, res) => {
  // This route is protected, and only authenticated users with a valid token can access it.
  // You can access the user information from req.user.
  // Example: const userId = req.user.id;
  try {
    const { id } = req.params;

    // Check if the user is authenticated and has a valid token
    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Access denied. User not authenticated." });
    }

    // Find the property by its ID
    const user = await User.deleteOne({ _id: id });

    if (!user) {
      return res.status(404).json({ message: "Property not found." });
    }

    // Check if the user is the owner of the property or has the role of 'admin'
    if (req.user.role !== "Owner") {
      return res
        .status(403)
        .json({
          message:
            "Access denied. You are not authorized to delete this property.",
        });
    }

    // Delete the property from the database

    return res.status(200).json({ message: "User deleted successfully." });
  } catch (error) {
    console.error("Error deleting property by ID:", error);
    return res
      .status(500)
      .json({ message: "Failed to delete property by ID." });
  }
});

router.get("/getManager/:id", authenticateToken, async (req, res) => {
  // This route is protected, and only authenticated users with a valid token can access it.
  // You can access the user information from req.user.
  // Example: const userId = req.user.id;
  try {
    const { id } = req.params;

    // Check if the user is authenticated and has a valid token
    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Access denied. User not authenticated." });
    }

    // Find the property

    // Check if the user is the owner of the property or has the role of 'admin'
    if (req.user.role !== "Owner") {
      return res
        .status(403)
        .json({
          message:
            "Access denied. You are not authorized to delete this property.",
        });
    }

    const user = await User.findOne({ _id: id });
    if (!user) {
      return res.status(404).json({ message: "Manager not found." });
    }

    // Delete the property from the database

    return res
      .status(200)
      .json({ message: "User found successfully.", manager: user });
  } catch (error) {
    console.error("Error deleting property by ID:", error);
    return res.status(500).json({ message: "cannot find user." });
  }
});

router.get("/getMyManagers", authenticateToken, async (req, res) => {
  // This route is protected, and only authenticated users with a valid token can access it.
  // You can access the user information from req.user.
  // Example: const userId = req.user.id;
  try {
    // Check if the user is authenticated and has a valid token
    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Access denied. User not authenticated." });
    }

    // Find the property by its ID
    const users = await User.find({ createdBy: req.user._id });

    if (!users) {
      return res.status(404).json({ message: "managers not found." });
    }

    // Check if the user is the owner of the property or has the role of 'admin'

    // Delete the property from the database

    return res.status(200).json({ message: "Managers found", managers: users });
  } catch (error) {
    console.error("Error deleting property by ID:", error);
    return res
      .status(500)
      .json({ message: "Failed to delete property by ID." });
  }
});

router.get("/getBookings", authenticateToken, async (req, res) => {
  if (!req.user) {
    return res
      .status(401)
      .json({ message: "Access denied. User not authenticated." });
  }
  // Check if the user has the role of "owner" in the database
  try {
    // Extract payment capture details from the request
    // Find the room by its ID
    const userWithRoleOwner = req.user.role == "Owner" ? true : false;
    if (!userWithRoleOwner) {
      return res
        .status(403)
        .json({ message: "Access denied. Only owners can create properties." });
    }
    const properties = await Property.find({ owner_user_id: req.user._id });
    let ids = [];
    for (let i = 0; i < properties.length; i++) {
      ids.push(properties[i]._id);
    }
    const bookings = await Booking.find({
      propertyId: {
        $in: [...ids],
      },
    });
    const allBookings = bookings.map((b) => ({
      ...b._doc,
      propertyName: properties.find(
        (p) => p._id.toString() == b.propertyId.toString()
      )?.name,
    }));
    return res.status(200).json({ message: "Rooms", bookings: allBookings });
  } catch (error) {
    console.error("Error capturing payment:", error);
    return res.status(500).json({ message: "Failed to capture payment." });
  }
});

router.get("/getAllBookings", authenticateToken, async (req, res) => {
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
      return res
        .status(403)
        .json({
          message: "Access denied. Only owners and managers can view bookings.",
        });
    }
    const properties = await Property.find({ owner_user_id: req.user._id });
    console.log(req.user, "user");
    let ids = [];
    for (let i = 0; i < properties.length; i++) {
      ids.push(properties[i]._id);
    }
    console.log("ids", ids);
    // Assuming managers should see all bookings and owners only their own properties' bookings
    const bookings =
      userHasAccess && req.user.role == "Manager"
        ? await Booking.find()
        : await await Booking.find();
    return res.status(200).json({ message: "Rooms", bookings: bookings });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ message: "Failed to process request." });
  }
});

router.get("/deleteAllBookings", authenticateToken, async (req, res) => {
  if (!req.user) {
    return res
      .status(401)
      .json({ message: "Access denied. User not authenticated." });
  }
  // Check if the user has the role of "owner" in the database
  try {
    // Extract payment capture details from the request
    // Find the room by its ID
    const userWithRoleOwner = req.user.role == "Owner" ? true : false;
    if (!userWithRoleOwner) {
      return res
        .status(403)
        .json({ message: "Access denied. Only owners can create properties." });
    }
    const bookings = await Booking.deleteMany();
    return res.status(200).json({ message: "Rooms", bookings: bookings });
  } catch (error) {
    console.error("Error capturing payment:", error);
    return res.status(500).json({ message: "Failed to capture payment." });
  }
});

router.post("/create-booking", authenticateToken, async (req, res) => {
  try {
    // Extract property details from the request body
    let date = new Date();
    const {
      paymentStatus,
      invoiceId,
      paymentAmount,
      from,
      to,
      propertyId,
      roomId,
      userId,
    } = req.body;

    // Check if the user is authenticated and has a valid token
    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Access denied. User not authenticated." });
    }

    const newBooking = new Booking({
      paymentStatus,
      invoiceId,
      paymentAmount,
      from: new Date(date.getTime() + 24 * 60 * 60 * 1000),
      to: new Date(date.getTime() + 72 * 60 * 60 * 1000),
      propertyId: propertyId,
      room: roomId,
      user: userId,
    });

    // Save the property to the database
    await newBooking.save();
    const toDate = new Date(date.getTime() + 72 * 30 * 60 * 60 * 1000);
    const fromDate = new Date(date.getTime() + 24 * 40 * 60 * 60 * 1000);
    const room = await Room.findOne({ _id: roomId });
    const slot = { from: fromDate, to: toDate };
    let availableDates = room.available;
    let result = [];
    availableDates.forEach((a) => result.push(...findSlot.findSlot(a, slot)));
    console.log(result, "result");
    room.available = result;
    await room.save();
    return res
      .status(201)
      .json({ message: "Booking created successfully.", property: newBooking });
  } catch (error) {
    console.error("Error creating booking:", error);
    return res.status(500).json({ message: "Failed to create booking." });
  }
});

router.get("/get-booking/:id", authenticateToken, async (req, res) => {
  // This route is protected, and only authenticated users with a valid token can access it.
  // You can access the user information from req.user.
  // Example: const userId = req.user.id;
  try {
    const { id } = req.params;

    // Check if the user is authenticated and has a valid token
    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Access denied. User not authenticated." });
    }

    // Find the property

    // Check if the user is the owner of the property or has the role of 'admin'
    if (req.user.role !== "Owner") {
      return res
        .status(403)
        .json({
          message:
            "Access denied. You are not authorized to delete this property.",
        });
    }

    const booking = await Booking.findOne({ _id: id });
    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    const user = await User.findOne({ _id: booking.user });

    // Delete the property from the database

    return res
      .status(200)
      .json({
        message: "Booking found successfully.",
        booking: { ...booking._doc, user: user },
      });
  } catch (error) {
    console.error("Error finding booking by ID:", error);
    return res.status(500).json({ message: "cannot find booking." });
  }
});

router.get(
  "/assign-manager/:propertyId/:managerId",
  authenticateToken,
  async (req, res) => {
    // This route is protected, and only authenticated users with a valid token can access it.
    // You can access the user information from req.user.
    // Example: const userId = req.user.id;
    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Access denied. User not authenticated." });
    }
    // Check if the user has the role of "owner" in the database
    try {
      const userWithRoleOwner = await User.findOne({
        _id: req.user._id,
        role: "Owner",
      });
      if (!userWithRoleOwner) {
        return res
          .status(403)
          .json({ message: "Access denied. Only owners can assign." });
      }
      const property = await Property.findById(req.params.propertyId);
      property.managerId = req.params.managerId;
      await property.save();
      return res.status(200).json({ message: "Manager added successfully." });
    } catch (error) {
      console.error("Error registering user:", error);
      return res.status(500).json({ message: "Registration failed." });
    }
  }
);

router.get(
  "/assign-room/:roomId/:bookingId",
  authenticateToken,
  async (req, res) => {
    // This route is protected, and only authenticated users with a valid token can access it.
    // You can access the user information from req.user.
    // Example: const userId = req.user.id;
    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Access denied. User not authenticated." });
    }
    // Check if the user has the role of "owner" in the database
    try {
      const userWithRoleOwner = await User.findOne({
        _id: req.user._id,
        role: "Owner",
      });
      if (!userWithRoleOwner) {
        return res
          .status(403)
          .json({ message: "Access denied. Only owners can assign." });
      }
      const booking = await Booking.findById(req.params.bookingId);
      booking.roomAssigned = req.params.roomId;
      await booking.save();
      return res.status(200).json({ message: "Manager added successfully." });
    } catch (error) {
      console.error("Error registering user:", error);
      return res.status(500).json({ message: "Registration failed." });
    }
  }
);

router.get(
  "/getUnOcupiedRooms/:bookingId",
  authenticateToken,
  async (req, res) => {
    // This route is protected, and only authenticated users with a valid token can access it.
    // You can access the user information from req.user.
    // Example: const userId = req.user.id;
    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Access denied. User not authenticated." });
    }
    // Check if the user has the role of "owner" in the database
    let filteredRooms = [];
    try {
      const userWithRoleOwner = await User.findOne({
        _id: req.user._id,
        role: "Owner",
      });
      if (!userWithRoleOwner) {
        return res
          .status(403)
          .json({ message: "Access denied. Only owners can assign." });
      }

      const booking = await Booking.findById(req.params.bookingId);
      const bookings = await Booking.find({
        roomType: booking.roomType,
        propertyId: booking.propertyId,
        roomAssigned: undefined,
      });
      const rooms = await Room.find({
        roomType: booking.roomType,
        propertyId: booking.propertyId,
      });
      for (let i = 0; i < rooms.length; i++) {
        for (let j = 0; j < bookings.length; j++) {
          let overlap =
            (new Date(booking.from).getTime() < new Date(bookings[j].from) &&
              new Date(booking.to).getTime() < new Date(bookings[j].from)) ||
            (new Date(booking.from).getTime() >
              new Date(bookings[j].to).getTime() &&
              new Date(booking.to).getTime() > new Date(bookings[j].to));
          if (!overlap) {
            filteredRooms.push(rooms[i]);
          }
        }
      }
      return res
        .status(200)
        .json({ message: "Found rooms successfully.", rooms: filteredRooms });
    } catch (error) {
      console.error("Error registering user:", error);
      return res.status(500).json({ message: "Finding rooms failed." });
    }
  }
);

router.get("/getComplaints", authenticateToken, async (req, res) => {
  try {
    // Extract payment capture details from the request
    // Find the room by its ID
    const properties = await Property.find({ owner_user_id: req.user._id });
    let complaints = [];
    for (let i = 0; i < properties.length; i++) {
      complaints.push(...properties[i].complaints);
    }
    return res.status(404).json({ message: "Rooms", complaints: complaints });
  } catch (error) {
    console.error("Error capturing payment:", error);
    return res.status(500).json({ message: "Failed to capture payment." });
  }
});

module.exports = router;
