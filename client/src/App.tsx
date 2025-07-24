import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import BookDisguise from './components/BookDisguise/BookDisguise';
import ChatApp from './components/Chat/ChatApp';
import AuthPages from './components/Auth/AuthPages';
import EmailVerification from './components/Auth/EmailVerification';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
          
          <Routes>
            {/* Public routes */}
            <Route path="/auth/*" element={<AuthPages />} />
            <Route path="/verify-email" element={<EmailVerification />} />
            
            {/* Protected routes */}
            <Route 
              path="/book" 
              element={
                <ProtectedRoute>
                  <BookDisguise />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/chat" 
              element={
                <ProtectedRoute>
                  <SocketProvider>
                    <ChatApp />
                  </SocketProvider>
                </ProtectedRoute>
              } 
            />
            
            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/book" replace />} />
            <Route path="*" element={<Navigate to="/book" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;