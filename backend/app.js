const express = require("express");
require("dotenv").config();
const mongoose = require("mongoose");
const cors = require("cors");
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const moment = require("moment");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const PDFDocument = require("pdfkit");
const User = require("./models/User");
const { generateReceipt } = require("./utils/pdfGenerator");
const { generateExcelReport } = require("./utils/excelGenerator");
const { log } = require("console");

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/sandhan_institute",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
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

// Create receipts directory if it doesn't exist
const receiptsDir = path.join(__dirname, "receipts");
if (!fs.existsSync(receiptsDir)) {
  fs.mkdirSync(receiptsDir);
}

// API Routes

// Create Razorpay Order
app.post("/api/create-order", async (req, res) => {
  console.log("---- /api/create-order hit ----");
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);

  const { amount, name, mobile, course } = req.body;

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
    console.log("Incoming request body:", req.body);

    const existingUser = await User.findOne({ mobile });
    if (existingUser) {
      return res.status(400).json({
        error:
          "Mobile number already registered. Duplicate payments not allowed.",
      });
    }

    // Create Razorpay order
    const options = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        name,
        mobile,
        course,
      },
    };

    const order = await razorpay.orders.create(options);

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("Order creation error:", err);
    res.status(500).json({
      error: "Failed to create payment order",
    });
  }
});

// Verify Razorpay Payment and Generate Receipt
app.post("/api/verify-payment", async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    name,
    mobile,
    course,
    amount,
  } = req.body;

  try {
    // Verify payment signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        error: "Payment verification failed",
      });
    }

    // Payment verified successfully, now save to database
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
      amount: parseFloat(amount) / 100, // Convert back from paise
      receiptNumber,
      paymentDate: new Date(),
      paymentStatus: "paid",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
    };

    const user = new User(userData);
    await user.save();

    const receiptId = `receipt_SDN${new Date()
      .toISOString()
      .replace(/[-:TZ.]/g, "")
      .slice(0, 12)}_${Date.now()}`;

    const downloadUrl = `/api/receipt/${receiptNumber}`;

    // Send success response with receipt download link
    res.json({
      success: true,
      message: "Payment verified and receipt generated",
      receiptNumber,
      downloadUrl,
    });
    console.log("Payment verified", downloadUrl);
  } catch (err) {
    console.error("Payment verification error:", err);

    if (err.code === 11000) {
      if (err.keyPattern && err.keyPattern.mobile) {
        return res.status(400).json({
          error: "Mobile number already registered",
        });
      }
    }

    res.status(500).json({
      error: "Payment verification failed. Please contact support.",
    });
  }
});

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
      .text("SANDHAN GROUP OF INSTITUTE", { align: "center" });
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
      .text("We appreciate your trust in Sandhan Group of Institute", 50, 410, {
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

    const fileName = `Sandhan_Institute_Report_${moment().format(
      "YYYY-MM-DD"
    )}.xlsx`;
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
  console.log(`   POST /api/create-order - Create Razorpay payment order`);
  console.log(
    `   POST /api/verify-payment - Verify payment and generate receipt`
  );
  console.log(`   GET  /api/download-receipt/:filename - Download PDF receipt`);
  console.log(
    `   POST /api/payment-direct - Direct payment (without Razorpay)`
  );
  console.log(`   GET  /api/export/excel - Generate course-wise Excel report`);
  console.log(`   GET  /api/stats - Get payment statistics`);
  console.log(`   GET  /api/payments - Get all payments (with pagination)`);
  console.log(`   GET  /api/health - Health check`);
});
