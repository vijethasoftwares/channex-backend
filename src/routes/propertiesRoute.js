const express = require("express");
const router = express.Router();
const Property = require("../models/Property");
const User = require("../models/User");
const authenticateToken = require("../middleware/authMiddleware");
const UserRoles = require("../config/consts");
const Room = require("../models/Rooms");
const Complaints = require("../models/Complaints");
const { ObjectId } = require("mongodb");

// Create a new property
router.post("/create-properties", authenticateToken, async (req, res) => {
  const userId = req.user._id;
  try {
    // Extract property details from the request body
    const {
      name,
      type,
      address,
      location,
      city,
      state,
      contactInfo,
      size,
      isFeatured,
      description,
      isCoupleFriendly,
      isParkingSpaceAvailable,
      managerId,
      nearbyPlaces,
      facilities,
      foodMenu,
      status,
      images,
      manager,
      coOfLocation,
    } = req.body;

    // Check if the user is authenticated and has a valid token
    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Access denied. User not authenticated." });
    }

    // Check if the user has the role of "owner" in the database
    const userWithRoleOwner = req.user.role === UserRoles.OWNER;
    if (!userWithRoleOwner) {
      return res
        .status(403)
        .json({ message: "Access denied. Only owners can create properties." });
    }

    // Create a new property document with the provided userId and images
    const newProperty = new Property({
      name,
      type,
      address,
      city,
      state,
      coOfLocation,
      contactInfo,
      size,
      isFeatured,
      managerId,
      isCoupleFriendly,
      isParkingSpaceAvailable,
      nearbyPlaces,
      description,
      facilities,
      foodMenu,
      status,
      manager,
      owner_user_id: userId,
      images,
    });

    // Save the property to the database
    await newProperty.save();

    return res.status(201).json({
      message: "Property created successfully.",
      property: newProperty,
    });
  } catch (error) {
    console.error("Error creating property:", error);
    return res.status(500).json({
      // Error creating property: Error: Property validation failed: managerId: Cast to ObjectId failed for value "" (type string) at path "managerId" because of "BSONError"
      message: error.message.includes("Cast to ObjectId failed")
        ? "Manager ID is invalid."
        : "Failed to create property.",
    });
  }
});

// Get all properties
router.get("/get-all-properties", authenticateToken, async (req, res) => {
  // Check if the user is authenticated and has a valid token
  if (!req.user) {
    return res
      .status(401)
      .json({ message: "Access denied. User not authenticated." });
  }

  // Check if the user has the role of "owner" in the database
  const userWithRoleOwner =
    req.user.role === UserRoles.OWNER ||
    req.user.role === UserRoles.ACCOUNTANT ||
    req.user.role === UserRoles.SALESMANAGER;
  if (!userWithRoleOwner) {
    return res
      .status(403)
      .json({ message: "Access denied. Only owners can create properties." });
  }
  try {
    const properties = await Property.find();
    return res
      .status(200)
      .json({ message: "fetched properties successfully", properties });
  } catch (error) {
    console.error("Error getting properties:", error);
    return res.status(500).json({ message: "Failed to retrieve properties." });
  }
});

router.get("/delete-all-properties", authenticateToken, async (req, res) => {
  if (!req.user) {
    return res
      .status(401)
      .json({ message: "Access denied. User not authenticated." });
  }

  // Check if the user has the role of "owner" in the database
  const userWithRoleOwner = req.user.role === UserRoles.OWNER;
  if (!userWithRoleOwner) {
    return res
      .status(403)
      .json({ message: "Access denied. Only owners can create properties." });
  }
  try {
    const properties = await Property.deleteMany();
    return res.status(200).json({ properties });
  } catch (error) {
    console.error("Error getting properties:", error);
    return res.status(500).json({ message: "Failed to retrieve properties." });
  }
});

router.get("/get-my-properties", authenticateToken, async (req, res) => {
  if (!req.user) {
    return res.status(500).json({ message: "Failed to retrieve properties." });
  }
  try {
    const userWithRoleManager = req.user.role === UserRoles.MANAGER;
    const userWithRoleOwner = req.user.role === UserRoles.OWNER;
    if (userWithRoleManager) {
      const properties = await Property.find({ managerId: req.user._id });
      return res.status(200).json({ properties });
    }
    if (userWithRoleOwner) {
      const properties = await Property.find({ owner_user_id: req.user._id });
      return res.status(200).json({ properties });
    }
  } catch (error) {
    console.error("Error getting properties:", error);
    return res.status(500).json({ message: "Failed to retrieve properties." });
  }
});

// Get property details by ID
router.get("/get-property-by-id/:propertyId", async (req, res) => {
  try {
    const { propertyId } = req.params;

    // Find the property by its ID
    const property = await Property.findById(propertyId);

    if (!property) {
      return res.status(404).json({ message: "Property not found." });
    }

    return res
      .status(200)
      .json({ property, message: "property fetched successfully" });
  } catch (error) {
    console.error("Error getting property by ID:", error);
    return res
      .status(500)
      .json({ message: "Failed to retrieve property by ID." });
  }
});

// Update property details by ID
router.patch("/update-property/:id", authenticateToken, async (req, res) => {
  // Check if the user is authenticated and has a valid token
  if (!req.user) {
    return res
      .status(401)
      .json({ message: "Access denied. User not authenticated." });
  }
  const UserRole = req.user.role === UserRoles.OWNER;
  if (!UserRole) {
    return res
      .status(403)
      .json({ message: "Access denied. Only owners can edit properties." });
  }
  try {
    const { id } = req.params;

    // Find the property by its ID
    const property = await Property.findById(id);

    if (!property) {
      return res.status(404).json({ message: "Property not found." });
    }

    // Extract updated property details from the request body
    const payload = req.body;

    // Update the property with the new details
    const isUpdated = await Property.updateOne({ _id: id }, payload);
    if (isUpdated.modifiedCount === 0) {
      return res.status(404).json({ message: "Failed to update property" });
    }
    return res
      .status(200)
      .json({ message: "Property updated successfully.", property });
  } catch (error) {
    console.error("Error updating property by ID:", error);
    return res
      .status(500)
      .json({ message: "Failed to update property by ID." });
  }
});

// Delete property by ID
router.delete("/delete-property/:id", authenticateToken, async (req, res) => {
  // Check if the user is authenticated and has a valid token
  if (!req.user) {
    return res
      .status(401)
      .json({ message: "Access denied. User not authenticated." });
  }
  const userWithRoleOwner = req.user.role == UserRoles.OWNER;
  if (!userWithRoleOwner) {
    return res.status(403).json({
      message: "Access denied. Only Owners can delete properties.",
      // "Access denied. You are not authorized to delete this property.",
    });
  }
  try {
    const { id } = req.params;

    // Find the property by its ID
    const property = await Property.findById(id);
    if (!property) {
      return res.status(404).json({ message: "Property not found." });
    }

    const hasRooms = Room.findOne({ propertyId: id });
    if (hasRooms) {
      return res.status(404).json({
        message: "Property has rooms. Please delete rooms first.",
      });
    }

    // Delete the property from the database
    await Property.deleteOne({ _id: id });

    return res.status(200).json({ message: "Property deleted successfully." });
  } catch (error) {
    console.error("Error deleting property by ID:", error);
    return res
      .status(500)
      .json({ message: "Failed to delete property by ID." });
  }
});

// Get properties by owner_user_id
router.get(
  "/get-properties-by-owner/:ownerId",
  authenticateToken,
  async (req, res) => {
    try {
      const { ownerId } = req.params;

      // Check if the user is authenticated and has a valid token
      if (!req.user) {
        return res
          .status(401)
          .json({ message: "Access denied. User not authenticated." });
      }

      // Check if the user is the owner or has the role of 'admin'
      if (ownerId !== req.user._id.toString() && req.user.role !== "admin") {
        return res.status(403).json({
          message:
            "Access denied. You are not authorized to access these properties.",
        });
      }

      // Find properties by owner_user_id
      const properties = await Property.find({ owner_user_id: ownerId });

      return res.status(200).json({ properties });
    } catch (error) {
      console.error("Error getting properties by owner_user_id:", error);
      return res
        .status(500)
        .json({ message: "Failed to retrieve properties by owner_user_id." });
    }
  }
);

// Get properties with filtering options
router.get("/get-properties", async (req, res) => {
  try {
    const { location, size, status, isFeatured } = req.query;
    const filters = {};

    // Add filters based on query parameters
    if (location) {
      filters.location = location;
    }

    if (size) {
      filters.size = size;
    }

    if (status) {
      filters.status = status;
    }

    if (isFeatured) {
      filters.isFeatured = isFeatured === "true"; // Convert to boolean
    }

    // Fetch properties based on filters
    const properties = await Property.find(filters);

    return res.status(200).json({ properties });
  } catch (error) {
    console.error("Error getting filtered properties:", error);
    return res.status(500).json({ message: "Failed to retrieve properties." });
  }
});

router.get("/properties/all", async (req, res) => {
  const p = await Property.find();
  console.log(p);

  return res.status(200).json(p);
});

router.post("/addComplaint", authenticateToken, async (req, res) => {
  try {
    // Extract property details from the request
    const { userId, complaintText, isResolved, propertyId } = req.body;

    // Find the property by its ID
    const property = await Property.findById(propertyId);

    if (!property) {
      return res.status(404).json({ message: "Property not found." });
    }
    console.log(property, "property");
    // Update the property with payment details
    property.complaints = [
      ...property.complaints,
      {
        userId: userId,
        complaintText: complaintText,
        isResolved: isResolved,
        date: new Date(),
      },
    ];
    // Save the updated property to the database
    await property.save();
    return res.status(200).json({
      message: "Complaint added successfully.",
      updatedProperty: property,
    });
  } catch (error) {
    console.error("Error capturing payment:", error);
    return res.status(500).json({ message: "Failed to capture payment." });
  }
});

router.put("/updateComplaint", authenticateToken, async (req, res) => {
  try {
    // Extract payment capture details from the request
    const { userId, complaintText, isResolved, propertyId } = req.body;

    // Find the room by its ID
    const property = await Property.findById(propertyId);

    if (!property) {
      return res.status(404).json({ message: "Property not found." });
    }

    // Check if the room is already occupied

    // Update the room with payment details
    (property.permissions = ["24/7 entry"]),
      (property.complaints = [
        ...property.complaints,
        {
          userId: userId,
          complaintText: complaintText,
          isResolved: isResolved,
          date: new Date(),
        },
      ]);
    // Save the updated room to the database
    await property.save();
    return res.status(200).json({
      message: "Complaint added successfully.",
      updatedProperty: property,
    });
  } catch (error) {
    console.error("Error capturing payment:", error);
    return res.status(500).json({ message: "Failed to capture payment." });
  }
});

router.get("/get-complaints", authenticateToken, async (req, res) => {
  try {
    // Extract payment capture details from the request
    // Find the room by its ID
    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Access denied. User not authenticated." });
    }
    // Check if the user has the role of "owner" in the database
    const userWithRoleOwner = req.user.role === UserRoles.OWNER;
    if (!userWithRoleOwner) {
      return res.status(403).json({
        message: "Access denied. Only owners can see complaints.",
      });
    }
    const complaints = await Complaints.find({
      owner_user_id: req.user._id,
    });
    return res.status(200).json({
      message: "Complaints fetched successfully.",
      complaints: complaints,
    });
  } catch (error) {
    console.error("Something went wrong:", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Something went wrong.",
    });
  }
});

module.exports = router;
