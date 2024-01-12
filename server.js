require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const db = require("./src/config/db");
const auth = require("./src/routes/authRoutes");
const Admin = require("./src/routes/adminRoutes");
const Property = require("./src/routes/propertiesRoute");
const Rooms = require("./src/routes/roomsRoutes");
const User = require("./src/models/User");
const Manager = require("./src/routes/managerRoutes");
const Owner = require("./src/routes/ownerRoute");
const user = require("./src/routes/userRoutes");
const map = require("./src/routes/mapRoutes");

// Middleware & CORS:
app.use(express.json());
app.use(cors());

app.get("/", async (req, res) => {
  return res.status(200).json({ message: "Server is running..." });
});

app.get("/getAllUsers", async (req, res) => {
  try {
    const users = await User.find();
    // Send a response with the token, message, and expiration time
    return res.status(200).json({ users });
  } catch (error) {
    console.error("Error logging in user:", error);
    return res.status(500).json({ message: "Login failed." });
  }
});
// Routes
app.use("/api/auth", auth);
app.use("/api/admin", Admin);
app.use("/api/owner", Property);
app.use("/api/manager", Rooms);
app.use("/api/manager", Manager);
app.use("/api/owner", Owner);
app.use("/api/user", user);
app.use("/api/map", map);

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
