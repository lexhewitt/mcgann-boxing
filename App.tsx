
import React, { useState } from 'react';
import { DataProvider } from './context/DataContext';
import { AuthProvider } from './context/AuthContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import MainContent from './components/MainContent';
import LoginModal from './components/auth/LoginModal';
import RegisterModal from './components/auth/RegisterModal';

const App: React.FC = () => {
  const [isLoginOpen, setLoginOpen] = useState(false);
  const [isRegisterOpen, setRegisterOpen] = useState(false);

  const handleSwitchToRegister = () => {
    setLoginOpen(false);
    setRegisterOpen(true);
  };

  const handleSwitchToLogin = () => {
    setRegisterOpen(false);
    setLoginOpen(true);
  };

  return (
    <DataProvider>
      <AuthProvider>
        <div className="min-h-screen bg-brand-dark text-brand-light flex flex-col font-sans">
          <Header 
            onLoginClick={() => setLoginOpen(true)}
            onRegisterClick={() => setRegisterOpen(true)}
          />
          <main className="flex-grow container mx-auto px-4 py-8">
            <MainContent onRegisterClick={() => setRegisterOpen(true)} />
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
      </AuthProvider>
    </DataProvider>
  );
};

export default App;
