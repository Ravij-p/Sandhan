// models/Payment.js
const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  amount: Number,
  paymentId: String, // Razorpay payment ID
  receiptUrl: String,
  timestamp: { type: Date, default: Date.now },
  status: { type: String, enum: ["success", "failed"], default: "success" },
});

module.exports = mongoose.model("Payment", paymentSchema);
