# Quick Test Scenarios - Price Toggle Feature

## Test Scenario 1: Course with Both Modes (Most Common)

### Admin Setup:
```
Title: Complete GPSC Preparation
Online Price: ₹5000
Offline Price: ₹8000
Location: Ahmedabad Center, SG Highway
```

### Expected Student Experience:
1. **Course Page Display:**
   - Shows toggle with both prices:
     * Online: ₹5,000 (Total: ₹5,118)
     * Offline: ₹8,000 (Total: ₹8,189)
   - Both prices visible before selection
   - Location shown when offline selected

2. **Enrollment Flow:**
   - Click "Register Now - Select Mode"
   - Modal shows both options with prices
   - Must select one before proceeding
   - See location for offline option
   - Price breakdown updates based on selection

3. **Payment:**
   - Razorpay amount matches selected mode
   - Receipt shows correct price
   - Enrollment stored with selected mode

---

## Test Scenario 2: Online-Only Course

### Admin Setup:
```
Title: Video Lectures Series
Online Price: ₹3000
Offline Price: (empty)
Location: (optional)
```

### Expected Student Experience:
1. **Course Page Display:**
   - No toggle shown
   - Single price display: ₹3,000 (Total: ₹3,071)
   - "Register Now - ₹3,071 Total" button

2. **Enrollment Flow:**
   - No mode selection needed
   - Automatically enrolls as online mode
   - Direct to payment

---

## Test Scenario 3: Offline-Only Course

### Admin Setup:
```
Title: Classroom Program
Online Price: (empty)
Offline Price: ₹12000
Location: Mumbai Center, Andheri
```

### Expected Student Experience:
1. **Course Page Display:**
   - No toggle shown
   - Single price display: ₹12,000 (Total: ₹12,283)
   - Location always visible
   - "Register Now - ₹12,283 Total" button

2. **Enrollment Flow:**
   - No mode selection needed
   - Automatically enrolls as offline mode
   - Location shown in confirmation
   - Direct to payment

---

## Test Scenario 4: Legacy Course (Backward Compatibility)

### Admin Setup:
```
Title: Old Course
Price: ₹4000 (legacy field)
Online Price: (empty)
Offline Price: (empty)
```

### Expected Student Experience:
1. **Course Page Display:**
   - Works exactly as before
   - Shows ₹4,000 (Total: ₹4,094)
   - No toggle
   - "Register Now - ₹4,094 Total" button

2. **Enrollment Flow:**
   - Normal flow
   - Defaults to online mode
   - No breaking changes

---

## Test Scenario 5: Error Cases

### Case 5.1: No Price Set
```
Admin Setup:
Price: (empty)
Online Price: (empty)
Offline Price: (empty)
```
**Expected:** Admin validation prevents saving. "At least one price must be provided"

### Case 5.2: Offline Price Without Location
```
Admin Setup:
Offline Price: ₹5000
Location: (empty)
```
**Expected:** Admin validation error. "Location is required when offline price is set"

### Case 5.3: Both Modes Available but No Selection
```
Student Action: Click "Continue to Payment" without selecting mode
```
**Expected:** Error message "Please select a mode (Online or Offline)"

---

## Quick Visual Checks

### ✅ Course Card in List:
- Shows price range if both available: "₹5,000 - ₹8,000"
- Shows single price if one mode

### ✅ Course Detail Sidebar:
- Online Price: ₹5,000
- Offline Price: ₹8,000
- Duration, Videos, Language

### ✅ Toggle Buttons:
- Two buttons side by side
- Selected button: Dark background, white text
- Unselected button: White background, dark text
- Each shows price below

### ✅ Price Breakdown Box:
**Before Selection (Both Available):**
```
Online Mode:
  Course Price: ₹5,000
  Razorpay Charges: ₹118
  Total: ₹5,118

Offline Mode:
  Course Price: ₹8,000
  Razorpay Charges: ₹189
  Total: ₹8,189
  Location: Ahmedabad Center
```

**After Selection (Online):**
```
Online Mode - Price Breakdown
  Course Price: ₹5,000
  Razorpay Charges: ₹118
  Grand Total: ₹5,118
```

---

## Admin Testing Checklist

- [ ] Create course with both prices → Success
- [ ] Create course with only online price → Success
- [ ] Create course with only offline price + location → Success
- [ ] Try offline price without location → Error
- [ ] Try no prices at all → Error
- [ ] Update existing course to add online price → Success
- [ ] Update existing course to add offline price → Success
- [ ] Edit prices and save → Success

---

## Student Testing Checklist

### Both Modes Available:
- [ ] See both prices before selecting
- [ ] Toggle between modes
- [ ] Location shows for offline
- [ ] Cannot proceed without selection
- [ ] Selected price used in payment
- [ ] Receipt shows correct price
- [ ] Enrollment has correct mode

### Single Mode:
- [ ] No toggle shown
- [ ] Single price clear
- [ ] Auto-proceeds to payment
- [ ] Correct mode stored

### Payment:
- [ ] Razorpay amount correct
- [ ] Receipt PDF has correct breakdown
- [ ] Password provided
- [ ] Can login and access course

---

## Common Issues & Solutions

### Issue: "No toggle showing even though both prices set"
**Check:** Ensure both onlinePrice and offlinePrice are > 0 in database

### Issue: "Wrong price charged"
**Check:** selectedMode being passed in API calls?

### Issue: "Location not showing"
**Check:** Location field populated and offline mode selected?

### Issue: "Old course not working"
**Solution:** Legacy price field still works, no changes needed

---

## API Test Calls

### Test Create Order (Both Modes):
```bash
POST /api/payments/public/course/create-order
{
  "courseId": "...",
  "name": "Test Student",
  "email": "test@test.com",
  "mobile": "1234567890",
  "selectedMode": "online"  // or "offline"
}
```

### Test Verify Payment:
```bash
POST /api/payments/public/course/verify-payment
{
  "razorpay_order_id": "...",
  "razorpay_payment_id": "...",
  "razorpay_signature": "...",
  "courseId": "...",
  "email": "test@test.com",
  "name": "Test Student",
  "mobile": "1234567890",
  "selectedMode": "online"  // or "offline"
}
```

---

**Quick Test Duration:** ~15 minutes for all scenarios
**Critical Path:** Scenario 1 (Both Modes) - Most important!
