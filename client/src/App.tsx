import { Router, Route, Switch, Redirect } from 'wouter';
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
        
        <Switch>
          {/* Public routes */}
          <Route path="/auth/:page?" component={AuthPages} />
          <Route path="/verify-email" component={EmailVerification} />
          
          {/* Protected routes */}
          <Route path="/book">
            <ProtectedRoute>
              <BookDisguise />
            </ProtectedRoute>
          </Route>
          
          <Route path="/chat">
            <ProtectedRoute>
              <SocketProvider>
                <ChatApp />
              </SocketProvider>
            </ProtectedRoute>
          </Route>
          
          {/* Default redirect */}
          <Route path="/">
            <Redirect to="/book" />
          </Route>
          
          {/* Catch all route */}
          <Route>
            <Redirect to="/book" />
          </Route>
        </Switch>
      </div>
    </AuthProvider>
  );
}

export default App;