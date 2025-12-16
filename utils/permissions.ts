import { AppUser, AdminLevel, UserRole } from '../types';

/**
 * Check if user is a superadmin (can create/manage other admins)
 */
export const isSuperAdmin = (user: AppUser | null): boolean => {
  if (!user || user.role !== UserRole.ADMIN) return false;
  return (user as any).adminLevel === AdminLevel.SUPERADMIN;
};

/**
 * Check if user is a full admin (can do everything except manage admins)
 */
export const isFullAdmin = (user: AppUser | null): boolean => {
  if (!user || user.role !== UserRole.ADMIN) return false;
  const adminLevel = (user as any).adminLevel;
  return adminLevel === AdminLevel.FULL_ADMIN || adminLevel === AdminLevel.SUPERADMIN;
};

/**
 * Check if user is any type of admin
 */
export const isAnyAdmin = (user: AppUser | null): boolean => {
  if (!user) return false;
  return user.role === UserRole.ADMIN;
};

/**
 * Check if user can delete members
 */
export const canDeleteMembers = (user: AppUser | null): boolean => {
  if (!isAnyAdmin(user)) return false;
  const adminLevel = (user as any).adminLevel;
  return adminLevel === AdminLevel.SUPERADMIN || adminLevel === AdminLevel.FULL_ADMIN;
};

/**
 * Check if user can delete coaches
 */
export const canDeleteCoaches = (user: AppUser | null): boolean => {
  if (!isAnyAdmin(user)) return false;
  const adminLevel = (user as any).adminLevel;
  return adminLevel === AdminLevel.SUPERADMIN || adminLevel === AdminLevel.FULL_ADMIN;
};

/**
 * Check if user can delete classes
 */
export const canDeleteClasses = (user: AppUser | null): boolean => {
  if (!isAnyAdmin(user)) return false;
  const adminLevel = (user as any).adminLevel;
  return adminLevel === AdminLevel.SUPERADMIN || adminLevel === AdminLevel.FULL_ADMIN;
};

/**
 * Check if user can delete sessions/bookings
 */
export const canDeleteSessions = (user: AppUser | null): boolean => {
  if (!isAnyAdmin(user)) return false;
  const adminLevel = (user as any).adminLevel;
  return adminLevel === AdminLevel.SUPERADMIN || adminLevel === AdminLevel.FULL_ADMIN;
};

/**
 * Check if user can create/manage other admins
 */
export const canManageAdmins = (user: AppUser | null): boolean => {
  return isSuperAdmin(user);
};

/**
 * Get admin level display name
 */
export const getAdminLevelDisplay = (adminLevel?: AdminLevel): string => {
  switch (adminLevel) {
    case AdminLevel.SUPERADMIN:
      return 'Super Admin';
    case AdminLevel.FULL_ADMIN:
      return 'Full Admin';
    case AdminLevel.STANDARD_ADMIN:
      return 'Standard Admin';
    default:
      return 'Coach';
  }
};


