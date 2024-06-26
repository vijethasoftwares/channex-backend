const express = require("express");
const router = express.Router();
const UserController = require("../controllers/userController");
const User = require("../models/User");
const unirest = require("unirest");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const { default: axios } = require("axios");
const clientId =
  "711974125982-gaeieriu9q60ctbps2qpbjitv0374d7l.apps.googleusercontent.com";

const client = new OAuth2Client(
  "711974125982-gaeieriu9q60ctbps2qpbjitv0374d7l.apps.googleusercontent.com"
);

// Register a new user
router.post("/register", UserController.registerUser);
// Verify user's email
router.get("/verify-email", UserController.verifyEmail);
// Login user
router.post("/adminLogin", UserController.loginUser);

// Get all users
router.get("/getusers", UserController.getAllUsers);

// Get a user by their ID
router.get("/getuser/:userId", UserController.getUserById);

// Update user by their ID
router.put("/updateuser/:userId", UserController.updateUserById);

// Delete user by their ID
router.delete("/deleteuser/:userId", UserController.deleteUserById);

router.post("/login", async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number is required." });
    }

    const userFound = await User.findOne({ phoneNumber });

    if (!userFound) {
      return res.status(404).json({ message: "User not found." });
    }

    const OTP = Array.from({ length: 6 }, () =>
      Math.floor(Math.random() * 10)
    ).join("");

    // Assuming you have a field to store OTP in user model
    userFound.phoneOtp = OTP;
    await userFound.save();

    // Assuming you have a function to send OTP
    // const sendingOtp = await sendOTP(phoneNumber, OTP);
    // const resData = await sendingOtp.json();
    // if (resData.return) {
    //   return res.status(500).json({ message: "OTP not sent." });
    // }

    return res
      .status(200)
      .json({ message: resData?.message || "OTP sent successfully." });
  } catch (error) {
    console.error(error);
    console.log("Error logging in user:", error);
    return res.status(500).json({
      message: error || "An error occurred while logging in.",
    });
  }
});

router.post("/gmailLogin", async (req, res) => {
  const { tokenId } = req.body;
  const verifyObject = {};
  verifyObject.idToken = tokenId;
  verifyObject.audience = clientId;
  const response = await client.verifyIdToken(verifyObject);
  const { email_verified } = response.payload;
  if (email_verified) {
    console.log(response.payload);
    const usert = await User.findOne({
      email: response.payload.email,
    });
    if (usert) {
      usert.image = response.payload.picture;
      await usert.save();
      const userid = usert._id;
      const token = jwt.sign(
        { userId: userid },
        `${process.env.JWT_SECRET_KEY}`,
        {
          expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES,
        }
      );
      res.status(200).json({
        success: true,
        usert,
        server_token: token,
      });
    } else {
      const user1 = new User();
      const userId = response.payload.email.split("@")[0];
      user1.username = response.payload.name;
      user1.email = response.payload.email;
      const u = await User.create(user1);
      const userid = u._id;
      const token = jwt.sign(
        { userId: u._id },
        `${process.env.JWT_SECRET_KEY}`,
        {
          expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES,
        }
      );
      res.status(200).json({
        success: true,
        user: u,
        server_token: token,
      });
    }
  } else {
    res.status(400).json({
      message: "unable to verify",
      success: false,
    });
  }
});

router.post("/verifyOtp", async (req, res) => {
  try {
    const { otp, phoneNumber } = req.body;

    // Find the user by username
    const user = await User.findOne({ phoneNumber, phoneOtp: otp });

    // Check if the user exists and the password matches
    if (user) {
      // Generate a JWT token with an expiration date and include the user's ID in the payload
      const token = jwt.sign(
        { userId: user._id },
        `${process.env.JWT_SECRET_KEY}`,
        {
          expiresIn: "30d",
        }
      );

      // Send a response with the token, user's _id, message, and expiration time
      return res.status(200).json({
        userId: user._id,
        role: user.role,
        token: token,
        message: "Login successful.",
        expiresIn: "30d",
      });
    } else {
      return res.status(500).json({ message: "OTP is wrong." });
    }
  } catch (error) {
    console.error("Error logging in user:", error);
    return res.status(500).json({ message: error || "OTP is wrong." });
  }
});

router.post("/verify/phone-or-email", async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;

    if (!emailOrPhone) {
      return res
        .status(400)
        .json({ message: "Email or phone number is required." });
    }

    const userFound = await User.findOne({
      $or: [{ email: emailOrPhone }, { phoneNumber: emailOrPhone }],
    });

    if (!userFound) {
      return res.status(404).json({ message: "User not found." });
    }

    if (userFound.password !== password) {
      return res.status(401).json({ message: "Password is wrong." });
    }

    const token = jwt.sign(
      { userId: userFound._id },
      `${process.env.JWT_SECRET_KEY}`,
      {
        expiresIn: "30d",
      }
    );

    // Send a response with the token, user's _id, message, and expiration time
    return res.status(200).json({
      userId: userFound._id,
      role: userFound.role,
      token: token,
      message: "Login successful.",
      expiresIn: "30d",
    });
  } catch (error) {
    console.error(error);
    console.log("Error logging in user:", error);
    return res
      .status(500)
      .json({ message: error || "An error occurred while logging in." });
  }

  // Assuming you have a function to send OTP
});

const OTP_EXPIRY_DURATION = 5 * 60 * 1000; // 5 minutes

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000); // Generate a 6-digit OTP
};

// async function sendOTP(phoneNumber, OTP) {
//   const apiKey =
//     "iI8bS2F1AnfoKHxpROrdel5VWBuNt6hLE0YsXwTmZJgqzj79yviVaRU1cXut8smbg0GLpKhrSfNxqvZD";
//   console.log(phoneNumber, OTP, "phoneNumber, OTP");
//   try {
//     const res = await fetch(
//       `https://www.fast2sms.com/dev/bulkV2?authorization=${apiKey}&variables_values=${OTP}&route=otp&numbers=${phoneNumber}`,
//       {
//         method: "GET",
//         headers: {
//           "cache-control": "no-cache",
//         },
//       }
//     );
//     return res;
//   } catch (error) {
//     console.error(error);
//     throw error;
//   }
// }

module.exports = router;
