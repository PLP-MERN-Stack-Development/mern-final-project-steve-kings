# Flexible Payment Phone Numbers

## Overview

The payment system allows **any phone number** to be used for M-Pesa payments, not just the phone number saved in the user's profile.

## How It Works

### 1. User Can Enter Any Number
- On the pricing page, users can type any Kenyan phone number
- No restriction to profile phone number
- Supports multiple formats:
  - `0712345678` → Auto-formatted to `+254712345678`
  - `712345678` → Auto-formatted to `+254712345678`
  - `254712345678` → Auto-formatted to `+254712345678`
  - `+254712345678` → Used as-is

### 2. Payment Flow
1. User selects a plan on `/pricing`
2. User enters **any** phone number
3. System sends STK push to that number
4. Payment is linked to logged-in user account
5. Credits are added to user's account

### 3. Use Cases

**Why allow any phone number?**
- User's phone might be off/unavailable
- Someone else can pay on user's behalf (friend, family, colleague)
- User might have multiple M-Pesa numbers
- Corporate payments from company phone
- Flexibility for users

### 4. Security & Tracking

**Payment is still secure:**
- Payment is linked to logged-in user account
- Transaction records store both:
  - User ID (who gets the credits)
  - Phone number (who paid)
- Email confirmation sent to user's email
- Transaction history shows all payments

**Example:**
```javascript
{
  userId: "user123",           // Credits go here
  phoneNumber: "+254700000000", // Payment came from here
  amount: 500,
  status: "Success"
}
```

## Frontend Implementation

### Pricing Page (`/pricing`)
```jsx
<input
  type="tel"
  placeholder="712 345 678"
  value={phoneNumber}
  onChange={(e) => setPhoneNumber(e.target.value)}
/>
```
- User can type any number
- No validation against profile
- Clear placeholder showing format

### Payment Button
```jsx
<PaymentButton
  amount={selectedPlan?.price}
  phoneNumber={phoneNumber}  // Any number user entered
  onSuccess={handlePaymentSuccess}
/>
```

## Backend Implementation

### STK Push Controller
```javascript
exports.initiateSTKPush = async (req, res) => {
  const { phoneNumber, amount } = req.body;
  
  // Accept any phone number
  // Format it properly
  let formattedPhone = phoneNumber.replace(/\s/g, '');
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '+254' + formattedPhone.substring(1);
  }
  
  // Send STK push to that number
  // Link payment to logged-in user
}
```

### Transaction Record
```javascript
{
  transactionId: "MPE123456",
  userId: req.user._id,        // Who gets credits
  phoneNumber: formattedPhone,  // Who paid
  amount: 500,
  status: "Success"
}
```

## Benefits

✅ **Flexibility** - Users can use any M-Pesa number
✅ **Convenience** - Someone else can pay on their behalf
✅ **No Restrictions** - Not limited to profile phone
✅ **Secure** - Credits still go to correct user account
✅ **Trackable** - All transactions recorded with both user and phone

## Important Notes

- Credits are added to the **logged-in user's account**
- Payment phone number is just for **sending STK push**
- User must be logged in to receive credits
- Guest payments are supported but require registration to claim credits
- Email confirmation sent to user's registered email
