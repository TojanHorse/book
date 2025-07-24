import React, { ReactNode } from 'react';
import { Redirect } from 'wouter';
import { useAuth } from '../../contexts/AuthContext';
import { BookOpen } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
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
    return <Redirect to="/auth/login" />;
  }

  if (!user.isVerified) {
    return <Redirect to="/verify-email" />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;