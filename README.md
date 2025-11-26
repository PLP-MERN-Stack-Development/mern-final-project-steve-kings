# PollSync - Digital Election Management System

A comprehensive, secure, and modern digital election management platform built with Next.js, Node.js, and MongoDB.

## 🚀 Features

### 🗳️ Election Management
- **Create Elections** - Set up elections with title, organization, dates, and description
- **Organization-Based** - Link elections to specific organizations
- **Real-time Updates** - Live vote counting via Socket.io
- **Multiple Tabs** - Overview, Analytics, and Voters management
- **Status Tracking** - Upcoming, Active, and Completed states
- **Election Sharing** - Generate shareable voting links

### 📊 Advanced Analytics Dashboard
- **Pie Chart** - Visual vote distribution by candidate
- **Bar Chart** - Side-by-side vote comparison
- **Line Chart** - 24-hour vote timeline tracking
- **Statistics Cards** - Key metrics (total candidates, votes, leading candidate, winning margin)
- **Real-time Data** - Live updates as votes are cast
- **Export Ready** - Data visualization for reporting

### 🏢 Organization Management
- **Create Organizations** - Manage multiple organizations
- **Organization Details** - Name, description, website, email, phone, address
- **Edit Organizations** - Update organization information anytime
- **View Elections** - See all elections per organization
- **Organization Dashboard** - Dedicated page for each organization
- **Member Management** - Owner and member tracking

### 👥 Voter Management
- **Manual Addition** - Add voters one by one with dynamic form rows
- **Bulk Import** - CSV file upload for multiple voters
- **CSV Template** - Download pre-formatted template
- **Voter List** - View all allowed voters with details
- **Delete Voters** - Remove voters with confirmation
- **Student ID System** - Unique identifier for each voter
- **Optional Fields** - Name and email (optional)

### 📞 Contact & Inquiry System
- **Organizer Contact Info** - Set contact person, email, and phone
- **Voting Page Display** - Contact information shown to voters
- **Clickable Links** - Email and phone links for easy contact
- **Database Storage** - All contact info stored securely
- **Edit Anytime** - Update contact details from dashboard

### 💳 Payment & Credits System
- **Per-Election Packages** - Each election requires its own package purchase
- **Multiple Plans** - Free, Starter, Standard, Unlimited
- **M-Pesa Integration** - Secure payment via Kopokopo
- **Package Validation** - Prevents election creation without package
- **Transaction History** - View all payment transactions
- **Real-time Credit Updates** - Instant credit reflection after payment

### 🎨 Modern Voting Experience
- **Clean UI** - Modern, intuitive voting interface
- **Candidate Cards** - Photos, names, positions, and manifestos
- **Position Grouping** - Organized by position (President, Secretary, etc.)
- **Visual Feedback** - Selected candidates highlighted
- **Status Indicators** - Voting open/closed/upcoming badges
- **Contact Display** - Inquiry information for voters
- **Responsive Design** - Works on all devices

### 🔐 Security & Authentication
- **User Registration** - Email and password authentication
- **Google Sign-In** - OAuth integration
- **JWT Tokens** - Secure session management
- **Role-Based Access** - Admin, Organizer, Voter roles
- **Protected Routes** - Middleware authentication
- **Password Hashing** - bcrypt encryption

### 📱 Real-time Features
- **Socket.io Integration** - Live vote updates
- **Connection Indicator** - Shows online/offline status
- **Auto-refresh** - Dashboard updates automatically
- **Live Results** - Real-time vote counting
- **Notifications** - Payment and vote confirmations

### 📧 Email Notifications
- **Payment Confirmations** - Automatic receipt after successful payment
- **Admin Bulk Email** - Send marketing/announcements to all users
- **Customizable Templates** - Election and password reset emails (optional)
- **Gmail Integration** - Powered by Nodemailer
- **Batch Processing** - Sends emails in batches for reliability

### 🎯 Admin Features
- **Admin Dashboard** - System-wide overview
- **User Management** - View and manage all users
- **Transaction Monitoring** - Track all payments
- **Election Oversight** - View all elections
- **Analytics** - System-wide statistics

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Recharts** - Data visualization
- **Socket.io Client** - Real-time updates
- **Axios** - HTTP client

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **Socket.io** - WebSocket server
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing
- **Nodemailer** - Email notifications

### Payment Integration
- **Kopokopo API** - M-Pesa payment gateway
- **Webhook Handling** - Payment confirmations
- **Transaction Tracking** - Payment history

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- MongoDB 5+
- npm or yarn

### Backend Setup
```bash
cd server
npm install
cp .env.example .env
# Configure your .env file
npm start
```

### Frontend Setup
```bash
cd client
npm install
cp .env.local.example .env.local
# Configure your .env.local file
npm run dev
```

## 🔧 Environment Variables

### Server (.env)
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
KOPOKOPO_CLIENT_ID=your_kopokopo_client_id
KOPOKOPO_CLIENT_SECRET=your_kopokopo_client_secret
KOPOKOPO_API_KEY=your_kopokopo_api_key

# Email Configuration (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_APP_PASSWORD=your-16-character-app-password
```

**Gmail Setup:**
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Step Verification
3. Generate App Password at [App Passwords](https://myaccount.google.com/apppasswords)
4. Use the 16-character password in EMAIL_APP_PASSWORD

### Client (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

## 📖 Usage

### Creating an Election
1. **Create Organization** - Set up your organization first
2. **Purchase Package** - Buy a package for the election
3. **Create Election** - Fill in election details and select organization
4. **Add Candidates** - Add candidates with photos and manifestos
5. **Add Voters** - Import voters via CSV or add manually
6. **Share Link** - Distribute voting link to voters

### Voting Process
1. **Access Link** - Voters visit the election link
2. **Verify Identity** - Enter Student ID
3. **Select Candidates** - Choose one candidate per position
4. **Submit Vote** - Cast votes securely
5. **Confirmation** - Receive success message

### Viewing Results
1. **Overview Tab** - Live results with progress bars
2. **Analytics Tab** - Detailed charts and statistics
3. **Voters Tab** - Manage allowed voters
4. **Real-time Updates** - Results update automatically

## 🎨 Key Pages

- `/` - Landing page
- `/login` - User authentication
- `/register` - New user registration
- `/dashboard` - Main dashboard
- `/dashboard/organizations` - Organization management
- `/dashboard/organizations/[id]` - Organization details
- `/dashboard/create-election` - Create new election
- `/dashboard/elections/[id]` - Election details (Overview, Analytics, Voters)
- `/dashboard/transactions` - Payment history
- `/pricing` - Package pricing
- `/vote/[id]` - Public voting page
- `/admin-dashboard` - Admin panel

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Protected API routes
- Role-based access control
- CORS configuration
- Input validation
- SQL injection prevention
- XSS protection

## 📊 Database Models

- **User** - User accounts with credits
- **Organization** - Organization entities
- **Election** - Election details
- **Candidate** - Candidate information
- **Vote** - Vote records
- **AllowedVoter** - Voter whitelist
- **Transaction** - Payment records

## 🚀 Deployment

### Backend
- Deploy to Heroku, Railway, or DigitalOcean
- Set environment variables
- Configure MongoDB Atlas
- Set up Kopokopo webhooks

### Frontend
- Deploy to Vercel (recommended)
- Configure environment variables
- Set up custom domain

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## 📝 License

This project is licensed under the MIT License.

## 👨‍💻 Developer

Developed by **Kings Creation** - [kingscreation.co.ke](https://kingscreation.co.ke)

## 📧 Support

For support, email support@pollsync.com or visit our website.

## 🎯 Roadmap

- [ ] Email notifications
- [ ] SMS voting reminders
- [ ] Multi-language support
- [ ] Advanced reporting
- [ ] API documentation
- [ ] Mobile app
- [ ] Blockchain verification
- [ ] AI-powered fraud detection

## ⚡ Performance

- Real-time updates via WebSockets
- Optimized database queries
- Image optimization
- Lazy loading
- Code splitting
- CDN integration

## 🧪 Testing

```bash
# Run backend tests
cd server
npm test

# Run frontend tests
cd client
npm test
```

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

---

**PollSync** - Secure Digital Elections Made Simple 🗳️

© 2025 Kings Creation. All rights reserved.
