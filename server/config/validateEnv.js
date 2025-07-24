// Environment variable validation for production readiness
const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'EMAIL_USER',
  'EMAIL_PASS',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
];

const optionalEnvVars = [
  'FRONTEND_URL',
  'PORT',
  'NODE_ENV'
];

function validateEnvironment() {
  const missingVars = [];
  const warnings = [];

  // Check required variables
  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });

  // Check JWT secret strength
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    warnings.push('JWT_SECRET should be at least 32 characters long for security');
  }

  // Check NODE_ENV
  if (!process.env.NODE_ENV) {
    warnings.push('NODE_ENV not set, defaulting to development');
    process.env.NODE_ENV = 'development';
  }

  // Check FRONTEND_URL for production
  if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL) {
    warnings.push('FRONTEND_URL should be set in production for proper CORS configuration');
  }

  // Report missing required variables
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => {
      console.error(`  - ${varName}`);
    });
    console.error('\nPlease set these variables before starting the server.');
    process.exit(1);
  }

  // Report warnings
  if (warnings.length > 0) {
    console.warn('⚠️  Environment warnings:');
    warnings.forEach(warning => {
      console.warn(`  - ${warning}`);
    });
    console.warn('');
  }

  console.log('✅ Environment validation passed');
}

let cachedConfig = null;

// Force cache invalidation in development
if (process.env.NODE_ENV !== 'production') {
  cachedConfig = null;
}

function getConfig() {
  // Disable caching in development for hot reload
  if (process.env.NODE_ENV !== 'production') {
    cachedConfig = null;
  }
  
  if (!cachedConfig) {
    validateEnvironment();
    cachedConfig = {
    mongodb: {
      uri: process.env.MONGODB_URI,
      options: {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      }
    },
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: '7d'
    },
    email: {
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    },
    cloudinary: {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    },
    server: {
      port: process.env.PORT || 3001,
      frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5174',
      nodeEnv: process.env.NODE_ENV || 'development'
    }
    };
  }
  
  return cachedConfig;
}

module.exports = { validateEnvironment, getConfig };
