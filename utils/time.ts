import { GymClass, AvailabilitySlot, UnavailableSlot } from '../types';

/**
 * Converts a time string "HH:mm" to the number of minutes from midnight.
 */
export const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Parses a class time range "HH:mm – HH:mm" into start and end minutes.
 */
export const parseClassTime = (classTime: string): { startMinutes: number; endMinutes: number } | null => {
  const parts = classTime.split('–').map(s => s.trim());
  if (parts.length !== 2) return null;

  try {
    const startMinutes = timeToMinutes(parts[0]);
    const endMinutes = timeToMinutes(parts[1]);
    return { startMinutes, endMinutes };
  } catch (e) {
    return null;
  }
};

/**
 * Calculates the next date for a given day of the week.
 */
export const getNextDateForDay = (day: GymClass['day']): Date => {
    const dayIndexMap = { 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 };
    const targetDayIndex = dayIndexMap[day];
    
    const today = new Date();
    const currentDayIndex = today.getDay();
    
    let diff = targetDayIndex - currentDayIndex;
    if (diff <= 0) { // If it's today or a past day of this week, get next week's
        diff += 7;
    }
    
    const nextDate = new Date();
    nextDate.setDate(today.getDate() + diff);
    return nextDate;
};

interface AvailabilityCheckParams {
    coachId: string;
    day: GymClass['day'];
    time: string; // Class time range e.g., "18:00 – 19:00"
    allClasses: GymClass[];
    coachAvailability: AvailabilitySlot[];
    unavailableSlots: UnavailableSlot[];
    checkDate?: Date; // Specific date to check against one-off unavailability
    classIdToIgnore?: string; // Used when editing an existing class to avoid self-conflict
}

interface AvailabilityResult {
    isAvailable: boolean;
    reason: string;
}

/**
 * Checks if a coach is available for a specific time slot.
 * A coach is available if:
 * 1. The class time does not fall within a specific `UnavailableSlot` for that date.
 * 2. The class time falls within one of their general availability slots.
 * 3. The class time does not overlap with another class they are already teaching.
 */
export const isCoachAvailable = ({
    coachId,
    day,
    time,
    allClasses,
    coachAvailability,
    unavailableSlots,
    checkDate,
    classIdToIgnore
}: AvailabilityCheckParams): AvailabilityResult => {

    const classTimeRange = parseClassTime(time);
    if (!classTimeRange) return { isAvailable: false, reason: 'Invalid class time format.' }; 

    const { startMinutes: classStart, endMinutes: classEnd } = classTimeRange;

    // 1. Check against one-off unavailability for the specific date
    if(checkDate) {
        const dateString = checkDate.toISOString().split('T')[0]; // YYYY-MM-DD
        const coachUnavailableSlots = unavailableSlots.filter(s => s.coachId === coachId && s.date === dateString);
        
        for(const slot of coachUnavailableSlots) {
            // All day block
            if(!slot.startTime || !slot.endTime) {
                return { isAvailable: false, reason: `Coach has blocked off ${checkDate.toLocaleDateString()}.` };
            }

            // Timed block
            const unavailableStart = timeToMinutes(slot.startTime);
            const unavailableEnd = timeToMinutes(slot.endTime);
            if(classStart < unavailableEnd && classEnd > unavailableStart) {
                 return { isAvailable: false, reason: `Coach is unavailable from ${slot.startTime} to ${slot.endTime} on this day.` };
            }
        }
    }


    // 2. Check against general recurring availability
    const coachGeneralAvailability = coachAvailability.filter(
        (slot) => slot.coachId === coachId && slot.day === day
    );

    const isInGeneralAvailability = coachGeneralAvailability.some((slot) => {
        const slotStart = timeToMinutes(slot.startTime);
        const slotEnd = timeToMinutes(slot.endTime);
        return classStart >= slotStart && classEnd <= slotEnd;
    });

    if (!isInGeneralAvailability) {
        return { isAvailable: false, reason: `Class time is outside the coach's recurring weekly availability.` };
    }

    // 3. Check for conflicts with other recurring classes
    const coachsOtherClasses = allClasses.filter(
        (c) =>
            c.coachId === coachId &&
            c.day === day &&
            c.id !== classIdToIgnore
    );

    const hasConflict = coachsOtherClasses.some((otherClass) => {
        const otherClassTimeRange = parseClassTime(otherClass.time);
        if (!otherClassTimeRange) return false;

        const { startMinutes: otherStart, endMinutes: otherEnd } = otherClassTimeRange;
        // Check for overlap: (StartA < EndB) and (EndA > StartB)
        return classStart < otherEnd && classEnd > otherStart;
    });

    if(hasConflict) {
        return { isAvailable: false, reason: 'Coach has a conflicting class at this time.' };
    }

    return { isAvailable: true, reason: '' };
};