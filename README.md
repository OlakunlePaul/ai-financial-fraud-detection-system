# AI Financial Fraud Detection Platform

A comprehensive full-stack platform for detecting, visualizing, and preventing fraudulent financial transactions in real-time using AI/ML.

## 🏗️ Architecture

- **Frontend**: React + TypeScript + Tailwind CSS + Recharts
- **Backend**: Node.js + Express + TypeScript + PostgreSQL
- **AI Service**: Python + Flask + scikit-learn
- **Database**: PostgreSQL

## 📁 Project Structure

```
.
├── frontend/          # React frontend application
├── backend/           # Node.js/Express backend API
├── ai-service/        # Python Flask AI/ML service
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.9+
- PostgreSQL 14+
- Git

### Installation

1. **Clone and install dependencies:**
   ```bash
   npm run install:all
   cd ai-service && pip install -r requirements.txt
   ```

2. **Set up PostgreSQL database:**
   ```bash
   createdb fraud_detection
   ```

3. **Configure environment variables:**
   - Copy `.env.example` files in each directory and fill in your values
   - Backend: `backend/.env`
   - Frontend: `frontend/.env`
   - AI Service: `ai-service/.env`

4. **Run database migrations:**
   ```bash
   cd backend && npm run migrate
   ```

5. **Start development servers:**
   ```bash
   # From root directory
   npm run dev
   
   # Or individually:
   npm run dev:backend    # Backend on http://localhost:5000
   npm run dev:frontend   # Frontend on http://localhost:3000
   
   # AI Service (in separate terminal):
   cd ai-service && python app.py  # AI Service on http://localhost:5001
   ```

## 🔐 Default Credentials

- **Admin**: `admin@fraud.com` / `admin123`
- **Analyst**: `analyst@fraud.com` / `analyst123`

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register (admin only)
- `GET /api/auth/me` - Get current user

### Transactions
- `GET /api/transactions` - List transactions (with filters)
- `GET /api/transactions/:id` - Get transaction details
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `POST /api/transactions/:id/flag` - Flag transaction as fraud

### Analytics
- `GET /api/analytics/dashboard` - Dashboard statistics
- `GET /api/analytics/trends` - Daily/monthly trends

## 🤖 AI Service Endpoints

- `POST /predict` - Predict fraud risk score for a transaction
- `GET /health` - Health check

## 🚢 Deployment

### Frontend (Vercel)
1. Connect your GitHub repo to Vercel
2. Set build command: `cd frontend && npm install && npm run build`
3. Set output directory: `frontend/dist`
4. Add environment variables in Vercel dashboard

### Backend (Railway)
1. Connect your GitHub repo to Railway
2. Set root directory: `backend`
3. Add PostgreSQL service
4. Set environment variables
5. Deploy

### AI Service (Render)
1. Create new Web Service on Render
2. Set build command: `pip install -r requirements.txt`
3. Set start command: `python app.py`
4. Add environment variables

## 🔒 Security Features

- JWT authentication
- Role-based access control (Admin, Analyst)
- Password hashing with bcrypt
- CORS configuration
- Input validation and sanitization

## 📊 Features

- Real-time fraud detection
- Transaction dashboard with risk scores
- Interactive charts and visualizations
- Alert system for flagged transactions
- Email/webhook notifications
- User management with roles

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Recharts, Axios
- **Backend**: Node.js, Express, TypeScript, PostgreSQL, Prisma, JWT
- **AI/ML**: Python, Flask, scikit-learn, pandas, numpy
- **Deployment**: Vercel, Railway, Render

## 📝 License

MIT

