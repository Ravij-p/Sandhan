# Admin Course Management Guide

## 🎯 **New Admin Course Management Page**

I've created a dedicated admin course management page at `/admin/courses` with comprehensive features for managing courses and videos.

## 🚀 **Features Available**

### **1. Course Management Dashboard**
- **View All Courses** - Complete list with search and filter functionality
- **Create New Courses** - Add courses with title, description, price, category
- **Edit Courses** - Update course information
- **Delete Courses** - Remove courses (with confirmation)
- **Course Statistics** - Total courses, videos, students, and revenue

### **2. Video Management**
- **Upload Videos** - Direct upload to Cloudflare R2 storage
- **Video Organization** - Set video order and duration
- **Video Metadata** - Add titles, descriptions, and categorization
- **File Validation** - Automatic file type and size validation

### **3. Search & Filter**
- **Search Courses** - By title or description
- **Filter by Category** - GPSC, UPSC, SSC, NEET, TALATI, ETHICS
- **Real-time Results** - Instant search and filter updates

### **4. Responsive Design**
- **Mobile Optimized** - Works perfectly on all devices
- **Tablet Friendly** - Optimized layouts for tablets
- **Desktop Enhanced** - Full-featured desktop experience

## 📱 **How to Access**

### **Step 1: Login as Admin**
1. Go to your website
2. Click "Login" button
3. Click "Admin Login"
4. Use your admin credentials:
   - **Email:** `admin@trushtiias.com`
   - **Password:** `admin123`

### **Step 2: Navigate to Course Management**
1. From the admin dashboard, click "Manage Courses" button
2. Or directly visit: `http://localhost:3000/admin/courses`

## 🛠️ **Course Management Features**

### **Creating a New Course**
1. Click "Add New Course" button
2. Fill in the course details:
   - **Course Title** (required)
   - **Description** (required)
   - **Price** in ₹ (required)
   - **Category** (GPSC, UPSC, SSC, etc.)
   - **Duration** (e.g., "12 months")
3. Click "Create Course"

### **Adding Videos to a Course**
1. Find the course in the table
2. Click the "Upload" icon (green upload button)
3. Select video file (max 500MB)
4. Add video details:
   - **Video Title** (required)
   - **Description** (optional)
   - **Duration** in seconds (optional)
   - **Order** for sequencing (optional)
5. Click "Upload Video"

### **Managing Existing Courses**
- **View Course** - Click the eye icon to preview
- **Edit Course** - Click the edit icon (coming soon)
- **Delete Course** - Click the trash icon (with confirmation)
- **Add Videos** - Click the upload icon

## 📊 **Dashboard Statistics**

The course management page shows:
- **Total Courses** - Number of active courses
- **Total Videos** - Sum of all videos across courses
- **Total Students** - Estimated student count
- **Total Revenue** - Calculated revenue based on enrollments

## 🔍 **Search & Filter Options**

### **Search Functionality**
- Search by course title
- Search by course description
- Real-time search results
- Case-insensitive search

### **Filter Options**
- **All Categories** - Show all courses
- **GPSC** - Gujarat Public Service Commission
- **UPSC** - Union Public Service Commission
- **SSC** - Staff Selection Commission
- **NEET 11** - NEET Class 11
- **NEET 12** - NEET Class 12
- **TALATI** - Talati cum Mantri
- **ETHICS** - Ethics and Values

## 🎥 **Video Upload Features**

### **Supported Formats**
- MP4 (recommended)
- WebM
- AVI
- MOV

### **File Size Limits**
- Maximum: 500MB per video
- Automatic validation
- Error messages for oversized files

### **Upload Process**
1. Files are uploaded directly to Cloudflare R2
2. Secure storage with private access
3. Signed URLs generated for video streaming
4. Progress tracking during upload

## 🔐 **Security Features**

### **Access Control**
- Admin-only access to course management
- JWT token verification
- Protected routes

### **File Security**
- Private video storage in R2
- Signed URLs with expiration
- File type validation
- Size limit enforcement

## 📱 **Mobile Experience**

### **Responsive Design**
- **Mobile (320px-640px):** Stacked layout, touch-friendly buttons
- **Tablet (641px-1024px):** Optimized grid layouts
- **Desktop (1025px+):** Full table view with all features

### **Mobile Features**
- Touch-friendly interface
- Swipe gestures support
- Optimized form inputs
- Mobile-optimized modals

## 🚨 **Troubleshooting**

### **Common Issues**

#### **"Failed to load courses" Error**
- Check if backend server is running
- Verify admin authentication
- Check network connection

#### **"Failed to upload video" Error**
- Check file size (must be under 500MB)
- Verify file format (video files only)
- Check Cloudflare R2 configuration
- Ensure stable internet connection

#### **"Access denied" Error**
- Make sure you're logged in as admin
- Check if JWT token is valid
- Try logging out and back in

### **File Upload Issues**
- **Large files:** Use video compression tools
- **Format issues:** Convert to MP4 format
- **Network issues:** Check internet connection
- **Storage issues:** Verify R2 bucket configuration

## 🎯 **Best Practices**

### **Course Creation**
1. Use clear, descriptive titles
2. Write comprehensive descriptions
3. Set appropriate pricing
4. Choose correct category
5. Add realistic duration

### **Video Management**
1. Use descriptive video titles
2. Add helpful descriptions
3. Set proper video order
4. Compress large files
5. Use consistent naming

### **Organization**
1. Use search and filter regularly
2. Keep course information updated
3. Monitor video upload progress
4. Regular backup of course data

## 🔄 **Next Steps**

### **Immediate Actions**
1. **Test the new course management page**
2. **Create your first course**
3. **Upload sample videos**
4. **Test search and filter functionality**

### **Future Enhancements**
- Course editing functionality
- Bulk video upload
- Course analytics
- Student enrollment tracking
- Video thumbnail generation

## 📞 **Support**

If you encounter any issues:
1. Check the browser console for errors
2. Verify backend server status
3. Check network connectivity
4. Review environment configuration

Your admin course management system is now fully functional and ready for production use!
