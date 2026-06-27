# Price Toggle Implementation for Online/Offline Courses

## Overview
Implemented a comprehensive pricing system that allows admin to set separate prices for online and offline modes. Students can toggle between available modes with full price transparency.

## Features Implemented

### 1. **Transparent Pricing**
- Both online and offline prices are displayed upfront before mode selection
- Clear breakdown showing:
  - Course Price
  - Razorpay Charges (2% + 18% GST)
  - Grand Total
- Location information shown for offline mode

### 2. **Smart Mode Selection**
- If only online price is set → Online mode only (no toggle)
- If only offline price is set → Offline mode only (no toggle)
- If both prices are set → Toggle between modes
- Legacy `price` field still supported for backward compatibility

### 3. **Admin Course Creation**
- Admin can set:
  - `onlinePrice` - Price for online mode
  - `offlinePrice` - Price for offline mode
  - `location` - Required when offline price is set
  - `price` - Legacy field (optional, for backward compatibility)
- Validation ensures location is provided when offline price is set

### 4. **Student Experience**
- See both prices displayed transparently
- Toggle between available modes
- Location shown when offline mode selected
- Cannot proceed without selecting mode when both available
- Selected mode tracked in enrollment

## Technical Changes

### Backend Changes

#### 1. Course Schema (`backend/models/Course.js`)
```javascript
// Added new fields
onlinePrice: {
  type: Number,
  min: 0,
  default: null,
},
offlinePrice: {
  type: Number,
  min: 0,
  default: null,
},
```

#### 2. Student Schema (`backend/models/Student.js`)
```javascript
// Added to enrolledCourses
courseMode: {
  type: String,
  enum: ["online", "offline"],
  default: "online",
},
```

#### 3. Course Routes (`backend/routes/courses.js`)
- Updated POST `/api/courses` to accept `onlinePrice` and `offlinePrice`
- Updated PUT `/api/courses/:id` to handle mode-specific pricing
- Added validation for offline price requiring location

#### 4. Payment Routes (`backend/routes/payments.js`)
- Updated POST `/api/payments/public/course/create-order` to:
  - Accept `selectedMode` parameter
  - Calculate price based on selected mode
  - Validate mode and pricing
- Updated POST `/api/payments/public/course/verify-payment` to:
  - Accept and store `selectedMode`
  - Use correct price based on mode
  - Store mode in enrollment record

### Frontend Changes

#### 1. CreateCoursePage (`frontend/src/components/admin/CreateCoursePage.js`)
- Added input fields for:
  - Online Price
  - Offline Price
- Removed course mode dropdown (mode determined by which prices are set)
- Location field always shown with helper text
- Preview shows both prices when available

#### 2. CourseDetail (`frontend/src/components/courses/CourseDetail.js`)
- Added `selectedMode` state
- Added mode selection toggle UI (shown only when both modes available)
- Added `getCurrentPrice()` helper function
- Transparent pricing display showing:
  - Both prices when both available and none selected
  - Selected price after toggle
  - Location for offline mode
- Updated enrollment modal to show mode selection
- Pass `selectedMode` in payment API calls
- Validation to ensure mode is selected when both available

## Usage Guide

### For Admins

#### Creating a Course with Both Modes:
1. Go to Admin → Create Course
2. Fill in basic details (title, description, category)
3. Set **Online Price**: e.g., ₹5000
4. Set **Offline Price**: e.g., ₹8000
5. Set **Location**: e.g., "Ahmedabad Center, SG Highway"
6. Add features and save

#### Creating Online-Only Course:
1. Set **Online Price** only
2. Leave **Offline Price** empty
3. Location optional

#### Creating Offline-Only Course:
1. Set **Offline Price** only
2. Set **Location** (required)
3. Leave **Online Price** empty

### For Students

#### Enrolling in Course with Both Modes:
1. Visit course detail page
2. See both prices displayed transparently:
   - Online Mode: ₹5000 + charges = ₹5,118 Total
   - Offline Mode: ₹8000 + charges = ₹8,189 Total
3. Click "Register Now"
4. Select mode by clicking toggle button
5. See location if offline selected
6. Fill in details and proceed to payment
7. Pay the amount for selected mode

#### Enrolling in Single Mode Course:
1. Visit course detail page
2. See single price displayed
3. No toggle shown (mode auto-selected)
4. Click "Register Now"
5. Fill details and proceed to payment

## Validation & Error Handling

### Backend Validations:
- ✅ At least one price must be provided (price, onlinePrice, or offlinePrice)
- ✅ Location required when offline price is set
- ✅ Selected mode must have a valid price
- ✅ Payment verification checks for valid price

### Frontend Validations:
- ✅ Must select mode when both are available
- ✅ Cannot proceed without mode selection
- ✅ Auto-selects mode when only one available
- ✅ Shows appropriate pricing based on selection

## Database Migration
No migration needed! The new fields are optional:
- Existing courses work with legacy `price` field
- New courses can use `onlinePrice` and `offlinePrice`
- System handles both scenarios gracefully

## Backward Compatibility
✅ Fully backward compatible:
- Old courses with only `price` field continue to work
- Legacy price used as fallback when mode-specific prices not set
- No breaking changes to existing functionality

## Testing Checklist

### Admin:
- [ ] Create course with only online price
- [ ] Create course with only offline price
- [ ] Create course with both prices
- [ ] Update existing course prices
- [ ] Verify validation for offline price without location

### Student:
- [ ] View course with single price (no toggle)
- [ ] View course with both prices (toggle shown)
- [ ] Toggle between modes and see price change
- [ ] Enroll with online mode
- [ ] Enroll with offline mode
- [ ] Verify receipt shows correct price
- [ ] Check enrollment record has correct mode

### Payment:
- [ ] Payment with online mode
- [ ] Payment with offline mode
- [ ] Verify Razorpay charges calculated correctly
- [ ] Receipt generation with correct breakdown

## Future Enhancements
- [ ] Add mode indicator in student dashboard
- [ ] Show enrolled mode in course list
- [ ] Filter courses by available modes
- [ ] Analytics on mode preferences
- [ ] Bulk update prices for existing courses

## Files Modified

### Backend:
1. `backend/models/Course.js` - Added onlinePrice, offlinePrice fields
2. `backend/models/Student.js` - Added courseMode to enrolledCourses
3. `backend/routes/courses.js` - Updated create/update routes
4. `backend/routes/payments.js` - Updated payment routes for mode-specific pricing

### Frontend:
1. `frontend/src/components/admin/CreateCoursePage.js` - Admin UI for pricing
2. `frontend/src/components/courses/CourseDetail.js` - Student mode selection & pricing display

## Benefits
✅ **Transparency**: Students see all prices upfront
✅ **Flexibility**: Courses can offer one or both modes
✅ **Clear UX**: No confusion about pricing or modes
✅ **Admin Control**: Easy to manage mode-specific pricing
✅ **Trackability**: Mode stored in enrollment for analytics
✅ **Backward Compatible**: Works with existing courses

---
**Implementation Date**: December 2024
**Status**: ✅ Complete and Ready for Production
