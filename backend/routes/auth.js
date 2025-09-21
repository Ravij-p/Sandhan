const express = require("express");
const jwt = require("jsonwebtoken");
const Student = require("../models/Student");
const Admin = require("../models/Admin");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

// Generate JWT token
const generateToken = (userId, userType) => {
  return jwt.sign(
    { userId, userType },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// Student Registration
router.post("/student/register", async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;

    // Validation
    if (!name || !email || !mobile || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    // Check if student already exists
    const existingStudent = await Student.findOne({
      $or: [{ email }, { mobile }]
    });

    if (existingStudent) {
      return res.status(400).json({ 
        error: "Student with this email or mobile already exists" 
      });
    }

    // Create new student
    const student = new Student({
      name,
      email,
      mobile,
      password,
    });

    await student.save();

    // Generate token
    const token = generateToken(student._id, "student");

    res.status(201).json({
      success: true,
      message: "Student registered successfully",
      token,
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        mobile: student.mobile,
      },
    });
  } catch (error) {
    console.error("Student registration error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

// Student Login
router.post("/student/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find student
    const student = await Student.findOne({ email, isActive: true });
    if (!student) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check password
    const isPasswordValid = await student.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Update last login
    student.lastLogin = new Date();
    await student.save();

    // Generate token
    const token = generateToken(student._id, "student");

    res.json({
      success: true,
      message: "Login successful",
      token,
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        mobile: student.mobile,
        enrolledCourses: student.enrolledCourses,
      },
    });
  } catch (error) {
    console.error("Student login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

// Admin Login
router.post("/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find admin
    const admin = await Admin.findOne({ email, isActive: true });
    if (!admin) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check password
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate token
    const token = generateToken(admin._id, "admin");

    res.json({
      success: true,
      message: "Login successful",
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

// Get current user profile
router.get("/profile", verifyToken, async (req, res) => {
  try {
    if (req.userType === "student") {
      const student = await Student.findById(req.user._id)
        .populate("enrolledCourses.course", "title description price")
        .select("-password");
      
      res.json({
        success: true,
        user: student,
        userType: "student",
      });
    } else if (req.userType === "admin") {
      const admin = await Admin.findById(req.user._id).select("-password");
      
      res.json({
        success: true,
        user: admin,
        userType: "admin",
      });
    }
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// Logout (client-side token removal)
router.post("/logout", verifyToken, (req, res) => {
  res.json({
    success: true,
    message: "Logged out successfully",
  });
});

module.exports = router;
