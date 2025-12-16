import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import LoginModal from './LoginModal';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
  fallback?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole,
  fallback 
}) => {
  const { currentUser, isAuthenticated } = useAuth();
  const [showLogin, setShowLogin] = React.useState(false);

  React.useEffect(() => {
    if (!isAuthenticated) {
      setShowLogin(true);
    }
  }, [isAuthenticated]);

  // Not authenticated
  if (!isAuthenticated || !currentUser) {
    return (
      <>
        {fallback || (
          <div className="min-h-screen bg-brand-dark flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-4">Authentication Required</h2>
              <p className="text-gray-400 mb-4">Please log in to access this page.</p>
            </div>
          </div>
        )}
        <LoginModal 
          isOpen={showLogin} 
          onClose={() => setShowLogin(false)} 
          onSwitchToRegister={() => {
            setShowLogin(false);
            // Trigger register modal via window event or state management
            window.dispatchEvent(new CustomEvent('openRegister'));
          }} 
        />
      </>
    );
  }

  // Check role requirement
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(currentUser.role)) {
      return (
        <div className="min-h-screen bg-brand-dark flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Access Denied</h2>
            <p className="text-gray-400">You don't have permission to access this page.</p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;

