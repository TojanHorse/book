import React, { useEffect, useState } from 'react';
import { useSearch, useLocation } from 'wouter';
import { useAuth } from '../../contexts/AuthContext';
import { BookOpen, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

const EmailVerification: React.FC = () => {
  const search = useSearch();
  const { verifyEmail, resendVerification } = useAuth();
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const urlParams = new URLSearchParams(search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');
    const token = urlParams.get('token');

    if (success === 'true') {
      setStatus('success');
      setMessage('Email verified successfully! You can now log in to access the Digital Library.');
      setTimeout(() => {
        setLocation('/auth/login');
      }, 3000);
    } else if (error) {
      setStatus('error');
      switch (error) {
        case 'missing_token':
          setMessage('Invalid verification link - token is missing.');
          break;
        case 'invalid_token':
          setMessage('Invalid or expired verification token. Please request a new verification email.');
          break;
        case 'server_error':
          setMessage('Server error occurred during verification. Please try again.');
          break;
        default:
          setMessage('Verification failed. Please try again.');
      }
    } else if (token) {
      // Handle old-style token verification for backward compatibility
      handleVerification(token);
    } else {
      setStatus('error');
      setMessage('Invalid verification link');
    }
  }, [search]);

  const handleVerification = async (token: string) => {
    try {
      const success = await verifyEmail(token);
      if (success) {
        setStatus('success');
        setMessage('Email verified successfully! Redirecting to library...');
        setTimeout(() => {
          setLocation('/book');
        }, 2000);
      } else {
        setStatus('error');
        setMessage('Verification failed. The link may be expired or invalid.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Verification failed. Please try again.');
    }
  };

  const handleResend = async () => {
    if (!email) {
      setMessage('Please enter your email address');
      return;
    }

    const success = await resendVerification(email);
    if (success) {
      setMessage('Verification email sent! Please check your inbox.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <BookOpen className="w-16 h-16 text-amber-700 mx-auto mb-4" />
          <h1 className="text-3xl title-font font-bold text-amber-900 mb-2">
            Email Verification
          </h1>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 book-spine text-center">
          {status === 'verifying' && (
            <>
              <RefreshCw className="w-16 h-16 text-amber-600 mx-auto mb-4 animate-spin" />
              <h2 className="text-xl title-font font-semibold text-gray-800 mb-2">
                Verifying Your Email
              </h2>
              <p className="text-gray-600 book-font">
                Please wait while we verify your email address...
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-xl title-font font-semibold text-gray-800 mb-2">
                Verification Successful!
              </h2>
              <p className="text-gray-600 book-font mb-4">
                {message}
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
              <h2 className="text-xl title-font font-semibold text-gray-800 mb-2">
                Verification Failed
              </h2>
              <p className="text-gray-600 book-font mb-6">
                {message}
              </p>

              <div className="space-y-4">
                <div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent book-font"
                  />
                </div>
                
                <button
                  onClick={handleResend}
                  className="w-full bg-amber-700 text-white py-3 px-4 rounded-lg hover:bg-amber-800 transition-colors book-font font-medium"
                >
                  Resend Verification Email
                </button>

                <button
                  onClick={() => setLocation('/auth/login')}
                  className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors book-font font-medium"
                >
                  Back to Login
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;