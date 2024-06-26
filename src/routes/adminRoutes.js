const express = require("express");
const router = express.Router();
const unirest = require("unirest");
const authenticateToken = require("../middleware/authMiddleware");
const User = require("../models/User");
const transporter = require("../config/nodemailer");
const { UserRoles } = require("../config/consts");

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
    const { name, phoneNumber, email } = req.body;
    const userWithRoleOwner =
      req.user.role === UserRoles.OWNER || req.user.role === UserRoles.ADMIN;
    if (!userWithRoleOwner) {
      return res.status(403).json({
        message: "Access denied. Only owners amd admin can create managers.",
      });
    }
    const existingUser = await User.findOne({
      $or: [{ email: email }, { phoneNumber: phoneNumber }],
    }).exec();
    console.log("existingUser", existingUser);
    if (existingUser) {
      return res
        .status(200)
        .json({ message: "Manager already exist", data: existingUser });
    }
    // Check if the email is already registered
    // Create a new user
    const newUser = new User({
      name,
      phoneNumber,
      email,
      role: UserRoles.MANAGER,
      createdBy: req.user._id,
    });

    await newUser.save();

    // Generate an email verification token

    // Send a verification email
    const mailOptions = {
      from: `${process.env.SENDER_EMAIL}`,
      to: newUser.email,
      subject: "Credentials for your account",
      text: `phoneNumber for logging in: ${phoneNumber}, email for logging in: ${email}`,
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
      message: `phoneNumber for logging in: ${phoneNumber}, email for logging in: ${email}`,
      language: "english",
      route: "q",
      numbers: `${phoneNumber}`,
    });

    req.headers({
      "cache-control": "no-cache",
    });

    return res.status(201).json({
      message: "User registered. Verification email sent.",
      data: newUser,
    });

    // req.end(function (res) {
    //   if (res.error) throw new Error(res.error);

    //   console.log(res.body);
    // });
  } catch (error) {
    console.error("Error registering user:", error);
    return res
      .status(500)
      .json({ message: error?.message || "Error creating user." });
  }
  // Save the property to the database

  // res.status(200).json({ message: "Welcome to the admin dashboard." });
});

module.exports = router;
