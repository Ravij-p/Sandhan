# Price Toggle Implementation - NO BASE PRICE

## Key Changes from Previous Version
- ❌ Removed `price` field completely from schema
- ✅ Only `onlinePrice` and `offlinePrice` fields exist
- ✅ Never shows ₹0 anywhere in the application
- ✅ If both prices set → Shows both on homepage and course list
- ✅ If one price set → Shows only that price

## Database Schema

### Course Model
```javascript
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
// NO price field!
```

### Student Enrollment
```javascript
enrolledCourses: [{
  courseMode: {
    type: String,
    enum: ["online", "offline"],
    default: "online",
  },
  // ... other fields
}]
```

## Admin Course Creation

### Fields:
- **Online Price**: Leave empty if not available
- **Offline Price**: Leave empty if not available
- **Location**: Required if offline price is set

### Validation:
- ✅ At least one price (online OR offline) must be set
- ✅ Location required when offline price exists
- ❌ No base price field

## Student Experience

### Homepage/Course List
Shows price badge on course card:
- **Both available**: `₹5,000 / ₹8,000`
- **Online only**: `₹5,000`
- **Offline only**: `₹8,000`
- **No price**: Badge not shown

### Course Detail Page

#### Both Prices Available:
1. Toggle buttons shown with prices
2. Price breakdown shows BOTH before selection:
   ```
   Online Mode:
     Course Price: ₹5,000
     Razorpay: ₹118
     Total: ₹5,118
   
   Offline Mode:
     Course Price: ₹8,000
     Razorpay: ₹189
     Total: ₹8,189
     Location: Ahmedabad Center
   ```
3. After toggle selection → Shows selected price breakdown only

#### Single Price:
- No toggle
- Auto-selects available mode
- Shows single price breakdown

#### No Price:
- Shows "Pricing information not available"
- No register button

### Sidebar "Course Info":
- **Both**: Shows "Online Price: ₹X" and "Offline Price: ₹Y"
- **One**: Shows "Price (Online/Offline): ₹X"
- **None**: Price row not shown

## Backend API

### Create Course
```javascript
POST /api/courses
{
  "title": "...",
  "onlinePrice": 5000,     // optional
  "offlinePrice": 8000,    // optional
  "location": "...",       // required if offlinePrice set
}

Validation:
- At least one price required
- Location required if offlinePrice exists
```

### Payment Flow
```javascript
POST /api/payments/public/course/create-order
{
  "courseId": "...",
  "selectedMode": "online" // or "offline"
}

Price Selection Logic:
1. If selectedMode === 'online' && onlinePrice exists → Use onlinePrice
2. If selectedMode === 'offline' && offlinePrice exists → Use offlinePrice
3. If no selectedMode && onlinePrice exists → Use onlinePrice
4. If no selectedMode && offlinePrice exists → Use offlinePrice
5. Otherwise → Error
```

## Display Rules - Never Show ₹0

### ✅ Correct:
- `₹5,000` - Single price
- `₹5,000 / ₹8,000` - Both prices
- "Pricing information not available" - No price
- Price badge hidden on course card if no price

### ❌ Wrong:
- `₹0` - Never shown
- `₹5,000 / ₹0` - Never shown
- Base Price field in admin - Doesn't exist

## Files Modified (Without Base Price)

### Backend:
1. `models/Course.js` - NO price field, only onlinePrice/offlinePrice
2. `models/Student.js` - Added courseMode to enrollment
3. `routes/courses.js` - Validation for at least one price
4. `routes/payments.js` - Price selection based on mode

### Frontend:
1. `admin/CreateCoursePage.js` - Only online/offline price fields
2. `courses/CourseDetail.js` - Toggle UI, no ₹0 display
3. `courses/CourseList.js` - Both prices shown, no ₹0

## Test Cases

### Scenario 1: Both Prices
```
Admin sets:
  onlinePrice: 5000
  offlinePrice: 8000
  location: "Ahmedabad"

Homepage shows: ₹5,000 / ₹8,000
Detail page: Toggle with both prices
Sidebar: Both prices listed
```

### Scenario 2: Online Only
```
Admin sets:
  onlinePrice: 5000
  offlinePrice: null
  location: ""

Homepage shows: ₹5,000
Detail page: No toggle, single price
Sidebar: Price (Online): ₹5,000
```

### Scenario 3: Offline Only
```
Admin sets:
  onlinePrice: null
  offlinePrice: 8000
  location: "Ahmedabad"

Homepage shows: ₹8,000
Detail page: No toggle, single price, location shown
Sidebar: Price (Offline): ₹8,000
```

### Scenario 4: No Price
```
Admin sets:
  onlinePrice: null
  offlinePrice: null

Homepage shows: No price badge
Detail page: "Pricing information not available"
Sidebar: No price row
```

## Migration Note

**Existing courses with `price` field:**
- Will not show price until admin updates
- Admin must set onlinePrice or offlinePrice
- No automatic migration from old price field

## Summary

✅ No base price field anywhere
✅ Only onlinePrice and offlinePrice
✅ Never displays ₹0
✅ Shows both prices when both available
✅ Shows single price when one available
✅ Hides price info when none available
✅ Full transparency before selection
✅ Location shown for offline mode

**Result**: Clean, transparent pricing system with no confusion!
