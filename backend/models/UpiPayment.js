const mongoose = require("mongoose");

const upiPaymentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    courseTitle: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    utrNumber: { type: String, required: true, trim: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    approvedAt: { type: Date },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
  },
  { timestamps: true }
);

upiPaymentSchema.index({ utrNumber: 1 }, { unique: true });
upiPaymentSchema.index({ email: 1, courseId: 1, status: 1 });

module.exports = mongoose.model("UpiPayment", upiPaymentSchema);


