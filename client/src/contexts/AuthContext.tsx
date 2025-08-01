import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface User {
  uniqueAppId: string;
  username: string;
  email: string;
  role: string;
  isVerified: boolean;
  lastActive?: string;
}

interface LoginResult {
  success: boolean;
  needsVerification?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<LoginResult>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  verifyEmail: (token: string) => Promise<boolean>;
  resendVerification: (email: string) => Promise<boolean>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Configure axios defaults for Replit environment
axios.defaults.baseURL = '/api';

console.log('🔧 API Base URL:', '/api');

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  // Set up axios interceptor for auth token
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Check for existing session on app load
  useEffect(() => {
    const checkAuth = async () => {
      console.log('🔄 Checking authentication, token exists:', !!token);
      if (token) {
        try {
          const response = await axios.get('/auth/me');
          console.log('✅ Auth check successful, user:', response.data.user);
          setUser(response.data.user);
        } catch (error) {
          console.error('❌ Auth check failed:', error);
          // Clear invalid token
          localStorage.removeItem('token');
          setToken(null);
        }
      } else {
        console.log('📝 No token found, user not authenticated');
      }
      setIsLoading(false);
      console.log('🏁 Auth check complete, isLoading set to false');
    };

    checkAuth();
  }, [token]);

  const login = async (email: string, password: string): Promise<LoginResult> => {
    try {
      const response = await axios.post('/auth/login', { email, password });
      const { token: newToken, user: userData } = response.data;
      
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      
      console.log('✅ Login successful, user data:', userData);
      toast.success(`Welcome back, ${userData.username}!`);
      return { success: true };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      
      if (error.response?.data?.needsVerification) {
        return { success: false, needsVerification: true };
      }
      return { success: false };
    }
  };

  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    try {
      const response = await axios.post('/auth/register', { 
        username, 
        email, 
        password 
      });
      
      toast.success('Registration successful! Please check your email for verification.');
      return true;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      return false;
    }
  };

  const verifyEmail = async (verificationToken: string): Promise<boolean> => {
    try {
      const response = await axios.get(`/auth/verify-email?token=${verificationToken}`);
      
      // Email verification successful, but user still needs to login
      // Don't automatically log them in
      
      toast.success('Email verified successfully! Please log in to access the Digital Library.');
      return true;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Email verification failed';
      toast.error(message);
      return false;
    }
  };

  const resendVerification = async (email: string): Promise<boolean> => {
    try {
      await axios.post('/auth/resend-verification', { email });
      toast.success('Verification email sent! Please check your inbox.');
      return true;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to resend verification email';
      toast.error(message);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    toast.success('Logged out successfully');
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    verifyEmail,
    resendVerification,
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};