const express = require("express");
const multer = require("multer");
const axios = require("axios");
const Document = require("../models/Document");
const Course = require("../models/Course");
const Student = require("../models/Student");
const { verifyToken, requireAdmin } = require("../middleware/auth");
const CloudinaryService = require("../services/cloudinaryService.js");

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

      // Upload file to Cloudinary (raw)
      const uploadResult = await CloudinaryService.uploadRaw(
        req.file,
        `courses/${courseId}/materials`
      );
      if (!uploadResult.success) {
        return res.status(500).json({ error: "Failed to upload document" });
      }

      // Create document record
      const document = new Document({
        title: title || req.file.originalname,
        description: description || "",
        fileName: uploadResult.publicId,
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

    if (req.userType !== "admin") {
      const student = await Student.findById(req.user._id);
      if (!student) return res.status(404).json({ error: "Student not found" });

      const isEnrolled = student.enrolledCourses.some(
        (e) =>
          e.course.toString() === document.course._id.toString() &&
          e.paymentStatus === "paid"
      );

      if (!isEnrolled) {
        return res.status(403).json({
          error: "You need to be enrolled in this course to download documents",
        });
      }
    }

    const downloadUrl = CloudinaryService.getRawDownloadUrl(
      document.fileName,
      document.originalName
    );

    const ext = document.originalName?.split(".").pop();
    console.log("Document download payload", {
      documentId,
      publicId: document.fileName,
      originalName: document.originalName,
      ext,
      mimeType: document.mimeType,
      downloadUrl,
    });

    if (!downloadUrl) {
      return res.status(500).json({ error: "Could not create URL" });
    }

    console.log("📦 Returning download URL to frontend:", downloadUrl);
    res.json({
      success: true,
      downloadUrl,
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

// Alias: Upload material (document) for a course
router.post(
  "/courses/:courseId/materials/upload",
  verifyToken,
  requireAdmin,
  upload.single("document"),
  async (req, res) => {
    try {
      const { courseId } = req.params;
      const { title, description, order } = req.body;
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });
      const course = await Course.findById(courseId);
      if (!course) return res.status(404).json({ error: "Course not found" });
      const uploadResult = await CloudinaryService.uploadRaw(
        req.file,
        `courses/${courseId}/materials`
      );
      if (!uploadResult.success)
        return res.status(500).json({ error: "Failed to upload material" });
      const document = await Document.create({
        title: title || req.file.originalname,
        description: description || "",
        fileName: uploadResult.publicId,
        originalName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        fileUrl: uploadResult.url,
        course: courseId,
        order: order ? parseInt(order) : 0,
        uploadedBy: req.user._id,
      });
      course.documents.push(document._id);
      await course.save();
      res.status(201).json({ success: true, material: document });
    } catch (error) {
      console.error("Upload material alias error:", error);
      res.status(500).json({ error: "Failed to upload material" });
    }
  }
);

// Alias: Get materials for a course
router.get("/courses/:courseId/materials", verifyToken, async (req, res) => {
  try {
    const { courseId } = req.params;
    const docs = await Document.find({ course: courseId, isActive: true }).sort(
      { order: 1, createdAt: 1 }
    );
    res.json({ success: true, materials: docs });
  } catch (error) {
    console.error("Fetch materials alias error:", error);
    res.status(500).json({ error: "Failed to fetch materials" });
  }
});

// Alias: Delete a material from a course
router.delete(
  "/courses/:courseId/materials/:materialId",
  verifyToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { courseId, materialId } = req.params;
      const doc = await Document.findById(materialId);
      if (!doc) return res.status(404).json({ error: "Material not found" });
      if (doc.course.toString() !== courseId) {
        return res
          .status(400)
          .json({ error: "Material does not belong to the course" });
      }
      // Delete from Cloudinary (raw)
      if (doc.fileName) {
        await CloudinaryService.deleteResource(doc.fileName, "raw");
      }
      doc.isActive = false;
      await doc.save();
      const course = await Course.findById(courseId);
      if (course) {
        course.documents = course.documents.filter(
          (d) => d.toString() !== materialId
        );
        await course.save();
      }
      res.json({ success: true, message: "Material deleted" });
    } catch (error) {
      console.error("Delete material alias error:", error);
      res.status(500).json({ error: "Failed to delete material" });
    }
  }
);

// STREAM route — server-side proxy to Cloudinary RAW
router.get("/stream/:id", verifyToken, async (req, res) => {
  try {
    const id = req.params.id;
    if (!id)
      return res
        .status(400)
        .json({ success: false, message: "Document id required" });

    const document = await Document.findById(id).populate("course");
    if (!document)
      return res
        .status(404)
        .json({ success: false, message: "Document not found" });

    if (req.userType !== "admin") {
      const student = await Student.findById(req.user._id);
      if (!student)
        return res
          .status(404)
          .json({ success: false, message: "Student not found" });
      const isEnrolled = student.enrolledCourses.some(
        (e) =>
          e.course.toString() === document.course._id.toString() &&
          e.paymentStatus === "paid"
      );
      if (!isEnrolled)
        return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const result = await CloudinaryService.findWorkingRawUrl(
      document.fileName,
      document.originalName
    );
    if (!result || !result.success) {
      return res.status(502).json({
        success: false,
        message: "Failed to construct working Cloudinary URL",
        diagnostics: result?.diagnostics,
      });
    }

    const cloudResp = await axios.get(result.url, {
      responseType: "stream",
      validateStatus: null,
    });
    if (!cloudResp || cloudResp.status !== 200) {
      return res.status(502).json({
        success: false,
        message: "Failed to fetch file from Cloudinary",
        cloudinaryStatus: cloudResp?.status,
        cloudinaryMessage: cloudResp?.statusText,
      });
    }

    const filename = document.originalName || "download";
    const mimeType = document.mimeType || "application/octet-stream";
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", mimeType);

    cloudResp.data.pipe(res);
  } catch (err) {
    console.error(
      "Stream download error:",
      err && err.message ? err.message : err
    );
    if (!res.headersSent)
      res
        .status(500)
        .json({ success: false, message: "Server error streaming file" });
  }
});

module.exports = router;
