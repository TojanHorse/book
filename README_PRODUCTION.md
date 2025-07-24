# 📚 Book Chat Application

A modern, real-time chat application disguised as a book reader with mobile-responsive design and hidden chat functionality.

## 🚀 Features

- **📖 Book Disguise Interface**: Looks like a book reading app
- **💬 Real-time Chat**: Instant messaging with Socket.IO
- **📁 File Sharing**: Upload and share images, documents
- **🔒 User Authentication**: JWT-based secure authentication
- **📱 Mobile Responsive**: Optimized for all devices
- **🎯 Hidden Chat Access**: 5-tap trigger on user icon
- **👥 User Search**: Find and start conversations with other users
- **💭 Typing Indicators**: See when others are typing
- **🟢 Online Status**: Real-time user presence
- **🔄 Message Persistence**: All messages saved to database

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Socket.IO Client** for real-time communication
- **React Router** for navigation
- **Axios** for API calls
- **React Hot Toast** for notifications

### Backend
- **Node.js** with Express
- **Socket.IO** for WebSocket connections
- **MongoDB** with Mongoose for data persistence
- **JWT** for authentication
- **Bcrypt** for password hashing
- **Cloudinary** for file storage
- **Multer** for file uploads

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB database (Atlas recommended)
- Cloudinary account (for file uploads)
- Gmail account (for email verification, optional)

## 🚀 Quick Start

### Local Development

1. **Clone the repository**:
```bash
git clone <your-repo-url>
cd book-chat-app
```

2. **Install dependencies**:
```bash
npm install
```

3. **Set up environment variables**:
Create `.env` file:
```env
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/book-chat
JWT_SECRET=your-jwt-secret-key-minimum-32-characters
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

4. **Start development server**:
```bash
npm run dev
```

Visit `http://localhost:5173` to see the application.

### Production Deployment

**Quick Deploy to Render**:

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

For detailed deployment instructions, see [DEPLOYMENT_OPTIMIZED.md](./DEPLOYMENT_OPTIMIZED.md).

## 📱 How to Use

### Accessing the Chat

1. **Register/Login**: Create an account or log in
2. **Book Interface**: You'll see a book reading interface
3. **Access Chat**: Tap the user icon **5 times quickly** to reveal chat
4. **Start Chatting**: Search for users and start conversations

### Chat Features

- **Send Messages**: Type and send text messages
- **Share Files**: Click the paperclip icon to upload files
- **See Status**: Green dot indicates online users
- **Typing Indicators**: See when others are typing
- **Mobile Navigation**: Use back button on mobile to switch between sidebar and chat

### File Sharing

- Supported types: Images (JPEG, PNG, GIF), Documents (PDF, DOC, TXT)
- Maximum file size: 10MB
- Files are stored securely on Cloudinary

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run check        # Run TypeScript checks

# Production
npm run build        # Build for production
npm run start        # Start production server

# Render Deployment
npm run render-build # Production build for Render
npm run render-start # Start production server on Render
```

## 🏗️ Project Structure

```
book-chat-app/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts (Auth, Socket)
│   │   ├── pages/          # Application pages
│   │   └── lib/           # Utilities and configurations
├── server/                 # Backend Node.js application
│   ├── config/            # Database and other configurations
│   ├── middleware/        # Express middleware
│   ├── models/           # Mongoose models
│   ├── routes.ts         # API routes and Socket.IO setup
│   └── index.ts          # Server entry point
├── shared/                # Shared types and utilities
└── dist/                 # Built application
```

## 🔒 Security Features

- **Password Hashing**: All passwords hashed with bcrypt
- **JWT Authentication**: Secure token-based authentication
- **CORS Protection**: Configured for production domains
- **File Validation**: File type and size restrictions
- **Environment Variables**: Sensitive data protection
- **MongoDB Security**: Connection with authentication

## 🌐 Environment Variables

### Required
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Optional (Email Verification)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
FROM_EMAIL=your-email@gmail.com
```

### Production Only
```env
FRONTEND_URL=https://your-app.onrender.com
RENDER_EXTERNAL_URL=https://your-app.onrender.com
```

## 📊 Performance Optimizations

- **Code Splitting**: Separate bundles for vendor, socket, and UI libraries
- **Gzip Compression**: Automatic response compression
- **MongoDB Connection Pooling**: Efficient database connections
- **Socket.IO Optimizations**: Reconnection handling and heartbeat monitoring
- **Image Optimization**: Cloudinary automatic image optimization
- **Bundle Analysis**: Optimized chunk sizes

## 🐛 Troubleshooting

### Common Issues

**Socket Connection Failed**:
- Check `FRONTEND_URL` matches your domain
- Verify WebSocket connections aren't blocked
- Check browser console for CORS errors

**File Upload Failed**:
- Verify Cloudinary credentials
- Check file size (max 10MB)
- Ensure proper file types

**Database Connection Issues**:
- Verify MongoDB URI format
- Check IP whitelist (add `0.0.0.0/0` for cloud platforms)
- Ensure database user has read/write permissions

### Debug Mode

Enable debug logging by setting:
```env
DEBUG=socket.io*
```

## 📈 Monitoring

### Key Metrics
- Response time (target: < 2s)
- Memory usage (target: < 500MB)
- Active socket connections
- Database query performance
- Error rates

### Tools
- **Render Dashboard**: Built-in metrics and logs
- **MongoDB Atlas**: Database performance monitoring
- **Cloudinary**: File storage analytics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues:

1. Check the [troubleshooting section](#-troubleshooting)
2. Review server logs in your deployment platform
3. Verify all environment variables are set correctly
4. Ensure external services (MongoDB, Cloudinary) are operational

## 🎯 Roadmap

- [ ] Group chat functionality
- [ ] Message reactions and replies
- [ ] Push notifications
- [ ] Voice message support
- [ ] Advanced file sharing (folders, multiple files)
- [ ] Message search functionality
- [ ] Chat themes and customization

---

**Happy Chatting! 💬**
