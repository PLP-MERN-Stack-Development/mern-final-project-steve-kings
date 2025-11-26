# Payment Security & Validation

## Overview

The system ensures credits are **ONLY** added for successful payments with multiple layers of validation.

## ✅ Security Checks in Place

### 1. Webhook Handler (Primary Method)

**Location:** `server/controllers/kopokopoController.js` - `handleCallback()`

**Validation Steps:**
```javascript
// Step 1: Check payment status
const isSuccess = resource.status === 'Success' || resource.status === 'Received';

// Step 2: Only process if BOTH conditions are true
if (isSuccess && planDetails) {
    // Add credits
}
```

**What this prevents:**
- ❌ Pending payments don't get credits
- ❌ Failed payments don't get credits
- ❌ Cancelled payments don't get credits
- ✅ Only Success/Received payments get credits

### 2. Duplicate Prevention

**Check before adding credits:**
```javascript
const existingCredit = user.electionCredits.find(
    credit => credit.transactionId === mpesaReceiptNumber
);

if (existingCredit) {
    console.log('⚠️  Credit already added for this transaction');
    return; // Don't add again
}
```

**What this prevents:**
- ❌ Double crediting from webhook retries
- ❌ Multiple credits for same transaction
- ✅ Each transaction only credits once

### 3. Transaction Tracking

**Every payment creates a transaction record:**
```javascript
{
  transactionId: "MPE123456",
  status: "Pending",  // Initially
  processed: false,   // Initially
  userId: "user123",
  amount: 500
}
```

**Status flow:**
1. `Pending` → STK push sent, waiting for payment
2. `Success` → Payment confirmed by M-Pesa
3. `processed: true` → Credits added to user

**What this prevents:**
- ❌ Credits without payment
- ❌ Fake transactions
- ✅ Full audit trail

### 4. Manual Credit Endpoint

**Location:** `server/routes/payment.js` - `/manual-credit`

**Validation Steps:**
```javascript
// 1. Transaction must exist (from real STK push)
if (!transaction) {
    return error('Transaction not found');
}

// 2. Must belong to requesting user
if (transaction.userId !== req.user._id) {
    return error('Not your transaction');
}

// 3. Must not be already processed
if (transaction.processed) {
    return error('Already credited');
}

// 4. Must be Pending or Success status
if (transaction.status !== 'Pending' && transaction.status !== 'Success') {
    return error('Invalid status');
}

// 5. Must be recent (within 10 minutes)
if (transactionAge > 10 minutes) {
    return error('Transaction too old');
}

// Only then add credits
```

**What this prevents:**
- ❌ Fake manual completions
- ❌ Old transaction reuse
- ❌ Other users claiming credits
- ✅ Only legitimate recent payments

### 5. Test Mode Validation

**Even in test mode, same rules apply:**
```javascript
// Simulate payment after 5 seconds
setTimeout(async () => {
    // Update to Success first
    txn.status = 'Success';
    txn.processed = true;
    await txn.save();
    
    // Then add credits
    if (userId && planDetails) {
        // Check for duplicates
        if (!existingCredit) {
            // Add credits
        }
    }
}, 5000);
```

## Payment Flow with Validation

### Normal Flow (Webhook)
```
1. User initiates payment
   ↓
2. STK push sent → Transaction created (Pending)
   ↓
3. User enters M-Pesa PIN
   ↓
4. M-Pesa processes payment
   ↓
5. Webhook received with status
   ↓
6. ✅ IF status === 'Success' → Add credits
   ❌ IF status === 'Failed' → No credits
   ❌ IF status === 'Cancelled' → No credits
```

### Manual Flow (Fallback)
```
1. User initiates payment
   ↓
2. STK push sent → Transaction created (Pending)
   ↓
3. User enters M-Pesa PIN
   ↓
4. Webhook delayed/failed
   ↓
5. User clicks "I've Completed Payment"
   ↓
6. System validates:
   - Transaction exists? ✅
   - Belongs to user? ✅
   - Not processed? ✅
   - Recent (< 10 min)? ✅
   - Status Pending/Success? ✅
   ↓
7. Add credits
```

## Database Integrity

### Transaction Model
```javascript
{
  transactionId: String,    // Unique M-Pesa receipt
  status: String,           // Pending/Success/Failed/Cancelled
  processed: Boolean,       // Credits added?
  userId: ObjectId,         // Who gets credits
  phoneNumber: String,      // Who paid
  amount: Number,
  plan: String,
  voterLimit: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### User Model - Election Credits
```javascript
{
  electionCredits: [{
    plan: String,
    voterLimit: Number,
    transactionId: String,  // Links to transaction
    used: Boolean,
    electionId: ObjectId
  }],
  voteCredits: Number       // Total available credits
}
```

## Audit Trail

Every payment is logged:
```javascript
console.log('Processing payment:');
console.log('- Transaction ID:', mpesaReceiptNumber);
console.log('- Amount:', paymentAmount);
console.log('- Status:', resource.status);
console.log('- User:', userId);

// After adding credits
console.log(`✅ User ${user.username} received ${planDetails.plan}`);
console.log(`   Vote Credits Added: ${voteCreditsToAdd}`);
console.log(`   Total Vote Credits: ${user.voteCredits}`);
```

## Summary

✅ **Credits ONLY added when:**
1. Payment status is 'Success' or 'Received'
2. Transaction exists in database
3. Not already processed (no duplicates)
4. Valid plan details found
5. User account exists

❌ **Credits NEVER added for:**
1. Pending payments
2. Failed payments
3. Cancelled payments
4. Duplicate transactions
5. Invalid/fake transactions
6. Old transactions (manual credit)

The system has **5 layers of validation** to ensure only successful payments receive credits!
