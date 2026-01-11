const express = require("express");
const Course = require("../models/Course");
const Student = require("../models/Student");
const UpiPayment = require("../models/UpiPayment");
const {
  verifyToken,
  requireStudent,
  requireAdmin,
} = require("../middleware/auth");

const TestSeries = require("../models/TestSeries");

const router = express.Router();

// Helper: build UPI intent URL
function buildUpiUrl({ pa, pn, am, cu = "INR", tn }) {
  const params = new URLSearchParams({ pa, pn, am: String(am), cu, tn });
  return `upi://pay?${params.toString()}`;
}

// Student: Initiate UPI payment (returns intent URL with course amount)
router.post("/initiate", verifyToken, requireStudent, async (req, res) => {
  try {
    const { courseId, testSeriesId } = req.body;

    if (!courseId && !testSeriesId) {
      return res.status(400).json({ error: "Course ID or Test Series ID is required" });
    }

    let item, itemType, itemTitle, itemPrice;

    if (courseId) {
      item = await Course.findById(courseId);
      itemType = "Course";
    } else {
      item = await TestSeries.findById(testSeriesId);
      itemType = "TestSeries";
    }

    if (!item || !item.isActive) {
      return res.status(404).json({ error: `${itemType} not found` });
    }
    
    itemTitle = item.title;
    itemPrice = item.price;

    const amountWithGst = String(
      Number(itemPrice) + 0.18 * Number(itemPrice) // assuming GST logic is same
    );
    // For test series price might already include GST or not, assuming same logic as course for consistency with prompt "Reuse the existing course payment flow"
    
    const upiUrl = `upi://pay?pa=${
      process.env.UPI_VPA || "7600837122@hdfcbank"
    }&pn=Tushti IAS&am=${amountWithGst}&cu=INR&tn=Payment for ${itemTitle} - ${req.user.email || "student"}`;
    const pa = process.env.UPI_VPA;
    const pn = "Tushti IAS";

    res.json({
      success: true,
      upiUrl,
      item: { id: item._id, title: itemTitle, price: itemPrice, type: itemType },
      payee: { pa, pn },
    });
  } catch (error) {
    console.error("UPI initiate error:", error);
    res.status(500).json({ error: "Failed to initiate UPI payment" });
  }
});

// Public: Initiate UPI payment and pre-create student/enrollment without login
router.post("/initiate-public", async (req, res) => {
  try {
    const { courseId, testSeriesId, email, phone, name } = req.body;
    if ((!courseId && !testSeriesId) || !email || !phone) {
      return res
        .status(400)
        .json({ error: "Item ID, email and phone are required" });
    }

    let item, itemType, itemTitle, itemPrice;
    if (courseId) {
      item = await Course.findById(courseId);
      itemType = "Course";
    } else {
      item = await TestSeries.findById(testSeriesId);
      itemType = "TestSeries";
    }

    if (!item || !item.isActive) {
      return res.status(404).json({ error: `${itemType} not found` });
    }
    itemTitle = item.title;
    itemPrice = item.price;

    let student = await Student.findOne({ email });
    let generatedPassword = null;
    if (!student) {
      const pwd = Math.random().toString(36).slice(-12);
      generatedPassword = pwd;
      student = new Student({
        name: name || email.split("@")[0],
        email,
        mobile: phone,
        password: pwd,
        tempPassword: pwd,
      });
      await student.save();
    } else {
      if (!student.name && name) {
        student.name = name;
        await student.save();
      }
    }

    let alreadyPending = false;
    let alreadyPaid = false;

    if (itemType === "Course") {
       alreadyPending = student.enrolledCourses.some(
        (e) => e.course.toString() === courseId && e.paymentStatus === "pending"
      );
       alreadyPaid = student.enrolledCourses.some(
        (e) => e.course.toString() === courseId && e.paymentStatus === "paid"
      );
      
      if (!alreadyPending && !alreadyPaid) {
        student.enrolledCourses.push({
          course: item._id,
          enrolledAt: new Date(),
          paymentStatus: "pending",
          amount: itemPrice,
        });
        await student.save();
      }
    } else {
      // Test Series
       alreadyPending = student.purchasedTestSeries.some(
        (e) => e.testSeries.toString() === testSeriesId && e.paymentStatus === "pending"
      );
       alreadyPaid = student.purchasedTestSeries.some(
        (e) => e.testSeries.toString() === testSeriesId && e.paymentStatus === "paid"
      );

      if (!alreadyPending && !alreadyPaid) {
        student.purchasedTestSeries.push({
          testSeries: item._id,
          enrolledAt: new Date(),
          paymentStatus: "pending",
          amount: itemPrice, // Using same schema structure
        });
        await student.save();
      }
    }

    const amountWithGst = String(
      Number(itemPrice) + 0.18 * Number(itemPrice)
    );
    const upiUrl = `upi://pay?pa=${process.env.UPI_VPA}&pn=Tushti IAS&am=${amountWithGst}&cu=INR&tn=Payment for ${itemTitle} - ${email}`;
    res.json({
      success: true,
      upiUrl,
      item: { id: item._id, title: itemTitle, price: itemPrice, type: itemType },
      preCreated: { studentId: student._id, tempPassword: generatedPassword },
    });
  } catch (error) {
    console.error("Public UPI initiate error:", error);
    res.status(500).json({ error: "Failed to initiate UPI payment" });
  }
});

// Student: Submit UTR/Transaction ID for verification
router.post("/submit-utr", verifyToken, requireStudent, async (req, res) => {
  try {
    const { courseId, testSeriesId, utrNumber } = req.body;
    if ((!courseId && !testSeriesId) || !utrNumber) {
      return res
        .status(400)
        .json({ error: "Item ID and utrNumber are required" });
    }

    let item, itemType, itemTitle, itemPrice;
    if (courseId) {
      item = await Course.findById(courseId);
      itemType = "Course";
    } else {
      item = await TestSeries.findById(testSeriesId);
      itemType = "TestSeries";
    }

    if (!item || !item.isActive) {
      return res.status(404).json({ error: `${itemType} not found` });
    }
    itemTitle = item.title;
    itemPrice = item.price;

    const student = await Student.findById(req.user._id);
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Prevent duplicate submissions
    if (itemType === "Course") {
      const alreadyEnrolled = student.enrolledCourses.some(
        (e) => e.course.toString() === courseId && e.paymentStatus === "paid"
      );
      if (alreadyEnrolled) {
        return res
          .status(400)
          .json({ error: "You already have access to this course" });
      }
    } else {
      const alreadyPurchased = student.purchasedTestSeries.some(
        (e) => e.testSeries.toString() === testSeriesId && e.paymentStatus === "paid"
      );
      if (alreadyPurchased) {
        return res
          .status(400)
          .json({ error: "You already have access to this test series" });
      }
    }

    // Prevent duplicate pending submission
    const filter = {
      studentId: student._id,
      status: "pending",
    };
    if (courseId) filter.courseId = courseId;
    else filter.testSeriesId = testSeriesId;

    const existingPending = await UpiPayment.findOne(filter);
    if (existingPending) {
      return res.status(400).json({
        error: "A pending verification already exists for this item",
      });
    }

    // Create UPI payment record
    const paymentData = {
      name: student.name,
      email: student.email,
      phone: student.mobile,
      amount: itemPrice,
      utrNumber: utrNumber.trim(),
      status: "pending",
      studentId: student._id,
    };

    if (courseId) {
      paymentData.courseId = courseId;
      paymentData.courseTitle = itemTitle;
    } else {
      paymentData.testSeriesId = testSeriesId;
      paymentData.testSeriesTitle = itemTitle;
    }

    const payment = await UpiPayment.create(paymentData);

    res.status(201).json({
      success: true,
      message: "Payment submitted for verification",
      receipt: {
        id: payment._id,
        utrNumber: payment.utrNumber,
        name: payment.name,
        email: payment.email,
        phone: payment.phone,
        item: itemTitle,
        amount: payment.amount,
        status: payment.status,
        createdAt: payment.createdAt,
      },
    });
  } catch (error) {
    console.error("Submit UTR error:", error);
    if (
      error.code === 11000 &&
      error.keyPattern &&
      error.keyPattern.utrNumber
    ) {
      return res.status(400).json({ error: "This UTR is already submitted" });
    }
    res.status(500).json({ error: "Failed to submit UTR" });
  }
});

// Student: Get my submission status for a course
router.get("/my", verifyToken, requireStudent, async (req, res) => {
  try {
    const { courseId } = req.query;
    const filter = { studentId: req.user._id };
    if (courseId) filter.courseId = courseId;
    const submissions = await UpiPayment.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, submissions });
  } catch (error) {
    console.error("Fetch my UPI submissions error:", error);
    res.status(500).json({ error: "Failed to fetch submissions" });
  }
});

// Admin: List pending UPI payments
router.get("/pending", verifyToken, requireAdmin, async (req, res) => {
  try {
    const items = await UpiPayment.find({ status: "pending" })
      .sort({ createdAt: -1 })
      .populate("courseId", "title price")
      .populate("studentId", "name email mobile");
    res.json({ success: true, items });
  } catch (error) {
    console.error("List pending UPI error:", error);
    res.status(500).json({ error: "Failed to list pending payments" });
  }
});

// Admin: Approve UPI payment and enroll student
router.post("/:id/approve", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await UpiPayment.findById(id);
    if (!payment) return res.status(404).json({ error: "Payment not found" });
    if (payment.status !== "pending") {
      return res.status(400).json({ error: "Payment is not pending" });
    }

    const student = await Student.findById(payment.studentId);
    if (!student) return res.status(404).json({ error: "Student not found" });

    // Enroll student if not already enrolled
    const isEnrolled = student.enrolledCourses.some(
      (e) =>
        e.course.toString() === payment.courseId.toString() &&
        e.paymentStatus === "paid"
    );

    if (!isEnrolled) {
      student.enrolledCourses.push({
        course: payment.courseId,
        enrolledAt: new Date(),
        paymentStatus: "paid",
        receiptNumber: payment.utrNumber,
        amount: payment.amount,
      });
      await student.save();
    }

    payment.status = "approved";
    payment.approvedAt = new Date();
    payment.approvedBy = req.user._id;
    await payment.save();

    res.json({ success: true, message: "Payment approved and access granted" });
  } catch (error) {
    console.error("Approve UPI error:", error);
    res.status(500).json({ error: "Failed to approve payment" });
  }
});

// Admin: Reject UPI payment
router.post("/:id/reject", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await UpiPayment.findById(id);
    if (!payment) return res.status(404).json({ error: "Payment not found" });
    if (payment.status !== "pending") {
      return res.status(400).json({ error: "Payment is not pending" });
    }

    payment.status = "rejected";
    payment.approvedAt = undefined;
    payment.approvedBy = undefined;
    await payment.save();

    res.json({ success: true, message: "Payment rejected" });
  } catch (error) {
    console.error("Reject UPI error:", error);
    res.status(500).json({ error: "Failed to reject payment" });
  }
});

// Fetch a receipt (by id)
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await UpiPayment.findById(id)
      .populate("courseId", "title price")
      .populate("testSeriesId", "title price");
    if (!payment) return res.status(404).json({ error: "Receipt not found" });

    // Allow owner or admin
    const isOwner =
      payment.studentId &&
      payment.studentId.toString() === req.user._id.toString();
    const isAdmin =
      req.user.role === "admin" || req.user.role === "super_admin";
    if (!isOwner && !isAdmin)
      return res.status(403).json({ error: "Forbidden" });

    res.json({
      success: true,
      receipt: {
        id: payment._id,
        utrNumber: payment.utrNumber,
        name: payment.name,
        email: payment.email,
        phone: payment.phone,
        course: payment.courseTitle || payment.testSeriesTitle,
        amount: payment.amount,
        status: payment.status,
        createdAt: payment.createdAt,
      },
    });
  } catch (error) {
    console.error("Fetch receipt error:", error);
    res.status(500).json({ error: "Failed to fetch receipt" });
  }
});

module.exports = router;
