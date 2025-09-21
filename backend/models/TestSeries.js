const mongoose = require("mongoose");

const testSeriesSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      required: true,
      enum: ["gpsc", "upsc", "neet", "banking", "railway", "ssc", "talati"],
    },
    duration: {
      type: String,
      default: "3 months",
    },
    numberOfTests: {
      type: Number,
      required: true,
      min: 1,
    },
    features: [
      {
        type: String,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("TestSeries", testSeriesSchema);
