# Setup Guide for Sean McGann
## Getting Started with Fleetwood Boxing Gym System

Welcome! This guide will walk you through setting up your gym management system step by step.

---

## 🔐 Step 1: Login to the System

**Click here to login:** [Login to Admin Dashboard](https://mcgann-boxing-2coodfhbmq-nw.a.run.app)

**Your Login Credentials:**
- **Email:** `sean@fleetwoodboxing.co.uk`
- **Password:** (Use the password you set up, or reset it if needed)

> **Note:** If you need to reset your password, use the "Forgot Password" link on the login page.

---

## 👥 Step 2: Add Coaches

**Direct Link:** [Add New Coach](https://mcgann-boxing-2coodfhbmq-nw.a.run.app/dashboard)

### Instructions:
1. After logging in, you'll see the **Admin Dashboard**
2. Navigate to the **"Coaches"** section (usually in the left sidebar or main menu)
3. Click the **"+ Add Coach"** or **"Add New Coach"** button
4. Fill in the coach details:
   - **Name** (required)
   - **Email** (required, must be unique)
   - **Level** (e.g., "Level 2 Coach", "Assistant Head Coach")
   - **Mobile Number** (optional)
   - **Bio** (optional description)
   - **Bank Details** (optional, for payments)
   - **Role:** Select `COACH` (not ADMIN - only you are ADMIN)
5. Click **"Save"** or **"Add Coach"**

### Recommended Order:
Add coaches in this order:
1. **Drew Austin** - Assistant Head Coach, Level 2
2. **Elle** - Level 2 Coach
3. **Bex** - Level 1 Coach
4. **Rach** - Fitness Instructor

> **Tip:** You can add coaches one at a time, or add them all now. You'll need at least one coach before you can create classes.

---

## 📅 Step 3: Set Up Coach Availability (Slots)

**Direct Link:** [Coach Availability](https://mcgann-boxing-2coodfhbmq-nw.a.run.app/dashboard)

### Instructions:
1. Go to the **"Coaches"** section in the dashboard
2. Click on a coach's name or **"View Availability"**
3. Click **"+ Add Availability"** or **"Create Slot"**
4. Fill in the slot details:
   - **Type:** Select `PRIVATE` (for 1-on-1 sessions) or `GROUP_SESSION` (for group sessions)
   - **Title:** e.g., "Private Boxing Session" or "Group Training Session"
   - **Start Date & Time:** When the session starts
   - **End Date & Time:** When the session ends
   - **Capacity:** 
     - For `PRIVATE`: Set to `1`
     - For `GROUP_SESSION`: Set the maximum number of participants (e.g., 6, 8, 10)
   - **Price:** Cost per session (e.g., £25.00 for private, £15.00 for group)
   - **Location:** (optional) e.g., "Main Gym", "Boxing Ring"
   - **Description:** (optional) Additional details about the session
5. Click **"Save"** or **"Create Slot"**

### Tips:
- You can create recurring slots by creating multiple slots with the same time pattern
- Slots can be booked by both members and non-members (guests)
- You can assign multiple coaches to a slot if it's a large group session

---

## 🥊 Step 4: Create Classes

**Direct Link:** [Create Class](https://mcgann-boxing-2coodfhbmq-nw.a.run.app/dashboard)

### Instructions:
1. Go to the **"Classes"** or **"Schedule"** section in the dashboard
2. Click **"+ Create Class"** or **"Add New Class"**
3. Fill in the class details:
   - **Class Name** (required): e.g., "Boxing Fundamentals", "HIITSTEP", "Gentle Moves"
   - **Description** (optional): What the class is about
   - **Day of Week** (required): Select the day (Monday, Tuesday, etc.)
   - **Time** (required): e.g., "18:00" or "6:00 PM"
   - **Coach/Coaches** (required): 
     - Select **one or more coaches** from the list
     - For large classes, you can select multiple coaches
   - **Capacity** (required): Maximum number of participants
   - **Price** (optional): Cost per class
   - **Age Range** (optional): Min and max age if applicable
4. Click **"Save"** or **"Create Class"**

### Example Classes to Create:
- **Boxing Fundamentals** - Monday 18:00 - Capacity: 20
- **HIITSTEP** - Wednesday 19:00 - Capacity: 15
- **Gentle Moves** - Friday 10:00 - Capacity: 12
- **Youth Boxing** - Saturday 14:00 - Capacity: 15

---

## 📋 Step 5: Review Your Setup

**Direct Link:** [View Schedule](https://mcgann-boxing-2coodfhbmq-nw.a.run.app/dashboard)

### Checklist:
- [ ] At least 2-3 coaches added
- [ ] At least 1 availability slot created for each coach (for private sessions)
- [ ] At least 3-4 classes created with coaches assigned
- [ ] All classes have correct day, time, and capacity set

---

## 🎯 Quick Reference Links

### Main Dashboard
- **Admin Dashboard:** [https://mcgann-boxing-2coodfhbmq-nw.a.run.app/dashboard](https://mcgann-boxing-2coodfhbmq-nw.a.run.app/dashboard)

### Public Pages (for testing)
- **Landing Page:** [https://mcgann-boxing-2coodfhbmq-nw.a.run.app](https://mcgann-boxing-2coodfhbmq-nw.a.run.app)
- **Booking Wizard:** [https://mcgann-boxing-2coodfhbmq-nw.a.run.app/book](https://mcgann-boxing-2coodfhbmq-nw.a.run.app/book)

---

## 💡 Tips & Best Practices

### Adding Coaches:
- Make sure each coach has a unique email address
- Add mobile numbers so members can contact coaches
- Set appropriate levels (Level 1, Level 2, Level 3, etc.)

### Creating Availability:
- Create slots at least 2-4 weeks in advance
- For recurring sessions, create multiple slots with the same pattern
- Set realistic capacity limits based on your gym space

### Creating Classes:
- Start with your most popular classes first
- Assign coaches who are available on those days/times
- Set capacity based on your gym's physical space
- Consider age restrictions for youth classes

### Testing:
- After creating classes, visit the public booking page to see how they appear
- Test booking a class as a guest to ensure everything works
- Check that coaches can see their assigned classes in their dashboard

---

## 🆘 Need Help?

If you encounter any issues:
1. Check that you're logged in as ADMIN (you should see admin controls)
2. Make sure all required fields are filled in
3. Verify that coaches exist before assigning them to classes
4. Refresh the page if something doesn't appear immediately

---

## 📝 Next Steps After Setup

Once you've added coaches, availability, and classes:
1. **Add Members:** You can add members manually or they can sign up themselves
2. **Test Bookings:** Try booking a class or session to ensure everything works
3. **Set Up Payments:** Verify Stripe is configured for payments (if not already done)
4. **Share with Coaches:** Give coaches their login credentials so they can manage their own schedules

---

**Last Updated:** December 2025  
**System Version:** Production

