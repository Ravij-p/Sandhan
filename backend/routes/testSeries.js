const express = require("express");
const multer = require("multer");
const TestSeries = require("../models/TestSeries");
const Payment = require("../models/Payment");
const { verifyToken, requireAdmin } = require("../middleware/auth");
const { uploadToR2 } = require("../services/cloudflareR2");

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// Get all test series (public)
router.get("/", async (req, res) => {
  try {
    console.log("Fetching all test series...");
    const testSeries = await TestSeries.find({ isActive: true })
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });

    console.log(`Found ${testSeries.length} test series`);
    res.json({
      success: true,
      testSeries,
    });
  } catch (error) {
    console.error("Fetch test series error:", error);
    res.status(500).json({ error: "Failed to fetch test series" });
  }
});

// Get test series by ID (public)
router.get("/:id", async (req, res) => {
  try {
    console.log(`Fetching test series with ID: ${req.params.id}`);
    const testSeries = await TestSeries.findById(req.params.id).populate(
      "createdBy",
      "name"
    );

    if (!testSeries) {
      console.log("Test series not found");
      return res.status(404).json({ error: "Test series not found" });
    }

    console.log("Test series found:", testSeries.title);
    res.json({
      success: true,
      testSeries,
    });
  } catch (error) {
    console.error("Fetch test series error:", error);
    res.status(500).json({ error: "Failed to fetch test series" });
  }
});

// Admin: Create new test series
router.post("/", verifyToken, requireAdmin, async (req, res) => {
  try {
    console.log("Creating new test series...");
    const {
      title,
      description,
      price,
      category,
      duration,
      numberOfTests,
      features,
    } = req.body;

    // Validation
    if (!title || !description || !price || !category || !numberOfTests) {
      console.log("Validation failed - missing required fields");
      return res.status(400).json({
        error:
          "Title, description, price, category, and number of tests are required",
      });
    }

    const testSeries = new TestSeries({
      title,
      description,
      price: parseFloat(price),
      category,
      duration: duration || "3 months",
      numberOfTests: parseInt(numberOfTests),
      features: features || [],
      createdBy: req.user._id,
    });

    await testSeries.save();
    console.log("Test series created successfully:", testSeries.title);

    res.status(201).json({
      success: true,
      message: "Test series created successfully",
      testSeries,
    });
  } catch (error) {
    console.error("Create test series error:", error);
    res.status(500).json({ error: "Failed to create test series" });
  }
});

// Admin: Update test series
router.put("/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      category,
      duration,
      numberOfTests,
      features,
    } = req.body;

    const testSeries = await TestSeries.findById(req.params.id);
    if (!testSeries) {
      return res.status(404).json({ error: "Test series not found" });
    }

    testSeries.title = title || testSeries.title;
    testSeries.description = description || testSeries.description;
    testSeries.price = price ? parseFloat(price) : testSeries.price;
    testSeries.category = category || testSeries.category;
    testSeries.duration = duration || testSeries.duration;
    testSeries.numberOfTests = numberOfTests
      ? parseInt(numberOfTests)
      : testSeries.numberOfTests;
    testSeries.features = features || testSeries.features;

    await testSeries.save();

    res.json({
      success: true,
      message: "Test series updated successfully",
      testSeries,
    });
  } catch (error) {
    console.error("Update test series error:", error);
    res.status(500).json({ error: "Failed to update test series" });
  }
});

// Admin: Delete test series
router.delete("/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    const testSeries = await TestSeries.findById(req.params.id);
    if (!testSeries) {
      return res.status(404).json({ error: "Test series not found" });
    }

    // Soft delete
    testSeries.isActive = false;
    await testSeries.save();

    res.json({
      success: true,
      message: "Test series deleted successfully",
    });
  } catch (error) {
    console.error("Delete test series error:", error);
    res.status(500).json({ error: "Failed to delete test series" });
  }
});

// Admin: Get all test series (including inactive)
router.get("/admin/all", verifyToken, requireAdmin, async (req, res) => {
  try {
    const testSeries = await TestSeries.find({})
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      testSeries,
    });
  } catch (error) {
    console.error("Fetch admin test series error:", error);
    res.status(500).json({ error: "Failed to fetch test series" });
  }
});

module.exports = router;
