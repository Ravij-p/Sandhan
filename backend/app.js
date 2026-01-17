const express = require("express");
require("dotenv").config();
const mongoose = require("mongoose");
const cors = require("cors");
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const moment = require("moment");
const crypto = require("crypto");
const PDFDocument = require("pdfkit");
const Razorpay = require("razorpay");
const User = require("./models/User");
const Student = require("./models/Student");
const Course = require("./models/Course");
const TestSeries = require("./models/TestSeries");
const { generateReceipt } = require("./utils/pdfGenerator");
const { generateExcelReport } = require("./utils/excelGenerator");
const { log } = require("console");

// Import new routes
const authRoutes = require("./routes/auth");
const courseRoutes = require("./routes/courses");
const adminRoutes = require("./routes/admin");
const paymentRoutes = require("./routes/payments");
const upiPaymentRoutes = require("./routes/upiPayments");
const testSeriesRoutes = require("./routes/testSeries");
const documentRoutes = require("./routes/documents");
const adminHomepageAdsRoutes = require("./routes/adminHomepageAds");

const app = express();
const PORT = process.env.PORT || 5000;
app.use(express.json());

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

function generateRandomPassword(length = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function getOrCreateStudentByEmail({ name, email, mobile }) {
  const normalizedEmail = email.toLowerCase().trim();
  let student = await Student.findOne({ email: normalizedEmail });
  let generatedPassword = null;

  if (!student) {
    generatedPassword = generateRandomPassword(8);
    student = new Student({
      name,
      email: normalizedEmail,
      mobile,
      password: generatedPassword,
      tempPassword: generatedPassword,
      mailedCredentials: false,
      enrollmentMailSent: false,
    });
  } else {
    if (mobile && mobile !== student.mobile) {
      student.mobile = mobile;
    }
  }

  await student.save();
  return { student, generatedPassword };
}

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected");
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("uploads")); // Serve uploaded files

// Create necessary directories
const receiptsDir = path.join(__dirname, "receipts");
const uploadsDir = path.join(__dirname, "uploads");

if (!fs.existsSync(receiptsDir)) {
  fs.mkdirSync(receiptsDir);
}

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// API Routes

// New authentication and course routes
app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/admin", adminRoutes);

app.post("/api/payments/public/course/create-order", async (req, res) => {
  try {
    const { courseId, name, email, mobile } = req.body;

    if (!courseId || !name || !email || !mobile) {
      return res
        .status(400)
        .json({ error: "Course ID, name, email and mobile are required" });
    }

    const course = await Course.findById(courseId);
    if (!course || !course.isActive) {
      return res.status(404).json({ error: "Course not found" });
    }

    const { student } = await getOrCreateStudentByEmail({
      name,
      email,
      mobile,
    });

    const baseAmount = course.price;
    const gatewayFeePercent = 0.02;
    const gstPercent = 0.18;
    const totalDeductionPercent = gatewayFeePercent * (1 + gstPercent);
    const amountToPay = Math.ceil(baseAmount / (1 - totalDeductionPercent));

    const options = {
      amount: amountToPay * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        studentId: student._id.toString(),
        studentEmail: student.email,
        courseId: courseId.toString(),
        studentName: student.name,
        courseName: course.title,
        mobile: student.mobile,
      },
    };

    const order = await razorpay.orders.create(options);
    const serviceCharge = amountToPay - baseAmount;

    res.json({
      success: true,
      orderId: order.id,
      amount: amountToPay,
      amountInPaise: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
      breakdown: {
        baseAmount,
        serviceCharge,
        totalAmount: amountToPay,
      },
      course: {
        id: course._id,
        title: course.title,
        price: course.price,
      },
    });
  } catch (error) {
    console.error("Public create course order error (app):", error);
    res.status(500).json({ error: "Failed to create payment order" });
  }
});

app.post("/api/payments/public/course/verify-payment", async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      courseId,
      email,
      name,
      mobile,
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !courseId ||
      !email
    ) {
      return res.status(400).json({ error: "Invalid payment data" });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: "Payment verification failed" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    const { student } = await getOrCreateStudentByEmail({
      name: name || "",
      email,
      mobile,
    });

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

    const receiptNumber = `SDN${moment().format("YYYYMM")}${Math.floor(
      Math.random() * 10000
    )
      .toString()
      .padStart(4, "0")}`;

    student.enrolledCourses.push({
      course: courseId,
      enrolledAt: new Date(),
      paymentStatus: "paid",
      receiptNumber,
      amount: course.price,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
    });

    await student.save();

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
    console.error("Public course payment verification error (app):", error);
    res.status(500).json({ error: "Payment verification failed" });
  }
});

app.post("/api/payments/public/test-series/create-order", async (req, res) => {
  try {
    const { testSeriesId, name, email, mobile } = req.body;

    if (!testSeriesId || !name || !email || !mobile) {
      return res.status(400).json({
        error: "Test Series ID, name, email and mobile are required",
      });
    }

    const testSeries = await TestSeries.findById(testSeriesId);
    if (!testSeries || !testSeries.isActive) {
      return res.status(404).json({ error: "Test series not found" });
    }

    const { student } = await getOrCreateStudentByEmail({
      name,
      email,
      mobile,
    });

    const baseAmount = testSeries.price;
    const gatewayFeePercent = 0.02;
    const gstPercent = 0.18;
    const totalDeductionPercent = gatewayFeePercent * (1 + gstPercent);
    const amountToPay = Math.ceil(baseAmount / (1 - totalDeductionPercent));

    const options = {
      amount: amountToPay * 100,
      currency: "INR",
      receipt: `testseries_${Date.now()}`,
      notes: {
        studentId: student._id.toString(),
        studentEmail: student.email,
        testSeriesId: testSeriesId.toString(),
        studentName: student.name,
        testSeriesName: testSeries.title,
        mobile: student.mobile,
      },
    };

    const order = await razorpay.orders.create(options);
    const serviceCharge = amountToPay - baseAmount;

    res.json({
      success: true,
      orderId: order.id,
      amount: amountToPay,
      amountInPaise: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
      breakdown: {
        baseAmount,
        serviceCharge,
        totalAmount: amountToPay,
      },
      testSeries: {
        id: testSeries._id,
        title: testSeries.title,
        price: testSeries.price,
      },
    });
  } catch (error) {
    console.error("Public create test series order error (app):", error);
    res.status(500).json({ error: "Failed to create payment order" });
  }
});

app.post(
  "/api/payments/public/test-series/verify-payment",
  async (req, res) => {
    try {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        testSeriesId,
        email,
        name,
        mobile,
      } = req.body;

      if (
        !razorpay_order_id ||
        !razorpay_payment_id ||
        !razorpay_signature ||
        !testSeriesId ||
        !email
      ) {
        return res.status(400).json({ error: "Invalid payment data" });
      }

      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_SECRET)
        .update(body.toString())
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ error: "Payment verification failed" });
      }

      const testSeries = await TestSeries.findById(testSeriesId);
      if (!testSeries) {
        return res.status(404).json({ error: "Test series not found" });
      }

      const { student } = await getOrCreateStudentByEmail({
        name: name || "",
        email,
        mobile,
      });

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

      const receiptNumber = `TSN${moment().format("YYYYMM")}${Math.floor(
        Math.random() * 10000
      )
        .toString()
        .padStart(4, "0")}`;

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
        testSeries: {
          id: testSeries._id,
          title: testSeries.title,
          price: testSeries.price,
        },
      });
    } catch (error) {
      console.error("Public verify test series payment error (app):", error);
      res.status(500).json({ error: "Failed to verify payment" });
    }
  }
);

app.use("/api/payments", paymentRoutes);
app.use("/payments", paymentRoutes);
app.use("/api/test-series", testSeriesRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/homepage-ads", adminHomepageAdsRoutes);
app.use("/api/upi-payments", upiPaymentRoutes);

// Legacy Razorpay endpoints removed

app.get("/api/receipt/:receiptNumber", async (req, res) => {
  try {
    const { receiptNumber } = req.params;

    // 1. Fetch receipt data from MongoDB
    const userData = await User.findOne({ receiptNumber });
    if (!userData) {
      return res.status(404).json({ error: "Receipt not found" });
    }

    // 2. Set response headers for PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=receipt_${receiptNumber}.pdf`
    );

    // 3. Create PDF and stream directly to response
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    // -------- HEADER ----------
    doc
      .fontSize(24)
      .fillColor("#2c3e50")
      .text("TUSHTI IAS", { align: "center" });
    doc
      .moveDown(7.5)
      .fontSize(18)
      .fillColor("#2c3e50")
      .text("PAYMENT RECEIPT", 50, 110, { align: "center" });

    // -------- DETAILS BOX ----------
    doc.rect(50, 150, 500, 200).strokeColor("#bdc3c7").lineWidth(1).stroke();

    let yPosition = 170;
    const lineHeight = 25;

    const details = [
      { label: "Receipt No:", value: userData.receiptNumber },
      {
        label: "Date:",
        value: new Date(userData.paymentDate).toLocaleDateString("en-IN"),
      },
      { label: "Student Name:", value: userData.name },
      { label: "Mobile Number:", value: userData.mobile },
      { label: "Course:", value: userData.course },
      {
        label: "Amount Paid:",
        value: `₹${userData.amount.toLocaleString("en-IN")}`,
      },
    ];

    details.forEach((detail, index) => {
      doc
        .fontSize(12)
        .fillColor("#2c3e50")
        .text(detail.label, 70, yPosition + index * lineHeight, { width: 150 })
        .text(detail.value, 220, yPosition + index * lineHeight, {
          width: 300,
        });
    });

    // -------- STATUS + THANK YOU ----------
    doc.fontSize(14).fillColor("#27ae60").text("Payment Status: PAID", 70, 320);

    doc
      .fontSize(16)
      .fillColor("#2c3e50")
      .text("Thank You for Your Payment!", 50, 380, { align: "center" });

    doc
      .fontSize(12)
      .fillColor("#7f8c8d")
      .text("We appreciate your trust in Tushti IAS", 50, 410, {
        align: "center",
      });

    // -------- FOOTER ----------
    doc
      .fontSize(10)
      .fillColor("#95a5a6")
      .text("This is a computer generated receipt.", 50, 450, {
        align: "center",
      });

    // 4. Finalize PDF
    doc.end();
  } catch (err) {
    console.error("Receipt generation error:", err);
    res.status(500).json({ error: "Failed to generate receipt" });
  }
});

// Download Receipt
// app.get("/api/api/download-receipt/:filename", (req, res) => {
//   const { filename } = req.params;
//   const filePath = path.join(receiptsDir, filename);

//   if (!fs.existsSync(filePath)) {
//     return res.status(404).json({ error: "Receipt not found" });
//   }

//   res.setHeader("Content-Type", "application/pdf");
//   res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

//   const fileStream = fs.createReadStream(filePath);
//   fileStream.pipe(res);
//   console.log("Receipt downloaded:", filename);
//   // Clean up file after sending
//   fileStream.on("end", () => {
//     setTimeout(() => {
//       if (fs.existsSync(filePath)) {
//         fs.unlinkSync(filePath);
//       }
//     }, 5000);
//   });
// });

// Payment Processing API
app.post("/api/payment-direct", async (req, res) => {
  const { name, amount, mobile, course } = req.body;

  // Validation
  if (!name || !amount || !mobile || !course) {
    return res.status(400).json({
      error: "All fields are required: name, amount, mobile, course",
    });
  }

  if (amount <= 0) {
    return res.status(400).json({
      error: "Amount must be greater than 0",
    });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ mobile });
    if (existingUser) {
      return res.status(400).json({
        error:
          "Mobile number already registered. Duplicate payments not allowed.",
      });
    }

    // Generate unique receipt number
    const receiptNumber = `SDN${moment().format("YYYYMM")}${Math.floor(
      Math.random() * 10000
    )
      .toString()
      .padStart(4, "0")}`;

    // Create user record
    const userData = {
      name: name.trim(),
      mobile: mobile.trim(),
      course: course.trim(),
      amount: parseFloat(amount),
      receiptNumber,
      paymentDate: new Date(),
      paymentStatus: "paid",
    };

    const user = new User(userData);
    await user.save();

    // Generate PDF receipt
    const fileName = `receipt_${receiptNumber}_${Date.now()}.pdf`;
    const filePath = path.join(receiptsDir, fileName);

    await generateReceipt(userData, filePath);

    // Send PDF as response
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    // Clean up file after sending (optional)
    fileStream.on("end", () => {
      setTimeout(() => {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }, 5000);
    });
  } catch (err) {
    console.error("Payment processing error:", err);

    if (err.code === 11000) {
      if (err.keyPattern && err.keyPattern.mobile) {
        return res.status(400).json({
          error: "Mobile number already registered",
        });
      }
      if (err.keyPattern && err.keyPattern.receiptNumber) {
        return res.status(400).json({
          error: "Receipt generation error. Please try again.",
        });
      }
    }

    res.status(500).json({
      error: "Payment processing failed. Please try again.",
    });
  }
});

// Excel Export API (Course-wise sheets)
app.get("/api/export/excel", async (req, res) => {
  try {
    const workbook = await generateExcelReport(User);

    const fileName = `Tushti_IAS_Report_${moment().format("YYYY-MM-DD")}.xlsx`;
    const filePath = path.join(__dirname, fileName);

    // Write workbook to file
    XLSX.writeFile(workbook, filePath);

    // Send file as download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    // Clean up file after sending
    fileStream.on("end", () => {
      setTimeout(() => {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }, 5000);
    });
  } catch (err) {
    console.error("Excel export error:", err);
    res.status(500).json({
      error: "Failed to generate Excel report",
    });
  }
});

// Get payment statistics
app.get("/api/stats", async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ paymentStatus: "paid" });
    const totalAmount = await User.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const courseStats = await User.aggregate([
      { $match: { paymentStatus: "paid" } },
      {
        $group: {
          _id: "$course",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json({
      totalStudents,
      totalAmount: totalAmount.length > 0 ? totalAmount[0].total : 0,
      courseStats: courseStats.map((course) => ({
        course: course._id,
        students: course.count,
        amount: course.totalAmount,
      })),
    });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

// Get all payments (with pagination)
app.get("/api/payments", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const course = req.query.course;

    const query = { paymentStatus: "paid" };
    if (course) {
      query.course = course;
    }

    const payments = await User.find(query)
      .sort({ paymentDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      payments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalRecords: total,
    });
  } catch (err) {
    console.error("Payments fetch error:", err);
    res.status(500).json({ error: "Failed to fetch payments" });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "Server is running",
    timestamp: new Date().toISOString(),
    port: PORT,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
  console.log(`📊 API Documentation:`);
  console.log(`   POST /api/upi-payments/initiate - Get UPI intent URL`);
  console.log(
    `   POST /api/upi-payments/submit-utr - Submit UTR for verification`
  );
  console.log(`   GET  /api/download-receipt/:filename - Download PDF receipt`);
  console.log(
    `   POST /api/payment-direct - Direct payment (without Razorpay)`
  );
  console.log(`   GET  /api/export/excel - Generate course-wise Excel report`);
  console.log(`   GET  /api/stats - Get payment statistics`);
  console.log(`   GET  /api/payments - Get all payments (with pagination)`);
  console.log(`   GET  /api/homepage-ads/public/active - Active homepage ads`);
  console.log(`   GET  /api/health - Health check`);
});
