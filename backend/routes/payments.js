const express = require("express");
const crypto = require("crypto");
const moment = require("moment");
const Student = require("../models/Student");
const Course = require("../models/Course");
const TestSeries = require("../models/TestSeries");
const User = require("../models/User");
const { verifyToken, requireStudent } = require("../middleware/auth");

const router = express.Router();

// Razorpay removed: use /api/upi-payments instead

// Create payment order for course enrollment
router.post("/create-order", verifyToken, requireStudent, async (req, res) => {
  try {
    const { courseId } = req.body;
    const studentId = req.user._id;

    // Validation
    if (!courseId) {
      return res.status(400).json({ error: "Course ID is required" });
    }

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course || !course.isActive) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Check if student is already enrolled
    const student = await Student.findById(studentId);
    const isAlreadyEnrolled = student.enrolledCourses.some(
      (enrollment) =>
        enrollment.course.toString() === courseId &&
        enrollment.paymentStatus === "paid"
    );

    if (isAlreadyEnrolled) {
      return res
        .status(400)
        .json({ error: "You are already enrolled in this course" });
    }

    // Calculate amount (including gateway fees)
    const baseAmount = course.price;
    const gatewayFeePercent = 0.02; // 2%
    const gstPercent = 0.18; // 18% GST on gateway fee
    const totalDeductionPercent = gatewayFeePercent * (1 + gstPercent);
    const amountToPay = Math.ceil(baseAmount / (1 - totalDeductionPercent));

    // Create Razorpay order
    const options = {
      amount: amountToPay * 100, // Razorpay expects amount in paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        studentId: studentId.toString(),
        courseId: courseId.toString(),
        studentName: student.name,
        courseName: course.title,
      },
    };

    // const order = await razorpay.orders.create(options); // Razorpay removed

    res.json({
      success: true,
      // orderId: order.id, // Razorpay removed
      amount: amountToPay, // Use calculated amount
      currency: "INR",
      // key: process.env.RAZORPAY_KEY_ID, // Razorpay removed
      course: {
        id: course._id,
        title: course.title,
        price: course.price,
      },
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({ error: "Failed to create payment order" });
  }
});

// Verify payment and enroll student
router.post(
  "/verify-payment",
  verifyToken,
  requireStudent,
  async (req, res) => {
    try {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        courseId,
      } = req.body;

      const studentId = req.user._id;

      // Verify payment signature
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_SECRET)
        .update(body.toString())
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ error: "Payment verification failed" });
      }

      // Get course details
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }

      // Get student
      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }

      // Check if already enrolled
      const isAlreadyEnrolled = student.enrolledCourses.some(
        (enrollment) =>
          enrollment.course.toString() === courseId &&
          enrollment.paymentStatus === "paid"
      );

      if (isAlreadyEnrolled) {
        return res
          .status(400)
          .json({ error: "You are already enrolled in this course" });
      }

      // Generate receipt number
      const receiptNumber = `SDN${moment().format("YYYYMM")}${Math.floor(
        Math.random() * 10000
      )
        .toString()
        .padStart(4, "0")}`;

      // Add course to student's enrolled courses
      student.enrolledCourses.push({
        course: courseId,
        enrolledAt: new Date(),
        paymentStatus: "paid",
        receiptNumber,
        amount: course.price,
      });

      await student.save();

      // Also create a legacy User record for backward compatibility
      const userData = {
        name: student.name,
        mobile: student.mobile,
        course: course.title,
        amount: course.price,
        receiptNumber,
        paymentDate: new Date(),
        paymentStatus: "paid",
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        studentId: student._id,
        courseId: course._id,
      };

      const user = new User(userData);
      await user.save();

      res.json({
        success: true,
        message: "Payment verified and enrollment successful",
        receiptNumber,
        course: {
          id: course._id,
          title: course.title,
        },
        enrollment: {
          enrolledAt: new Date(),
          receiptNumber,
          amount: course.price,
        },
      });
    } catch (error) {
      console.error("Payment verification error:", error);
      res.status(500).json({ error: "Payment verification failed" });
    }
  }
);

// Get student's enrollment history
router.get("/enrollments", verifyToken, requireStudent, async (req, res) => {
  try {
    const student = await Student.findById(req.user._id)
      .populate("enrolledCourses.course", "title description price thumbnail")
      .select("enrolledCourses");

    res.json({
      success: true,
      enrollments: student.enrolledCourses,
    });
  } catch (error) {
    console.error("Fetch enrollments error:", error);
    res.status(500).json({ error: "Failed to fetch enrollments" });
  }
});

// Create payment order for test series purchase
router.post(
  "/test-series/create-order",
  verifyToken,
  requireStudent,
  async (req, res) => {
    try {
      const { testSeriesId } = req.body;
      const studentId = req.user._id;

      // Validation
      if (!testSeriesId) {
        return res.status(400).json({ error: "Test Series ID is required" });
      }

      // Check if test series exists
      const testSeries = await TestSeries.findById(testSeriesId);
      if (!testSeries || !testSeries.isActive) {
        return res.status(404).json({ error: "Test series not found" });
      }

      // Check if student already purchased
      const student = await Student.findById(studentId);
      const isAlreadyPurchased = student.purchasedTestSeries.some(
        (purchase) =>
          purchase.testSeries.toString() === testSeriesId &&
          purchase.paymentStatus === "paid"
      );

      if (isAlreadyPurchased) {
        return res
          .status(400)
          .json({ error: "You have already purchased this test series" });
      }

      // Calculate amount (including gateway fees)
      const baseAmount = testSeries.price;
      const gatewayFeePercent = 0.02; // 2%
      const gstPercent = 0.18; // 18% GST on gateway fee
      const totalDeductionPercent = gatewayFeePercent * (1 + gstPercent);
      const amountToPay = Math.ceil(baseAmount / (1 - totalDeductionPercent));

      // Create Razorpay order
      const options = {
        amount: amountToPay * 100, // Razorpay expects amount in paise
        currency: "INR",
        receipt: `testseries_${Date.now()}`,
        notes: {
          studentId: studentId.toString(),
          testSeriesId: testSeriesId.toString(),
          studentName: student.name,
          testSeriesName: testSeries.title,
        },
      };

      // const order = await razorpay.orders.create(options); // Razorpay removed

      res.json({
        success: true,
        // orderId: order.id, // Razorpay removed
        amount: amountToPay, // Use calculated amount
        currency: "INR",
        // key: process.env.RAZORPAY_KEY_ID, // Razorpay removed
        testSeries: {
          id: testSeries._id,
          title: testSeries.title,
          price: testSeries.price,
        },
      });
    } catch (error) {
      console.error("Create test series order error:", error);
      res.status(500).json({ error: "Failed to create payment order" });
    }
  }
);

// Verify test series payment and grant access
router.post(
  "/test-series/verify-payment",
  verifyToken,
  requireStudent,
  async (req, res) => {
    try {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        testSeriesId,
      } = req.body;

      const studentId = req.user._id;

      // Verify payment signature
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_SECRET)
        .update(body.toString())
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ error: "Payment verification failed" });
      }

      // Get test series details
      const testSeries = await TestSeries.findById(testSeriesId);
      if (!testSeries) {
        return res.status(404).json({ error: "Test series not found" });
      }

      // Get student
      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }

      // Check if already purchased
      const isAlreadyPurchased = student.purchasedTestSeries.some(
        (purchase) =>
          purchase.testSeries.toString() === testSeriesId &&
          purchase.paymentStatus === "paid"
      );

      if (isAlreadyPurchased) {
        return res
          .status(400)
          .json({ error: "You have already purchased this test series" });
      }

      // Generate receipt number
      const receiptNumber = `TSN${moment().format("YYYYMM")}${Math.floor(
        Math.random() * 10000
      )
        .toString()
        .padStart(4, "0")}`;

      // Add test series to student's purchased test series
      student.purchasedTestSeries.push({
        testSeries: testSeriesId,
        paymentStatus: "paid",
        enrolledAt: new Date(),
        receiptNumber: receiptNumber,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
      });

      await student.save();

      res.json({
        success: true,
        message: "Test series purchased successfully",
        receiptNumber: receiptNumber,
        testSeries: {
          id: testSeries._id,
          title: testSeries.title,
          price: testSeries.price,
        },
      });
    } catch (error) {
      console.error("Verify test series payment error:", error);
      res.status(500).json({ error: "Failed to verify payment" });
    }
  }
);

// Get student's purchased test series
router.get(
  "/test-series/purchases",
  verifyToken,
  requireStudent,
  async (req, res) => {
    try {
      const student = await Student.findById(req.user._id)
        .populate(
          "purchasedTestSeries.testSeries",
          "title description price numberOfTests duration"
        )
        .select("purchasedTestSeries");

      res.json({
        success: true,
        purchases: student.purchasedTestSeries,
      });
    } catch (error) {
      console.error("Fetch test series purchases error:", error);
      res.status(500).json({ error: "Failed to fetch test series purchases" });
    }
  }
);

module.exports = router;
