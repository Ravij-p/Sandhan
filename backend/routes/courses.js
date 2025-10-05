const express = require("express");
const Course = require("../models/Course");
const Video = require("../models/Video");
const Student = require("../models/Student");
const {
  verifyToken,
  requireAdmin,
  requireStudent,
} = require("../middleware/auth");
const multer = require("multer");
const path = require("path");
const CloudflareR2Service = require("../services/cloudflareR2");

const router = express.Router();

// Test endpoint to check all courses (including inactive)
router.get("/test/all", async (req, res) => {
  try {
    console.log("Fetching ALL courses (including inactive)...");
    const allCourses = await Course.find({})
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });

    console.log(`Found ${allCourses.length} total courses`);
    res.json({
      success: true,
      totalCourses: allCourses.length,
      courses: allCourses,
    });
  } catch (error) {
    console.error("Fetch all courses error:", error);
    res.status(500).json({ error: "Failed to fetch all courses" });
  }
});

// Configure multer for memory storage (for R2 uploads)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow video files
    if (file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only video files are allowed"), false);
    }
  },
});

// Get all courses (public)
router.get("/", async (req, res) => {
  try {
    console.log("Fetching all courses...");
    const courses = await Course.find({ isActive: true })
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });

    console.log(`Found ${courses.length} courses`);
    console.log(
      "Courses data:",
      courses.map((c) => ({ id: c._id, title: c.title, isActive: c.isActive }))
    );
    res.json({
      success: true,
      courses,
    });
  } catch (error) {
    console.error("Fetch courses error:", error);
    res.status(500).json({ error: "Failed to fetch courses" });
  }
});

// Get course by ID with videos (public)
router.get("/:id", async (req, res) => {
  try {
    console.log(`Fetching course with ID: ${req.params.id}`);
    const course = await Course.findById(req.params.id).populate(
      "createdBy",
      "name"
    );

    if (!course) {
      console.log("Course not found");
      return res.status(404).json({ error: "Course not found" });
    }

    // Fetch videos separately
    const videos = await Video.find({
      course: req.params.id,
      isActive: true,
    }).sort({ order: 1 });

    console.log("Course found:", course.title);
    console.log(`Found ${videos.length} videos for this course`);

    // Add videos to the course object
    const courseWithVideos = {
      ...course.toObject(),
      videos: videos,
    };

    res.json({
      success: true,
      course: courseWithVideos,
    });
  } catch (error) {
    console.error("Fetch course error:", error);
    res.status(500).json({ error: "Failed to fetch course" });
  }
});

// Get course videos (requires authentication and enrollment)
router.get("/:id/videos", verifyToken, requireStudent, async (req, res) => {
  try {
    const courseId = req.params.id;
    const studentId = req.user._id;

    // Check if student is enrolled in this course
    const student = await Student.findById(studentId);
    const isEnrolled = student.enrolledCourses.some(
      (enrollment) =>
        enrollment.course.toString() === courseId &&
        enrollment.paymentStatus === "paid"
    );

    if (!isEnrolled) {
      return res.status(403).json({
        error:
          "Access denied. You must be enrolled in this course to view videos.",
      });
    }

    // Get course with videos
    const course = await Course.findById(courseId);
    const videos = await Video.find({
      course: courseId,
      isActive: true,
    }).sort({ order: 1 });

    res.json({
      success: true,
      course: {
        _id: course._id,
        title: course.title,
        description: course.description,
      },
      videos,
    });
  } catch (error) {
    console.error("Fetch course videos error:", error);
    res.status(500).json({ error: "Failed to fetch course videos" });
  }
});

// Get specific video with signed URL (requires authentication and enrollment)
router.get(
  "/:courseId/videos/:videoId",
  verifyToken,
  requireStudent,
  async (req, res) => {
    try {
      const { courseId, videoId } = req.params;
      const studentId = req.user._id;

      // Check if student is enrolled in this course
      const student = await Student.findById(studentId);
      const isEnrolled = student.enrolledCourses.some(
        (enrollment) =>
          enrollment.course.toString() === courseId &&
          enrollment.paymentStatus === "paid"
      );

      if (!isEnrolled) {
        return res.status(403).json({
          error:
            "Access denied. You must be enrolled in this course to view videos.",
        });
      }

      // Get video details
      const video = await Video.findOne({
        _id: videoId,
        course: courseId,
        isActive: true,
      });

      if (!video) {
        return res.status(404).json({ error: "Video not found" });
      }

      // Generate signed URL for video access
      const signedUrlResult = await CloudflareR2Service.generateSignedUrl(
        video.videoUrl,
        3600
      ); // 1 hour expiry

      if (!signedUrlResult.success) {
        return res
          .status(500)
          .json({ error: "Failed to generate video access URL" });
      }

      res.json({
        success: true,
        video: {
          _id: video._id,
          title: video.title,
          description: video.description,
          duration: video.duration,
          order: video.order,
        },
        signedUrl: signedUrlResult.signedUrl,
        expiresIn: signedUrlResult.expiresIn,
      });
    } catch (error) {
      console.error("Fetch video error:", error);
      res.status(500).json({ error: "Failed to fetch video" });
    }
  }
);

// Admin: Create new course
router.post("/", verifyToken, requireAdmin, async (req, res) => {
  try {
    console.log("Creating new course with data:", req.body);
    const { title, description, price, category, duration, features } =
      req.body;

    // Validation
    if (!title || !description || !price || !category) {
      console.log("Validation failed - missing required fields");
      return res.status(400).json({
        error: "Title, description, price, and category are required",
      });
    }

    const course = new Course({
      title,
      description,
      price,
      category,
      duration: duration || "12 months",
      features: features || [],
      createdBy: req.user._id,
    });

    console.log("Saving course to database...");
    await course.save();
    console.log("Course saved successfully with ID:", course._id);

    res.status(201).json({
      success: true,
      message: "Course created successfully",
      course,
    });
  } catch (error) {
    console.error("Create course error:", error);
    res.status(500).json({ error: "Failed to create course" });
  }
});

// Admin: Update course
router.put("/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      category,
      duration,
      features,
      isActive,
    } = req.body;

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Update fields
    if (title) course.title = title;
    if (description) course.description = description;
    if (price !== undefined) course.price = price;
    if (category) course.category = category;
    if (duration) course.duration = duration;
    if (features) course.features = features;
    if (isActive !== undefined) course.isActive = isActive;

    await course.save();

    res.json({
      success: true,
      message: "Course updated successfully",
      course,
    });
  } catch (error) {
    console.error("Update course error:", error);
    res.status(500).json({ error: "Failed to update course" });
  }
});

// Admin: Delete course
router.delete("/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Soft delete - set isActive to false
    course.isActive = false;
    await course.save();

    res.json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    console.error("Delete course error:", error);
    res.status(500).json({ error: "Failed to delete course" });
  }
});

// Admin: Add video to course
router.post(
  "/:id/videos",
  verifyToken,
  requireAdmin,
  upload.single("video"),
  async (req, res) => {
    try {
      const { title, description, duration, order, cloudinaryUrl } = req.body;
      const courseId = req.params.id;

      // Validation
      if (!title || !req.file) {
        return res
          .status(400)
          .json({ error: "Title and video file are required" });
      }

      // Support Cloudinary-hosted videos when URL is provided
      if (cloudinaryUrl) {
        const video = new Video({
          title,
          description: description || "",
          videoUrl: cloudinaryUrl,
          thumbnail: "",
          duration: duration ? parseInt(duration) : 0,
          order: order ? parseInt(order) : 0,
          course: courseId,
          createdBy: req.user._id,
        });
        await video.save();
        const course = await Course.findById(courseId);
        if (course) {
          course.videos.push(video._id);
          await course.save();
        }
        return res.status(201).json({
          success: true,
          message: "Video added from Cloudinary URL",
          video: {
            _id: video._id,
            title: video.title,
            description: video.description,
            duration: video.duration,
            order: video.order,
            course: video.course,
          },
        });
      }

      // Validate file type and size for direct uploads to R2
      if (!CloudflareR2Service.validateFileType(req.file)) {
        return res
          .status(400)
          .json({ error: "Invalid file type. Only video files are allowed." });
      }

      if (!CloudflareR2Service.validateFileSize(req.file)) {
        return res
          .status(400)
          .json({ error: "File size too large. Maximum size is 500MB." });
      }

      // Check if course exists
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }

      // Generate unique file key
      const fileKey = CloudflareR2Service.generateFileKey(
        req.file.originalname,
        `courses/${courseId}/videos`
      );

      // Upload to Cloudflare R2
      const uploadResult = await CloudflareR2Service.uploadFile(
        req.file,
        fileKey,
        req.file.mimetype
      );

      if (!uploadResult.success) {
        return res
          .status(500)
          .json({ error: "Failed to upload video: " + uploadResult.error });
      }

      // Create video record
      const video = new Video({
        title,
        description: description || "",
        videoUrl: fileKey, // Store the R2 key, not the full URL
        thumbnail: "", // Can be added later
        duration: duration ? parseInt(duration) : 0,
        order: order ? parseInt(order) : 0,
        course: courseId,
        createdBy: req.user._id,
      });

      await video.save();

      // Add video to course's videos array
      course.videos.push(video._id);
      await course.save();

      res.status(201).json({
        success: true,
        message: "Video uploaded successfully",
        video: {
          _id: video._id,
          title: video.title,
          description: video.description,
          duration: video.duration,
          order: video.order,
          course: video.course,
        },
      });
    } catch (error) {
      console.error("Add video error:", error);
      res.status(500).json({ error: "Failed to add video" });
    }
  }
);

// Admin: Update video
router.put(
  "/:courseId/videos/:videoId",
  verifyToken,
  requireAdmin,
  upload.single("thumbnail"),
  async (req, res) => {
    try {
      const { title, description, videoUrl, duration, order, isActive } =
        req.body;
      const { courseId, videoId } = req.params;

      const video = await Video.findOne({ _id: videoId, course: courseId });
      if (!video) {
        return res.status(404).json({ error: "Video not found" });
      }

      // Update fields
      if (title) video.title = title;
      if (description !== undefined) video.description = description;
      if (videoUrl) video.videoUrl = videoUrl;
      if (req.file) video.thumbnail = req.file.path;
      if (duration) video.duration = parseInt(duration);
      if (order) video.order = parseInt(order);
      if (isActive !== undefined) video.isActive = isActive;

      await video.save();

      res.json({
        success: true,
        message: "Video updated successfully",
        video,
      });
    } catch (error) {
      console.error("Update video error:", error);
      res.status(500).json({ error: "Failed to update video" });
    }
  }
);

// Admin: Delete video
router.delete(
  "/:courseId/videos/:videoId",
  verifyToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { courseId, videoId } = req.params;

      const video = await Video.findOne({ _id: videoId, course: courseId });
      if (!video) {
        return res.status(404).json({ error: "Video not found" });
      }

      // Soft delete - set isActive to false
      video.isActive = false;
      await video.save();

      // Remove video from course's videos array
      const course = await Course.findById(courseId);
      if (course) {
        course.videos = course.videos.filter(
          (vidId) => vidId.toString() !== videoId
        );
        await course.save();
      }

      res.json({
        success: true,
        message: "Video deleted successfully",
      });
    } catch (error) {
      console.error("Delete video error:", error);
      res.status(500).json({ error: "Failed to delete video" });
    }
  }
);

module.exports = router;
