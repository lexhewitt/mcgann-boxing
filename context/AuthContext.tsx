import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { AppUser, Member, UserRole, Coach } from '../types';
import { useData } from './DataContext';

interface AuthContextType {
  currentUser: AppUser | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  registerMember: (memberData: Omit<Member, 'id' | 'role'> & { password: string }) => Promise<{ success: boolean; user?: AppUser; error?: string }>;
  addCoach: (coachData: Omit<Coach, 'id'>) => Coach | null;
  updateCurrentUser: (userData: Partial<AppUser>) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_USER_KEY = 'fleetwood-auth-user';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const { members, coaches, addMember: addMemberToData, updateMember, addCoach: addCoachToData } = useData();

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/server-api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return { success: false, error: data.error || 'Login failed' };
      }

      // Map the user data to match our AppUser type
      const user = data.user;
      const appUser: AppUser = user.role === 'MEMBER' 
        ? {
            id: user.id,
            name: user.name,
            email: user.email,
            role: UserRole.MEMBER,
            dob: user.dob,
            sex: user.sex,
            ability: user.ability,
            bio: user.bio,
            coachId: user.coach_id,
            isCarded: user.is_carded,
            membershipStatus: user.membership_status,
            membershipStartDate: user.membership_start_date,
            membershipExpiry: user.membership_expiry,
            isRollingMonthly: user.is_rolling_monthly,
          }
        : {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role === 'ADMIN' ? UserRole.ADMIN : UserRole.COACH,
            level: user.level,
            bio: user.bio,
            imageUrl: user.imageUrl || user.image_url,
            mobileNumber: user.mobileNumber || user.mobile_number,
            bankDetails: user.bankDetails || user.bank_details,
            whatsappAutoReplyEnabled: user.whatsappAutoReplyEnabled ?? user.whatsapp_auto_reply_enabled,
            whatsappAutoReplyMessage: user.whatsappAutoReplyMessage || user.whatsapp_auto_reply_message,
          };

      setCurrentUser(appUser);
      if (typeof window !== 'undefined') {
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify({ id: appUser.id, email: appUser.email }));
      }
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }, []);

  const logout = () => {
    setCurrentUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_USER_KEY);
    }
  };

  const registerMember = async (memberData: Omit<Member, 'id' | 'role'> & { password: string; familyMembers?: Array<{ name: string; dob: string }> }): Promise<{ success: boolean; user?: AppUser; error?: string }> => {
    try {
      const response = await fetch('/server-api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: memberData.name,
          email: memberData.email,
          password: memberData.password,
          dob: memberData.dob,
          sex: memberData.sex,
          ability: memberData.ability,
          bio: memberData.bio || '',
          coachId: memberData.coachId || null,
          familyMembers: memberData.familyMembers || [],
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return { success: false, error: data.error || 'Registration failed' };
      }

      // Map the user data to match our AppUser type
      const user = data.user;
      const newMember: Member = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: UserRole.MEMBER,
        dob: user.dob,
        sex: user.sex,
        ability: user.ability,
        bio: user.bio,
        coachId: user.coach_id,
        isCarded: user.is_carded,
        membershipStatus: user.membership_status,
        membershipStartDate: user.membership_start_date,
        membershipExpiry: user.membership_expiry,
        isRollingMonthly: user.is_rolling_monthly,
      };

      // Also add to local data context
      addMemberToData(newMember);
      setCurrentUser(newMember);
      if (typeof window !== 'undefined') {
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify({ id: newMember.id, email: newMember.email }));
      }
      return { success: true, user: newMember };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (currentUser) return;
    const savedAuth = localStorage.getItem(AUTH_USER_KEY);
    if (!savedAuth) return;
    
    try {
      const { id, email } = JSON.parse(savedAuth);
      const allUsers: AppUser[] = [...members, ...coaches];
      const matchedUser = allUsers.find(u => u.id === id || u.email.toLowerCase() === email.toLowerCase());
      if (matchedUser) {
        setCurrentUser(matchedUser);
      } else {
        // If user not found in local data, clear saved auth
        localStorage.removeItem(AUTH_USER_KEY);
      }
    } catch (error) {
      console.error('Error parsing saved auth:', error);
      localStorage.removeItem(AUTH_USER_KEY);
    }
  }, [members, coaches, currentUser]);

  const isAuthenticated = currentUser !== null;

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, registerMember, addCoach, updateCurrentUser, isAuthenticated }}>
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
