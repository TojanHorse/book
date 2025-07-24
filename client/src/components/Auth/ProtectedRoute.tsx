import React, { ReactNode } from 'react';
import { Redirect } from 'wouter';
import { useAuth } from '../../contexts/AuthContext';
import { BookOpen } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading, token } = useAuth();

  console.log('ProtectedRoute - isLoading:', isLoading, 'user:', user, 'token:', !!token);

  // Show loading screen while authentication is being checked
  if (isLoading) {
    console.log('ProtectedRoute - showing loading screen');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-amber-700 mx-auto mb-4 animate-pulse" />
          <p className="text-amber-700 book-font text-lg">Loading your library...</p>
        </div>
      </div>
    );
  }

  // If no user or token, redirect to login
  if (!user || !token) {
    console.log('ProtectedRoute - no user/token, redirecting to login');
    return <Redirect to="/auth/login" />;
  }

  // If user exists but is not verified, redirect to verification
  if (user && !user.isVerified) {
    console.log('ProtectedRoute - user not verified, redirecting to verification');
    return <Redirect to="/verify-email" />;
  }

  // User is authenticated and verified
  console.log('ProtectedRoute - user authenticated and verified, rendering protected content');
  return <>{children}</>;
};

export default ProtectedRoute;