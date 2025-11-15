import { Coach, GymClass, Member, UserRole, Booking, FamilyMember, AvailabilitySlot, GymAccessLog, UnavailableSlot, ClassTransferNotification } from './types';

export const COACHES: Coach[] = [
  { id: 'c1', name: 'Sean McGann', email: 'sean@fleetwoodboxing.co.uk', role: UserRole.ADMIN, level: 'Head Coach, Level 3', bio: 'With over 20 years of experience, Sean is the heart and soul of Fleetwood Boxing Gym.', imageUrl: 'https://picsum.photos/seed/sean/400/400', mobileNumber: '07111222333', bankDetails: '10-20-30 12345678' },
  { id: 'c2', name: 'Drew Austin', email: 'drew@fleetwoodboxing.co.uk', role: UserRole.COACH, level: 'Assistant Head Coach, Level 2', bio: 'Drew specializes in conditioning and development for all skill levels.', imageUrl: 'https://picsum.photos/seed/drew/400/400', mobileNumber: '07444555666', bankDetails: '20-30-40 87654321' },
  { id: 'c3', name: 'Elle', email: 'elle@fleetwoodboxing.co.uk', role: UserRole.COACH, level: 'Level 2 Coach', bio: 'Elle is passionate about empowering women through boxing and fitness.', imageUrl: 'https://picsum.photos/seed/elle/400/400', mobileNumber: '07777888999', bankDetails: '30-40-50 11223344' },
  { id: 'c4', name: 'Bex', email: 'bex@fleetwoodboxing.co.uk', role: UserRole.COACH, level: 'Level 1 Coach', bio: 'Bex brings infectious energy to her classes, focusing on fundamentals and fun.', imageUrl: 'https://picsum.photos/seed/bex/400/400', mobileNumber: '07123123123', bankDetails: '40-50-60 55667788' },
  { id: 'c5', name: 'Rach', email: 'rach@fleetwoodboxing.co.uk', role: UserRole.COACH, level: 'Fitness Instructor', bio: 'Rach leads our HIITSTEP and Gentle Moves classes with expertise and enthusiasm.', imageUrl: 'https://picsum.photos/seed/rach/400/400', mobileNumber: '07543543543', bankDetails: '50-60-70 99887766' },
];

export const CLASSES: GymClass[] = [
    { id: 'cl1', name: 'HIITSTEP with Rach (RH Fitness)', description: 'High-intensity step workout', day: 'Monday', time: '06:30 – 07:00', coachId: 'c5', capacity: 15, price: 8, minAge: 16 },
    { id: 'cl2', name: 'Circuits with Sean', description: 'Circuit training', day: 'Tuesday', time: '06:30 – 07:00', coachId: 'c1', capacity: 20, price: 8, minAge: 16 },
    { id: 'cl3', name: 'Circuits with Drew', description: 'Circuit training', day: 'Thursday', time: '06:30 – 07:00', coachId: 'c2', capacity: 20, price: 8, minAge: 16 },
    { id: 'cl4', name: 'HIITSTEP with Rach (RH Fitness)', description: 'High-intensity step workout', day: 'Friday', time: '06:30 – 07:00', coachId: 'c5', capacity: 15, price: 8, minAge: 16 },
    { id: 'cl5', name: 'Fit Over 50', description: 'Fitness class for ages 50+', day: 'Monday', time: '11:00 – 12:00', coachId: 'c1', capacity: 10, price: 10, minAge: 50 },
    { id: 'cl6', name: 'Gentle Moves (RH Fitness)', description: 'Gentle fitness and mobility', day: 'Thursday', time: '11:00 – 12:00', coachId: 'c5', capacity: 10, price: 10, minAge: 16 },
    { id: 'cl7', name: 'Tiny Tysons', description: 'Children’s boxing class', day: 'Monday', time: '17:00 – 17:45', coachId: 'c4', capacity: 12, price: 7, minAge: 5, maxAge: 9 },
    { id: 'cl8', name: 'Tiny Tysons', description: 'Children’s boxing class', day: 'Wednesday', time: '17:00 – 17:45', coachId: 'c4', capacity: 12, price: 7, minAge: 5, maxAge: 9 },
    { id: 'cl9', name: 'Carded Boxers', description: 'Competitive boxer training', day: 'Monday', time: '18:00 – 19:00', coachId: 'c1', capacity: 8, price: 12, minAge: 16 },
    { id: 'cl10', name: 'Beginner / Development', description: 'Boxing fundamentals & skill building', day: 'Tuesday', time: '18:00 – 19:00', coachId: 'c2', capacity: 15, price: 10, minAge: 16 },
    { id: 'cl11', name: 'Carded Boxers', description: 'Competitive boxer training', day: 'Wednesday', time: '18:00 – 19:00', coachId: 'c1', capacity: 8, price: 12, minAge: 16 },
    { id: 'cl12', name: 'Beginner / Development', description: 'Boxing fundamentals & skill building', day: 'Thursday', time: '18:00 – 19:00', coachId: 'c2', capacity: 15, price: 10, minAge: 16 },
    { id: 'cl13', name: 'Seniors Class', description: 'Advanced boxing training', day: 'Tuesday', time: '19:00 – 20:15', coachId: 'c1', capacity: 10, price: 12, minAge: 16 },
    { id: 'cl14', name: 'Seniors Class', description: 'Advanced boxing training', day: 'Thursday', time: '19:00 – 20:15', coachId: 'c1', capacity: 10, price: 12, minAge: 16 },
    { id: 'cl15', name: 'Ladies Class', description: 'Boxing & fitness for women', day: 'Monday', time: '19:00 – 20:00', coachId: 'c3', capacity: 15, price: 10, minAge: 16 },
];

export const COACH_AVAILABILITY: AvailabilitySlot[] = [
  // Sean McGann is generally available for classes in the morning and evening on weekdays
  { id: 'av1', coachId: 'c1', day: 'Monday', startTime: '06:00', endTime: '12:00' },
  { id: 'av2', coachId: 'c1', day: 'Monday', startTime: '17:30', endTime: '21:00' },
  { id: 'av3', coachId: 'c1', day: 'Tuesday', startTime: '06:00', endTime: '12:00' },
  { id: 'av4', coachId: 'c1', day: 'Tuesday', startTime: '18:30', endTime: '21:00' },
  { id: 'av5', coachId: 'c1', day: 'Wednesday', startTime: '17:30', endTime: '21:00' },
  { id: 'av6', coachId: 'c1', day: 'Thursday', startTime: '06:00', endTime: '12:00' },
  { id: 'av7', coachId: 'c1', day: 'Thursday', startTime: '18:30', endTime: '21:00' },
  
  // Drew Austin
  { id: 'av8', coachId: 'c2', day: 'Tuesday', startTime: '17:00', endTime: '20:00' },
  { id: 'av9', coachId: 'c2', day: 'Thursday', startTime: '06:00', endTime: '08:00' },
  { id: 'av10', coachId: 'c2', day: 'Thursday', startTime: '17:00', endTime: '20:00' },

  // Elle
  { id: 'av11', coachId: 'c3', day: 'Monday', startTime: '18:00', endTime: '21:00' },

  // Bex
  { id: 'av12', coachId: 'c4', day: 'Monday', startTime: '16:00', endTime: '19:00' },
  { id: 'av13', coachId: 'c4', day: 'Wednesday', startTime: '16:00', endTime: '19:00' },
  
  // Rach
  { id: 'av14', coachId: 'c5', day: 'Monday', startTime: '06:00', endTime: '08:00' },
  { id: 'av15', coachId: 'c5', day: 'Thursday', startTime: '10:00', endTime: '13:00' },
  { id: 'av16', coachId: 'c5', day: 'Friday', startTime: '06:00', endTime: '08:00' },
];

export const UNAVAILABLE_SLOTS: UnavailableSlot[] = [];

const getExpiryDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
}

const getStartDate = (daysAgo: number) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0];
}


export const MEMBERS: Member[] = [
    { id: 'm1', name: 'John Doe', email: 'john@example.com', role: UserRole.MEMBER, dob: '1996-05-20', sex: 'M', ability: 'Intermediate', bio: 'Aspiring amateur boxer looking to improve my footwork.', coachId: 'c2', isCarded: false, membershipStatus: 'Monthly', membershipStartDate: getStartDate(50), membershipExpiry: getExpiryDate(20), isRollingMonthly: true },
    { id: 'm2', name: 'Jane Smith', email: 'jane@example.com', role: UserRole.MEMBER, dob: '1990-11-10', sex: 'F', ability: 'Beginner', bio: 'Just starting out, excited to learn and get fit!', coachId: 'c3', isCarded: false, membershipStatus: 'PAYG', membershipStartDate: getStartDate(100) },
    { id: 'm3', name: 'Liam Johnson', email: 'liam@example.com', role: UserRole.MEMBER, dob: '2002-01-15', sex: 'M', ability: 'Competitive', bio: 'Training for the golden gloves.', coachId: 'c1', isCarded: true, membershipStatus: 'Monthly', membershipStartDate: getStartDate(300), membershipExpiry: getExpiryDate(15), isRollingMonthly: true },
    { id: 'm4', name: 'Chloe Davis', email: 'chloe@example.com', role: UserRole.MEMBER, dob: '1995-07-22', sex: 'F', ability: 'Intermediate', bio: 'Love the high-energy classes.', coachId: 'c3', isCarded: false, membershipStatus: 'PAYG', membershipStartDate: getStartDate(10) },
    { id: 'm5', name: 'Oscar Wilson', email: 'oscar@example.com', role: UserRole.MEMBER, dob: '1984-03-30', sex: 'M', ability: 'Beginner', bio: 'Future world champ!', coachId: 'c4', isCarded: false, membershipStatus: 'None', membershipStartDate: getStartDate(5) },
    { id: 'm6', name: 'Amelia Brown', email: 'amelia@example.com', role: UserRole.MEMBER, dob: '1993-09-05', sex: 'F', ability: 'Advanced', bio: 'Focusing on technique and sparring.', coachId: 'c2', isCarded: false, membershipStatus: 'Monthly', membershipStartDate: getStartDate(90), membershipExpiry: getExpiryDate(-5), isRollingMonthly: false }, // Expired
    { id: 'm7', name: 'Noah Garcia', email: 'noah@example.com', role: UserRole.MEMBER, dob: '1999-06-12', sex: 'M', ability: 'Beginner', bio: 'Getting back into fitness.', coachId: null, isCarded: false, membershipStatus: 'PAYG', membershipStartDate: getStartDate(25) },
    { id: 'm8', name: 'Kaylee Smith', email: 'kayleeannsmith@gmail.com', role: UserRole.MEMBER, dob: '1984-04-15', sex: 'F', ability: 'Beginner', bio: '', coachId: null, isCarded: false, membershipStatus: 'PAYG', membershipStartDate: getStartDate(1) },
];

export const FAMILY_MEMBERS: FamilyMember[] = [
    { id: 'fm1', parentId: 'm2', name: 'Leo Smith', dob: '2016-08-25' }, // age 8
    { id: 'fm2', parentId: 'm5', name: 'Mia Wilson', dob: '2014-04-18' }, // age 10
    { id: 'fm3', parentId: 'm8', name: 'Beau', dob: '2015-06-10' }, // age 9
    { id: 'fm4', parentId: 'm8', name: 'Lex', dob: '2010-02-20' }, // age 14
];

export const INITIAL_BOOKINGS: Booking[] = [
  { id: 'b1', memberId: 'm1', participantId: 'm1', classId: 'cl10', bookingDate: new Date().toISOString(), paid: true, attended: true },
  { id: 'b2', memberId: 'm2', participantId: 'm2', classId: 'cl15', bookingDate: new Date().toISOString(), paid: false, attended: false },
  { id: 'b3', memberId: 'm3', participantId: 'm3', classId: 'cl9', bookingDate: new Date().toISOString(), paid: true, attended: true },
  { id: 'b4', memberId: 'm3', participantId: 'm3', classId: 'cl11', bookingDate: new Date().toISOString(), paid: true, attended: false },
  { id: 'b5', memberId: 'm4', participantId: 'm4', classId: 'cl13', bookingDate: new Date().toISOString(), paid: false, attended: false },
  { id: 'b6', memberId: 'm2', participantId: 'fm1', classId: 'cl7', bookingDate: new Date().toISOString(), paid: true, attended: true }, // Child booked
  { id: 'b7', memberId: 'm6', participantId: 'm6', classId: 'cl14', bookingDate: new Date().toISOString(), paid: true, attended: true },
  { id: 'b8', memberId: 'm7', participantId: 'm7', classId: 'cl12', bookingDate: new Date().toISOString(), paid: false, attended: true },
  { id: 'b9', memberId: 'm1', participantId: 'm1', classId: 'cl2', bookingDate: new Date().toISOString(), paid: true, attended: false },
  { id: 'b10', memberId: 'm4', participantId: 'm4', classId: 'cl15', bookingDate: new Date().toISOString(), paid: true, attended: true },
];

export const INITIAL_NOTIFICATIONS: ClassTransferNotification[] = [];

export const GYM_ACCESS_LOGS: GymAccessLog[] = [];