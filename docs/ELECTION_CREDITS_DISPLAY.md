# Election Credits Display

## Overview

Each election now displays the package and credits used for that specific election, making it easy to track which plan was purchased for each election.

## What's Displayed

### 1. Main Dashboard (`/dashboard`)
Each election card shows:
- **Package Used**: The plan name (Free, Starter, Standard, Unlimited)
- **Credits**: Number of vote credits allocated to that election
  - Shows actual number (10, 50, 200)
  - Shows ∞ for unlimited plans

### 2. Election Details Page (`/dashboard/elections/[id]`)
Header displays:
- **Package**: Plan name in a badge
- **Credits**: Vote credits for this election
- Clean, compact display next to election title

## Visual Design

- **Green gradient background** (from-green-50 to-emerald-50)
- **Green border** for consistency with brand
- **Bold, clear typography** for easy reading
- **Separate sections** for package name and credits

## Database Fields

Elections now store:
```javascript
{
  packageUsed: String,      // e.g., 'starter', 'standard'
  creditsUsed: Number,       // e.g., 50, 200, 999999 (unlimited)
  transactionId: String      // Transaction that paid for this
}
```

## How It Works

1. **When election is created**:
   - System captures which package was used
   - Stores the credit allocation
   - Links to the transaction ID

2. **On dashboard**:
   - Each election shows its own package/credits
   - Users can see at a glance which plan each election uses
   - Helps track spending per election

3. **Benefits**:
   - Clear visibility of resources per election
   - Easy to track which elections used which packages
   - Helps with budgeting and planning
   - Transparent credit allocation

## Example Display

```
┌─────────────────────────────────┐
│ Package Used          Credits   │
│ Starter               50        │
└─────────────────────────────────┘
```

## Future Enhancements

- [ ] Show remaining credits per election
- [ ] Display transaction details on click
- [ ] Add credit usage analytics
- [ ] Show credit consumption rate
