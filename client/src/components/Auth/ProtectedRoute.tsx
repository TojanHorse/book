import React, { ReactNode } from 'react';
import { Redirect } from 'wouter';
import { useAuth } from '../../contexts/AuthContext';
import { BookOpen } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();

  console.log('ProtectedRoute - isLoading:', isLoading, 'user:', user);

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

  if (!user) {
    console.log('ProtectedRoute - no user, redirecting to login');
    return <Redirect to="/auth/login" />;
  }

  if (!user.isVerified) {
    console.log('ProtectedRoute - user not verified, redirecting to verification');
    return <Redirect to="/verify-email" />;
  }

  console.log('ProtectedRoute - user authenticated, rendering protected content');
  return <>{children}</>;
};

export default ProtectedRoute;