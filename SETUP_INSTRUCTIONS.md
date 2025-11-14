# Tushti IAS App Upgrade - Setup Instructions

## Overview
Your Tushti IAS App has been upgraded with the following new features:

### New Features Added:
1. **Student Authentication System**
   - Student registration and login
   - JWT-based authentication
   - Protected routes for course access

2. **Admin Dashboard**
   - Admin login system
   - Course management (create, update, delete)
   - Video management (upload, organize)
   - Student enrollment tracking
   - Payment analytics

3. **Enhanced Course System**
   - Video lecture system
   - Course enrollment tracking
   - Access control (only enrolled students can watch videos)

4. **Improved Payment Integration**
   - New payment flow with student enrollment
   - Automatic course access after payment
   - Better payment tracking

## Backend Setup

### 1. Install New Dependencies
```bash
cd backend
npm install bcryptjs jsonwebtoken multer
```

### 2. Environment Variables
Create a `.env` file in the backend directory with:
```env
# Database
MONGO_URI=mongodb://localhost:27017/trushtiias_app

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_here

# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_SECRET=your_razorpay_secret

# Server Configuration
PORT=5000
NODE_ENV=development
```

### 3. Create Uploads Directory
```bash
mkdir backend/uploads
```

### 4. Start Backend Server
```bash
cd backend
npm start
```

## Frontend Setup

### 1. Install New Dependencies
```bash
cd frontend
npm install axios
```

### 2. Environment Variables
Create a `.env` file in the frontend directory with:
```env
REACT_APP_API_BASE_URL=http://localhost:5000/api
```

### 3. Start Frontend Server
```bash
cd frontend
npm start
```

## Initial Admin Setup

### 1. Create Admin Account
After starting the backend server, make a POST request to create the first admin:

```bash
curl -X POST http://localhost:5000/api/admin/create-admin \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin Name",
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

### 2. Login as Admin
Use the admin credentials to login at `/admin` route.

## Database Models

### New Models Created:
1. **Student** - Student accounts with enrollment tracking
2. **Admin** - Admin accounts for course management
3. **Course** - Course information and metadata
4. **Video** - Video lectures linked to courses
5. **User** - Updated legacy model for backward compatibility

## API Endpoints

### Authentication
- `POST /api/auth/student/register` - Student registration
- `POST /api/auth/student/login` - Student login
- `POST /api/auth/admin/login` - Admin login
- `GET /api/auth/profile` - Get current user profile

### Courses
- `GET /api/courses` - Get all courses
- `GET /api/courses/:id` - Get course details
- `GET /api/courses/:id/videos` - Get course videos (requires enrollment)
- `POST /api/courses` - Create course (admin only)
- `PUT /api/courses/:id` - Update course (admin only)
- `DELETE /api/courses/:id` - Delete course (admin only)

### Videos
- `POST /api/courses/:id/videos` - Add video to course (admin only)
- `PUT /api/courses/:courseId/videos/:videoId` - Update video (admin only)
- `DELETE /api/courses/:courseId/videos/:videoId` - Delete video (admin only)

### Payments
- `POST /api/payments/create-order` - Create payment order
- `POST /api/payments/verify-payment` - Verify payment and enroll student
- `GET /api/payments/enrollments` - Get student enrollments

### Admin
- `GET /api/admin/dashboard` - Get dashboard statistics
- `GET /api/admin/students` - Get all students
- `GET /api/admin/courses` - Get all courses with video counts
- `GET /api/admin/videos` - Get all videos
- `GET /api/admin/payments` - Get payment history

## Frontend Routes

### Public Routes
- `/` - Home page
- `/about` - About page
- `/gpsc`, `/upsc`, etc. - Course pages

### Student Routes (Protected)
- `/dashboard` - Student dashboard
- `/course/:courseId` - Course content with videos

### Admin Routes (Protected)
- `/admin` - Admin dashboard

## Security Features

1. **JWT Authentication** - Secure token-based authentication
2. **Route Protection** - Protected routes for students and admins
3. **Access Control** - Only enrolled students can access course videos
4. **Admin Authorization** - Admin-only endpoints for course management

## File Structure

```
backend/
├── models/
│   ├── Student.js (new)
│   ├── Admin.js (new)
│   ├── Course.js (new)
│   ├── Video.js (new)
│   └── User.js (updated)
├── routes/
│   ├── auth.js (new)
│   ├── courses.js (new)
│   ├── admin.js (new)
│   └── payments.js (new)
├── middleware/
│   └── auth.js (new)
└── uploads/ (new)

frontend/
├── src/
│   ├── context/
│   │   └── AuthContext.js (new)
│   ├── components/
│   │   ├── auth/ (new)
│   │   ├── student/ (new)
│   │   ├── admin/ (new)
│   │   └── ProtectedRoute.js (new)
│   └── App.js (updated)
```

## Testing the System

1. **Student Flow:**
   - Register a new student account
   - Login and access dashboard
   - Enroll in a course (payment integration)
   - Access course videos

2. **Admin Flow:**
   - Login as admin
   - Create new courses
   - Add videos to courses
   - View student enrollments and analytics

## Migration Notes

- Existing payment data is preserved in the legacy User model
- New payments will create both User and Student records
- Course pages maintain backward compatibility
- All existing functionality continues to work

## Troubleshooting

1. **Database Connection Issues:**
   - Ensure MongoDB is running
   - Check MONGO_URI in .env file

2. **Authentication Issues:**
   - Verify JWT_SECRET is set
   - Check token expiration (7 days default)

3. **File Upload Issues:**
   - Ensure uploads directory exists
   - Check file permissions

4. **Payment Issues:**
   - Verify Razorpay credentials
   - Check payment verification logic

## Next Steps

1. Set up your environment variables
2. Install dependencies
3. Create admin account
4. Test student registration and course enrollment
5. Add your first course and videos through admin panel

The system is now ready for production use with proper authentication, course management, and video delivery!
