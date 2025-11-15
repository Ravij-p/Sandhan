const express = require("express");
const Course = require("../models/Course");
const Video = require("../models/Video");
const Student = require("../models/Student");
const Document = require("../models/Document");
const {
  verifyToken,
  requireAdmin,
  requireStudent,
} = require("../middleware/auth");
const multer = require("multer");
const CloudinaryService = require("../services/cloudinaryService");

const router = express.Router();

// Configure multer for memory storage
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

// Get all courses (public)
router.get("/", async (req, res) => {
  try {
    console.log("Fetching all courses...");
    const courses = await Course.find({ isActive: true })
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });

    console.log(`Found ${courses.length} courses`);
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
    const userId = req.user._id;
    const userType = req.userType;

    // Admin has access to all courses
    if (userType === "admin") {
      const course = await Course.findById(courseId);
      const videos = await Video.find({
        course: courseId,
        isActive: true,
      }).sort({ order: 1 });

      return res.json({
        success: true,
        course: {
          _id: course._id,
          title: course.title,
          description: course.description,
        },
        videos,
      });
    }

    // Check if student is enrolled in this course
    const student = await Student.findById(userId);
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

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
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

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

// Get course materials (requires authentication and enrollment)
router.get("/:id/materials", verifyToken, requireStudent, async (req, res) => {
  try {
    const courseId = req.params.id;
    const userId = req.user._id;

    if (req.userType !== "admin") {
      const student = await Student.findById(userId);
      if (!student) return res.status(404).json({ error: "Student not found" });
      const isEnrolled = student.enrolledCourses.some(
        (e) => e.course.toString() === courseId && e.paymentStatus === "paid"
      );
      if (!isEnrolled) {
        return res.status(403).json({ error: "Access denied" });
      }
    }

    const materials = await Document.find({ course: courseId, isActive: true })
      .sort({ order: 1, createdAt: 1 })
      .select("title description mimeType originalName fileUrl");

    res.json({ success: true, materials });
  } catch (error) {
    console.error("Fetch course materials error:", error);
    res.status(500).json({ error: "Failed to fetch course materials" });
  }
});

// Get specific video (requires authentication and enrollment)
router.get(
  "/:courseId/videos/:videoId",
  verifyToken,
  requireStudent,
  async (req, res) => {
    try {
      const { courseId, videoId } = req.params;
      const userId = req.user._id;
      const userType = req.userType;

      // Admin has access to all videos
      if (userType === "admin") {
        const video = await Video.findOne({
          _id: videoId,
          course: courseId,
          isActive: true,
        });

        if (!video) {
          return res.status(404).json({ error: "Video not found" });
        }

        return res.json({
          success: true,
          video: {
            _id: video._id,
            title: video.title,
            description: video.description,
            duration: video.duration,
            order: video.order,
            videoUrl: video.videoUrl,
            thumbnail: video.thumbnail,
          },
        });
      }

      // Check if student is enrolled in this course
      const student = await Student.findById(userId);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }

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

      // Return video with Cloudinary URL (already public)
      res.json({
        success: true,
        video: {
          _id: video._id,
          title: video.title,
          description: video.description,
          duration: video.duration,
          order: video.order,
          videoUrl: video.videoUrl, // Cloudinary URL
          thumbnail: video.thumbnail,
        },
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

// Admin: Add material (video/pdf) to course
router.post("/:id/materials", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { title, fileUrl, fileType } = req.body;
    const courseId = req.params.id;

    if (!title || !fileUrl || !fileType) {
      return res
        .status(400)
        .json({ error: "title, fileUrl and fileType are required" });
    }
    if (!["video", "pdf"].includes(fileType)) {
      return res.status(400).json({ error: "fileType must be video or pdf" });
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: "Course not found" });

    course.materials.push({ title, fileUrl, fileType });
    await course.save();

    res.status(201).json({ success: true, materials: course.materials });
  } catch (error) {
    console.error("Add material error:", error);
    res.status(500).json({ error: "Failed to add material" });
  }
});

// Admin: Set/Update course payment details
router.put("/:id/payment", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { amount, upiLink, qrCode } = req.body;
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: "Course not found" });

    if (!course.payment) course.payment = {};
    if (amount !== undefined) course.payment.amount = amount;
    if (upiLink !== undefined) course.payment.upiLink = upiLink;
    if (qrCode !== undefined) course.payment.qrCode = qrCode;

    await course.save();
    res.json({ success: true, payment: course.payment });
  } catch (error) {
    console.error("Update payment error:", error);
    res.status(500).json({ error: "Failed to update payment details" });
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
      const { title, description, duration, order } = req.body;
      const courseId = req.params.id;

      // Validation
      if (!title || !req.file) {
        return res
          .status(400)
          .json({ error: "Title and video file are required" });
      }

      // Validate file type and size
      if (!CloudinaryService.validateFileType(req.file)) {
        return res
          .status(400)
          .json({ error: "Invalid file type. Only video files are allowed." });
      }

      if (!CloudinaryService.validateFileSize(req.file)) {
        return res
          .status(400)
          .json({ error: "File size too large. Maximum size is 500MB." });
      }

      // Check if course exists
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }

      // Upload to Cloudinary
      const uploadResult = await CloudinaryService.uploadVideo(
        req.file,
        `courses/${courseId}/videos`
      );

      if (!uploadResult.success) {
        return res
          .status(500)
          .json({ error: "Failed to upload video: " + uploadResult.error });
      }

      // Generate thumbnail URL from Cloudinary
      const thumbnailUrl = CloudinaryService.generateThumbnailUrl(
        uploadResult.publicId
      );

      // Create video record
      const video = new Video({
        title,
        description: description || "",
        videoUrl: uploadResult.url,
        thumbnail: thumbnailUrl,
        duration: duration ? parseInt(duration) : uploadResult.duration || 0,
        order: order ? parseInt(order) : 0,
        course: courseId,
        createdBy: req.user._id,
        cloudinaryPublicId: uploadResult.publicId, // Store for deletion later
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
          videoUrl: video.videoUrl,
          thumbnail: video.thumbnail,
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
      const { title, description, duration, order, isActive } = req.body;
      const { courseId, videoId } = req.params;

      const video = await Video.findOne({ _id: videoId, course: courseId });
      if (!video) {
        return res.status(404).json({ error: "Video not found" });
      }

      // Update fields
      if (title) video.title = title;
      if (description !== undefined) video.description = description;
      if (duration) video.duration = parseInt(duration);
      if (order) video.order = parseInt(order);
      if (isActive !== undefined) video.isActive = isActive;

      // Upload new thumbnail if provided
      if (req.file) {
        const uploadResult = await CloudinaryService.uploadImage(
          req.file,
          `courses/${courseId}/thumbnails`
        );
        if (uploadResult.success) {
          video.thumbnail = uploadResult.url;
        }
      }

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

      // Delete from Cloudinary if publicId exists
      if (video.cloudinaryPublicId) {
        await CloudinaryService.deleteResource(
          video.cloudinaryPublicId,
          "video"
        );
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

// Save student video progress
router.patch(
  "/:courseId/videos/:videoId/progress",
  verifyToken,
  requireStudent,
  async (req, res) => {
    try {
      const { courseId, videoId } = req.params;
      const { timestamp } = req.body;

      if (timestamp === undefined || Number.isNaN(Number(timestamp))) {
        return res.status(400).json({ error: "Timestamp is required" });
      }

      const student = await Student.findById(req.user._id);
      if (!student) return res.status(404).json({ error: "Student not found" });

      const isEnrolled = student.enrolledCourses.some(
        (e) => e.course.toString() === courseId && e.paymentStatus === "paid"
      );
      if (!isEnrolled) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Support both Mongoose Map and plain object
      if (
        student.watchedProgress &&
        typeof student.watchedProgress.set === "function"
      ) {
        student.watchedProgress.set(videoId, Number(timestamp));
      } else {
        student.watchedProgress = student.watchedProgress || {};
        student.watchedProgress[videoId] = Number(timestamp);
      }

      await student.save();

      res.json({ success: true, message: "Progress saved" });
    } catch (error) {
      console.error("Save progress error:", error);
      res.status(500).json({ error: "Failed to save progress" });
    }
  }
);

module.exports = router;
