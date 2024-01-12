require('dotenv').config();
const User = require('../models/User');
const transporter = require('../config/nodemailer');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Function to generate an email verification token
function generateVerificationToken() {
    // Generate a random token for simplicity
    const tokenLength = 32;
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < tokenLength; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        token += characters.charAt(randomIndex);
    }
    return token;
}

// Function to generate the verification link
function generateVerificationLink(emailVerificationToken) {
    return `https://${process.env.DOMAIN}/verify-email?token=${emailVerificationToken}`;
}

// Register a new user
async function registerUser(req, res) {
    try {
        const { username, password, firstName, lastName, email } = req.body;

        // Check if the email is already registered
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email is already registered.' });
        }

        // Create a new user
        const newUser = new User({
            username,
            password,
            firstName,
            lastName,
            email,
        });

        // Generate an email verification token
        const emailVerificationToken = generateVerificationToken();

        // Save the user with the verification token
        newUser.emailVerificationToken = emailVerificationToken;
        await newUser.save();

        // Send a verification email
        const mailOptions = {
            from: `${process.env.SENDER_EMAIL}`,
            to: newUser.email,
            subject: 'Email Verification',
            text: `Please click the following link to verify your email: ${generateVerificationLink(emailVerificationToken)}`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending verification email:', error);
                return res.status(500).json({ message: 'Failed to send verification email.' });
            } else {
                console.log('Verification email sent:', info.response);
                return res.status(201).json({ message: 'User registered. Verification email sent.' });
            }
        });
    } catch (error) {
        console.error('Error registering user:', error);
        return res.status(500).json({ message: 'Registration failed.' });
    }
}

// Verify user's email
async function verifyEmail(req, res) {
    try {
        const { token } = req.query;

        // Find the user with the provided email verification token
        const user = await User.findOne({ emailVerificationToken: token });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired verification token.' });
        }

        // Check if the token is expired
        if (user.emailVerificationExpire && user.emailVerificationExpire < Date.now()) {
            return res.status(400).json({ message: 'Verification token has expired.' });
        }

        // Mark the user's email as verified
        user.isVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpire = undefined;
        await user.save();

        return res.status(200).json({ message: 'Email verification successful. You can now log in.' });
    } catch (error) {
        console.error('Error verifying email:', error);
        return res.status(500).json({ message: 'Email verification failed.' });
    }
}

// Login user
async function loginUser(req, res) {
    try {
        const { username, password } = req.body;

        // Find the user by username
        const user = await User.findOne({ username });

        // Check if the user exists and the password matches
        if (!user || user.password !== password) {
            return res.status(401).json({ message: 'Invalid username or password.' });
        }

        // Generate a JWT token with an expiration date and include the user's ID in the payload
        const token = jwt.sign({ userId: user._id }, `${process.env.JWT_SECRET_KEY}`, {
            expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES,
        });

        // Send a response with the token, user's _id, message, and expiration time
        return res.status(200).json({
            userId: user._id,
            role: user.role,
            token: token,
            message: 'Login successful.',
            expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES,
        });
    } catch (error) {
        console.error('Error logging in user:', error);
        return res.status(500).json({ message: 'Login failed.' });
    }
}

//Get All Users
async function getAllUsers(req, res) {
    try {
        const users = await User.find();
        // Send a response with the token, message, and expiration time
        return res.status(200).json({
        });
    } catch (error) {
        console.error('Error logging in user:', error);
        return res.status(500).json({ message: 'Login failed.' });
    }
}

// Get a user by their ID
async function getUserById(req, res) {
    try {
        const { userId } = req.params;

        // Find the user by their ID
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Return the user data
        return res.status(200).json({ user });
    } catch (error) {
        console.error('Error getting user by ID:', error);
        return res.status(500).json({ message: 'Failed to get user by ID.' });
    }
}

// Update user by their ID
async function updateUserById(req, res) {
    try {
        const { userId } = req.params;
        const updatedUserData = req.body;

        // Find the user by their ID and update their data
        const updatedUser = await User.findByIdAndUpdate(userId, updatedUserData, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Return the updated user data
        return res.status(200).json({ user: updatedUser });
    } catch (error) {
        console.error('Error updating user by ID:', error);
        return res.status(500).json({ message: 'Failed to update user by ID.' });
    }
}

// Delete user by their ID
async function deleteUserById(req, res) {
    try {
        const { userId } = req.params;

        // Find the user by their ID and delete them
        const deletedUser = await User.findByIdAndDelete(userId);

        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Return a success message
        return res.status(200).json({ message: 'User deleted successfully.' });
    } catch (error) {
        console.error('Error deleting user by ID:', error);
        return res.status(500).json({ message: 'Failed to delete user by ID.' });
    }
}


module.exports = {
    registerUser,
    verifyEmail,
    loginUser,
    getAllUsers,
    getUserById,
    updateUserById,
    deleteUserById
};