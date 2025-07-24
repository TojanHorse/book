# Production Deployment Guide

This chat application is optimized for deployment on Render.com with real-time messaging, file sharing, and mobile responsiveness.

## Prerequisites

1. **MongoDB Atlas**: Free cluster at [https://cloud.mongodb.com](https://cloud.mongodb.com)
2. **Cloudinary**: Free account at [https://cloudinary.com](https://cloudinary.com) for file uploads
3. **Render**: Free account at [https://render.com](https://render.com)
4. **GitHub**: Push your code to a GitHub repository

## Quick Deploy to Render

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

## Manual Deployment Steps

### 1. Set Up External Services

**MongoDB Atlas:**
- Create a free cluster
- Add database user with read/write permissions
- Whitelist IP: `0.0.0.0/0` (for Render)
- Get connection string

**Cloudinary:**
- Create free account
- Note your cloud name, API key, and API secret

### 2. Deploy to Render

1. **Create Web Service**:
   - Connect your GitHub repository
   - Name: `your-chat-app`
   - Environment: `Node`
   - Build Command: `npm run render-build`
   - Start Command: `npm run render-start`

2. **Environment Variables**:
```env
# Production
NODE_ENV=production
PORT=3001

# Database (Required)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname

# JWT Secret (Required - Generate a strong 32+ character secret)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long

# Frontend URL (Required - Set to your Render URL)
FRONTEND_URL=https://your-app-name.onrender.com
RENDER_EXTERNAL_URL=https://your-app-name.onrender.com

# Email Configuration (Optional - for email verification)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
FROM_EMAIL=your-email@gmail.com

# Cloudinary (Required - for file uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 3. Advanced Configuration

**Render Settings:**
- Auto-Deploy: ✅ Enabled
- Build Command: `npm run render-build`
- Start Command: `npm run render-start`
- Health Check Path: Leave empty
- Instance Type: Free (or paid for better performance)

## Features Included

✅ **Real-time Chat**: Instant messaging with Socket.IO  
✅ **File Sharing**: Images, documents via Cloudinary  
✅ **User Authentication**: JWT-based with email verification  
✅ **Mobile Responsive**: Optimized for all devices  
✅ **Hidden Chat Access**: 5-tap trigger on user icon  
✅ **Production Optimized**: Compression, caching, error handling  

## Testing Your Deployment

### Essential Tests:

1. **Authentication Flow**:
   ```
   ✅ User registration
   ✅ Email verification (if configured)
   ✅ User login
   ✅ JWT token persistence
   ```

2. **Chat Functionality**:
   ```
   ✅ Real-time messaging
   ✅ Message persistence
   ✅ File uploads (images/documents)
   ✅ User search and conversations
   ✅ Typing indicators
   ✅ Online/offline status
   ```

3. **Mobile Features**:
   ```
   ✅ Responsive design
   ✅ Chat sidebar toggle
   ✅ 5-tap user icon trigger
   ✅ Touch interactions
   ```

### Performance Tests:

- Load time < 3 seconds
- Real-time message delivery < 1 second
- File upload successful
- Mobile navigation smooth

## Troubleshooting

### Build Issues

**"npm ci failed"**:
```bash
# Check package-lock.json is committed
# Verify Node.js version compatibility
```

**"TypeScript compilation failed"**:
```bash
# Run locally: npm run check
# Fix any TypeScript errors before deployment
```

### Runtime Issues

**"Socket connection failed"**:
- Verify `FRONTEND_URL` matches your Render URL
- Check browser console for CORS errors
- Ensure WebSocket connections are not blocked

**"Database connection failed"**:
- Verify MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- Check `MONGODB_URI` format and credentials
- Ensure database user has read/write permissions

**"File upload failed"**:
- Verify all Cloudinary environment variables
- Check file size (max 10MB)
- Test with different file types

### Debug Commands

**View Logs**:
```bash
# In Render Dashboard → Your Service → Logs
# Look for connection errors, authentication failures
```

**Test Socket Connection**:
```javascript
// In browser console
window.location.reload(); // Refresh and check console logs
```

## Production Optimizations

### Performance Features:
- **Gzipped Responses**: Automatic compression
- **Code Splitting**: Optimized JavaScript bundles
- **MongoDB Connection Pooling**: Efficient database connections
- **Socket.IO Optimizations**: Reconnection handling, heartbeat monitoring
- **Error Boundaries**: Graceful error handling
- **Memory Management**: Proper cleanup on disconnection

### Security Features:
- **Password Hashing**: bcrypt with salt rounds
- **JWT Authentication**: Secure token-based auth
- **CORS Configuration**: Restricted to production domain
- **File Validation**: Type and size restrictions
- **Environment Variables**: Sensitive data protection
- **Rate Limiting**: Built-in Express protections

## Monitoring

### Key Metrics to Monitor:
- Response time (should be < 2s)
- Memory usage (should be < 500MB)
- Socket connections (active users)
- Database query performance
- Error rates in logs

### Render Metrics:
Access via Render Dashboard → Your Service → Metrics

## Scaling

### Free Tier Limits:
- 750 hours/month runtime
- Automatic sleep after 15 minutes of inactivity
- Cold start latency on wake up

### Paid Tier Benefits:
- Always-on service
- Better performance
- No cold starts
- More memory/CPU

## Support

If you encounter issues:

1. Check the logs in Render Dashboard
2. Verify all environment variables are set correctly
3. Test the application locally first
4. Check MongoDB Atlas and Cloudinary dashboards for service status

For additional support, check the application logs and ensure all services (MongoDB, Cloudinary) are functioning properly.
