const express = require("express");
const Course = require("../models/Course");
const Student = require("../models/Student");
const UpiPayment = require("../models/UpiPayment");
const {
  verifyToken,
  requireStudent,
  requireAdmin,
} = require("../middleware/auth");

const router = express.Router();

// Helper: build UPI intent URL
function buildUpiUrl({ pa, pn, am, cu = "INR", tn }) {
  const params = new URLSearchParams({ pa, pn, am: String(am), cu, tn });
  return `upi://pay?${params.toString()}`;
}

// Student: Initiate UPI payment (returns intent URL with course amount)
router.post("/initiate", verifyToken, requireStudent, async (req, res) => {
  try {
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({ error: "Course ID is required" });
    }

    const course = await Course.findById(courseId);
    if (!course || !course.isActive) {
      return res.status(404).json({ error: "Course not found" });
    }

    const upiUrl = `upi://pay?pa=${
      process.env.UPI_VPA || "7600837122@hdfcbank"
    }&pn=Tushti IAS&am=${String(
      Number(course.price) + 0.18 * Number(course.price)
    )}&cu=INR&tn=Payment for ${course.title} - ${req.user.email || "student"}`;
    const pa = process.env.UPI_VPA;
    const pn = "Tushti IAS";

    res.json({
      success: true,
      upiUrl,
      course: { id: course._id, title: course.title, price: course.price },
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
    const { courseId, email, phone, name } = req.body;
    if (!courseId || !email || !phone) {
      return res
        .status(400)
        .json({ error: "courseId, email and phone are required" });
    }

    const course = await Course.findById(courseId);
    if (!course || !course.isActive) {
      return res.status(404).json({ error: "Course not found" });
    }

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
    }

    const alreadyPending = student.enrolledCourses.some(
      (e) => e.course.toString() === courseId && e.paymentStatus === "pending"
    );
    const alreadyPaid = student.enrolledCourses.some(
      (e) => e.course.toString() === courseId && e.paymentStatus === "paid"
    );

    if (!alreadyPending && !alreadyPaid) {
      student.enrolledCourses.push({
        course: course._id,
        enrolledAt: new Date(),
        paymentStatus: "pending",
        amount: course.price,
      });
      await student.save();
    }

    const amountWithGst = String(
      Number(course.price) + 0.18 * Number(course.price)
    );
    const upiUrl = `upi://pay?pa=${process.env.UPI_VPA}&pn=Tushti IAS&am=${amountWithGst}&cu=INR&tn=Payment for ${course.title} - ${email}`;
    res.json({
      success: true,
      upiUrl,
      course: { id: course._id, title: course.title, price: course.price },
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
    const { courseId, utrNumber } = req.body;
    if (!courseId || !utrNumber) {
      return res
        .status(400)
        .json({ error: "courseId and utrNumber are required" });
    }

    const course = await Course.findById(courseId);
    if (!course || !course.isActive) {
      return res.status(404).json({ error: "Course not found" });
    }

    const student = await Student.findById(req.user._id);
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Prevent duplicate submissions for the same course if already approved
    const alreadyEnrolled = student.enrolledCourses.some(
      (e) => e.course.toString() === courseId && e.paymentStatus === "paid"
    );
    if (alreadyEnrolled) {
      return res
        .status(400)
        .json({ error: "You already have access to this course" });
    }

    // Prevent duplicate pending submission for same student/course
    const existingPending = await UpiPayment.findOne({
      studentId: student._id,
      courseId,
      status: "pending",
    });
    if (existingPending) {
      return res.status(400).json({
        error: "A pending verification already exists for this course",
      });
    }

    // Create UPI payment record
    const payment = await UpiPayment.create({
      name: student.name,
      email: student.email,
      phone: student.mobile,
      courseId: course._id,
      courseTitle: course.title,
      amount: course.price,
      utrNumber: utrNumber.trim(),
      status: "pending",
      studentId: student._id,
    });

    res.status(201).json({
      success: true,
      message: "Payment submitted for verification",
      receipt: {
        id: payment._id,
        utrNumber: payment.utrNumber,
        name: payment.name,
        email: payment.email,
        phone: payment.phone,
        course: payment.courseTitle,
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
    const payment = await UpiPayment.findById(id).populate(
      "courseId",
      "title price"
    );
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
        course: payment.courseTitle,
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
