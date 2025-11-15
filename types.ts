
export enum UserRole {
  MEMBER = 'MEMBER',
  COACH = 'COACH',
  ADMIN = 'ADMIN'
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Not ideal to have on client, but for mock purposes
  role: UserRole;
}

export interface Member extends User {
  role: UserRole.MEMBER;
  dob: string; // Date of Birth in 'YYYY-MM-DD' format
  sex: 'M' | 'F';
  ability: 'Beginner' | 'Intermediate' | 'Advanced' | 'Competitive';
  bio: string;
  coachId: string | null;
  isCarded?: boolean;
  membershipStatus: 'PAYG' | 'Monthly' | 'None';
  membershipStartDate?: string; // ISO date string 'YYYY-MM-DD'
  membershipExpiry?: string; // ISO date string 'YYYY-MM-DD'
  isRollingMonthly?: boolean;
}

export interface Coach extends User {
  role: UserRole.COACH | UserRole.ADMIN;
  level: string;
  bio: string;
  imageUrl: string;
  mobileNumber?: string;
  bankDetails?: string; // e.g., Sort Code, Account Number
}

export type AppUser = Member | Coach;

export interface FamilyMember {
  id: string;
  parentId: string;
  name: string;
  dob: string; // Date of Birth in 'YYYY-MM-DD' format
}

export interface GymClass {
  id: string;
  name: string;
  description: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  time: string;
  coachId: string;
  capacity: number;
  price: number;
  minAge?: number;
  maxAge?: number;
  originalCoachId?: string; // ID of the coach who this class was temporarily transferred from
}

export interface Booking {
  id:string;
  memberId: string;      // The account holder who made/paid for the booking
  participantId: string; // Who is attending (can be memberId or familyMemberId)
  classId: string;
  bookingDate: string;   // ISO string
  paid: boolean;
  attended?: boolean;
}

export enum NotificationStatus {
    PENDING = 'PENDING',
    ACCEPTED = 'ACCEPTED',
    DECLINED = 'DECLINED',
    UNDONE = 'UNDONE',
    CANCELED = 'CANCELED',
}

export interface ClassTransferNotification {
    id: string;
    timestamp: string;
    classId: string;
    requestingCoachId: string; // Original coach
    targetCoachId: string; // Coach being asked to cover
    status: NotificationStatus;
    note?: string;
}


export interface AuditLog {
  id: string;
  timestamp: string; // ISO string
  actorId: string; // User ID of who performed the action
  action: 'MEMBER_ADDED_TO_CLASS' | 'MEMBER_REMOVED_FROM_CLASS' | 'MEMBER_TRANSFERRED_CLASS' | 'MEMBER_BOOKED_CLASS' | 'CLASS_TRANSFER_REQUESTED' | 'CLASS_TRANSFER_ACCEPTED' | 'CLASS_TRANSFER_UNDONE' | 'CLASS_TRANSFER_CANCELED';
  details: string; // Human-readable description
}

export interface AvailabilitySlot {
  id: string;
  coachId: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
}

export interface UnavailableSlot {
  id: string;
  coachId: string;
  date: string; // "YYYY-MM-DD"
  startTime?: string; // "HH:mm"
  endTime?: string; // "HH:mm"
}


export interface GymAccessLog {
    id: string;
    memberId: string;
    accessDate: string; // ISO String
    amountPaid: number;
    paid: boolean;
    notes?: string;
}
