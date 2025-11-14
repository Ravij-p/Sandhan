const express = require("express");
const Student = require("../models/Student");
const Course = require("../models/Course");
const Video = require("../models/Video");
const User = require("../models/User");
const { verifyToken, requireAdmin } = require("../middleware/auth");
const Admin = require("../models/Admin");
const router = express.Router();

// Get dashboard statistics
router.get("/dashboard", verifyToken, requireAdmin, async (req, res) => {
  try {
    // Get total counts
    const totalStudents = await Student.countDocuments({ isActive: true });
    const totalCourses = await Course.countDocuments({ isActive: true });
    const totalVideos = await Video.countDocuments({ isActive: true });
    const totalPayments = await User.countDocuments({ paymentStatus: "paid" });

    // Get recent enrollments
    const recentEnrollments = await Student.find({ isActive: true })
      .populate("enrolledCourses.course", "title")
      .sort({ updatedAt: -1 })
      .limit(10)
      .select("name email mobile enrolledCourses updatedAt");

    // Get course-wise statistics
    const courseStats = await Course.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: "students",
          localField: "_id",
          foreignField: "enrolledCourses.course",
          as: "enrollments",
        },
      },
      {
        $project: {
          title: 1,
          price: 1,
          enrollmentCount: { $size: "$enrollments" },
          totalRevenue: {
            $multiply: [{ $size: "$enrollments" }, "$price"],
          },
        },
      },
      { $sort: { enrollmentCount: -1 } },
    ]);

    // Get payment statistics
    const paymentStats = await User.aggregate([
      { $match: { paymentStatus: "paid" } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          totalPayments: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      stats: {
        totalStudents,
        totalCourses,
        totalVideos,
        totalPayments,
        totalRevenue: paymentStats.length > 0 ? paymentStats[0].totalAmount : 0,
      },
      recentEnrollments,
      courseStats,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard statistics" });
  }
});

// Get all students with enrollment details
router.get("/students", verifyToken, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search;

    let query = { isActive: true };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } },
      ];
    }

    const students = await Student.find(query)
      .populate("enrolledCourses.course", "title price")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select("-password");

    const total = await Student.countDocuments(query);

    res.json({
      success: true,
      students,
      pagination: {
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        totalRecords: total,
      },
    });
  } catch (error) {
    console.error("Fetch students error:", error);
    res.status(500).json({ error: "Failed to fetch students" });
  }
});

// Get student details by ID
router.get("/students/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate("enrolledCourses.course", "title description price")
      .select("-password");

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    res.json({
      success: true,
      student,
    });
  } catch (error) {
    console.error("Fetch student error:", error);
    res.status(500).json({ error: "Failed to fetch student details" });
  }
});

// Update student status
router.put("/students/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { isActive } = req.body;

    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    student.isActive = isActive;
    await student.save();

    res.json({
      success: true,
      message: "Student status updated successfully",
    });
  } catch (error) {
    console.error("Update student error:", error);
    res.status(500).json({ error: "Failed to update student" });
  }
});

// Get all courses with video counts
router.get("/courses", verifyToken, requireAdmin, async (req, res) => {
  try {
    const courses = await Course.find({ isActive: true })
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });

    // Get video counts for each course
    const coursesWithVideoCounts = await Promise.all(
      courses.map(async (course) => {
        const videoCount = await Video.countDocuments({
          course: course._id,
          isActive: true,
        });
        return {
          ...course.toObject(),
          videoCount,
        };
      })
    );

    res.json({
      success: true,
      courses: coursesWithVideoCounts,
    });
  } catch (error) {
    console.error("Fetch courses error:", error);
    res.status(500).json({ error: "Failed to fetch courses" });
  }
});

// Get all videos with course details
router.get("/videos", verifyToken, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const courseId = req.query.courseId;

    let query = { isActive: true };
    if (courseId) {
      query.course = courseId;
    }

    const videos = await Video.find(query)
      .populate("course", "title")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Video.countDocuments(query);

    res.json({
      success: true,
      videos,
      pagination: {
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        totalRecords: total,
      },
    });
  } catch (error) {
    console.error("Fetch videos error:", error);
    res.status(500).json({ error: "Failed to fetch videos" });
  }
});

// Get videos for a specific course
router.get(
  "/courses/:courseId/videos",
  verifyToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { courseId } = req.params;

      // Check if course exists
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }

      // Get videos for this course
      const videos = await Video.find({
        course: courseId,
        isActive: true,
      })
        .populate("createdBy", "name")
        .sort({ order: 1, createdAt: 1 });

      res.json({
        success: true,
        videos,
        course: {
          _id: course._id,
          title: course.title,
          description: course.description,
        },
      });
    } catch (error) {
      console.error("Fetch course videos error:", error);
      res.status(500).json({ error: "Failed to fetch course videos" });
    }
  }
);

// Get enrollment count for a specific course
router.get(
  "/courses/:courseId/enrollment-count",
  verifyToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { courseId } = req.params;

      // Count students enrolled in this course with paid status
      const enrollmentCount = await Student.countDocuments({
        "enrolledCourses.course": courseId,
        "enrolledCourses.paymentStatus": "paid",
        isActive: true,
      });

      res.json({
        success: true,
        enrollmentCount,
      });
    } catch (error) {
      console.error("Fetch enrollment count error:", error);
      res.status(500).json({ error: "Failed to fetch enrollment count" });
    }
  }
);

// Get students enrolled in a specific course
router.get(
  "/courses/:courseId/students",
  verifyToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { courseId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;

      // Find students enrolled in this course
      const students = await Student.find({
        "enrolledCourses.course": courseId,
        "enrolledCourses.paymentStatus": "paid",
        isActive: true,
      })
        .select("name email mobile enrolledCourses createdAt")
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      // Get enrollment details for each student
      const studentsWithEnrollment = students.map(student => {
        const enrollment = student.enrolledCourses.find(
          e => e.course.toString() === courseId && e.paymentStatus === "paid"
        );
        return {
          _id: student._id,
          name: student.name,
          email: student.email,
          mobile: student.mobile,
          enrolledAt: enrollment?.enrolledAt || student.createdAt,
          receiptNumber: enrollment?.receiptNumber,
          amount: enrollment?.amount,
        };
      });

      const total = await Student.countDocuments({
        "enrolledCourses.course": courseId,
        "enrolledCourses.paymentStatus": "paid",
        isActive: true,
      });

      res.json({
        success: true,
        students: studentsWithEnrollment,
        pagination: {
          totalPages: Math.ceil(total / limit),
          currentPage: page,
          totalRecords: total,
        },
      });
    } catch (error) {
      console.error("Fetch course students error:", error);
      res.status(500).json({ error: "Failed to fetch course students" });
    }
  }
);

// Get payment history
router.get("/payments", verifyToken, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const courseId = req.query.course;

    // Get payments from both Student model (new system) and User model (legacy)
    let studentPayments = [];
    let legacyPayments = [];

    // Get payments from Student model
    const studentQuery = { isActive: true };
    if (courseId) {
      studentQuery["enrolledCourses.course"] = courseId;
    }

    const students = await Student.find(studentQuery)
      .populate("enrolledCourses.course", "title price")
      .select("name email mobile enrolledCourses createdAt")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Transform student data to match payment format
    studentPayments = students.flatMap((student) =>
      student.enrolledCourses
        .filter((enrollment) => enrollment.paymentStatus === "paid")
        .map((enrollment) => ({
          _id: `${student._id}_${enrollment.course._id}`,
          name: student.name,
          email: student.email,
          mobile: student.mobile,
          course: enrollment.course.title,
          amount: enrollment.amount,
          receiptNumber: enrollment.receiptNumber,
          paymentDate: enrollment.enrolledAt,
          paymentStatus: "paid",
          source: "student",
        }))
    );

    // Get legacy payments from User model
    const userQuery = { paymentStatus: "paid" };
    if (courseId) {
      // Find legacy payments by course name (less precise)
      const course = await Course.findById(courseId);
      if (course) {
        userQuery.course = course.title;
      }
    }

    legacyPayments = await User.find(userQuery)
      .sort({ paymentDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Transform legacy payments
    const transformedLegacyPayments = legacyPayments.map((payment) => ({
      ...payment.toObject(),
      source: "legacy",
    }));

    // Combine and sort all payments
    const allPayments = [...studentPayments, ...transformedLegacyPayments].sort(
      (a, b) => new Date(b.paymentDate) - new Date(a.paymentDate)
    );

    // Get total count
    const studentCount = await Student.countDocuments(studentQuery);
    const legacyCount = await User.countDocuments(userQuery);
    const total = studentCount + legacyCount;

    res.json({
      success: true,
      payments: allPayments,
      pagination: {
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        totalRecords: total,
      },
    });
  } catch (error) {
    console.error("Fetch payments error:", error);
    res.status(500).json({ error: "Failed to fetch payments" });
  }
});

// Create admin account (for initial setup)
router.post("/create-admin", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if any admin exists
    const existingAdmin = await Admin.findOne();
    if (existingAdmin) {
      return res.status(403).json({
        error: "Admin account already exists. Use login endpoint.",
      });
    }

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    // Create admin
    const admin = new Admin({
      name,
      email,
      password,
      role: "super_admin",
    });

    await admin.save();

    res.status(201).json({
      success: true,
      message: "Admin account created successfully",
    });
  } catch (error) {
    console.error("Create admin error:", error);
    res.status(500).json({ error: "Failed to create admin account" });
  }
});

module.exports = router;
