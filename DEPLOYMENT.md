# Deployment Guide for Render

This guide walks you through deploying the Digital Library Chat App to Render.

## Prerequisites

1. **MongoDB Atlas Account**: Set up a MongoDB database on Atlas
2. **Cloudinary Account**: For file uploads and media storage
3. **Email Provider**: Gmail or any SMTP service for email verification
4. **GitHub Repository**: Your code should be in a GitHub repository

## Environment Variables

Set these environment variables in your Render service:

### Required Variables

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# Authentication
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long

# Cloudinary (File Storage)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name

# Email Service
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Production Settings
NODE_ENV=production
FRONTEND_URL=https://your-app-name.onrender.com
PORT=10000
```

## Render Service Configuration

### Web Service Settings

1. **Build Command**: `npm run render-build`
2. **Start Command**: `npm run render-start`
3. **Node Version**: 18.x or higher
4. **Environment**: Node

### Auto-Deploy

Enable auto-deploy from your main branch for continuous deployment.

## Database Setup

### MongoDB Atlas

1. Create a new cluster on MongoDB Atlas
2. Add your Render service IP to the IP whitelist (or use 0.0.0.0/0 for all IPs)
3. Create a database user with read/write permissions
4. Copy the connection string and set it as `MONGODB_URI`

## File Storage Setup

### Cloudinary

1. Sign up for a free Cloudinary account
2. Go to Dashboard to find your credentials
3. Set up the environment variables as shown above

## Email Service Setup

### Gmail Setup

1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password: Account Settings > Security > App passwords
3. Use your Gmail address as `EMAIL_USER`
4. Use the generated app password as `EMAIL_PASS`

## Security Considerations

- Use strong, unique values for `JWT_SECRET`
- Enable MongoDB IP whitelisting for production
- Use environment variables for all sensitive data
- Regular security updates for dependencies

## Monitoring and Logs

- Monitor your Render service logs for errors
- Set up health checks if needed
- Monitor MongoDB Atlas metrics
- Watch Cloudinary usage limits

## Troubleshooting

### Common Issues

1. **Build Failures**: Check Node.js version compatibility
2. **Database Connection**: Verify MongoDB URI and IP whitelist
3. **File Upload Issues**: Check Cloudinary credentials
4. **Email Not Sending**: Verify Gmail app password and SMTP settings

### Log Analysis

Check Render service logs for:
- Database connection errors
- Socket.IO connection issues
- File upload failures
- Authentication problems

## Features Included

✅ **User Authentication**: Registration, login, email verification
✅ **Real-time Chat**: Socket.IO powered messaging
✅ **File Sharing**: Images, videos, documents via Cloudinary
✅ **Book Disguise**: Secret chat access through book interface
✅ **Responsive Design**: Works on desktop and mobile
✅ **User Search**: Find and start conversations with other users
✅ **Typing Indicators**: Real-time typing status
✅ **Message History**: Persistent chat history
✅ **Online Status**: See who's online

## Post-Deployment Testing

1. **User Registration**: Test account creation and email verification
2. **Login**: Verify authentication works
3. **Chat Function**: Send messages between different accounts
4. **File Upload**: Test image/video/document sharing
5. **Secret Access**: Test the hidden chat unlock mechanism
6. **Mobile**: Test responsive design on mobile devices

## Support

If you encounter issues during deployment:

1. Check Render service logs
2. Verify all environment variables are set correctly
3. Test database connectivity
4. Ensure Cloudinary credentials are valid
5. Check email service configuration

---

**Happy Deploying! 🚀**
