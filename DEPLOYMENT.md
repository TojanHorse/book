# Deployment Guide for Disguised Chat App

## Environment Variables Required

Before deploying to Render, you need to set the following environment variables:

### Required Variables:
- `NODE_ENV=production`
- `MONGODB_URI` - Your MongoDB connection string
- `JWT_SECRET` - A secure secret (minimum 32 characters)
- `EMAIL_USER` - Gmail email address for sending verification emails
- `EMAIL_PASS` - Gmail app password (not your regular password)
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name for file uploads
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret
- `FRONTEND_URL` - Your deployed frontend URL (e.g., https://yourapp.onrender.com)

## Render Deployment Steps

1. **Connect Repository**: Connect this repository to your Render account

2. **Create Web Service**: 
   - Service Type: Web Service
   - Environment: Node
   - Build Command: `npm run render-build`
   - Start Command: `npm start`

3. **Set Environment Variables**: Add all required environment variables listed above

4. **Deploy**: Render will automatically build and deploy your application

## Gmail App Password Setup

To send verification emails, you need to:
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
   - Use this password as `EMAIL_PASS`

## MongoDB Atlas Setup

1. Create a free MongoDB Atlas account
2. Create a new cluster
3. Add your Render IP to network access (or use 0.0.0.0/0 for all IPs)
4. Create a database user
5. Get the connection string and use it as `MONGODB_URI`

## Cloudinary Setup

1. Create a free Cloudinary account
2. Find your API credentials in the dashboard
3. Use them for the CLOUDINARY_* environment variables

## Security Notes

- Ensure `JWT_SECRET` is at least 32 characters long and random
- Keep all environment variables secure and never commit them to the repository
- The app will validate all required environment variables on startup

## Troubleshooting

If deployment fails:
1. Check the build logs for missing environment variables
2. Verify MongoDB connection string format
3. Ensure all required environment variables are set
4. Check that Gmail app password is correct

## Features Included

- ✅ Environment variable validation
- ✅ Production-optimized MongoDB connection
- ✅ Proper CORS configuration
- ✅ Static file serving for React frontend
- ✅ Health check endpoint at `/api/health`
- ✅ Graceful error handling
- ✅ Security best practices
