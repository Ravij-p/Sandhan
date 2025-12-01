const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    mobile: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    enrolledCourses: [
      {
        course: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Course",
        },
        enrolledAt: {
          type: Date,
          default: Date.now,
        },
        paymentStatus: {
          type: String,
          enum: ["paid", "pending"],
          default: "paid",
        },
        receiptNumber: {
          type: String,
        },
        amount: {
          type: Number,
        },
        razorpayOrderId: {
          type: String,
        },
        razorpayPaymentId: {
          type: String,
        },
      },
    ],
    purchasedTestSeries: [
      {
        testSeries: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "TestSeries",
        },
        enrolledAt: {
          type: Date,
          default: Date.now,
        },
        paymentStatus: {
          type: String,
          enum: ["paid", "pending"],
          default: "paid",
        },
        receiptNumber: {
          type: String,
        },
        razorpayOrderId: {
          type: String,
        },
        razorpayPaymentId: {
          type: String,
        },
      },
    ],
    tempPassword: {
      type: String,
      default: null,
    },
    mailedCredentials: {
      type: Boolean,
      default: false,
    },
    enrollmentMailSent: {
      type: Boolean,
      default: false,
    },
    watchedProgress: {
      type: Map,
      of: Number,
      default: {},
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
studentSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
studentSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Index for efficient querying
studentSchema.index({ email: 1 });
studentSchema.index({ mobile: 1 });

module.exports = mongoose.model("Student", studentSchema);
