const mongoose = require("mongoose");

const homepageAdSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    imageUrl: { type: String, required: true },
    redirectUrl: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true }
);

homepageAdSchema.index({ isActive: 1, order: 1 });

module.exports = mongoose.model("HomepageAd", homepageAdSchema);


