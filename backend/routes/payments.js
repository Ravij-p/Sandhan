const express = require("express");
const crypto = require("crypto");
const moment = require("moment");
const Razorpay = require("razorpay");
const Student = require("../models/Student");
const Course = require("../models/Course");
const TestSeries = require("../models/TestSeries");
const User = require("../models/User");
const { verifyToken, requireStudent } = require("../middleware/auth");
const { generateReceiptToStream } = require("../utils/pdfGenerator");

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function generateRandomPassword(length = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function calcPricing(baseAmount) {
  const gatewayFeePercent = 0.02;
  const gstPercent = 0.18;
  const totalDeductionPercent = gatewayFeePercent * (1 + gstPercent);
  const totalAmount = Math.ceil(baseAmount / (1 - totalDeductionPercent));
  const gatewayCharge = totalAmount - baseAmount;
  return { baseAmount, gatewayCharge, totalAmount };
}

function makeReceiptNumber(prefix) {
  return `${prefix}${moment().format("YYYYMM")}${Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0")}`;
}

async function getOrCreateStudentByEmail({ name, email, mobile }) {
  const normalizedEmail = email.toLowerCase().trim();
  let student = await Student.findOne({ email: normalizedEmail });

  if (!student) {
    const generatedPassword = generateRandomPassword(8);
    student = new Student({
      name,
      email: normalizedEmail,
      mobile,
      password: generatedPassword,
      tempPassword: generatedPassword,
      mailedCredentials: false,
      enrollmentMailSent: false,
      formFilledAt: new Date(),
    });
    await student.save();
  } else {
    // Update mutable fields without triggering password rehash
    const updates = {};
    if (mobile && mobile !== student.mobile) updates.mobile = mobile;
    if (!student.formFilledAt) updates.formFilledAt = new Date();
    if (Object.keys(updates).length > 0) {
      await Student.updateOne({ _id: student._id }, { $set: updates });
      Object.assign(student, updates);
    }
  }

  return student;
}

// ── Receipt download ──────────────────────────────────────────────────────────

// GET /api/payments/receipt/:receiptNumber
router.get("/receipt/:receiptNumber", async (req, res) => {
  try {
    const { receiptNumber } = req.params;

    // Find the enrollment that matches this receipt
    const student = await Student.findOne({
      "enrolledCourses.receiptNumber": receiptNumber,
    }).populate("enrolledCourses.course", "title price");

    if (!student) {
      return res.status(404).json({ error: "Receipt not found" });
    }

    const enrollment = student.enrolledCourses.find(
      (e) => e.receiptNumber === receiptNumber
    );
    const courseTitle = enrollment?.course?.title || "Course";
    const baseAmount = enrollment?.amount || 0;
    const { gatewayCharge, totalAmount } = calcPricing(baseAmount);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=TushtiIAS_Receipt_${receiptNumber}.pdf`
    );

    generateReceiptToStream(
      {
        receiptNumber,
        name: student.name,
        email: student.email,
        mobile: student.mobile,
        courseName: courseTitle,
        baseAmount,
        gatewayCharge,
        totalAmount,
        paymentDate: enrollment?.enrolledAt,
        razorpayOrderId: enrollment?.razorpayOrderId,
        razorpayPaymentId: enrollment?.razorpayPaymentId,
        password: student.tempPassword || null,
      },
      res
    );
  } catch (err) {
    console.error("Receipt generation error:", err);
    res.status(500).json({ error: "Failed to generate receipt" });
  }
});

// ── Public: create order ───────────────────────────────────────────────────

router.post("/public/course/create-order", async (req, res) => {
  try {
    const { courseId, name, email, mobile, selectedMode } = req.body;
    if (!courseId || !name || !email || !mobile) {
      return res.status(400).json({ error: "courseId, name, email and mobile are required" });
    }

    const course = await Course.findById(courseId);
    if (!course || !course.isActive) return res.status(404).json({ error: "Course not found" });

    // Determine price based on selectedMode
    let coursePrice;
    if (selectedMode === 'online' && course.onlinePrice > 0) {
      coursePrice = course.onlinePrice;
    } else if (selectedMode === 'offline' && course.offlinePrice > 0) {
      coursePrice = course.offlinePrice;
    } else if (!selectedMode && course.onlinePrice > 0) {
      coursePrice = course.onlinePrice;
    } else if (!selectedMode && course.offlinePrice > 0) {
      coursePrice = course.offlinePrice;
    } else {
      return res.status(400).json({ error: "This course has no price set. Please ask admin to update the course price." });
    }

    const student = await getOrCreateStudentByEmail({ name, email, mobile });
    const { baseAmount, gatewayCharge, totalAmount } = calcPricing(coursePrice);

    let order;
    try {
      order = await razorpay.orders.create({
        amount: totalAmount * 100,
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
        notes: {
          studentId: student._id.toString(),
          courseId: courseId.toString(),
          studentName: student.name,
          courseName: course.title,
          mobile: student.mobile,
          selectedMode: selectedMode || 'online',
        },
      });
    } catch (rzpErr) {
      const desc = rzpErr?.error?.description || rzpErr?.message || "Razorpay error";
      return res.status(400).json({ error: desc });
    }

    res.json({
      success: true,
      orderId: order.id,
      amount: totalAmount,
      amountInPaise: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
      breakdown: { baseAmount, gatewayCharge, totalAmount },
      course: { id: course._id, title: course.title, price: coursePrice },
      selectedMode: selectedMode || 'online',
    });
  } catch (error) {
    console.error("Public create course order error:", error);
    res.status(500).json({ error: "Failed to create payment order" });
  }
});

// ── Public: verify payment ─────────────────────────────────────────────────

router.post("/public/course/verify-payment", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, courseId, email, name, mobile, selectedMode } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !courseId || !email) {
      return res.status(400).json({ error: "Invalid payment data" });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: "Payment verification failed" });
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: "Course not found" });

    // Determine price based on selectedMode
    let coursePrice;
    if (selectedMode === 'online' && course.onlinePrice) {
      coursePrice = course.onlinePrice;
    } else if (selectedMode === 'offline' && course.offlinePrice) {
      coursePrice = course.offlinePrice;
    } else if (!selectedMode && course.onlinePrice) {
      coursePrice = course.onlinePrice;
    } else if (!selectedMode && course.offlinePrice) {
      coursePrice = course.offlinePrice;
    } else {
      return res.status(400).json({ error: "No valid price found" });
    }

    const student = await getOrCreateStudentByEmail({ name: name || "", email, mobile });

    const isAlreadyEnrolled = student.enrolledCourses.some(
      (e) => e.course.toString() === courseId && e.paymentStatus === "paid"
    );
    if (isAlreadyEnrolled) {
      return res.status(400).json({ error: "Already enrolled in this course" });
    }

    const receiptNumber = makeReceiptNumber("SDN");
    const { baseAmount, gatewayCharge, totalAmount } = calcPricing(coursePrice);

    await Student.findByIdAndUpdate(student._id, {
      $push: {
        enrolledCourses: {
          course: courseId,
          enrolledAt: new Date(),
          paymentStatus: "paid",
          receiptNumber,
          amount: coursePrice,
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          courseMode: selectedMode || 'online',
        }
      }
    });

    // Legacy User record
    try {
      await new User({
        name: student.name,
        mobile: student.mobile,
        course: course.title,
        amount: coursePrice,
        receiptNumber,
        paymentDate: new Date(),
        paymentStatus: "paid",
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        studentId: student._id,
        courseId: course._id,
      }).save();
    } catch (e) { /* non-critical */ }
    res.json({
      success: true,
      message: "Payment verified and enrollment successful",
      receiptNumber,
      receiptUrl: `/api/payments/receipt/${receiptNumber}`,
      breakdown: { baseAmount, gatewayCharge, totalAmount },
      course: { id: course._id, title: course.title },
      password: student.tempPassword,
      studentName: student.name,
      studentEmail: student.email,
      studentMobile: student.mobile,
      selectedMode: selectedMode || 'online',
    });
  } catch (error) {
    console.error("Public course payment verification error:", error);
    res.status(500).json({ error: "Payment verification failed" });
  }
});

// ── Authenticated: create order ────────────────────────────────────────────

router.post("/create-order", verifyToken, requireStudent, async (req, res) => {
  try {
    const { courseId, selectedMode } = req.body;
    if (!courseId) return res.status(400).json({ error: "Course ID is required" });

    const course = await Course.findById(courseId);
    if (!course || !course.isActive) return res.status(404).json({ error: "Course not found" });

    const student = await Student.findById(req.user._id);
    const isAlreadyEnrolled = student.enrolledCourses.some(
      (e) => e.course.toString() === courseId && e.paymentStatus === "paid"
    );
    if (isAlreadyEnrolled) return res.status(400).json({ error: "Already enrolled" });

    let coursePrice;
    if (selectedMode === 'online' && course.onlinePrice) {
      coursePrice = course.onlinePrice;
    } else if (selectedMode === 'offline' && course.offlinePrice) {
      coursePrice = course.offlinePrice;
    } else if (!selectedMode && course.onlinePrice) {
      coursePrice = course.onlinePrice;
    } else if (!selectedMode && course.offlinePrice) {
      coursePrice = course.offlinePrice;
    } else {
      return res.status(400).json({ error: "No valid price found" });
    }

    const { baseAmount, gatewayCharge, totalAmount } = calcPricing(coursePrice);

    const order = await razorpay.orders.create({
      amount: totalAmount * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: { studentId: student._id.toString(), courseId, studentName: student.name, courseName: course.title },
    });

    res.json({
      success: true,
      orderId: order.id,
      amount: totalAmount,
      amountInPaise: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
      breakdown: { baseAmount, gatewayCharge, totalAmount },
      course: { id: course._id, title: course.title, price: coursePrice },
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({ error: "Failed to create payment order" });
  }
});

// ── Authenticated: verify payment ─────────────────────────────────────────

router.post("/verify-payment", verifyToken, requireStudent, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, courseId, selectedMode } = req.body;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: "Payment verification failed" });
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: "Course not found" });

    const student = await Student.findById(req.user._id);
    if (!student) return res.status(404).json({ error: "Student not found" });

    const isAlreadyEnrolled = student.enrolledCourses.some(
      (e) => e.course.toString() === courseId && e.paymentStatus === "paid"
    );
    if (isAlreadyEnrolled) return res.status(400).json({ error: "Already enrolled" });

    let coursePrice;
    if (selectedMode === 'online' && course.onlinePrice) {
      coursePrice = course.onlinePrice;
    } else if (selectedMode === 'offline' && course.offlinePrice) {
      coursePrice = course.offlinePrice;
    } else if (!selectedMode && course.onlinePrice) {
      coursePrice = course.onlinePrice;
    } else if (!selectedMode && course.offlinePrice) {
      coursePrice = course.offlinePrice;
    } else {
      return res.status(400).json({ error: "No valid price found" });
    }

    const receiptNumber = makeReceiptNumber("SDN");
    const { baseAmount, gatewayCharge, totalAmount } = calcPricing(coursePrice);

    await Student.findByIdAndUpdate(student._id, {
      $push: {
        enrolledCourses: {
          course: courseId,
          enrolledAt: new Date(),
          paymentStatus: "paid",
          receiptNumber,
          amount: coursePrice,
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          courseMode: selectedMode || 'online',
        }
      }
    });

    try {
      await new User({
        name: student.name,
        mobile: student.mobile,
        course: course.title,
        amount: coursePrice,
        receiptNumber,
        paymentDate: new Date(),
        paymentStatus: "paid",
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        studentId: student._id,
        courseId: course._id,
      }).save();
    } catch (e) { /* non-critical */ }

    res.json({
      success: true,
      message: "Payment verified and enrollment successful",
      receiptNumber,
      receiptUrl: `/api/payments/receipt/${receiptNumber}`,
      breakdown: { baseAmount, gatewayCharge, totalAmount },
      course: { id: course._id, title: course.title },
      password: student.tempPassword,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({ error: "Payment verification failed" });
  }
});

// ── Enrollments list ───────────────────────────────────────────────────────

router.get("/enrollments", verifyToken, requireStudent, async (req, res) => {
  try {
    const student = await Student.findById(req.user._id)
      .populate("enrolledCourses.course", "title description price thumbnail")
      .select("enrolledCourses");
    res.json({ success: true, enrollments: student.enrolledCourses });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch enrollments" });
  }
});

// ── Public: test series create order ──────────────────────────────────────

router.post("/public/test-series/create-order", async (req, res) => {
  try {
    const { testSeriesId, name, email, mobile } = req.body;
    if (!testSeriesId || !name || !email || !mobile) {
      return res.status(400).json({ error: "testSeriesId, name, email and mobile are required" });
    }

    const testSeries = await TestSeries.findById(testSeriesId);
    if (!testSeries || !testSeries.isActive) return res.status(404).json({ error: "Test series not found" });

    const student = await getOrCreateStudentByEmail({ name, email, mobile });
    const { baseAmount, gatewayCharge, totalAmount } = calcPricing(testSeries.price);

    const order = await razorpay.orders.create({
      amount: totalAmount * 100,
      currency: "INR",
      receipt: `testseries_${Date.now()}`,
      notes: {
        studentId: student._id.toString(),
        testSeriesId,
        studentName: student.name,
        testSeriesName: testSeries.title,
        mobile: student.mobile,
      },
    });

    res.json({
      success: true,
      orderId: order.id,
      amount: totalAmount,
      amountInPaise: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
      breakdown: { baseAmount, gatewayCharge, totalAmount },
      testSeries: { id: testSeries._id, title: testSeries.title, price: testSeries.price },
    });
  } catch (error) {
    console.error("Public create test series order error:", error);
    res.status(500).json({ error: "Failed to create payment order" });
  }
});

// ── Public: test series verify ─────────────────────────────────────────────

router.post("/public/test-series/verify-payment", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, testSeriesId, email, name, mobile } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !testSeriesId || !email) {
      return res.status(400).json({ error: "Invalid payment data" });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: "Payment verification failed" });
    }

    const testSeries = await TestSeries.findById(testSeriesId);
    if (!testSeries) return res.status(404).json({ error: "Test series not found" });

    const student = await getOrCreateStudentByEmail({ name: name || "", email, mobile });

    const isAlreadyPurchased = student.purchasedTestSeries.some(
      (p) => p.testSeries.toString() === testSeriesId && p.paymentStatus === "paid"
    );
    if (isAlreadyPurchased) return res.status(400).json({ error: "Already purchased" });

    const receiptNumber = makeReceiptNumber("TSN");

    student.purchasedTestSeries.push({
      testSeries: testSeriesId,
      paymentStatus: "paid",
      enrolledAt: new Date(),
      receiptNumber,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
    });
    await student.save();

    res.json({
      success: true,
      message: "Test series purchased successfully",
      receiptNumber,
      testSeries: { id: testSeries._id, title: testSeries.title, price: testSeries.price },
    });
  } catch (error) {
    console.error("Public verify test series payment error:", error);
    res.status(500).json({ error: "Failed to verify payment" });
  }
});

// ── Authenticated: test series ─────────────────────────────────────────────

router.post("/test-series/create-order", verifyToken, requireStudent, async (req, res) => {
  try {
    const { testSeriesId } = req.body;
    if (!testSeriesId) return res.status(400).json({ error: "Test Series ID is required" });

    const testSeries = await TestSeries.findById(testSeriesId);
    if (!testSeries || !testSeries.isActive) return res.status(404).json({ error: "Test series not found" });

    const student = await Student.findById(req.user._id);
    const isAlreadyPurchased = student.purchasedTestSeries.some(
      (p) => p.testSeries.toString() === testSeriesId && p.paymentStatus === "paid"
    );
    if (isAlreadyPurchased) return res.status(400).json({ error: "Already purchased" });

    const { baseAmount, gatewayCharge, totalAmount } = calcPricing(testSeries.price);

    const order = await razorpay.orders.create({
      amount: totalAmount * 100,
      currency: "INR",
      receipt: `testseries_${Date.now()}`,
      notes: { studentId: req.user._id.toString(), testSeriesId, studentName: student.name },
    });

    res.json({
      success: true,
      orderId: order.id,
      amount: totalAmount,
      amountInPaise: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
      breakdown: { baseAmount, gatewayCharge, totalAmount },
      testSeries: { id: testSeries._id, title: testSeries.title, price: testSeries.price },
    });
  } catch (error) {
    console.error("Create test series order error:", error);
    res.status(500).json({ error: "Failed to create payment order" });
  }
});

router.post("/test-series/verify-payment", verifyToken, requireStudent, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, testSeriesId } = req.body;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) return res.status(400).json({ error: "Payment verification failed" });

    const testSeries = await TestSeries.findById(testSeriesId);
    if (!testSeries) return res.status(404).json({ error: "Test series not found" });

    const student = await Student.findById(req.user._id);
    if (!student) return res.status(404).json({ error: "Student not found" });

    const isAlreadyPurchased = student.purchasedTestSeries.some(
      (p) => p.testSeries.toString() === testSeriesId && p.paymentStatus === "paid"
    );
    if (isAlreadyPurchased) return res.status(400).json({ error: "Already purchased" });

    const receiptNumber = makeReceiptNumber("TSN");

    student.purchasedTestSeries.push({
      testSeries: testSeriesId,
      paymentStatus: "paid",
      enrolledAt: new Date(),
      receiptNumber,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
    });
    await student.save();

    res.json({
      success: true,
      message: "Test series purchased successfully",
      receiptNumber,
      testSeries: { id: testSeries._id, title: testSeries.title, price: testSeries.price },
    });
  } catch (error) {
    console.error("Verify test series payment error:", error);
    res.status(500).json({ error: "Failed to verify payment" });
  }
});

router.get("/test-series/purchases", verifyToken, requireStudent, async (req, res) => {
  try {
    const student = await Student.findById(req.user._id)
      .populate("purchasedTestSeries.testSeries", "title description price numberOfTests duration")
      .select("purchasedTestSeries");
    res.json({ success: true, purchases: student.purchasedTestSeries });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch test series purchases" });
  }
});

module.exports = router;
