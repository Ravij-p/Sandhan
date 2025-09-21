const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    videoUrl: {
      type: String,
      required: true,
    },
    thumbnail: {
      type: String,
      default: "",
    },
    duration: {
      type: Number, // in seconds
      default: 0,
    },
    order: {
      type: Number,
      default: 0,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
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

// Index for efficient querying
videoSchema.index({ course: 1, order: 1 });

module.exports = mongoose.model("Video", videoSchema);
