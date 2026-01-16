const express = require("express");
const Student = require("../models/Student");
const Course = require("../models/Course");
const Video = require("../models/Video");
const User = require("../models/User");
const { verifyToken, requireAdmin } = require("../middleware/auth");
const Admin = require("../models/Admin");
const TestSeries = require("../models/TestSeries");
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
    const { isActive, mailedCredentials, enrollmentMailSent } = req.body;

    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    if (typeof isActive === "boolean") student.isActive = isActive;
    if (typeof mailedCredentials === "boolean")
      student.mailedCredentials = mailedCredentials;
    if (typeof enrollmentMailSent === "boolean")
      student.enrollmentMailSent = enrollmentMailSent;
    await student.save();

    res.json({
      success: true,
      message: "Student updated successfully",
      student,
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
      const studentsWithEnrollment = students.map((student) => {
        const enrollment = student.enrolledCourses.find(
          (e) => e.course.toString() === courseId && e.paymentStatus === "paid"
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

// Auto-discovered admin features for frontend UI
router.get("/features", verifyToken, requireAdmin, async (req, res) => {
  try {
    res.json({
      success: true,
      features: [
        {
          key: "manage_courses",
          title: "Manage Courses",
          description: "Create, update, delete courses and configure payments",
          icon: "BookOpen",
          path: "/admin/courses",
          api: [
            { method: "GET", route: "/api/admin/courses" },
            { method: "POST", route: "/api/courses" },
            { method: "PUT", route: "/api/courses/:id" },
            { method: "DELETE", route: "/api/courses/:id" },
          ],
        },
        {
          key: "manage_videos",
          title: "Manage Videos",
          description: "Upload, reorder, update and delete course videos",
          icon: "Play",
          path: "/admin/courses",
          api: [
            { method: "GET", route: "/api/admin/courses/:courseId/videos" },
            { method: "POST", route: "/api/courses/:id/videos" },
            { method: "PUT", route: "/api/courses/:courseId/videos/:videoId" },
            {
              method: "DELETE",
              route: "/api/courses/:courseId/videos/:videoId",
            },
          ],
        },
        {
          key: "manage_documents",
          title: "Course Documents",
          description: "Upload and manage PDFs and resources for courses",
          icon: "FileText",
          path: "/admin/courses",
          api: [
            { method: "POST", route: "/api/documents/courses/:courseId" },
            { method: "GET", route: "/api/documents/courses/:courseId" },
            { method: "PUT", route: "/api/documents/:documentId" },
            { method: "DELETE", route: "/api/documents/:documentId" },
          ],
        },
        {
          key: "upi_approvals",
          title: "UPI Approvals",
          description: "Approve or reject pending UPI payment submissions",
          icon: "ShieldCheck",
          path: "/admin/approvals",
          api: [
            { method: "GET", route: "/api/upi-payments/pending" },
            { method: "POST", route: "/api/upi-payments/:id/approve" },
            { method: "POST", route: "/api/upi-payments/:id/reject" },
          ],
        },
        {
          key: "test_series",
          title: "Test Series",
          description: "Create, update and manage test series",
          icon: "Settings",
          path: "/admin/test-series",
          api: [
            { method: "GET", route: "/api/test-series/admin/all" },
            { method: "POST", route: "/api/test-series" },
            { method: "PUT", route: "/api/test-series/:id" },
            { method: "DELETE", route: "/api/test-series/:id" },
          ],
        },
        {
          key: "homepage_ads",
          title: "Homepage Ads",
          description: "Configure and manage homepage promotional banners",
          icon: "Image",
          path: "/admin",
          api: [
            { method: "POST", route: "/api/homepage-ads" },
            { method: "GET", route: "/api/homepage-ads" },
            { method: "GET", route: "/api/homepage-ads/public/active" },
          ],
        },
      ],
    });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch admin features" });
  }
});

// Enroll a student to a course (admin manual enroll)
router.post(
  "/courses/:courseId/students",
  verifyToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { courseId } = req.params;
      const { studentId, email, mobile, amount } = req.body;
      const course = await Course.findById(courseId);
      if (!course) return res.status(404).json({ error: "Course not found" });

      let student;
      if (studentId) {
        student = await Student.findById(studentId);
      } else if (email || mobile) {
        student = await Student.findOne({
          $or: [email ? { email } : null, mobile ? { mobile } : null].filter(
            Boolean
          ),
        });
      }
      if (!student) return res.status(404).json({ error: "Student not found" });

      const already = student.enrolledCourses.some(
        (e) => e.course.toString() === courseId && e.paymentStatus === "paid"
      );
      if (already) {
        return res.status(400).json({ error: "Student already enrolled" });
      }

      student.enrolledCourses.push({
        course: courseId,
        enrolledAt: new Date(),
        paymentStatus: "paid",
        receiptNumber: `ADM${Date.now()}`,
        amount: amount !== undefined ? amount : course.price,
      });
      await student.save();

      res.json({
        success: true,
        message: "Student enrolled",
        studentId: student._id,
      });
    } catch (e) {
      console.error("Admin enroll error:", e);
      res.status(500).json({ error: "Failed to enroll student" });
    }
  }
);

// Remove a student's access to a course
router.delete(
  "/courses/:courseId/students/:studentId",
  verifyToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { courseId, studentId } = req.params;
      const student = await Student.findById(studentId);
      if (!student) return res.status(404).json({ error: "Student not found" });

      const before = student.enrolledCourses.length;
      student.enrolledCourses = student.enrolledCourses.filter(
        (e) => e.course.toString() !== courseId
      );
      if (student.enrolledCourses.length === before) {
        return res.status(404).json({ error: "Enrollment not found" });
      }
      await student.save();

      res.json({ success: true, message: "Access removed" });
    } catch (e) {
      console.error("Admin remove access error:", e);
      res.status(500).json({ error: "Failed to remove access" });
    }
  }
);

// Alias route: add student to course via body payload
router.post(
  "/add-student-to-course",
  verifyToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { courseId, studentId, email, mobile, amount } = req.body;
      if (!courseId)
        return res.status(400).json({ error: "courseId is required" });

      const course = await Course.findById(courseId);
      if (!course) return res.status(404).json({ error: "Course not found" });

      let student;
      if (studentId) {
        student = await Student.findById(studentId);
      } else if (email || mobile) {
        student = await Student.findOne({
          $or: [email ? { email } : null, mobile ? { mobile } : null].filter(
            Boolean
          ),
        });
      }
      if (!student) return res.status(404).json({ error: "Student not found" });

      const already = student.enrolledCourses.some(
        (e) => e.course.toString() === courseId && e.paymentStatus === "paid"
      );
      if (already)
        return res.status(400).json({ error: "Student already enrolled" });

      student.enrolledCourses.push({
        course: courseId,
        enrolledAt: new Date(),
        paymentStatus: "paid",
        receiptNumber: `ADM${Date.now()}`,
        amount: amount !== undefined ? amount : course.price,
      });
      await student.save();

      res.json({
        success: true,
        message: "Student enrolled",
        studentId: student._id,
      });
    } catch (e) {
      console.error("Admin enroll alias error:", e);
      res.status(500).json({ error: "Failed to enroll student" });
    }
  }
);

router.post(
  "/add-student-to-test-series",
  verifyToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { testSeriesId, studentId, email, mobile } = req.body;
      if (!testSeriesId) {
        return res.status(400).json({ error: "testSeriesId is required" });
      }

      const testSeries = await TestSeries.findById(testSeriesId);
      if (!testSeries) {
        return res.status(404).json({ error: "Test series not found" });
      }

      let student;
      if (studentId) {
        student = await Student.findById(studentId);
      } else if (email || mobile) {
        const normalizedEmail =
          email && typeof email === "string"
            ? email.trim().toLowerCase()
            : null;
        student = await Student.findOne({
          $or: [
            normalizedEmail ? { email: normalizedEmail } : null,
            mobile ? { mobile } : null,
          ].filter(Boolean),
        });
      }

      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }

      const already = student.purchasedTestSeries.some(
        (e) =>
          e.testSeries.toString() === testSeriesId && e.paymentStatus === "paid"
      );

      if (already) {
        return res
          .status(400)
          .json({ error: "Student already enrolled in this test series" });
      }

      student.purchasedTestSeries.push({
        testSeries: testSeriesId,
        enrolledAt: new Date(),
        paymentStatus: "paid",
        receiptNumber: `TSADM${Date.now()}`,
      });

      await student.save();

      res.json({
        success: true,
        message: "Student enrolled to test series",
        studentId: student._id,
      });
    } catch (e) {
      console.error("Admin enroll test series error:", e);
      res
        .status(500)
        .json({ error: "Failed to enroll student to test series" });
    }
  }
);

// Alias route: remove student access from a course
router.post(
  "/remove-student-from-course",
  verifyToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { courseId, studentId } = req.body;
      if (!courseId || !studentId) {
        return res
          .status(400)
          .json({ error: "courseId and studentId are required" });
      }

      const student = await Student.findById(studentId);
      if (!student) return res.status(404).json({ error: "Student not found" });

      const before = student.enrolledCourses.length;
      student.enrolledCourses = student.enrolledCourses.filter(
        (e) => e.course.toString() !== courseId
      );
      if (student.enrolledCourses.length === before) {
        return res.status(404).json({ error: "Enrollment not found" });
      }
      await student.save();

      res.json({ success: true, message: "Access removed" });
    } catch (e) {
      console.error("Admin remove access alias error:", e);
      res.status(500).json({ error: "Failed to remove access" });
    }
  }
);

module.exports = router;
