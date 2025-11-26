# 📚 Kopokopo STK Push Integration Guide (PollSync / Vote‑System)

> **⚠️ Important** – This document **does NOT contain** your real Kopokopo secrets. Wherever you see `<YOUR_…>` replace it with the value from your own `.env` file. Never commit real secrets to source control.

---

## 1️⃣ Overview

| Component | Responsibility |
|-----------|----------------|
| **Frontend** – `PaymentButton` (`client/components/payment/payment.jsx`) | Collect phone + amount, call the backend STK‑push endpoint, show status, listen for real‑time success via Socket.IO. |
| **Backend** – `kopokopoController.js` (`server/controllers`) | Build the Kopokopo payload, obtain an OAuth token, call the Kopokopo **STK‑push** API, return a friendly response. |
| **Webhook** – `handleCallback` (same controller) | Kopokopo posts the final payment status. We store the transaction ID & timestamp in the user’s `electionCredits` array and emit a Socket.IO event. |
| **Socket.IO** – `io` (`server/index.js`) | Pushes `payment_success` events to the logged‑in client so the UI can auto‑close the modal and show a success message. |
| **Test‑Mode** (dev only) | When Kopokopo credentials are missing, the controller simulates a successful payment, adds a credit, and emits the socket event. |

---

## 2️⃣ Prerequisites

1. **Node ≥ 18**, **npm** (or Yarn) installed.
2. **Kopokopo account** – you need:
   - **Client ID**
   - **Client Secret**
   - **API Key** (optional – we use OAuth)
   - **TILL NUMBER** (the number that receives the STK push)
   - **Callback URL** – publicly reachable URL that Kopokopo will POST to (e.g. `https://your‑domain.com/api/kopokopo/webhook`). When testing locally you can expose the server with **ngrok** and set the callback to the ngrok URL.
3. **MongoDB** (Atlas or local) – already configured in the project.
4. **Socket.IO** – already wired in `server/index.js`.

---

## 3️⃣ Environment Variables (`.env`)

Create (or edit) `server/.env` **and keep it out of version control**:

```dotenv
# Kopokopo credentials
KOPOKOPO_CLIENT_ID=<YOUR_KOPOKOPO_CLIENT_ID>
KOPOKOPO_CLIENT_SECRET=<YOUR_KOPOKOPO_CLIENT_SECRET>
KOPOKOPO_API_KEY=<YOUR_KOPOKOPO_API_KEY>          # optional, kept for reference
KOPOKOPO_TILL_NUMBER=<YOUR_TILL_NUMBER>          # e.g. 5674132
KOPOKOPO_BASE_URL=https://api.kopokopo.com        # default – keep unless you use a sandbox
KOPOKOPO_CALLBACK_URL=<YOUR_PUBLIC_CALLBACK_URL>  # e.g. https://abcd1234.ngrok.io/api/kopokopo/webhook

# General server config
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pwd>@cluster0.mongodb.net/vote-system
NEXT_PUBLIC_API_URL=http://localhost:5000           # used by the client for Socket.IO
```

> **Tip:** Keep a `server/.env.example` file in the repo with the same keys but empty values so new developers know what to add.

---

## 4️⃣ Backend – Kopokopo Controller (`server/controllers/kopokopoController.js`)

Below is the **complete, production‑ready** code (with test‑mode logic). Copy‑paste it into `server/controllers/kopokopoController.js`.

```javascript
// ----------------------------------------------------------
//  Kopokopo Controller – STK Push & Webhook handling
// ----------------------------------------------------------

const axios = require('axios');

// ----------------------------------------------------------
// 1️⃣  Load credentials from .env
// ----------------------------------------------------------
const CLIENT_ID     = process.env.KOPOKOPO_CLIENT_ID;
const CLIENT_SECRET = process.env.KOPOKOPO_CLIENT_SECRET;
const API_KEY       = process.env.KOPOKOPO_API_KEY;          // optional
const BASE_URL      = process.env.KOPOKOPO_BASE_URL || 'https://api.kopokopo.com';
const CALLBACK_URL  = process.env.KOPOKOPO_CALLBACK_URL;

// ----------------------------------------------------------
// 2️⃣  Helper – obtain OAuth token from Kopokopo
// ----------------------------------------------------------
const getAccessToken = async () => {
    try {
        const res = await axios.post(`${BASE_URL}/oauth/token`, {
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            grant_type: 'client_credentials'
        });
        return res.data.access_token;
    } catch (err) {
        console.error('❌ Failed to get Kopokopo token', err.response?.data || err.message);
        throw new Error('Kopokopo authentication failed');
    }
};

// ----------------------------------------------------------
// 3️⃣  POST /api/payment/stk-push   –  Initiate STK Push
// ----------------------------------------------------------
exports.initiateSTKPush = async (req, res) => {
    const { phoneNumber, amount } = req.body;

    console.log('=== STK Push Request ===');
    console.log('Phone:', phoneNumber);
    console.log('Amount:', amount);
    console.log('User:', req.user ? req.user._id : 'guest');

    // ---- Basic validation -------------------------------------------------
    if (!phoneNumber || !amount) {
        return res.status(400).json({ success: false, message: 'Phone number and amount are required' });
    }

    // ---- Normalise phone number to +254 format -----------------------------
    let formattedPhone = phoneNumber.replace(/\s/g, '');
    if (formattedPhone.startsWith('0'))          formattedPhone = '+254' + formattedPhone.substring(1);
    else if (formattedPhone.startsWith('254'))   formattedPhone = '+' + formattedPhone;
    else if (!formattedPhone.startsWith('+'))    formattedPhone = '+254' + formattedPhone;

    console.log('Formatted phone:', formattedPhone);

    // ---- Detect DEV / TEST mode (missing credentials) --------------------
    const isTestMode = !CLIENT_ID || !CLIENT_SECRET || CLIENT_ID === 'your_client_id_here';
    if (isTestMode) {
        console.log('⚠️  TEST MODE – Simulating payment');

        // Simulate async processing (3 s)
        setTimeout(async () => {
            console.log('📱 Simulated payment success');

            // ---- Add credit to user (if logged‑in) -------------------------
            if (req.user) {
                const User = require('../models/User');
                const user = await User.findById(req.user._id);
                if (user) {
                    // Determine plan from amount
                    let planDetails = null;
                    const amt = parseFloat(amount);
                    if (amt === 5)      planDetails = { plan: 'free', voterLimit: 10, price: 5 };
                    else if (amt === 500)   planDetails = { plan: 'starter', voterLimit: 50, price: 500 };
                    else if (amt === 1500)  planDetails = { plan: 'standard', voterLimit: 200, price: 1500 };
                    else if (amt === 3000)  planDetails = { plan: 'unlimited', voterLimit: -1, price: 3000 };

                    if (planDetails) {
                        user.electionCredits.push({
                            ...planDetails,
                            transactionId: `TEST_TXN_${Date.now()}`,
                            paymentDate: new Date()
                        });
                        await user.save();
                        console.log(`✅ TEST: Credit added to ${user.username}`);

                        // Emit socket event so the UI updates instantly
                        const io = req.app.get('io');
                        if (io) {
                            io.to(req.user._id.toString()).emit('payment_success', {
                                status: 'success',
                                amount,
                                transactionId: `TEST_TXN_${Date.now()}`,
                                plan: planDetails.plan,
                                timestamp: Date.now()
                            });
                            console.log('✅ TEST: Socket event emitted');
                        }
                    }
                }
            }
        }, 3000);

        // Immediate fake success response
        return res.status(200).json({
            success: true,
            message: 'TEST MODE: Payment simulated successfully',
            testMode: true,
            data: { reference: `TEST_${Date.now()}`, status: 'Success' }
        });
    }

    // --------------------------------------------------------------
    // 4️⃣  REAL KOPOKOPO FLOW – obtain token & call STK endpoint
    // --------------------------------------------------------------
    try {
        console.log('🔐 Getting Kopokopo OAuth token...');
        const token = await getAccessToken();

        const payload = {
            payment_channel: 'M-PESA STK Push',
            till_number: process.env.KOPOKOPO_TILL_NUMBER,
            subscriber: {
                phone_number: formattedPhone,
                email: req.user ? req.user.email : 'guest@pollsync.com'
            },
            amount: { currency: 'KES', value: amount },
            metadata: {
                user_id: req.user ? req.user._id : 'guest',
                purpose: 'ELECTION_PAYMENT'
            },
            _links: { callback_url: CALLBACK_URL }
        };

        console.log('📤 Sending STK request to Kopokopo...');
        const response = await axios.post(`${BASE_URL}/api/v1/incoming_payments`, payload, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
                Accept: 'application/json'
            }
        });

        console.log('✅ Kopokopo responded:', response.status);
        res.status(200).json({
            success: true,
            message: 'STK Push initiated successfully',
            data: response.data
        });
    } catch (err) {
        console.error('❌ Kopokopo STK Push error');
        if (err.response) {
            console.error('Status:', err.response.status);
            console.error('Data:', JSON.stringify(err.response.data, null, 2));
        } else {
            console.error(err.message);
        }
        res.status(500).json({ success: false, message: 'Failed to initiate payment' });
    }
};

// ----------------------------------------------------------
// 5️⃣  Webhook – POST /api/kopokopo/webhook
// ----------------------------------------------------------
exports.handleCallback = async (req, res) => {
    try {
        const { topic, event } = req.body;
        console.log('🔔 Kopokopo webhook received – topic:', topic);

        if (topic !== 'incoming_payment') {
            return res.status(200).json({ success: true });
        }

        const { status, amount, metadata, resource } = event;
        if (resource.status !== 'Success') {
            console.log('⚠️ Payment not successful – status:', resource.status);
            return res.status(200).json({ success: true });
        }

        const userId = metadata.user_id;
        const paymentAmount = parseFloat(resource.amount.value);
        console.log('🧾 Successful payment for user:', userId, 'Amount:', paymentAmount);

        // ---- Determine plan based on amount ---------------------------------
        let planDetails = null;
        if (paymentAmount === 5)      planDetails = { plan: 'free', voterLimit: 10, price: 5 };
        else if (paymentAmount === 500)   planDetails = { plan: 'starter', voterLimit: 50, price: 500 };
        else if (paymentAmount === 1500)  planDetails = { plan: 'standard', voterLimit: 200, price: 1500 };
        else if (paymentAmount === 3000)  planDetails = { plan: 'unlimited', voterLimit: -1, price: 3000 };

        if (!planDetails) {
            console.warn('❓ Unknown payment amount – cannot map to a plan');
            return res.status(200).json({ success: true });
        }

        // ---- Add credit to the user -----------------------------------------
        if (userId && userId !== 'guest') {
            const User = require('../models/User');
            const user = await User.findById(userId);
            if (user) {
                user.electionCredits.push({
                    ...planDetails,
                    transactionId: resource.id || resource.reference || 'N/A',
                    paymentDate: new Date(resource.timestamp || Date.now())
                });
                await user.save();
                console.log(`✅ Credit added to ${user.username}`);

                // Emit real‑time event to the client
                const io = req.app.get('io');
                if (io) {
                    io.to(userId.toString()).emit('payment_success', {
                        status: 'success',
                        amount: resource.amount.value,
                        transactionId: resource.id || resource.reference,
                        plan: planDetails.plan,
                        timestamp: resource.timestamp || Date.now()
                    });
                    console.log('🔔 Socket event emitted to user');
                }
            }
        }

        res.status(200).json({ success: true });
    } catch (err) {
        console.error('❌ Webhook processing error:', err);
        res.status(500).json({ success: false, message: 'Webhook error' });
    }
};
```

> **Where the code lives**
> - STK‑push endpoint: `server/controllers/kopokopoController.js` – exported as `initiateSTKPush`
> - Webhook: same file – exported as `handleCallback`
> - Routes (usually in `server/routes/payment.js`):
>   ```js
>   router.post('/stk-push', protect, kopokopoController.initiateSTKPush);
>   router.post('/webhook', kopokopoController.handleCallback);
>   ```
> - Socket.io is attached in `server/index.js` (`app.set('io', io)`).

---

## 5️⃣ Frontend – Payment Button (`client/components/payment/payment.jsx`)

> The component already contains extensive console logs and fallback polling. Below is a trimmed version that highlights the important parts.

```tsx
"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import io from "socket.io-client";

export default function PaymentButton({ amount, phoneNumber, onSuccess }) {
  const [status, setStatus] = useState("idle");
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);

  // ---------- Socket.io connection ----------
  useEffect(() => {
    console.log("=== Payment Button Mount ===");
    console.log("User:", user?._id);
    console.log("API URL:", process.env.NEXT_PUBLIC_API_URL);

    const socketUrl = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5000";
    const newSocket = io(socketUrl, { transports: ["websocket", "polling"], reconnection: true });

    newSocket.on("connect", () => console.log("✅ Socket connected:", newSocket.id));
    newSocket.on("disconnect", () => console.log("❌ Socket disconnected"));
    newSocket.on("error", err => console.error("Socket error:", err));

    setSocket(newSocket);

    if (user) {
      console.log("Joining room:", user._id);
      newSocket.emit("join_room", user._id);
      newSocket.on("payment_success", data => {
        console.log("✅ Payment success event received:", data);
        if (data.status === "success") {
          setStatus("success");
          if (onSuccess) onSuccess();
        }
      });
    }

    return () => {
      console.log("Cleaning up socket connection");
      newSocket.close();
    };
  }, [user, onSuccess]);

  // ---------- Initiate payment ----------
  const handlePayment = async () => {
    if (!phoneNumber) {
      alert("Please enter a phone number");
      return;
    }

    console.log("=== Initiating Payment ===");
    console.log("Phone:", phoneNumber);
    console.log("Amount:", amount);
    setStatus("loading");

    try {
      const response = await api.post("/payment/stk-push", { phoneNumber, amount });
      console.log("STK Push Response:", JSON.stringify(response.data, null, 2));
      console.log("Success field:", response.data.success);
      console.log("Message:", response.data.message);

      if (response.data.success) {
        setStatus("pending");
        alert("Payment initiated! Check your phone to complete the transaction.");

        // 60‑second fallback – in case the webhook never arrives
        setTimeout(async () => {
          if (status === "pending") {
            console.log("Polling after 60 s for credit...");
            const userRes = await api.get("/auth/profile");
            const hasCredit = userRes.data.electionCredits?.some(c => !c.used);
            if (hasCredit) {
              console.log("✅ Credit found via fallback poll");
              setStatus("success");
              if (onSuccess) onSuccess();
            }
          }
        }, 60000);
      } else {
        setStatus("error");
        alert("Failed to initiate payment: " + response.data.message);
      }
    } catch (err) {
      console.error("Payment Error:", err);
      setStatus("error");
      alert("Payment failed: " + (err.response?.data?.message || err.message));
    }
  };

  // ---------- UI ----------
  return (
    <button
      onClick={handlePayment}
      disabled={["loading", "pending", "success"].includes(status)}
      className={`w-full py-3 px-4 rounded-lg font-bold text-white transition-all ${
        status === "loading" || status === "pending"
          ? "bg-gray-400 cursor-not-allowed"
          : status === "success"
          ? "bg-green-600 cursor-default"
          : status === "error"
          ? "bg-red-600 hover:bg-red-700"
          : "bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl"
      }`}
    >
      {status === "loading"
        ? "Processing..."
        : status === "pending"
        ? "Waiting for payment..."
        : status === "success"
        ? "✅ Payment Successful!"
        : status === "error"
        ? "Error. Try Again"
        : `Pay KES ${amount}`}
    </button>
  );
}
```

### How it works
1. **Mount** – opens a Socket.IO connection to the server (uses `NEXT_PUBLIC_API_URL`).
2. **Join room** – `socket.emit('join_room', user._id)` so the server can target this client.
3. **Payment** – POST `/payment/stk-push` with phone + amount.
4. **Success** – the server (or test‑mode) emits `payment_success`; the client receives it, calls `onSuccess`, and updates UI.
5. **Fallback** – after 60 s we poll `/auth/profile` to see if a credit appeared (covers cases where the webhook is missed).

---

## 6️⃣ Pricing Modal (UI) – `client/components/PricingModal.tsx`

The modal simply imports `PaymentButton` and passes `onSuccess` (which closes the modal and shows a success alert). The full component is already in the repo; no changes needed unless you want to tweak styling.

---

## 7️⃣ Testing the Flow

| Scenario | Steps |
|----------|-------|
| **Local dev (no real Kopokopo keys)** | 1️⃣ Ensure `.env` **does NOT** contain `KOPOKOPO_CLIENT_ID`/`SECRET`. <br>2️⃣ Run `npm run dev` (client & server). <br>3️⃣ Open the app, click “Create Election”. <br>4️⃣ Modal appears → pick a plan → click Pay. <br>5️⃣ Console shows “TEST MODE – Simulating payment”. <br>6️⃣ After ~3 s the modal closes and a success alert appears. |
| **Production (real keys)** | 1️⃣ Fill `.env` with real Kopokopo credentials. <br>2️⃣ Deploy (Vercel/Render/etc.) and expose a **public** callback URL (e.g. `https://my‑app.com/api/kopokopo/webhook`). <br>3️⃣ Test with a real M‑PESA number – you’ll receive the STK prompt on your phone. <br>4️⃣ After confirming, the webhook fires, credit is stored, and the UI updates instantly via Socket.IO. |
| **Fallback check** | Disable Socket.IO (comment out `io.emit` in webhook) and retry a real payment. After 60 s the client will poll the profile endpoint and still detect the new credit, showing success. |

---

## 8️⃣ Deployment Checklist

1. **Environment** – All Kopokopo vars present in the production environment.
2. **HTTPS** – Kopokopo requires a **secure** callback URL (HTTPS).
3. **CORS** – Ensure your server allows the client origin (`Access-Control-Allow-Origin`).
4. **Socket.io** – The client must be able to reach the server URL (`NEXT_PUBLIC_API_URL`). If you use a reverse‑proxy (e.g., Vercel), set `io` to the same host.
5. **Rate limits** – Kopokopo may limit the number of STK pushes per minute; handle `429` responses gracefully (show “try again later”).

---

## 9️⃣ Security & Best Practices

| Practice | Why it matters |
|----------|----------------|
| **Never commit `.env`** | Secrets would be exposed publicly. Use `.gitignore`. |
| **Use HTTPS for callback** | Prevents man‑in‑the‑middle tampering of payment status. |
| **Validate amount on server** | Never trust the client – the server decides which plan the amount maps to. |
| **Sanitise phone numbers** | Ensure only valid Kenyan numbers are sent to Kopokopo. |
| **Log, but don’t log secrets** | Console logs should never print `CLIENT_SECRET` or `API_KEY`. |
| **Test‑mode flag** | Keeps production safe – test‑mode only runs when credentials are missing. |

---

## 📄 Putting It All Together – Example `.env.example`

```dotenv
# Kopokopo – fill these with your real values before deploying
KOPOKOPO_CLIENT_ID=
KOPOKOPO_CLIENT_SECRET=
KOPOKOPO_API_KEY=
KOPOKOPO_TILL_NUMBER=
KOPOKOPO_BASE_URL=https://api.kopokopo.com
KOPOKOPO_CALLBACK_URL=

# General
PORT=5000
MONGODB_URI=
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## 🎉 You’re Ready!

1. **Copy** the controller code into `server/controllers/kopokopoController.js`.  
2. **Add** the routes (`/payment/stk-push` & `/payment/webhook`).  
3. **Configure** your `.env` with the real Kopokopo keys (or leave them blank for test‑mode).  
4. **Run** the app (`npm run dev` for both client & server).  
5. **Open** the UI, try the pricing modal, and you should see a working STK‑push flow (real or simulated).  

If you ever need to reuse this integration in another project, just copy the controller, the environment variables, and the `PaymentButton` component – everything else stays the same.

---

*Happy coding, and enjoy seamless M‑PESA payments!* 🚀
