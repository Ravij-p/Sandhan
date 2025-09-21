# Environment Configuration for Sandhan App

Create a `.env` file in the `backend` directory with the following variables:

## Required Environment Variables

```env
# Database Configuration
MONGO_URI=mongodb://localhost:27017/sandhan_app

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_secure

# Razorpay Payment Gateway Configuration
RAZORPAY_KEY_ID=rzp_test_your_razorpay_key_id
RAZORPAY_SECRET=your_razorpay_secret_key

# Cloudflare R2 Storage Configuration
CLOUDFLARE_R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
CLOUDFLARE_R2_ACCESS_KEY_ID=your_r2_access_key_id
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
CLOUDFLARE_R2_BUCKET_NAME=your_r2_bucket_name

# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

## Optional Environment Variables

```env
# Email Configuration (for notifications)
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Admin Configuration (for initial setup)
DEFAULT_ADMIN_EMAIL=admin@sandhan.com
DEFAULT_ADMIN_PASSWORD=admin123

# Security Configuration
BCRYPT_ROUNDS=10
JWT_EXPIRES_IN=7d

# File Upload Configuration
MAX_FILE_SIZE=500MB
ALLOWED_VIDEO_TYPES=video/mp4,video/webm,video/avi,video/mov

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Redis Configuration (for caching)
REDIS_URL=redis://localhost:6379

# Monitoring
SENTRY_DSN=your_sentry_dsn_here

# API Documentation
API_DOCS_URL=/api-docs
```

## Setup Instructions

### 1. Database Setup
- Install MongoDB locally or use MongoDB Atlas
- Update `MONGO_URI` with your database connection string

### 2. JWT Secret
- Generate a secure random string for JWT_SECRET
- Use: `openssl rand -base64 32` or any secure random generator

### 3. Razorpay Setup
- Sign up at [Razorpay](https://razorpay.com)
- Get your API keys from the dashboard
- Update `RAZORPAY_KEY_ID` and `RAZORPAY_SECRET`

### 4. Cloudflare R2 Setup
- Sign up at [Cloudflare](https://cloudflare.com)
- Create an R2 bucket
- Generate API tokens with R2 permissions
- Update R2 configuration variables

### 5. Frontend Configuration
Create a `.env` file in the `frontend` directory:

```env
REACT_APP_API_BASE_URL=http://localhost:5000/api
```

## Security Notes

1. **Never commit `.env` files to version control**
2. **Use strong, unique secrets for production**
3. **Rotate API keys regularly**
4. **Use environment-specific configurations**
5. **Enable HTTPS in production**

## Production Checklist

- [ ] Use strong JWT secret (32+ characters)
- [ ] Enable HTTPS
- [ ] Use production database
- [ ] Set NODE_ENV=production
- [ ] Configure proper CORS origins
- [ ] Set up monitoring and logging
- [ ] Use secure file storage
- [ ] Enable rate limiting
- [ ] Set up backup strategies
