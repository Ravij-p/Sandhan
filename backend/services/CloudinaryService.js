const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

class CloudinaryService {
    constructor() {
        // Configure Cloudinary with credentials from .env
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });

        // Validate configuration
        if (!process.env.CLOUDINARY_CLOUD_NAME) {
            console.error('ERROR: CLOUDINARY_CLOUD_NAME is not set in environment variables');
        }
        if (!process.env.CLOUDINARY_API_KEY) {
            console.error('ERROR: CLOUDINARY_API_KEY is not set in environment variables');
        }
        if (!process.env.CLOUDINARY_API_SECRET) {
            console.error('ERROR: CLOUDINARY_API_SECRET is not set in environment variables');
        }
    }

    /**
     * Validate file type (only videos allowed)
     */
    validateFileType(file) {
        const allowedMimeTypes = [
            'video/mp4',
            'video/mpeg',
            'video/quicktime',
            'video/x-msvideo',
            'video/x-ms-wmv',
            'video/webm',
            'video/x-flv',
            'video/x-matroska',
        ];
        return allowedMimeTypes.includes(file.mimetype);
    }

    /**
     * Validate file size (max 500MB for free tier, adjust as needed)
     */
    validateFileSize(file) {
        const maxSize = 500 * 1024 * 1024; // 500MB in bytes
        return file.size <= maxSize;
    }

    /**
     * Upload video to Cloudinary from buffer
     */
    async uploadVideo(file, folder = 'courses/videos') {
        try {
            console.log(`Uploading video to Cloudinary: ${file.originalname}`);

            return new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        resource_type: 'video',
                        folder: folder,
                        use_filename: true,
                        unique_filename: true,
                        overwrite: false,
                        chunk_size: 6000000, // 6MB chunks for large files
                    },
                    (error, result) => {
                        if (error) {
                            console.error('Cloudinary upload error:', error);
                            reject({
                                success: false,
                                error: error.message || 'Upload failed',
                            });
                        } else {
                            console.log('Upload successful:', result.secure_url);
                            resolve({
                                success: true,
                                url: result.secure_url,
                                publicId: result.public_id,
                                format: result.format,
                                duration: result.duration,
                                width: result.width,
                                height: result.height,
                                resourceType: result.resource_type,
                            });
                        }
                    }
                );

                // Convert buffer to stream and pipe to Cloudinary
                streamifier.createReadStream(file.buffer).pipe(uploadStream);
            });
        } catch (error) {
            console.error('Cloudinary upload error:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Upload image (for thumbnails) to Cloudinary
     */
    async uploadImage(file, folder = 'courses/thumbnails') {
        try {
            console.log(`Uploading image to Cloudinary: ${file.originalname}`);

            return new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        resource_type: 'image',
                        folder: folder,
                        use_filename: true,
                        unique_filename: true,
                        overwrite: false,
                        transformation: [
                            { width: 1280, height: 720, crop: 'limit' },
                            { quality: 'auto' },
                            { fetch_format: 'auto' },
                        ],
                    },
                    (error, result) => {
                        if (error) {
                            console.error('Cloudinary image upload error:', error);
                            reject({
                                success: false,
                                error: error.message || 'Upload failed',
                            });
                        } else {
                            console.log('Image upload successful:', result.secure_url);
                            resolve({
                                success: true,
                                url: result.secure_url,
                                publicId: result.public_id,
                                format: result.format,
                                width: result.width,
                                height: result.height,
                            });
                        }
                    }
                );

                streamifier.createReadStream(file.buffer).pipe(uploadStream);
            });
        } catch (error) {
            console.error('Cloudinary image upload error:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Delete resource from Cloudinary
     */
    async deleteResource(publicId, resourceType = 'video') {
        try {
            console.log(`Deleting ${resourceType} from Cloudinary: ${publicId}`);

            const result = await cloudinary.uploader.destroy(publicId, {
                resource_type: resourceType,
            });

            if (result.result === 'ok') {
                console.log('Resource deleted successfully');
                return {
                    success: true,
                    message: 'Resource deleted successfully',
                };
            } else {
                return {
                    success: false,
                    error: 'Failed to delete resource',
                };
            }
        } catch (error) {
            console.error('Cloudinary delete error:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Get video details from Cloudinary
     */
    async getVideoDetails(publicId) {
        try {
            const result = await cloudinary.api.resource(publicId, {
                resource_type: 'video',
            });

            return {
                success: true,
                details: {
                    publicId: result.public_id,
                    url: result.secure_url,
                    duration: result.duration,
                    format: result.format,
                    width: result.width,
                    height: result.height,
                    createdAt: result.created_at,
                    bytes: result.bytes,
                },
            };
        } catch (error) {
            console.error('Get video details error:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Generate thumbnail from video
     */
    generateThumbnailUrl(publicId, options = {}) {
        const {
            width = 640,
            height = 360,
            crop = 'fill',
            gravity = 'center',
            quality = 'auto',
            format = 'jpg',
        } = options;

        return cloudinary.url(publicId, {
            resource_type: 'video',
            transformation: [
                { width, height, crop, gravity },
                { quality },
                { format },
            ],
        });
    }

    /**
     * Get optimized video URL with transformations
     */
    getOptimizedVideoUrl(publicId, options = {}) {
        const {
            quality = 'auto',
            format = 'auto',
        } = options;

        return cloudinary.url(publicId, {
            resource_type: 'video',
            transformation: [
                { quality },
                { fetch_format: format },
            ],
        });
    }

    /**
     * List videos in a folder
     */
    async listVideos(folder = 'courses/videos', maxResults = 100) {
        try {
            const result = await cloudinary.api.resources({
                resource_type: 'video',
                type: 'upload',
                prefix: folder,
                max_results: maxResults,
            });

            return {
                success: true,
                videos: result.resources,
                total: result.resources.length,
            };
        } catch (error) {
            console.error('List videos error:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }
}

// Export singleton instance
module.exports = new CloudinaryService();