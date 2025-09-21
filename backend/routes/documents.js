const express = require("express");
const multer = require("multer");
const Document = require("../models/Document");
const Course = require("../models/Course");
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

// Admin: Upload document for course
router.post(
  "/courses/:courseId",
  verifyToken,
  requireAdmin,
  upload.single("document"),
  async (req, res) => {
    try {
      const { courseId } = req.params;
      const { title, description, order } = req.body;

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Validate course exists
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }

      // Upload file to R2
      const uploadResult = await uploadToR2(
        req.file.buffer,
        `documents/${courseId}/${Date.now()}-${req.file.originalname}`,
        req.file.mimetype
      );

      // Create document record
      const document = new Document({
        title: title || req.file.originalname,
        description: description || "",
        fileName: uploadResult.key,
        originalName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        fileUrl: uploadResult.url,
        course: courseId,
        order: order ? parseInt(order) : 0,
        uploadedBy: req.user._id,
      });

      await document.save();

      // Add document to course's documents array
      course.documents.push(document._id);
      await course.save();

      res.status(201).json({
        success: true,
        message: "Document uploaded successfully",
        document: {
          _id: document._id,
          title: document.title,
          description: document.description,
          originalName: document.originalName,
          fileSize: document.fileSize,
          mimeType: document.mimeType,
          order: document.order,
          course: document.course,
        },
      });
    } catch (error) {
      console.error("Upload document error:", error);
      res.status(500).json({ error: "Failed to upload document" });
    }
  }
);

// Get documents for a course (authenticated users only)
router.get("/courses/:courseId", verifyToken, async (req, res) => {
  try {
    const { courseId } = req.params;
    const documents = await Document.find({
      course: courseId,
      isActive: true,
    })
      .sort({ order: 1, createdAt: 1 })
      .populate("uploadedBy", "name");

    res.json({
      success: true,
      documents,
    });
  } catch (error) {
    console.error("Fetch documents error:", error);
    res.status(500).json({ error: "Failed to fetch documents" });
  }
});

// Get signed URL for document download
router.get("/:documentId/download", verifyToken, async (req, res) => {
  try {
    const { documentId } = req.params;
    const document = await Document.findById(documentId).populate("course");

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Check if user is enrolled in the course
    const Payment = require("../models/Payment");
    const enrollment = await Payment.findOne({
      student: req.user._id,
      course: document.course._id,
      status: "completed",
    });

    if (!enrollment) {
      return res.status(403).json({
        error: "You need to be enrolled in this course to download documents",
      });
    }

    // Generate signed URL for download
    const { generateSignedUrl } = require("../services/cloudflareR2");
    const signedUrl = await generateSignedUrl(document.fileName, 3600); // 1 hour expiry

    res.json({
      success: true,
      downloadUrl: signedUrl,
      document: {
        title: document.title,
        originalName: document.originalName,
        fileSize: document.fileSize,
        mimeType: document.mimeType,
      },
    });
  } catch (error) {
    console.error("Generate download URL error:", error);
    res.status(500).json({ error: "Failed to generate download URL" });
  }
});

// Admin: Delete document
router.delete("/:documentId", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { documentId } = req.params;
    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Soft delete
    document.isActive = false;
    await document.save();

    // Remove from course's documents array
    const course = await Course.findById(document.course);
    if (course) {
      course.documents = course.documents.filter(
        (docId) => docId.toString() !== documentId
      );
      await course.save();
    }

    res.json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("Delete document error:", error);
    res.status(500).json({ error: "Failed to delete document" });
  }
});

// Admin: Update document
router.put("/:documentId", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { documentId } = req.params;
    const { title, description, order } = req.body;

    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    document.title = title || document.title;
    document.description = description || document.description;
    document.order = order ? parseInt(order) : document.order;

    await document.save();

    res.json({
      success: true,
      message: "Document updated successfully",
      document,
    });
  } catch (error) {
    console.error("Update document error:", error);
    res.status(500).json({ error: "Failed to update document" });
  }
});

module.exports = router;
