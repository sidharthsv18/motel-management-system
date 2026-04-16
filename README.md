# Motel Management System

A complete full-stack web application for managing motel bookings, rooms, payments, and expenses with role-based access control.

## ✨ Features

- 🔐 **User Authentication** - Login with JWT tokens (Owner & Receptionist roles)
- 📊 **Dashboard** - Real-time KPIs (check-ins, check-outs, revenue, expenses)
- 🛏️ **Room Management** - Track room status and pricing
- 📅 **Booking Management** - Create, update, and manage bookings
- 💳 **Payment Tracking** - Record and monitor payments
- 💰 **Expense Tracking** - Log and categorize expenses
- 📝 **Audit Logs** - Track all changes (owner only)
- 📱 **Responsive UI** - Works on desktop and mobile

## 🚀 Quick Start (5 Minutes)

```bash
# 1. Install dependencies
npm run setup

# 2. Start the application
npm start

# 3. Open in browser
# Frontend: http://localhost:5173
# Backend: http://localhost:5000

# Test credentials:
# Email: ashok@elitegrand.com
# Password: password123
```

**That's it!** No database setup needed yet - uses mock data by default.

## 📚 Full Documentation

For detailed setup, database configuration, and deployment instructions, see [SETUP.md](./SETUP.md)

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | React 18 + Vite + React Router |
| **Backend** | Node.js + Express |
| **Database** | PostgreSQL (optional - currently using mock data) |
| **Auth** | JWT (JSON Web Tokens) |
| **Styling** | CSS (responsive design) |
| **Charts** | Recharts |

## 📋 Available Scripts

```bash
npm start              # Start both frontend & backend
npm run start:server   # Start backend only
npm run start:client   # Start frontend only
npm run setup          # Install all dependencies
npm run prod:client    # Build frontend for production
npm run prod:server    # Start backend in production mode
```

## 🗂️ Project Structure

```
motel-management-system/
├── server/          # Backend (Express API)
│   ├── index.js     # Main server + all routes
│   └── package.json
├── client/          # Frontend (React + Vite)
│   ├── src/
│   │   ├── pages/   # Login, Dashboard, Bookings, etc.
│   │   └── index.css
│   └── package.json
├── database/        # Database schema
├── .env            # Environment variables
└── SETUP.md        # Detailed setup & deployment guide
```

## 🔄 Next Steps

1. **Test the Application** - Login and explore all pages
2. **Setup Database** - Follow SETUP.md to connect PostgreSQL
3. **Deploy** - See deployment options in SETUP.md

## ⚙️ System Requirements

- **Node.js** v14 or higher
- **npm** v6 or higher
- **PostgreSQL** (optional - for production)

## 🐛 Troubleshooting

- **Port already in use?** → Run `npx kill-port 5000`
- **Frontend not loading?** → Check if backend is running
- **Login not working?** → Clear browser cache and localStorage
- **More help?** → See SETUP.md troubleshooting section

## 📄 License

MIT - Feel free to use this project for personal or commercial use.

## 💡 Support

For detailed troubleshooting, database setup, and deployment guides, see the comprehensive [SETUP.md](./SETUP.md) file.

---

**Ready to get started?** Run `npm run setup && npm start` now!


5. Start the server:
   ```
   npm run dev
   ```

### Frontend Setup

1. Navigate to the `client` directory:
   ```
   cd client
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. Open your browser and go to `http://localhost:5173`

### Default Login

- Email: ashok@elitegrand.com
- Password: password123

## Project Structure

```
motel-management-system/
├── client/          # React frontend
├── server/          # Node.js backend
├── database/        # SQL scripts
└── README.md
```

## API Endpoints

- `POST /api/auth/login` - User login
- `GET /api/dashboard` - Dashboard data
- `GET /api/bookings` - List bookings
- `POST /api/bookings` - Create booking
- `GET /api/rooms` - List rooms
- `GET /api/payments` - List payments
- `POST /api/payments` - Create payment
- `GET /api/expenses` - List expenses
- `POST /api/expenses` - Create expense

## Future Enhancements

- Advanced reports and charts
- WhatsApp booking integration
- SMS notifications
- Automated pricing suggestions
- Multi-property support