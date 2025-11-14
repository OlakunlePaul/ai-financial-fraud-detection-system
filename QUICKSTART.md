# Quick Start Guide

Get the Fraud Detection Platform running locally in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- Python 3.9+ installed
- PostgreSQL 14+ installed and running
- npm or yarn

## Step 1: Clone and Install

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..

# Install AI service dependencies
cd ai-service && pip install -r requirements.txt && cd ..
```

## Step 2: Database Setup

```bash
# Create database
createdb fraud_detection

# Or using psql:
psql -U postgres -c "CREATE DATABASE fraud_detection;"
```

## Step 3: Configure Environment

### Backend
```bash
cd backend
cp .env.example .env
# Edit .env and set:
# - DATABASE_URL=postgresql://postgres:password@localhost:5432/fraud_detection
# - JWT_SECRET=your-secret-key-here
```

### Frontend
```bash
cd frontend
cp .env.example .env
# VITE_API_URL is already set to http://localhost:5000/api
```

### AI Service
```bash
cd ai-service
# .env is optional, defaults are fine for local development
```

## Step 4: Initialize Database

```bash
cd backend
npm run migrate
npm run seed
```

This creates:
- Database tables
- Admin user: `admin@fraud.com` / `admin123`
- Analyst user: `analyst@fraud.com` / `analyst123`

## Step 5: Start Services

### Option A: All Services (Recommended)

Open 3 terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Runs on http://localhost:5000
```

**Terminal 2 - AI Service:**
```bash
cd ai-service
python app.py
# Runs on http://localhost:5001
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm run dev
# Runs on http://localhost:3000
```

### Option B: Using Root Scripts

```bash
# From root directory
npm run dev:backend    # In one terminal
npm run dev:frontend   # In another terminal
# AI service still needs separate terminal: cd ai-service && python app.py
```

## Step 6: Access the Application

1. Open browser: http://localhost:3000
2. Login with:
   - **Admin**: `admin@fraud.com` / `admin123`
   - **Analyst**: `analyst@fraud.com` / `analyst123`

## Testing the System

### Create a Test Transaction

Use the API or frontend to create a transaction:

```bash
# Login first to get token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fraud.com","password":"admin123"}'

# Use the token to create a transaction
curl -X POST http://localhost:5000/api/transactions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "TXN001",
    "amount": 5000,
    "currency": "USD",
    "merchant_name": "Test Merchant",
    "transaction_type": "purchase",
    "payment_method": "credit_card",
    "location_country": "US",
    "location_city": "New York"
  }'
```

The AI service will automatically:
- Calculate fraud risk score
- Flag suspicious transactions
- Create alerts if risk > 70

## Troubleshooting

### Database Connection Error
- Ensure PostgreSQL is running: `pg_isready`
- Check DATABASE_URL in backend/.env
- Verify database exists: `psql -l | grep fraud_detection`

### Port Already in Use
- Backend: Change PORT in backend/.env
- Frontend: Change port in frontend/vite.config.ts
- AI Service: Change PORT in ai-service/.env

### AI Service Not Responding
- Check Python version: `python --version` (needs 3.9+)
- Verify dependencies: `pip list | grep flask`
- Check logs for errors

### Frontend Can't Connect to Backend
- Verify backend is running on port 5000
- Check VITE_API_URL in frontend/.env
- Check browser console for CORS errors

## Next Steps

- Read the main [README.md](./README.md) for full documentation
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment
- Explore the codebase to understand the architecture

## Development Tips

- Backend uses `tsx watch` for hot reload
- Frontend uses Vite for fast HMR
- AI service needs manual restart on code changes
- Use PostgreSQL GUI tools (pgAdmin, DBeaver) for database inspection

