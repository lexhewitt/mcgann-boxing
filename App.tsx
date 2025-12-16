
import React, { useState } from 'react';
import { DataProvider } from './context/DataContext';
import { AuthProvider } from './context/AuthContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import MainContent from './components/MainContent';
import LoginModal from './components/auth/LoginModal';
import RegisterModal from './components/auth/RegisterModal';
import ForgotPasswordModal from './components/auth/ForgotPasswordModal';
import BookingWizard from './components/bookings/BookingWizard';
import SignupPage from './components/auth/SignupPage';
import ResetPasswordPage from './components/auth/ResetPasswordPage';

const App: React.FC = () => {
  const [isLoginOpen, setLoginOpen] = useState(false);
  const [isRegisterOpen, setRegisterOpen] = useState(false);
  const [isForgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const isBookingPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/book');
  const isSignupPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/signup');
  const isResetPasswordPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/reset-password');

  const handleSwitchToRegister = () => {
    setLoginOpen(false);
    setRegisterOpen(true);
  };

  const handleSwitchToLogin = () => {
    setRegisterOpen(false);
    setForgotPasswordOpen(false);
    setLoginOpen(true);
  };

  // Listen for forgot password event
  React.useEffect(() => {
    const handleOpenForgotPassword = () => {
      setLoginOpen(false);
      setForgotPasswordOpen(true);
    };
    window.addEventListener('openForgotPassword', handleOpenForgotPassword);
    return () => window.removeEventListener('openForgotPassword', handleOpenForgotPassword);
  }, []);

  return (
    <DataProvider>
      <AuthProvider>
        <div className="min-h-screen bg-brand-dark text-brand-light flex flex-col font-sans">
          <Header 
            onLoginClick={() => setLoginOpen(true)}
            onRegisterClick={() => setRegisterOpen(true)}
          />
          <main className="flex-grow container mx-auto px-4 py-8">
            {isBookingPage ? (
              <BookingWizard />
            ) : isSignupPage ? (
              <SignupPage />
            ) : isResetPasswordPage ? (
              <ResetPasswordPage />
            ) : (
              <MainContent onRegisterClick={() => setRegisterOpen(true)} />
            )}
          </main>
          <Footer />
        </div>
        <LoginModal 
          isOpen={isLoginOpen} 
          onClose={() => setLoginOpen(false)} 
          onSwitchToRegister={handleSwitchToRegister} 
        />
        <RegisterModal 
          isOpen={isRegisterOpen} 
          onClose={() => setRegisterOpen(false)} 
          onSwitchToLogin={handleSwitchToLogin} 
        />
        <ForgotPasswordModal
          isOpen={isForgotPasswordOpen}
          onClose={() => setForgotPasswordOpen(false)}
          onSwitchToLogin={handleSwitchToLogin}
        />
      </AuthProvider>
    </DataProvider>
  );
};

export default App;
