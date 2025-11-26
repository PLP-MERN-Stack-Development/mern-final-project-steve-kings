# Multiple Packages Per Election

## Overview

Users can now purchase and assign **multiple packages to a single election**, with the system calculating the **total credits** from all packages.

## How It Works

### 1. Create Election with First Package
```javascript
// User creates election with Starter package (50 voters)
Election {
  packages: [{
    packageName: 'starter',
    credits: 50,
    transactionId: 'MPE123',
    addedDate: Date
  }],
  totalCredits: 50  // Virtual field
}
```

### 2. Add More Packages to Same Election
```javascript
// User buys Standard package and adds to same election
Election {
  packages: [
    {
      packageName: 'starter',
      credits: 50,
      transactionId: 'MPE123'
    },
    {
      packageName: 'standard',
      credits: 200,
      transactionId: 'MPE456'
    }
  ],
  totalCredits: 250  // 50 + 200 = 250
}
```

### 3. Unlimited Package
```javascript
// If any package is unlimited, total becomes unlimited
Election {
  packages: [
    {
      packageName: 'starter',
      credits: 50
    },
    {
      packageName: 'unlimited',
      credits: -1  // Unlimited
    }
  ],
  totalCredits: 999999,  // Treated as unlimited
  hasUnlimitedCredits: true
}
```

## API Endpoints

### Get Election Packages
```
GET /api/elections/:id/packages
```

**Response:**
```json
{
  "success": true,
  "packages": [
    {
      "packageName": "starter",
      "credits": 50,
      "transactionId": "MPE123",
      "addedDate": "2024-01-01"
    },
    {
      "packageName": "standard",
      "credits": 200,
      "transactionId": "MPE456",
      "addedDate": "2024-01-02"
    }
  ],
  "totalCredits": 250,
  "hasUnlimited": false,
  "packageCount": 2
}
```

### Add Package to Election
```
POST /api/elections/:id/add-package
Body: { "packageId": "user_package_id" }
```

**Response:**
```json
{
  "success": true,
  "message": "Package added to election successfully",
  "election": {
    "id": "election123",
    "title": "Student Council Election",
    "totalPackages": 2,
    "totalCredits": 250,
    "hasUnlimited": false
  }
}
```

## Database Schema

### Election Model
```javascript
{
  packages: [{
    packageName: String,    // 'starter', 'standard', etc.
    credits: Number,        // 50, 200, -1 (unlimited)
    transactionId: String,  // Payment reference
    addedDate: Date
  }],
  
  // Virtual fields (calculated)
  totalCredits: Number,           // Sum of all package credits
  hasUnlimitedCredits: Boolean    // True if any package is unlimited
}
```

## UI Display

### Main Dashboard
```
┌─────────────────────────┐
│ Election Title          │
│ Organization            │
│                         │
│ ┌─────────────────────┐ │
│ │ 2 Packages          │ │
│ │ Starter + Standard  │ │
│ │ Total Credits: 250  │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

### Election Details Header
```
┌──────────────────────────────────┐
│ ← Election Title                 │
│   ┌────────────────────────────┐ │
│   │ 2 Packages                 │ │
│   │ Multiple                   │ │
│   │ Total Credits: 250         │ │
│   │ [Add Package]              │ │
│   └────────────────────────────┘ │
└──────────────────────────────────┘
```

## Use Cases

### Scenario 1: Growing Election
1. Start with Free package (10 voters)
2. Election grows, add Starter (50 voters)
3. Total: 60 voters available

### Scenario 2: Large Event
1. Buy Standard package (200 voters)
2. More registrations expected
3. Add another Standard (200 voters)
4. Total: 400 voters available

### Scenario 3: Upgrade to Unlimited
1. Start with Starter (50 voters)
2. Unexpectedly large turnout
3. Add Unlimited package
4. Total: Unlimited voters

## Benefits

✅ **Flexible** - Add credits as needed
✅ **Scalable** - Grow election capacity on demand
✅ **Transparent** - See all packages used
✅ **Cost-Effective** - Buy only what you need, when you need it
✅ **No Waste** - Don't overpay upfront

## Calculation Logic

```javascript
// Calculate total credits
totalCredits = packages.reduce((sum, pkg) => {
  if (pkg.credits === -1) return 999999; // Unlimited
  return sum + pkg.credits;
}, 0);

// Check for unlimited
hasUnlimited = packages.some(pkg => pkg.credits === -1);
```

## Frontend Implementation

### Display Total Credits
```typescript
const totalCredits = election.totalCredits 
  ? (election.totalCredits >= 999999 ? '∞' : election.totalCredits)
  : election.creditsUsed;
```

### Show Package Count
```typescript
const packageDisplay = election.packages?.length > 1
  ? `${election.packages.length} Packages`
  : 'Package';
```

## Summary

Users can now:
1. ✅ Create election with one package
2. ✅ Add more packages to same election
3. ✅ See total credits from all packages
4. ✅ View package breakdown
5. ✅ Scale election capacity as needed

The system automatically calculates and displays total credits from all packages assigned to an election!
