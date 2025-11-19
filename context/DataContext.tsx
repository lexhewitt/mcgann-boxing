import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Coach, GymClass, Member, Booking, AuditLog, AppUser, FamilyMember, AvailabilitySlot, GymAccessLog, UnavailableSlot, ClassTransferNotification, NotificationStatus, Transaction, TransactionSource, TransactionStatus, CoachSlot, CoachAppointment, SlotType, GuestBooking, BookingAlert, UserRole } from '../types';
import { COACHES, CLASSES, MEMBERS, INITIAL_BOOKINGS, FAMILY_MEMBERS, COACH_AVAILABILITY, GYM_ACCESS_LOGS, UNAVAILABLE_SLOTS, INITIAL_NOTIFICATIONS, INITIAL_TRANSACTIONS, COACH_SLOTS, INITIAL_COACH_APPOINTMENTS } from '../constants';
import { sendWhatsAppNotification } from '../services/notificationService';

interface DataContextType {
  coaches: Coach[];
  classes: GymClass[];
  members: Member[];
  familyMembers: FamilyMember[];
  bookings: Booking[];
  auditLogs: AuditLog[];
  coachAvailability: AvailabilitySlot[];
  unavailableSlots: UnavailableSlot[];
  gymAccessLogs: GymAccessLog[];
  notifications: ClassTransferNotification[];
  bookingAlerts: BookingAlert[];
  transactions: Transaction[];
  coachSlots: CoachSlot[];
  coachAppointments: CoachAppointment[];
  guestBookings: GuestBooking[];
  createClassTransferRequest: (classId: string, targetCoachId: string, note: string, actor: AppUser) => void;
  acceptClassTransfer: (notificationId: string, actor: AppUser) => void;
  undoClassTransfer: (classId: string, actor: AppUser) => void;
  cancelClassTransferRequest: (notificationId: string, actor: AppUser) => void;
  logGymAccess: (memberId: string, amount: number, paid?: boolean) => void;
  addAvailabilitySlot: (slot: Omit<AvailabilitySlot, 'id'>) => void;
  deleteAvailabilitySlot: (slotId: string) => void;
  addUnavailableSlot: (slot: Omit<UnavailableSlot, 'id'>) => void;
  deleteUnavailableSlot: (slotId: string) => void;
  addBooking: (booking: Omit<Booking, 'id' | 'bookingDate'>, actor: AppUser) => void;
  deleteBooking: (bookingId: string, actor: AppUser) => void;
  updateBooking: (bookingId: string, newClassId: string, actor: AppUser) => void;
  toggleAttendance: (bookingId: string) => void;
  updateMember: (member: Member) => void;
  addMember: (member: Omit<Member, 'id'>) => Member;
  deleteMember: (memberId: string) => void;
  addFamilyMember: (familyMember: Omit<FamilyMember, 'id'>) => void;
  deleteFamilyMember: (familyMemberId: string) => void;
  updateCoach: (coach: Coach) => void;
  addCoach: (coach: Omit<Coach, 'id'>) => Coach;
  deleteCoach: (coachId: string) => void;
  updateClass: (gymClass: GymClass) => void;
  addClass: (gymClass: Omit<GymClass, 'id'>) => void;
  deleteClass: (classId: string) => void;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'currency' | 'createdAt'> & { currency?: Transaction['currency'] }) => Transaction;
  updateTransaction: (transactionId: string, updates: Partial<Transaction>) => void;
  bookCoachSlot: (slotId: string, member: Member, participantName: string) => void;
  addGuestBooking: (entry: Omit<GuestBooking, 'id'>) => void;
  acknowledgeBookingAlert: (alertId: string, actor?: AppUser) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [coaches, setCoaches] = useState<Coach[]>(COACHES);
  const [classes, setClasses] = useState<GymClass[]>(CLASSES);
  const [members, setMembers] = useState<Member[]>(MEMBERS);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>(FAMILY_MEMBERS);
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [coachAvailability, setCoachAvailability] = useState<AvailabilitySlot[]>(COACH_AVAILABILITY);
  const [unavailableSlots, setUnavailableSlots] = useState<UnavailableSlot[]>(UNAVAILABLE_SLOTS);
  const [gymAccessLogs, setGymAccessLogs] = useState<GymAccessLog[]>(GYM_ACCESS_LOGS);
  const [notifications, setNotifications] = useState<ClassTransferNotification[]>(INITIAL_NOTIFICATIONS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [coachSlots, setCoachSlots] = useState<CoachSlot[]>(COACH_SLOTS);
  const [coachAppointments, setCoachAppointments] = useState<CoachAppointment[]>(INITIAL_COACH_APPOINTMENTS);
  const [guestBookings, setGuestBookings] = useState<GuestBooking[]>([]);
  const [bookingAlerts, setBookingAlerts] = useState<BookingAlert[]>([]);

  const addAuditLog = (log: Omit<AuditLog, 'id'>) => {
    const newLog: AuditLog = { ...log, id: `log-${Date.now()}` };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const addTransaction = (transaction: Omit<Transaction, 'id' | 'currency' | 'createdAt'> & { currency?: Transaction['currency'] }) => {
    const newTransaction: Transaction = {
      id: `tx-${Date.now()}`,
      currency: transaction.currency ?? 'GBP',
      createdAt: new Date().toISOString(),
      ...transaction,
    };
    setTransactions(prev => [newTransaction, ...prev]);
    return newTransaction;
  };

  const updateTransaction = (transactionId: string, updates: Partial<Transaction>) => {
    setTransactions(prev => prev.map(tx => tx.id === transactionId ? { ...tx, ...updates } : tx));
  };

  const getOwnerId = (): string => {
    const admin = coaches.find(c => c.role === UserRole.ADMIN);
    return admin?.id ?? coaches[0]?.id ?? '';
  };

  const addBookingAlert = (
    targetCoachId: string,
    message: string,
    meta?: Partial<Omit<BookingAlert, 'id' | 'timestamp' | 'coachId' | 'message' | 'status'>>
  ) => {
    if (!targetCoachId) return;
    setBookingAlerts(prev => [{
      id: `alert-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      coachId: targetCoachId,
      message,
      status: 'PENDING',
      ...meta,
    }, ...prev]);
  };

  const acknowledgeBookingAlert = (alertId: string, actor?: AppUser) => {
    setBookingAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { 
            ...alert, 
            status: 'ACKNOWLEDGED',
            confirmedBy: actor?.name ?? alert.confirmedBy,
            confirmedAt: new Date().toISOString(),
          }
        : alert
    ));
  };

  const notifyCoachAndOwner = (
    coachId: string, 
    message: string,
    meta?: Partial<Omit<BookingAlert, 'id' | 'timestamp' | 'coachId' | 'message' | 'status'>>
  ) => {
    const ownerId = getOwnerId();
    [coachId, ownerId].forEach(id => addBookingAlert(id, message, meta));

    const coach = coaches.find(c => c.id === coachId);
    if (coach?.mobileNumber) {
      sendWhatsAppNotification(coach.mobileNumber, message);
    }
    const owner = coaches.find(c => c.id === ownerId);
    if (owner?.mobileNumber && owner.id !== coachId) {
      sendWhatsAppNotification(owner.mobileNumber, message);
    }
  };

  const bookCoachSlot = (slotId: string, member: Member, participantName: string) => {
    const slot = coachSlots.find(s => s.id === slotId);
    if (!slot) return;

    const appointment: CoachAppointment = {
      id: `appt-${Date.now()}`,
      slotId,
      memberId: member.id,
      participantName,
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
    };

    setCoachAppointments(prev => [appointment, ...prev]);

    addTransaction({
      memberId: member.id,
      coachId: slot.coachId,
      slotId,
      amount: slot.price,
      source: slot.type === SlotType.PRIVATE ? TransactionSource.PRIVATE_SESSION : TransactionSource.GROUP_SESSION,
      status: TransactionStatus.PAID,
      description: slot.title,
      settledAt: new Date().toISOString(),
    });

    addAuditLog({
      timestamp: new Date().toISOString(),
      actorId: member.id,
      action: 'MEMBER_BOOKED_CLASS',
      details: `${member.name} scheduled ${slot.title} with ${coaches.find(c => c.id === slot.coachId)?.name ?? 'coach'}.`,
    });

    const message = `Client: ${participantName} booked ${slot.title} on ${new Date(slot.start).toLocaleString()}. Please confirm.`;
    notifyCoachAndOwner(slot.coachId, message, {
      serviceType: slot.type === SlotType.PRIVATE ? 'PRIVATE' : 'CLASS',
      referenceId: slot.id,
      participantName,
      amount: slot.price,
    });
  };

  const addGuestBooking = (entry: Omit<GuestBooking, 'id'>) => {
    const booking: GuestBooking = {
      id: `guest-${Date.now()}`,
      ...entry,
    };
    setGuestBookings(prev => [booking, ...prev]);
    if (entry.referenceId) {
      if (entry.serviceType === 'CLASS') {
        const gymClass = classes.find(cls => cls.id === entry.referenceId);
        if (gymClass) {
          const message = `Client: ${entry.participantName} booked ${gymClass.name} on ${new Date(entry.date).toLocaleString()}. Please confirm.`;
          notifyCoachAndOwner(gymClass.coachId, message, {
            serviceType: 'CLASS',
            referenceId: gymClass.id,
            participantName: entry.participantName,
            amount: gymClass.price,
          });
        }
      } else {
        const slot = coachSlots.find(slot => slot.id === entry.referenceId);
        if (slot) {
          const message = `Client: ${entry.participantName} booked ${slot.title} on ${new Date(entry.date).toLocaleString()}. Please confirm.`;
          notifyCoachAndOwner(slot.coachId, message, {
            serviceType: 'PRIVATE',
            referenceId: slot.id,
            participantName: entry.participantName,
            amount: slot.price,
          });
        }
      }
    }
  };
  // --- Notification and Class Transfer Logic ---
  
  const createClassTransferRequest = (classId: string, targetCoachId: string, note: string, actor: AppUser) => {
    const gymClass = classes.find(c => c.id === classId);
    const targetCoach = coaches.find(c => c.id === targetCoachId);
    if (!gymClass || !targetCoach || !actor) return;

    const newNotification: ClassTransferNotification = {
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString(),
      classId,
      requestingCoachId: actor.id,
      targetCoachId,
      status: NotificationStatus.PENDING,
      note,
    };
    setNotifications(prev => [newNotification, ...prev]);
    addAuditLog({
      timestamp: new Date().toISOString(),
      actorId: actor.id,
      action: 'CLASS_TRANSFER_REQUESTED',
      details: `${actor.name} requested ${targetCoach.name} to cover the class "${gymClass.name}".`,
    });
  };

  const acceptClassTransfer = (notificationId: string, actor: AppUser) => {
    const notification = notifications.find(n => n.id === notificationId);
    if (!notification || notification.status !== NotificationStatus.PENDING) return;
    
    const gymClass = classes.find(c => c.id === notification.classId);
    const originalCoach = coaches.find(c => c.id === notification.requestingCoachId);
    if (!gymClass || !originalCoach) return;
    
    // Update class with new coach and store original coach
    setClasses(prev => prev.map(c => 
      c.id === notification.classId 
        ? { ...c, originalCoachId: c.coachId, coachId: notification.targetCoachId } 
        : c
    ));

    // Update notification status
    setNotifications(prev => prev.map(n => 
      n.id === notificationId ? { ...n, status: NotificationStatus.ACCEPTED } : n
    ));
    
    addAuditLog({
      timestamp: new Date().toISOString(),
      actorId: actor.id,
      action: 'CLASS_TRANSFER_ACCEPTED',
      details: `${actor.name} accepted the request to cover "${gymClass.name}" for ${originalCoach.name}.`,
    });
  };

  const undoClassTransfer = (classId: string, actor: AppUser) => {
    const gymClass = classes.find(c => c.id === classId);
    if (!gymClass || !gymClass.originalCoachId) return;

    const originalCoach = coaches.find(c => c.id === gymClass.originalCoachId);
    if(!originalCoach) return;

    // Find the accepted notification to mark it as undone
    const relatedNotification = notifications.find(n => n.classId === classId && n.status === NotificationStatus.ACCEPTED);
    if (relatedNotification) {
        setNotifications(prev => prev.map(n => 
            n.id === relatedNotification.id ? { ...n, status: NotificationStatus.UNDONE } : n
        ));
    }
    
    // Revert class to original coach
    const revertedCoachId = gymClass.originalCoachId;
    setClasses(prev => prev.map(c => 
      c.id === classId ? { ...c, coachId: revertedCoachId, originalCoachId: undefined } : c
    ));

    addAuditLog({
      timestamp: new Date().toISOString(),
      actorId: actor.id,
      action: 'CLASS_TRANSFER_UNDONE',
      details: `${actor.name} undid the transfer for "${gymClass.name}". Class was returned to ${originalCoach.name}.`,
    });
  };

  const cancelClassTransferRequest = (notificationId: string, actor: AppUser) => {
    const notification = notifications.find(n => n.id === notificationId);
    if (!notification || notification.status !== NotificationStatus.PENDING) return;
    
    const gymClass = classes.find(c => c.id === notification.classId);
    const targetCoach = coaches.find(c => c.id === notification.targetCoachId);
    if (!gymClass || !targetCoach) return;
    
    setNotifications(prev => prev.map(n => 
      n.id === notificationId ? { ...n, status: NotificationStatus.CANCELED } : n
    ));
    
    addAuditLog({
      timestamp: new Date().toISOString(),
      actorId: actor.id,
      action: 'CLASS_TRANSFER_CANCELED',
      details: `${actor.name} canceled the cover request sent to ${targetCoach.name} for "${gymClass.name}".`,
    });
  };


  const addBooking = (booking: Omit<Booking, 'id' | 'bookingDate'>, actor: AppUser) => {
    const newBooking: Booking = {
      ...booking,
      id: `b${Date.now()}`,
      bookingDate: new Date().toISOString(),
      attended: false,
    };

    const allParticipants = [...members, ...familyMembers];
    const participant = allParticipants.find(p => p.id === booking.participantId);
    const gymClass = classes.find(c => c.id === booking.classId);

    if (participant && gymClass) {
        let action: AuditLog['action'] = 'MEMBER_BOOKED_CLASS';
        let details = `${participant.name} was booked into ${gymClass.name}.`;
        if (actor.id !== booking.memberId) { // Admin/Coach action
            action = 'MEMBER_ADDED_TO_CLASS';
            details = `${actor.name} added ${participant.name} to ${gymClass.name}.`;
        } else if (actor.id !== booking.participantId) { // Parent booking for child
             details = `${actor.name} booked ${participant.name} into ${gymClass.name}.`;
        }
        addAuditLog({
            timestamp: new Date().toISOString(),
            actorId: actor.id,
            action,
            details,
        });

        addTransaction({
            memberId: booking.memberId,
            coachId: gymClass.coachId,
            bookingId: newBooking.id,
            amount: gymClass.price,
            source: TransactionSource.CLASS,
            status: booking.paid ? TransactionStatus.PAID : TransactionStatus.PENDING,
            description: `${gymClass.name}`,
            settledAt: booking.paid ? new Date().toISOString() : undefined,
        });

        const message = `Client: ${participant.name} booked ${gymClass.name} (${gymClass.day} ${gymClass.time}). Please confirm.`;
        notifyCoachAndOwner(gymClass.coachId, message, {
          serviceType: 'CLASS',
          referenceId: gymClass.id,
          participantName: participant.name,
          amount: gymClass.price,
        });
    }

    setBookings(prev => [...prev, newBooking]);
  };
  
  const deleteBooking = (bookingId: string, actor: AppUser) => {
    const bookingToDelete = bookings.find(b => b.id === bookingId);
    if (bookingToDelete) {
        const allParticipants = [...members, ...familyMembers];
        const participant = allParticipants.find(p => p.id === bookingToDelete.participantId);
        const gymClass = classes.find(c => c.id === bookingToDelete.classId);
        if (participant && gymClass) {
            addAuditLog({
                timestamp: new Date().toISOString(),
                actorId: actor.id,
                action: 'MEMBER_REMOVED_FROM_CLASS',
                details: `${actor.name} removed ${participant.name} from ${gymClass.name}.`,
            });
        }

        setTransactions(prev => prev.map(tx => 
            tx.bookingId === bookingId 
                ? { ...tx, status: TransactionStatus.REFUNDED, settledAt: new Date().toISOString() }
                : tx
        ));
    }

    setBookings(prev => prev.filter(b => b.id !== bookingId));
  };

  const updateBooking = (bookingId: string, newClassId: string, actor: AppUser) => {
     const bookingToUpdate = bookings.find(b => b.id === bookingId);
     if (bookingToUpdate) {
        const allParticipants = [...members, ...familyMembers];
        const participant = allParticipants.find(p => p.id === bookingToUpdate.participantId);
        const oldClass = classes.find(c => c.id === bookingToUpdate.classId);
        const newClass = classes.find(c => c.id === newClassId);
        if (participant && oldClass && newClass) {
            addAuditLog({
                timestamp: new Date().toISOString(),
                actorId: actor.id,
                action: 'MEMBER_TRANSFERRED_CLASS',
                details: `${actor.name} transferred ${participant.name} from ${oldClass.name} to ${newClass.name}.`,
            });
        }
    }
    setBookings(prev => prev.map(b => (b.id === bookingId ? { ...b, classId: newClassId } : b)));
  };

  const toggleAttendance = (bookingId: string) => {
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, attended: !b.attended } : b));
  };

  const updateMember = (updatedMember: Member) => {
    setMembers(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m));
  };
  
  const addMember = (newMemberData: Omit<Member, 'id'>) => {
    const newMember: Member = { ...newMemberData, id: `m${Date.now()}` };
    setMembers(prev => [...prev, newMember]);
    return newMember;
  };
  
  const deleteMember = (memberId: string) => {
    // Delete member, their bookings, and their family members' profiles & bookings
    setMembers(prev => prev.filter(m => m.id !== memberId));
    setFamilyMembers(prev => prev.filter(fm => fm.parentId !== memberId));
    setBookings(prev => prev.filter(b => b.memberId !== memberId));
  };

  const addFamilyMember = (newFamilyMemberData: Omit<FamilyMember, 'id'>) => {
    const newFamilyMember: FamilyMember = { ...newFamilyMemberData, id: `fm${Date.now()}` };
    setFamilyMembers(prev => [...prev, newFamilyMember]);
  };

  const deleteFamilyMember = (familyMemberId: string) => {
    setFamilyMembers(prev => prev.filter(fm => fm.id !== familyMemberId));
    // Also remove any bookings for that family member
    setBookings(prev => prev.filter(b => b.participantId !== familyMemberId));
  };


  const updateCoach = (updatedCoach: Coach) => {
    setCoaches(prev => prev.map(c => c.id === updatedCoach.id ? updatedCoach : c));
  };

  const addCoach = (newCoachData: Omit<Coach, 'id'>): Coach => {
     const newCoach: Coach = { ...newCoachData, id: `c${Date.now()}` };
     setCoaches(prev => [...prev, newCoach]);
     return newCoach;
  };

  const deleteCoach = (coachId: string) => {
    const isAssignedToClass = classes.some(c => c.coachId === coachId);
    if (isAssignedToClass) {
      alert("Cannot delete coach. They are currently assigned to one or more classes. Please reassign the classes first.");
      return;
    }

    // Un-assign coach from any members
    setMembers(prevMembers =>
      prevMembers.map(member =>
        member.coachId === coachId ? { ...member, coachId: null } : member
      )
    );

    setCoaches(prev => prev.filter(c => c.id !== coachId));
  };
  
  const updateClass = (updatedClass: GymClass) => {
    setClasses(prev => prev.map(c => c.id === updatedClass.id ? updatedClass : c));
  };

  const addClass = (newClassData: Omit<GymClass, 'id'>) => {
    const newClass: GymClass = { ...newClassData, id: `cl${Date.now()}` };
    setClasses(prev => [...prev, newClass]);
  };

  const deleteClass = (classId: string) => {
    setClasses(prev => prev.filter(c => c.id !== classId));
    setBookings(prev => prev.filter(b => b.classId !== classId));
  };
  
  const addAvailabilitySlot = (newSlotData: Omit<AvailabilitySlot, 'id'>) => {
    const newSlot: AvailabilitySlot = { ...newSlotData, id: `av${Date.now()}` };
    setCoachAvailability(prev => [...prev, newSlot].sort((a, b) => {
        const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        if (dayOrder.indexOf(a.day) !== dayOrder.indexOf(b.day)) {
            return dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
        }
        return a.startTime.localeCompare(b.startTime);
    }));
  };

  const deleteAvailabilitySlot = (slotId: string) => {
    setCoachAvailability(prev => prev.filter(s => s.id !== slotId));
  };
  
  const addUnavailableSlot = (newSlotData: Omit<UnavailableSlot, 'id'>) => {
    const newSlot: UnavailableSlot = { ...newSlotData, id: `uav-${Date.now()}` };
    setUnavailableSlots(prev => [...prev, newSlot].sort((a,b) => a.date.localeCompare(b.date)));
  }

  const deleteUnavailableSlot = (slotId: string) => {
    setUnavailableSlots(prev => prev.filter(s => s.id !== slotId));
  }

  const logGymAccess = (memberId: string, amount: number, paid: boolean = false) => {
    const newLog: GymAccessLog = {
        id: `ga-${Date.now()}`,
        memberId,
        amountPaid: amount,
        accessDate: new Date().toISOString(),
        paid,
        notes: paid ? 'Payment confirmed via Stripe' : 'Charge raised - awaiting Stripe payment',
    };
    setGymAccessLogs(prev => [newLog, ...prev]);

    addTransaction({
      memberId,
      amount,
      source: TransactionSource.GYM_PASS,
      status: paid ? TransactionStatus.PAID : TransactionStatus.PENDING,
      description: 'Gym-only access',
      settledAt: paid ? new Date().toISOString() : undefined,
    });
  };


  return (
    <DataContext.Provider value={{ coaches, classes, members, familyMembers, bookings, auditLogs, coachAvailability, unavailableSlots, gymAccessLogs, notifications, transactions, coachSlots, coachAppointments, guestBookings, bookingAlerts, createClassTransferRequest, acceptClassTransfer, undoClassTransfer, cancelClassTransferRequest, logGymAccess, addAvailabilitySlot, deleteAvailabilitySlot, addUnavailableSlot, deleteUnavailableSlot, addBooking, deleteBooking, updateBooking, toggleAttendance, updateMember, addMember, deleteMember, addFamilyMember, deleteFamilyMember, updateCoach, addCoach, deleteCoach, updateClass, addClass, deleteClass, addTransaction, updateTransaction, bookCoachSlot, addGuestBooking, acknowledgeBookingAlert }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
