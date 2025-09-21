# Admin Setup Guide - Sandhan App

## 🔐 Admin Credentials Setup

### Step 1: Start the Backend Server
```bash
cd backend
npm start
```

### Step 2: Create Admin Account
You can create the admin account using any of these methods:

#### Method 1: Using curl (Command Line)
```bash
curl -X POST http://localhost:5000/api/admin/create-admin \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin Name",
    "email": "admin@sandhan.com",
    "password": "admin123"
  }'
```

#### Method 2: Using Postman
1. Open Postman
2. Create a new POST request
3. URL: `http://localhost:5000/api/admin/create-admin`
4. Headers: `Content-Type: application/json`
5. Body (raw JSON):
```json
{
  "name": "Admin Name",
  "email": "admin@sandhan.com",
  "password": "admin123"
}
```

#### Method 3: Using Browser Console
```javascript
fetch('http://localhost:5000/api/admin/create-admin', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Admin Name',
    email: 'admin@sandhan.com',
    password: 'admin123'
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

### Step 3: Your Admin Credentials
After successful creation, your admin credentials will be:

- **Email:** `admin@sandhan.com`
- **Password:** `admin123`
- **Role:** `super_admin`

### Step 4: Login as Admin
1. Start your frontend server: `cd frontend && npm start`
2. Go to `http://localhost:3000`
3. Click "Login" button
4. Click "Admin Login"
5. Enter your credentials:
   - Email: `admin@sandhan.com`
   - Password: `admin123`

## 🎯 Admin Features Available

### Dashboard
- View total students, courses, videos, and revenue
- Recent enrollments overview
- Course performance analytics

### Course Management
- Create new courses
- Update course details
- Delete courses (soft delete)
- Add videos to courses
- Organize video order

### Student Management
- View all registered students
- Track student enrollments
- View student details and progress

### Video Management
- Upload video files
- Add video descriptions
- Set video duration
- Organize videos by course

### Payment Analytics
- View payment history
- Track revenue by course
- Export payment reports

## 🔧 Customizing Admin Credentials

You can change the admin credentials by modifying the curl request:

```bash
curl -X POST http://localhost:5000/api/admin/create-admin \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Your Name",
    "email": "your-email@example.com",
    "password": "your-secure-password"
  }'
```

**Important Notes:**
- Password must be at least 6 characters
- Email must be unique
- Only one admin account can be created initially
- After creation, use the login endpoint for future access

## 🚨 Security Best Practices

1. **Change Default Password:** Immediately change the default password after first login
2. **Use Strong Password:** Use a combination of letters, numbers, and symbols
3. **Secure Email:** Use a secure email address for admin account
4. **Environment Variables:** Store sensitive data in environment variables
5. **HTTPS:** Use HTTPS in production environment

## 🛠️ Troubleshooting

### "Admin account already exists" Error
This means an admin account has already been created. Use the login endpoint instead:
```bash
curl -X POST http://localhost:5000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@sandhan.com",
    "password": "admin123"
  }'
```

### "Failed to create admin account" Error
1. Check if backend server is running
2. Verify database connection
3. Check server logs for detailed error messages

### Login Issues
1. Verify credentials are correct
2. Check if account exists in database
3. Ensure JWT_SECRET is set in environment variables

## 📱 Mobile Responsive Features

The admin dashboard is fully responsive and works on:
- **Mobile phones** (320px - 640px)
- **Tablets** (641px - 1024px)
- **Desktop** (1025px+)

### Mobile Optimizations:
- Touch-friendly buttons and forms
- Responsive grid layouts
- Optimized navigation
- Mobile-first design approach

## 🎨 UI/UX Features

- **Modern Design:** Clean and professional interface
- **Intuitive Navigation:** Easy-to-use admin panel
- **Real-time Updates:** Live data and statistics
- **Responsive Layout:** Works on all device sizes
- **Accessibility:** Screen reader friendly
- **Fast Loading:** Optimized performance

## 📊 Analytics Dashboard

The admin dashboard provides:
- **Student Statistics:** Total enrolled students
- **Course Analytics:** Popular courses and performance
- **Revenue Tracking:** Payment history and totals
- **Enrollment Trends:** Recent student registrations
- **Video Statistics:** Total videos and course content

## 🔄 Next Steps After Setup

1. **Create Your First Course:**
   - Go to admin dashboard
   - Click "Add New Course"
   - Fill in course details
   - Upload course videos

2. **Test Student Registration:**
   - Register a test student account
   - Enroll in a course
   - Test video access

3. **Customize Settings:**
   - Update course categories
   - Set pricing
   - Configure payment settings

4. **Monitor Performance:**
   - Check analytics regularly
   - Review student feedback
   - Optimize course content

Your Sandhan App is now ready for production use with full admin capabilities!
