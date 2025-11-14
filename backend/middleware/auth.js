const jwt = require("jsonwebtoken");
const Student = require("../models/Student");
const Admin = require("../models/Admin");

// Middleware to verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    
    if (!token) {
      return res.status(401).json({ error: "Access denied. No token provided." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user exists and is active
    let user;
    if (decoded.userType === "student") {
      user = await Student.findById(decoded.userId).select("-password");
    } else if (decoded.userType === "admin") {
      user = await Admin.findById(decoded.userId).select("-password");
    }

    if (!user || !user.isActive) {
      return res.status(401).json({ error: "Invalid token or user not found." });
    }

    req.user = user;
    req.userType = decoded.userType;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token." });
  }
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.userType !== "admin") {
    return res.status(403).json({ error: "Access denied. Admin privileges required." });
  }
  next();
};

// Middleware to check if user is student (admin can also access)
const requireStudent = (req, res, next) => {
  if (req.userType !== "student" && req.userType !== "admin") {
    return res.status(403).json({ error: "Access denied. Student privileges required." });
  }
  next();
};

module.exports = {
  verifyToken,
  requireAdmin,
  requireStudent,
};
