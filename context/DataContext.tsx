import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Coach, GymClass, Member, Booking, AuditLog, AppUser, FamilyMember, AvailabilitySlot, GymAccessLog, UnavailableSlot, ClassTransferNotification, NotificationStatus, Transaction, TransactionSource, TransactionStatus, CoachSlot, CoachAppointment, SlotType, GuestBooking, BookingAlert, UserRole, ConfirmationStatus } from '../types';
import { COACHES, CLASSES, MEMBERS, INITIAL_BOOKINGS, FAMILY_MEMBERS, COACH_AVAILABILITY, GYM_ACCESS_LOGS, UNAVAILABLE_SLOTS, INITIAL_NOTIFICATIONS, INITIAL_TRANSACTIONS, COACH_SLOTS, INITIAL_COACH_APPOINTMENTS } from '../constants';
import { supabase, getSupabase } from '../services/supabaseClient';
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
  refreshData: () => Promise<void>;
  createClassTransferRequest: (classId: string, targetCoachId: string, note: string, actor: AppUser) => void;
  acceptClassTransfer: (notificationId: string, actor: AppUser) => void;
  undoClassTransfer: (classId: string, actor: AppUser) => void;
  cancelClassTransferRequest: (notificationId: string, actor: AppUser) => void;
  logGymAccess: (memberId: string, amount: number, paid?: boolean) => void;
  addAvailabilitySlot: (slot: Omit<AvailabilitySlot, 'id'>) => void;
  deleteAvailabilitySlot: (slotId: string) => void;
  addUnavailableSlot: (slot: Omit<UnavailableSlot, 'id'>) => void;
  deleteUnavailableSlot: (slotId: string) => void;
  addBooking: (booking: Omit<Booking, 'id' | 'bookingDate'> & { stripeSessionId?: string }, actor: AppUser) => Promise<void>;
  deleteBooking: (bookingId: string, actor: AppUser) => Promise<void>;
  updateBooking: (bookingId: string, newClassId: string, actor: AppUser) => void;
  toggleAttendance: (bookingId: string) => void;
  updateMember: (member: Member) => void;
  addMember: (member: Omit<Member, 'id'>) => Promise<Member>;
  deleteMember: (memberId: string) => void;
  addFamilyMember: (familyMember: Omit<FamilyMember, 'id'>) => void;
  deleteFamilyMember: (familyMemberId: string) => void;
  updateCoach: (coach: Coach) => Promise<void>;
  addCoach: (coach: Omit<Coach, 'id'>) => Coach;
  deleteCoach: (coachId: string) => void;
  updateClass: (gymClass: GymClass) => void;
  addClass: (gymClass: Omit<GymClass, 'id'>) => void;
  deleteClass: (classId: string) => void;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'currency' | 'createdAt'> & { currency?: Transaction['currency'] }) => Transaction;
  updateTransaction: (transactionId: string, updates: Partial<Transaction>) => void;
  bookCoachSlot: (slotId: string, member: Member, participantName: string, stripeSessionId?: string) => Promise<void>;
  addGuestBooking: (entry: Omit<GuestBooking, 'id' | 'status' | 'createdAt'>) => Promise<void>;
  cancelBooking: (bookingId: string, actor: AppUser, options?: { allowLate?: boolean; issueRefund?: boolean }) => Promise<{ success: boolean; message: string }>;
  cancelCoachAppointment: (appointmentId: string, actor: AppUser, options?: { allowLate?: boolean; issueRefund?: boolean }) => Promise<{ success: boolean; message: string }>;
  cancelGuestBooking: (guestBookingId: string, actor: AppUser, options?: { allowLate?: boolean }) => Promise<{ success: boolean; message: string }>;
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
  
  const loadData = async () => {
    try {
      const response = await fetch('/server-api/bootstrap-data');
      if (response.ok) {
        const data = await response.json();
        setCoaches(data.coaches);
        setMembers(data.members);
        setFamilyMembers(data.familyMembers);
        setClasses(data.classes);
        setBookings(data.bookings);
        setCoachSlots(data.coachSlots);
        setCoachAppointments(data.coachAppointments);
        setTransactions(data.transactions);
        setGuestBookings(data.guestBookings);
        return;
      }
    } catch (error) {
      console.error('Bootstrap data fetch failed', error);
    }

    const supabaseClient = getSupabase();
    if (!supabaseClient) {
      console.warn('Supabase client not available, using local data only');
      return;
    }
    try {
      const [coachesRes, membersRes, familyRes, classesRes, bookingsRes, slotsRes, apptsRes, txRes, guestRes, classCoachesRes, slotCoachesRes] =
        await Promise.all([
          supabaseClient.from('coaches').select('*'),
          supabaseClient.from('members').select('*'),
          supabaseClient.from('family_members').select('*'),
          supabaseClient.from('classes').select('*'),
          supabaseClient.from('bookings').select('*'),
          supabaseClient.from('coach_slots').select('*'),
          supabaseClient.from('coach_appointments').select('*'),
          supabaseClient.from('transactions').select('*'),
          supabaseClient.from('guest_bookings').select('*'),
          supabaseClient.from('class_coaches').select('*'),
          supabaseClient.from('slot_coaches').select('*'),
        ]);

      if (!coachesRes.error && coachesRes.data) {
        const mapped = (coachesRes.data as any[]).map(row => ({
          id: row.id,
          name: row.name,
          email: row.email,
          role: row.role,
          level: row.level,
          bio: row.bio,
          imageUrl: row.image_url,
          mobileNumber: row.mobile_number,
          bankDetails: row.bank_details,
          whatsappAutoReplyEnabled: row.whatsapp_auto_reply_enabled ?? true,
          whatsappAutoReplyMessage: row.whatsapp_auto_reply_message || undefined,
        })) as Coach[];
        setCoaches(mapped);
      }
      if (!membersRes.error && membersRes.data) setMembers(membersRes.data as Member[]);
      if (!familyRes.error && familyRes.data) setFamilyMembers(familyRes.data as FamilyMember[]);
      
      // Map classes with multiple coaches from junction table
      if (!classesRes.error && classesRes.data) {
        const classCoachMap: Record<string, string[]> = {};
        if (!classCoachesRes.error && classCoachesRes.data) {
          (classCoachesRes.data as any[]).forEach(cc => {
            if (!classCoachMap[cc.class_id]) {
              classCoachMap[cc.class_id] = [];
            }
            classCoachMap[cc.class_id].push(cc.coach_id);
          });
        }
        const mappedClasses = (classesRes.data as any[]).map(row => {
          const coachIds = classCoachMap[row.id] || [];
          return {
            id: row.id,
            name: row.name,
            description: row.description,
            day: row.day,
            time: row.time,
            coachId: row.coach_id,
            coachIds: coachIds.length > 0 ? coachIds : undefined,
            capacity: row.capacity,
            price: Number(row.price),
            minAge: row.min_age,
            maxAge: row.max_age,
            originalCoachId: row.original_coach_id,
          } as GymClass;
        });
        setClasses(mappedClasses);
      }
      if (!bookingsRes.error && bookingsRes.data) {
        const mapped = bookingsRes.data.map((b: any) => ({
          id: b.id,
          memberId: b.member_id,
          participantId: b.participant_id || b.participant_family_id || b.member_id,
          classId: b.class_id,
          bookingDate: b.booking_date,
          paid: b.paid,
          attended: b.attended,
          confirmationStatus: b.confirmation_status,
          sessionStart: b.session_start,
        })) as Booking[];
        setBookings(mapped);
      }
        if (!slotsRes.error && slotsRes.data) {
          // Map slots with multiple coaches
          const slotCoachMap: Record<string, string[]> = {};
          if (!slotCoachesRes.error && slotCoachesRes.data) {
            (slotCoachesRes.data as any[]).forEach(sc => {
              if (!slotCoachMap[sc.slot_id]) {
                slotCoachMap[sc.slot_id] = [];
              }
              slotCoachMap[sc.slot_id].push(sc.coach_id);
            });
          }
          const mapped = (slotsRes.data as any[]).map(row => {
            const coachIds = slotCoachMap[row.id] || [];
            return {
              id: row.id,
              coachId: row.coach_id,
              coachIds: coachIds.length > 1 ? coachIds : undefined,
              type: row.type,
              title: row.title,
              description: row.description,
              start: row.start,
              end: row.end,
              capacity: row.capacity,
              price: Number(row.price),
              location: row.location,
            } as CoachSlot;
          });
          setCoachSlots(mapped);
        }
      if (!apptsRes.error && apptsRes.data) {
        const mapped = (apptsRes.data as any[]).map(row => ({
          id: row.id,
          slotId: row.slot_id,
          memberId: row.member_id,
          participantName: row.participant_name,
          status: row.status,
          createdAt: row.created_at,
        })) as CoachAppointment[];
        setCoachAppointments(mapped);
      }
      if (!txRes.error && txRes.data) {
        const mapped = (txRes.data as any[]).map(row => ({
          id: row.id,
          memberId: row.member_id,
          coachId: row.coach_id,
          bookingId: row.booking_id,
          slotId: row.slot_id,
          amount: Number(row.amount),
          currency: row.currency,
          source: row.source,
          status: row.status,
          description: row.description,
          stripeSessionId: row.stripe_session_id,
          createdAt: row.created_at,
          settledAt: row.settled_at,
          confirmationStatus: row.confirmation_status,
        })) as Transaction[];
        setTransactions(mapped);
      }
      if (!guestRes.error && guestRes.data) {
        const mapped = (guestRes.data as any[]).map(row => ({
          id: row.id,
          serviceType: row.service_type,
          referenceId: row.reference_id,
          title: row.title,
          date: row.date,
          participantName: row.participant_name,
          contactName: row.contact_name,
          contactEmail: row.contact_email,
          contactPhone: row.contact_phone,
          status: row.status,
          createdAt: row.created_at,
        })) as GuestBooking[];
        setGuestBookings(mapped);
      }
    } catch (error) {
      console.error('Failed to load data from Supabase', error);
    }
  };

  const refreshData = async () => {
    await loadData();
  };

  useEffect(() => {
    loadData();
  }, []);
  const CANCELLATION_WINDOW_MS = 24 * 60 * 60 * 1000;

  const addAuditLog = (log: Omit<AuditLog, 'id'>) => {
    const newLog: AuditLog = { ...log, id: `log-${Date.now()}` };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const addTransaction = (transaction: Omit<Transaction, 'id' | 'currency' | 'createdAt'> & { currency?: Transaction['currency'] }) => {
    const newTransaction: Transaction = {
      id: `tx-${Date.now()}`,
      currency: transaction.currency ?? 'GBP',
      createdAt: new Date().toISOString(),
      confirmationStatus: transaction.confirmationStatus ?? 'CONFIRMED',
      ...transaction,
    };
    setTransactions(prev => [newTransaction, ...prev]);
    if (supabase) {
      supabase.from('transactions').insert({
        id: newTransaction.id,
        member_id: newTransaction.memberId,
        coach_id: newTransaction.coachId,
        booking_id: newTransaction.bookingId,
        slot_id: newTransaction.slotId,
        amount: newTransaction.amount,
        currency: newTransaction.currency,
        source: newTransaction.source,
        status: newTransaction.status,
        description: newTransaction.description,
        stripe_session_id: newTransaction.stripeSessionId,
        confirmation_status: newTransaction.confirmationStatus,
        created_at: newTransaction.createdAt,
        settled_at: newTransaction.settledAt,
      }).then(({ error }) => {
        if (error) console.error('Supabase: insert transaction failed', error.message);
      });
    }
    return newTransaction;
  };

  const updateTransaction = async (transactionId: string, updates: Partial<Transaction>) => {
    setTransactions(prev => prev.map(tx => tx.id === transactionId ? { ...tx, ...updates } : tx));
    // Use server API to update transaction (requires admin permissions)
    try {
      const payload: any = {};
      if (updates.status) payload.status = updates.status;
      if (updates.confirmationStatus) payload.confirmation_status = updates.confirmationStatus;
      if (updates.settledAt) payload.settled_at = updates.settledAt;
      if (updates.description) payload.description = updates.description;
      if (updates.paymentMethod) payload.payment_method = updates.paymentMethod;
      if (updates.billingFrequency) payload.billing_frequency = updates.billingFrequency;
      if (updates.stripeCustomerId) payload.stripe_customer_id = updates.stripeCustomerId;
      if (updates.stripeSubscriptionId) payload.stripe_subscription_id = updates.stripeSubscriptionId;
      
      const response = await fetch('/server-api/update-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId, updates: payload }),
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to update transaction:', error);
      } else {
        console.log(`[DataContext] Transaction ${transactionId} updated:`, updates);
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
    }
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

  const markBookingConfirmed = (bookingId?: string) => {
    if (!bookingId) return;
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, confirmationStatus: 'CONFIRMED' } : b));
  };

  const markGuestBookingConfirmed = (guestBookingId?: string) => {
    if (!guestBookingId) return;
    setGuestBookings(prev => prev.map(g => g.id === guestBookingId ? { ...g, status: 'CONFIRMED' } : g));
  };

  const acknowledgeBookingAlert = (alertId: string, actor?: AppUser) => {
    setBookingAlerts(prev => prev.map(alert => {
      if (alert.id !== alertId) return alert;
      if (alert.transactionId) {
        const linkedTx = transactions.find(tx => tx.id === alert.transactionId);
        if (linkedTx) {
          updateTransaction(alert.transactionId, {
            confirmationStatus: 'CONFIRMED',
            status: TransactionStatus.PAID,
          });
          if (linkedTx.bookingId) {
            markBookingConfirmed(linkedTx.bookingId);
          }
        }
      }
      if (alert.guestBookingId) {
        markGuestBookingConfirmed(alert.guestBookingId);
      }
      return {
        ...alert,
        status: 'ACKNOWLEDGED',
        confirmedBy: actor?.name ?? alert.confirmedBy,
        confirmedAt: new Date().toISOString(),
      };
    }));
  };

  const processStripeRefund = async (sessionId: string) => {
    try {
      const response = await fetch('/server-api/refund-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to issue Stripe refund.');
      }
      return true;
    } catch (error) {
      console.error('Stripe refund error:', error);
      return false;
    }
  };

  const notifyCoachAndOwner = async (
    coachId: string, 
    message: string,
    meta?: Partial<Omit<BookingAlert, 'id' | 'timestamp' | 'coachId' | 'message' | 'status'>>
  ) => {
    const ownerId = getOwnerId();
    [coachId, ownerId].forEach(id => addBookingAlert(id, message, meta));

    const coach = coaches.find(c => c.id === coachId);
    if (coach?.mobileNumber) {
      await sendWhatsAppNotification(coach.mobileNumber, message);
    }
    const owner = coaches.find(c => c.id === ownerId);
    if (owner?.mobileNumber && owner.id !== coachId) {
      await sendWhatsAppNotification(owner.mobileNumber, message);
    }
  };

  const isRefundEligible = (sessionStart?: string | Date | null) => {
    if (!sessionStart) return false;
    const date = sessionStart instanceof Date ? sessionStart : new Date(sessionStart);
    return date.getTime() - Date.now() >= CANCELLATION_WINDOW_MS;
  };

  const closeAlerts = (predicate: (alert: BookingAlert) => boolean, actor?: AppUser) => {
    setBookingAlerts(prev => prev.map(alert => predicate(alert) ? {
      ...alert,
      status: 'ACKNOWLEDGED',
      confirmedBy: actor?.name ?? alert.confirmedBy,
      confirmedAt: new Date().toISOString(),
    } : alert));
  };

  const bookCoachSlot = async (slotId: string, member: Member, participantName: string, stripeSessionId?: string) => {
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
    if (supabase) {
      supabase.from('coach_appointments').insert({
        id: appointment.id,
        slot_id: slotId,
        member_id: member.id,
        participant_name: participantName,
        status: appointment.status,
        created_at: appointment.createdAt,
      }).then(({ error }) => {
        if (error) console.error('Supabase: insert coach appointment failed', error.message);
      });
    }

    const transaction = addTransaction({
      memberId: member.id,
      coachId: slot.coachId,
      slotId,
      amount: slot.price,
      source: slot.type === SlotType.PRIVATE ? TransactionSource.PRIVATE_SESSION : TransactionSource.GROUP_SESSION,
      status: TransactionStatus.PAID,
      description: slot.title,
      settledAt: new Date().toISOString(),
      confirmationStatus: 'PENDING',
      stripeSessionId,
    });

    addAuditLog({
      timestamp: new Date().toISOString(),
      actorId: member.id,
      action: 'MEMBER_BOOKED_CLASS',
      details: `${member.name} scheduled ${slot.title} with ${coaches.find(c => c.id === slot.coachId)?.name ?? 'coach'}.`,
    });

    const message = `Client: ${participantName} booked ${slot.title} on ${new Date(slot.start).toLocaleString()}. Please confirm.`;
    await notifyCoachAndOwner(slot.coachId, message, {
      serviceType: slot.type === SlotType.PRIVATE ? 'PRIVATE' : 'CLASS',
      referenceId: slot.id,
      participantName,
      amount: slot.price,
      transactionId: transaction.id,
    });
  };

  const addGuestBooking = async (entry: Omit<GuestBooking, 'id' | 'status' | 'createdAt'>) => {
    const booking: GuestBooking = {
      id: `guest-${Date.now()}`,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      ...entry,
    };
    setGuestBookings(prev => [booking, ...prev]);
    if (supabase) {
      supabase.from('guest_bookings').insert({
        id: booking.id,
        service_type: booking.serviceType,
        reference_id: booking.referenceId,
        title: booking.title,
        date: booking.date,
        participant_name: booking.participantName,
        contact_name: booking.contactName,
        contact_email: booking.contactEmail,
        contact_phone: booking.contactPhone,
        status: booking.status,
        created_at: booking.createdAt,
      }).then(({ error }) => {
        if (error) console.error('Supabase: insert guest booking failed', error.message);
      });
    }
    if (entry.referenceId) {
      if (entry.serviceType === 'CLASS') {
        const gymClass = classes.find(cls => cls.id === entry.referenceId);
        if (gymClass) {
          const message = `Client: ${entry.participantName} booked ${gymClass.name} on ${new Date(entry.date).toLocaleString()}. Please confirm.`;
          await notifyCoachAndOwner(gymClass.coachId, message, {
            serviceType: 'CLASS',
            referenceId: gymClass.id,
            participantName: entry.participantName,
            amount: gymClass.price,
            guestBookingId: booking.id,
          });
        }
      } else {
        const slot = coachSlots.find(slot => slot.id === entry.referenceId);
        if (slot) {
          const message = `Client: ${entry.participantName} booked ${slot.title} on ${new Date(entry.date).toLocaleString()}. Please confirm.`;
          await notifyCoachAndOwner(slot.coachId, message, {
            serviceType: 'PRIVATE',
            referenceId: slot.id,
            participantName: entry.participantName,
            amount: slot.price,
            guestBookingId: booking.id,
          });
        }
      }
    }
  };

  const cancelBooking = async (bookingId: string, actor: AppUser, options?: { allowLate?: boolean; issueRefund?: boolean }) => {
    const bookingToCancel = bookings.find(b => b.id === bookingId);
    if (!bookingToCancel) {
      return { success: false, message: 'Booking not found.' };
    }
    const gymClass = classes.find(c => c.id === bookingToCancel.classId);
    const participant = [...members, ...familyMembers].find(p => p.id === bookingToCancel.participantId);
    const sessionDate = bookingToCancel.sessionStart ? new Date(bookingToCancel.sessionStart) : null;
    const refundEligible = bookingToCancel.paid && isRefundEligible(sessionDate);
    if (!refundEligible && !options?.allowLate) {
      return { success: false, message: 'This class starts within 24 hours. Please contact the gym to cancel.' };
    }
    const shouldRefund = options?.issueRefund ?? refundEligible;

    const tx = transactions.find(tx => tx.bookingId === bookingId);
    if (shouldRefund) {
      if (tx?.stripeSessionId) {
        const refundOk = await processStripeRefund(tx.stripeSessionId);
        if (!refundOk) {
          return { success: false, message: 'Unable to refund via Stripe. Please try again or refund manually.' };
        }
      } else {
        return { success: false, message: 'Payment reference not found. Please refund manually in Stripe before canceling.' };
      }
    }

    setBookings(prev => prev.filter(b => b.id !== bookingId));
    if (supabase) {
      supabase.from('bookings').delete().eq('id', bookingId).then(({ error }) => {
        if (error) console.error('Supabase: delete booking failed', error.message);
      });
    }

    if (tx) {
      setTransactions(prev => prev.map(t => t.id === tx.id ? {
        ...t,
        status: shouldRefund ? TransactionStatus.REFUNDED : t.status,
        confirmationStatus: shouldRefund ? 'CONFIRMED' : 'CANCELED',
        settledAt: shouldRefund ? new Date().toISOString() : t.settledAt,
      } : t));
      closeAlerts(alert => alert.transactionId === tx.id, actor);
    }

    addAuditLog({
      timestamp: new Date().toISOString(),
      actorId: actor.id,
      action: 'MEMBER_REMOVED_FROM_CLASS',
      details: `${actor.name} canceled ${participant?.name ?? 'a participant'} from ${gymClass?.name ?? 'a class'}. ${shouldRefund ? 'Refund issued.' : 'Late cancellation - no refund.'}`,
    });

    if (gymClass) {
      const notifyMessage = `Cancellation: ${participant?.name ?? 'Participant'} withdrew from ${gymClass.name} (${gymClass.day} ${gymClass.time}). ${shouldRefund ? 'Refund issued.' : 'Late cancellation - no refund.'}`;
      await notifyCoachAndOwner(gymClass.coachId, notifyMessage);
    }

    return {
      success: true,
      message: shouldRefund ? 'Booking canceled and refunded.' : 'Booking canceled. No refund issued (inside 24 hours).',
    };
  };

  const cancelCoachAppointment = async (appointmentId: string, actor: AppUser, options?: { allowLate?: boolean; issueRefund?: boolean }) => {
    const appointment = coachAppointments.find(appt => appt.id === appointmentId);
    if (!appointment) {
      return { success: false, message: 'Session not found.' };
    }
    const slot = coachSlots.find(s => s.id === appointment.slotId);
    if (!slot) {
      return { success: false, message: 'Session slot not found.' };
    }
    const refundEligible = isRefundEligible(slot.start);
    if (!refundEligible && !options?.allowLate) {
      return { success: false, message: 'This session starts within 24 hours. Please contact the gym to cancel.' };
    }
    const shouldRefund = options?.issueRefund ?? refundEligible;

    const tx = transactions.find(tx => tx.slotId === slot.id && tx.memberId === appointment.memberId);
    if (shouldRefund) {
      if (tx?.stripeSessionId) {
        const refundOk = await processStripeRefund(tx.stripeSessionId);
        if (!refundOk) {
          return { success: false, message: 'Unable to refund via Stripe. Please try again or refund manually.' };
        }
      } else {
        return { success: false, message: 'Payment reference not found. Please refund manually in Stripe before canceling.' };
      }
    }

    setCoachAppointments(prev => prev.filter(appt => appt.id !== appointmentId));
    if (supabase) {
      supabase.from('coach_appointments').delete().eq('id', appointmentId).then(({ error }) => {
        if (error) console.error('Supabase: delete coach appointment failed', error.message);
      });
    }

    if (tx) {
      setTransactions(prev => prev.map(t => t.id === tx.id ? {
        ...t,
        status: shouldRefund ? TransactionStatus.REFUNDED : t.status,
        confirmationStatus: shouldRefund ? 'CONFIRMED' : 'CANCELED',
        settledAt: shouldRefund ? new Date().toISOString() : t.settledAt,
      } : t));
      closeAlerts(alert => alert.transactionId === tx.id, actor);
    }

    addAuditLog({
      timestamp: new Date().toISOString(),
      actorId: actor.id,
      action: 'MEMBER_REMOVED_FROM_CLASS',
      details: `${actor.name} canceled ${appointment.participantName}'s session (${slot.title}). ${shouldRefund ? 'Refund issued.' : 'Late cancellation - no refund.'}`,
    });

    const notifyMessage = `Cancellation: ${appointment.participantName} withdrew from ${slot.title} on ${new Date(slot.start).toLocaleString()}. ${shouldRefund ? 'Refund issued.' : 'Late cancellation - no refund.'}`;
    await notifyCoachAndOwner(slot.coachId, notifyMessage);

    return {
      success: true,
      message: shouldRefund ? 'Session canceled and refunded.' : 'Session canceled. No refund issued (inside 24 hours).',
    };
  };

  const cancelGuestBooking = async (guestBookingId: string, actor: AppUser, options?: { allowLate?: boolean }) => {
    const guestBooking = guestBookings.find(g => g.id === guestBookingId);
    if (!guestBooking) {
      return { success: false, message: 'Guest booking not found.' };
    }
    const refundEligible = isRefundEligible(guestBooking.date);
    if (!refundEligible && !options?.allowLate) {
      return { success: false, message: 'This booking starts within 24 hours. Please contact the gym.' };
    }

    setGuestBookings(prev => prev.map(g => g.id === guestBookingId ? { ...g, status: 'CANCELED' } : g));
    if (supabase) {
      supabase.from('guest_bookings').update({ status: 'CANCELED' }).eq('id', guestBookingId).then(({ error }) => {
        if (error) console.error('Supabase: update guest booking failed', error.message);
      });
    }
    closeAlerts(alert => alert.guestBookingId === guestBookingId, actor);

    addAuditLog({
      timestamp: new Date().toISOString(),
      actorId: actor.id,
      action: 'MEMBER_REMOVED_FROM_CLASS',
      details: `${actor.name} canceled guest booking for ${guestBooking.participantName} (${guestBooking.title}).`,
    });

    return {
      success: true,
      message: refundEligible ? 'Guest booking canceled.' : 'Guest booking canceled (late cancellation - manual refund may be required).',
    };
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
    const targetCoach = coaches.find(c => c.id === notification.targetCoachId);
    if (!gymClass || !originalCoach || !targetCoach) return;
    
    // Allow admin or target coach to accept
    if (actor.role !== 'ADMIN' && actor.id !== notification.targetCoachId) {
      console.warn('Only admin or target coach can accept cover requests');
      return;
    }
    
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
    
    const acceptedBy = actor.role === 'ADMIN' ? `${actor.name} (Admin)` : actor.name;
    addAuditLog({
      timestamp: new Date().toISOString(),
      actorId: actor.id,
      action: 'CLASS_TRANSFER_ACCEPTED',
      details: `${acceptedBy} accepted the request for ${targetCoach.name} to cover "${gymClass.name}" for ${originalCoach.name}.`,
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


  const addBooking = async (bookingInput: Omit<Booking, 'id' | 'bookingDate'> & { stripeSessionId?: string }, actor: AppUser) => {
    const { stripeSessionId, ...booking } = bookingInput;
    const newBooking: Booking = {
      ...booking,
      id: `b${Date.now()}`,
      bookingDate: new Date().toISOString(),
      attended: false,
      confirmationStatus: booking.paid ? 'PENDING' : 'CONFIRMED',
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

        const needsCoachConfirmation = booking.paid && actor.role === UserRole.MEMBER;

        const transaction = addTransaction({
            memberId: booking.memberId,
            coachId: gymClass.coachId,
            bookingId: newBooking.id,
            amount: gymClass.price,
            source: TransactionSource.CLASS,
            status: booking.paid ? TransactionStatus.PAID : TransactionStatus.PENDING,
            description: `${gymClass.name}`,
            settledAt: booking.paid ? new Date().toISOString() : undefined,
            confirmationStatus: needsCoachConfirmation ? 'PENDING' : 'CONFIRMED',
            stripeSessionId,
        });

        const message = `Client: ${participant.name} booked ${gymClass.name} (${gymClass.day} ${gymClass.time}). Please confirm.`;
        await notifyCoachAndOwner(gymClass.coachId, message, {
          serviceType: 'CLASS',
          referenceId: gymClass.id,
          participantName: participant.name,
          amount: gymClass.price,
          transactionId: transaction.id,
        });
    }

    setBookings(prev => [...prev, newBooking]);
    if (supabase) {
      supabase.from('bookings').insert({
        id: newBooking.id,
        member_id: newBooking.memberId,
        participant_id: newBooking.participantId,
        class_id: newBooking.classId,
        booking_date: newBooking.bookingDate,
        session_start: newBooking.sessionStart,
        paid: newBooking.paid,
        attended: newBooking.attended,
        confirmation_status: newBooking.confirmationStatus,
      }).then(({ error }) => {
        if (error) console.error('Supabase: insert booking failed', error.message);
      });
    }
  };
  
  const deleteBooking = async (bookingId: string, actor: AppUser) => {
    await cancelBooking(bookingId, actor, { allowLate: true, issueRefund: false });
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
  
  const addMember = async (newMemberData: Omit<Member, 'id'>) => {
    const newMember: Member = { ...newMemberData, id: `m${Date.now()}` };
    setMembers(prev => [...prev, newMember]);
    
    // Get Supabase client (will use runtime env if available)
    const supabaseClient = getSupabase();
    
    // Check runtime env values
    const runtimeUrl = (window as any).__ENV__?.VITE_SUPABASE_URL;
    const runtimeKey = (window as any).__ENV__?.VITE_SUPABASE_ANON_KEY;
    const buildUrl = import.meta.env.VITE_SUPABASE_URL;
    const buildKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    console.log('Supabase initialization check:', {
      runtimeUrl,
      runtimeKey: runtimeKey ? 'Present' : 'Missing',
      buildUrl,
      buildKey: buildKey ? 'Present' : 'Missing',
      supabaseClient: supabaseClient ? 'Initialized' : 'NULL'
    });
    
    if (!supabaseClient) {
      console.error('Supabase client not initialized. Member not saved to database.');
      console.error('Available env values:', {
        VITE_SUPABASE_URL: runtimeUrl || buildUrl || 'NOT SET',
        VITE_SUPABASE_ANON_KEY: runtimeKey || buildKey ? 'SET' : 'NOT SET'
      });
      alert('Database connection not available. Member added locally only.\n\nCheck browser console for details.');
      return newMember;
    }

    try {
      console.log('Attempting to insert member:', {
        id: newMember.id,
        name: newMember.name,
        email: newMember.email
      });
      
      const { error, data } = await supabaseClient.from('members').insert({
        id: newMember.id,
        name: newMember.name,
        email: newMember.email,
        dob: newMember.dob,
        sex: newMember.sex,
        ability: newMember.ability,
        bio: newMember.bio,
        coach_id: newMember.coachId,
        is_carded: newMember.isCarded,
        membership_status: newMember.membershipStatus,
        membership_start_date: newMember.membershipStartDate,
        membership_expiry: newMember.membershipExpiry,
        is_rolling_monthly: newMember.isRollingMonthly,
      }).select();

      if (error) {
        console.error('Supabase: insert member failed', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        
        // Check for duplicate email error
        let errorMessage = error.message;
        if (error.code === '23505' || error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
          if (error.message.includes('email')) {
            errorMessage = `A member with the email "${newMember.email}" already exists in the database. Please use a different email address.`;
          } else {
            errorMessage = `This record already exists in the database. ${error.message}`;
          }
        }
        
        alert(`Failed to save member to database:\n\n${errorMessage}\n\nCheck browser console for details.`);
        // Remove from local state if insert failed
        setMembers(prev => prev.filter(m => m.id !== newMember.id));
        throw new Error(errorMessage); // Throw so the form can catch it
      } else {
        console.log('Member successfully saved to Supabase:', data);
      }
    } catch (err) {
      console.error('Unexpected error inserting member:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('Error type:', err instanceof TypeError ? 'TypeError (likely network/CORS issue)' : 'Other error');
      console.error('Full error:', err);
      alert(`Failed to save member to database: ${errorMessage}\n\nThis might be a network or CORS issue. Check browser console for details.`);
      setMembers(prev => prev.filter(m => m.id !== newMember.id));
    }
    
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


  const updateCoach = async (updatedCoach: Coach) => {
    setCoaches(prev => prev.map(c => c.id === updatedCoach.id ? updatedCoach : c));
    if (supabase) {
      const { error } = await supabase
        .from('coaches')
        .update({
          name: updatedCoach.name,
          email: updatedCoach.email,
          level: updatedCoach.level,
          bio: updatedCoach.bio,
          image_url: updatedCoach.imageUrl,
          mobile_number: updatedCoach.mobileNumber,
          bank_details: updatedCoach.bankDetails,
          role: updatedCoach.role,
          whatsapp_auto_reply_enabled: updatedCoach.whatsappAutoReplyEnabled ?? true,
          whatsapp_auto_reply_message: updatedCoach.whatsappAutoReplyMessage || null,
        })
        .eq('id', updatedCoach.id);
      if (error) {
        console.error('Supabase: update coach failed', error.message);
        throw error;
      }
    }
  };

  const addCoach = (newCoachData: Omit<Coach, 'id'>): Coach => {
     const newCoach: Coach = { ...newCoachData, id: `c${Date.now()}` };
     setCoaches(prev => [...prev, newCoach]);
     if (supabase) {
       supabase.from('coaches').insert({
         id: newCoach.id,
         name: newCoach.name,
         email: newCoach.email,
         level: newCoach.level,
         bio: newCoach.bio,
         image_url: newCoach.imageUrl,
         mobile_number: newCoach.mobileNumber,
         bank_details: newCoach.bankDetails,
         role: newCoach.role,
       }).then(({ error }) => {
         if (error) console.error('Supabase: insert coach failed', error.message);
       });
     }
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

  const addClass = async (newClassData: Omit<GymClass, 'id'>) => {
    const newClass: GymClass = { ...newClassData, id: `cl${Date.now()}` };
    setClasses(prev => [...prev, newClass]);
    const supabaseClient = getSupabase();
    if (supabaseClient) {
      // Insert the class
      const { error: classError } = await supabaseClient.from('classes').insert({
        id: newClass.id,
        name: newClass.name,
        description: newClass.description,
        day: newClass.day,
        time: newClass.time,
        coach_id: newClass.coachId,
        capacity: newClass.capacity,
        price: newClass.price,
        min_age: newClass.minAge,
        max_age: newClass.maxAge,
        original_coach_id: newClass.originalCoachId,
      });
      
      if (classError) {
        console.error('Supabase: insert class failed', classError.message);
        return;
      }

      // Insert multiple coaches if provided
      if (newClass.coachIds && newClass.coachIds.length > 0) {
        const coachInserts = newClass.coachIds.map(coachId => ({
          id: `cc_${newClass.id}_${coachId}`,
          class_id: newClass.id,
          coach_id: coachId,
        }));
        
        const { error: coachesError } = await supabaseClient.from('class_coaches').insert(coachInserts);
        if (coachesError) {
          console.error('Supabase: insert class coaches failed', coachesError.message);
        }
      } else {
        // If no coachIds array, create a single junction record for the primary coach
        const { error: coachError } = await supabaseClient.from('class_coaches').insert({
          id: `cc_${newClass.id}_${newClass.coachId}`,
          class_id: newClass.id,
          coach_id: newClass.coachId,
        });
        if (coachError) {
          console.error('Supabase: insert class coach failed', coachError.message);
        }
      }
    }
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
    <DataContext.Provider value={{ coaches, classes, members, familyMembers, bookings, auditLogs, coachAvailability, unavailableSlots, gymAccessLogs, notifications, transactions, coachSlots, coachAppointments, guestBookings, bookingAlerts, refreshData, createClassTransferRequest, acceptClassTransfer, undoClassTransfer, cancelClassTransferRequest, logGymAccess, addAvailabilitySlot, deleteAvailabilitySlot, addUnavailableSlot, deleteUnavailableSlot, addBooking, deleteBooking, updateBooking, toggleAttendance, updateMember, addMember, deleteMember, addFamilyMember, deleteFamilyMember, updateCoach, addCoach, deleteCoach, updateClass, addClass, deleteClass, addTransaction, updateTransaction, bookCoachSlot, addGuestBooking, cancelBooking, cancelCoachAppointment, cancelGuestBooking, acknowledgeBookingAlert }}>
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
