# Package-Based Credit System

## Overview

The system has been simplified to use **package-based credits** instead of pooled vote credits. Each election now requires its own dedicated package.

## ✅ What Changed

### Removed:
- ❌ `voteCredits` field from User model
- ❌ Total vote credits tracking
- ❌ Pooled credits across elections
- ❌ `addVoteCredits()` method
- ❌ `useVoteCredits()` method
- ❌ `hasVoteCredits()` method

### Kept:
- ✅ `electionCredits` array (packages)
- ✅ Package-based system
- ✅ One package = One election

## How It Works Now

### 1. User Buys a Package
```javascript
// User purchases "Starter" package
{
  plan: 'starter',
  voterLimit: 50,
  price: 500,
  used: false,
  electionId: null
}
```

### 2. User Creates Election
```javascript
// Package is assigned to election
{
  plan: 'starter',
  voterLimit: 50,
  price: 500,
  used: true,              // ✓ Marked as used
  electionId: "election123" // ✓ Linked to election
}
```

### 3. Election Shows Package Info
```javascript
// Election displays its package
{
  packageUsed: 'starter',
  creditsUsed: 50,
  transactionId: 'MPE123456'
}
```

## Benefits

✅ **Cleaner** - No confusing total credits
✅ **Simpler** - One package = One election
✅ **Transparent** - Clear what each election costs
✅ **Easier Tracking** - See which package for which election
✅ **No Confusion** - Credits don't get mixed between elections

## User Flow

### Before (Pooled Credits):
1. Buy 200 credits
2. Create election 1 (uses 50 credits) → 150 left
3. Create election 2 (uses 50 credits) → 100 left
4. **Confusing**: Which election used which credits?

### After (Package-Based):
1. Buy Starter package (50 voters)
2. Create election 1 → Uses Starter package
3. Want another election? Buy another package
4. **Clear**: Each election has its own package

## Dashboard Display

### Main Dashboard:
- Shows **Available Packages** count
- Shows **Used Packages** count
- No more "total credits"

### Election Cards:
- Shows **Package Used** (e.g., "Starter")
- Shows **Credits** (e.g., "50 voters")
- Clear per-election tracking

## API Changes

### Before:
```javascript
GET /api/auth/credits
{
  voteCredits: 150,
  electionPackages: { available: 2 }
}
```

### After:
```javascript
GET /api/auth/credits
{
  electionPackages: {
    total: 3,
    available: 1,
    used: 2
  }
}
```

## Payment Flow

### 1. User Pays
- Receives 1 package
- Package added to `electionCredits` array
- `used: false` initially

### 2. Create Election
- System finds unused package
- Marks package as `used: true`
- Links package to election

### 3. View Election
- Shows which package was used
- Shows voter limit from that package
- Clear cost tracking

## Migration Notes

Existing users with `voteCredits`:
- Field still exists in database (for backward compatibility)
- Not used in new system
- Can be safely ignored
- Future: Can be removed in database migration

## Summary

**Old System**: Buy credits → Pool them → Use across elections → Confusing
**New System**: Buy package → Use for 1 election → Clear and simple

Each election is now self-contained with its own dedicated package!
