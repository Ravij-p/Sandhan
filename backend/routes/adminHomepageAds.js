const express = require("express");
const { verifyToken, requireAdmin } = require("../middleware/auth");
const HomepageAd = require("../models/HomepageAd");

const router = express.Router();

// Admin: Create or update ad
router.post("/", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id, title, description, imageUrl, redirectUrl, isActive, order } = req.body;
    let ad;
    if (id) {
      ad = await HomepageAd.findById(id);
      if (!ad) return res.status(404).json({ error: "Ad not found" });
      if (title !== undefined) ad.title = title;
      if (description !== undefined) ad.description = description;
      if (imageUrl !== undefined) ad.imageUrl = imageUrl;
      if (redirectUrl !== undefined) ad.redirectUrl = redirectUrl;
      if (isActive !== undefined) ad.isActive = isActive;
      if (order !== undefined) ad.order = order;
      await ad.save();
    } else {
      ad = await HomepageAd.create({
        title,
        description: description || "",
        imageUrl,
        redirectUrl,
        isActive: isActive !== undefined ? isActive : true,
        order: order || 0,
        createdBy: req.user._id,
      });
    }
    res.json({ success: true, ad });
  } catch (e) {
    res.status(500).json({ error: "Failed to save ad" });
  }
});

// Admin: List all ads
router.get("/", verifyToken, requireAdmin, async (req, res) => {
  try {
    const ads = await HomepageAd.find({}).sort({ order: 1, createdAt: -1 });
    res.json({ success: true, ads });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch ads" });
  }
});

// Public: Active ads
router.get("/public/active", async (req, res) => {
  try {
    const ads = await HomepageAd.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
    res.json({ success: true, ads });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch ads" });
  }
});

module.exports = router;


