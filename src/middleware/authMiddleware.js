require('dotenv').config();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to authenticate JWT tokens
function authenticateToken(req, res, next) {
  const { authorization } = req.headers;
  const token = authorization.split(' ')[1];

  // Check if no token is provided
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  // Verify the token and decode the userId from the payload using the correct secret key
  jwt.verify(token, `${process.env.JWT_SECRET_KEY}`, async (err, decoded) => {
    if (err) {
      console.error('JWT Verification Error:', err);
      return res.status(403).json({ message: 'Access denied. Invalid token.' });
    }
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        "Error": 'UNKNOWN ACCESS',
        "Message": 'Authorization headers are missing/invalid'
      });
    }
    req.user = user;
    next();
  });
}

module.exports = authenticateToken;