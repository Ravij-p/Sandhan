const mongoose = require("mongoose");

// Legacy User model for backward compatibility with existing payments
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    mobile: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    course: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["paid", "pending"],
      default: "paid",
    },
    receiptNumber: {
      type: String,
      unique: true,
      required: true,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    razorpayOrderId: {
      type: String,
      sparse: true,
    },
    razorpayPaymentId: {
      type: String,
      sparse: true,
    },
    // New fields for integration with Student model
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      sparse: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
