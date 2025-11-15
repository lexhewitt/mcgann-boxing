import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface HeaderProps {
  onLoginClick: () => void;
  onRegisterClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLoginClick, onRegisterClick }) => {
  const { currentUser, logout } = useAuth();

  return (
    <header className="bg-brand-dark/80 backdrop-blur-sm sticky top-0 z-50 shadow-lg shadow-brand-red/10">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex-shrink-0">
            <a href="#" className="text-2xl font-bold text-white tracking-wider">
              Fleetwood Boxing Gym
            </a>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {currentUser ? (
                <>
                  <span className="text-gray-300">Welcome, {currentUser.name}!</span>
                  {currentUser.role === UserRole.ADMIN && <span className="px-2 py-1 bg-brand-red text-xs font-bold rounded">ADMIN</span>}
                  {currentUser.role === UserRole.COACH && <span className="px-2 py-1 bg-blue-500 text-xs font-bold rounded">COACH</span>}
                  <button
                    onClick={logout}
                    className="bg-brand-red text-white hover:bg-red-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={onLoginClick}
                    className="text-gray-300 hover:bg-brand-gray hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Login
                  </button>
                  <button
                    onClick={onRegisterClick}
                    className="bg-brand-red text-white hover:bg-red-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Join Now
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="md:hidden flex items-center">
               {currentUser ? (
                   <button
                      onClick={logout}
                      className="bg-brand-red text-white hover:bg-red-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Logout
                    </button>
               ) : (
                  <button
                    onClick={onRegisterClick}
                    className="bg-brand-red text-white hover:bg-red-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Join
                  </button>
               )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;