const AWS = require('aws-sdk');

// Configure AWS SDK for Cloudflare R2
const r2 = new AWS.S3({
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  region: 'auto',
  signatureVersion: 'v4',
});

const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME;

class CloudflareR2Service {
  // Upload file to R2
  static async uploadFile(file, key, contentType) {
    try {
      const params = {
        Bucket: BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: contentType,
        ACL: 'private', // Make files private by default
      };

      const result = await r2.upload(params).promise();
      return {
        success: true,
        key: result.Key,
        location: result.Location,
        url: result.Location,
      };
    } catch (error) {
      console.error('R2 upload error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Generate signed URL for private file access
  static async generateSignedUrl(key, expiresIn = 3600) {
    try {
      const params = {
        Bucket: BUCKET_NAME,
        Key: key,
        Expires: expiresIn, // URL expires in 1 hour by default
      };

      const signedUrl = await r2.getSignedUrlPromise('getObject', params);
      return {
        success: true,
        signedUrl,
        expiresIn,
      };
    } catch (error) {
      console.error('R2 signed URL error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Delete file from R2
  static async deleteFile(key) {
    try {
      const params = {
        Bucket: BUCKET_NAME,
        Key: key,
      };

      await r2.deleteObject(params).promise();
      return {
        success: true,
        message: 'File deleted successfully',
      };
    } catch (error) {
      console.error('R2 delete error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Check if file exists
  static async fileExists(key) {
    try {
      const params = {
        Bucket: BUCKET_NAME,
        Key: key,
      };

      await r2.headObject(params).promise();
      return true;
    } catch (error) {
      if (error.statusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  // Get file metadata
  static async getFileMetadata(key) {
    try {
      const params = {
        Bucket: BUCKET_NAME,
        Key: key,
      };

      const result = await r2.headObject(params).promise();
      return {
        success: true,
        metadata: {
          size: result.ContentLength,
          contentType: result.ContentType,
          lastModified: result.LastModified,
          etag: result.ETag,
        },
      };
    } catch (error) {
      console.error('R2 metadata error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // List files in a directory
  static async listFiles(prefix = '', maxKeys = 1000) {
    try {
      const params = {
        Bucket: BUCKET_NAME,
        Prefix: prefix,
        MaxKeys: maxKeys,
      };

      const result = await r2.listObjectsV2(params).promise();
      return {
        success: true,
        files: result.Contents.map(file => ({
          key: file.Key,
          size: file.Size,
          lastModified: file.LastModified,
          etag: file.ETag,
        })),
        isTruncated: result.IsTruncated,
      };
    } catch (error) {
      console.error('R2 list files error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Generate unique file key
  static generateFileKey(originalName, prefix = '') {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split('.').pop();
    const fileName = `${timestamp}_${randomString}.${extension}`;
    
    return prefix ? `${prefix}/${fileName}` : fileName;
  }

  // Validate file type
  static validateFileType(file, allowedTypes = ['video/mp4', 'video/webm', 'video/avi', 'video/mov']) {
    return allowedTypes.includes(file.mimetype);
  }

  // Validate file size (in bytes)
  static validateFileSize(file, maxSize = 500 * 1024 * 1024) { // 500MB default
    return file.size <= maxSize;
  }
}

module.exports = CloudflareR2Service;
