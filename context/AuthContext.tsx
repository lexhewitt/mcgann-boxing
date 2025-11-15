import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { AppUser, Member, UserRole, Coach } from '../types';
import { useData } from './DataContext';

interface AuthContextType {
  currentUser: AppUser | null;
  login: (email: string) => boolean;
  logout: () => void;
  registerMember: (memberData: Omit<Member, 'id' | 'role'>) => AppUser | null;
  addCoach: (coachData: Omit<Coach, 'id'>) => Coach | null;
  updateCurrentUser: (userData: Partial<AppUser>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const { members, coaches, addMember: addMemberToData, updateMember, addCoach: addCoachToData } = useData();

  const login = useCallback((email: string): boolean => {
    const allUsers: AppUser[] = [...members, ...coaches];
    const user = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  }, [members, coaches]);

  const logout = () => {
    setCurrentUser(null);
  };

  const registerMember = (memberData: Omit<Member, 'id' | 'role'>): AppUser | null => {
    const existingUser = [...members, ...coaches].find(u => u.email.toLowerCase() === memberData.email.toLowerCase());
    if (existingUser) {
        alert("User with this email already exists.");
        return null;
    }
    const newMember = addMemberToData({ ...memberData, role: UserRole.MEMBER });
    setCurrentUser(newMember);
    return newMember;
  };
  
  const addCoach = (coachData: Omit<Coach, 'id'>): Coach | null => {
    const existingUser = [...members, ...coaches].find(u => u.email.toLowerCase() === coachData.email.toLowerCase());
    if (existingUser) {
        // Error is handled in the component
        return null;
    }
    const newCoach = addCoachToData(coachData);
    return newCoach;
  };

  const updateCurrentUser = (userData: Partial<AppUser>) => {
    if (currentUser) {
        const updatedUser = { ...currentUser, ...userData };
        
        // FIX: The original `setCurrentUser` call was misplaced, causing a type error because `updatedUser`
        // is not guaranteed to be a valid `AppUser` after spreading a union type.
        // By moving `setCurrentUser` inside role-based checks and casting, we ensure type safety.
        if (updatedUser.role === UserRole.MEMBER) {
            setCurrentUser(updatedUser as Member);
            updateMember(updatedUser as Member);
        }
        // Similar logic for coach update if needed
        else if (updatedUser.role === UserRole.COACH || updatedUser.role === UserRole.ADMIN) {
            setCurrentUser(updatedUser as Coach);
        }
    }
  };


  return (
    <AuthContext.Provider value={{ currentUser, login, logout, registerMember, addCoach, updateCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
