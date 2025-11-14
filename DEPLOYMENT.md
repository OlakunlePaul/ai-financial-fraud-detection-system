# Deployment Guide

This guide covers deploying the AI Financial Fraud Detection Platform to production.

## Prerequisites

- GitHub account
- Vercel account (for frontend)
- Railway account (for backend)
- Render account (for AI service)
- PostgreSQL database (Railway provides this)

## Frontend Deployment (Vercel)

### Step 1: Prepare Frontend

1. Ensure `frontend/package.json` has build scripts configured
2. Create `vercel.json` in the frontend directory:

```json
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/dist",
  "devCommand": "cd frontend && npm run dev",
  "installCommand": "cd frontend && npm install"
}
```

### Step 2: Deploy to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add Environment Variables:
   - `VITE_API_URL`: Your backend API URL (e.g., `https://your-backend.railway.app/api`)

### Step 3: Update Backend CORS

Update `backend/src/index.ts` to include your Vercel domain in CORS:

```typescript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-app.vercel.app'
  ],
  credentials: true
}));
```

## Backend Deployment (Railway)

### Step 1: Prepare Backend

1. Create `railway.json` in the backend directory:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Step 2: Deploy to Railway

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Add PostgreSQL service:
   - Click "+ New" → "Database" → "PostgreSQL"
6. Configure Environment Variables:
   - `DATABASE_URL`: Auto-provided by Railway PostgreSQL service
   - `JWT_SECRET`: Generate a strong secret (use `openssl rand -base64 32`)
   - `JWT_EXPIRES_IN`: `7d`
   - `NODE_ENV`: `production`
   - `PORT`: Railway auto-assigns
   - `AI_SERVICE_URL`: Your AI service URL
   - `FRONTEND_URL`: Your Vercel frontend URL
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`: Email service credentials
   - `WEBHOOK_URL`: (Optional) Webhook endpoint for alerts

### Step 3: Run Migrations

1. In Railway, open your backend service
2. Go to "Deployments" → "View Logs"
3. Use Railway CLI or connect via SSH to run:
   ```bash
   npm run migrate
   npm run seed
   ```

## AI Service Deployment (Render)

### Step 1: Prepare AI Service

1. Create `render.yaml` in the ai-service directory:

```yaml
services:
  - type: web
    name: fraud-detection-ai
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: python app.py
    envVars:
      - key: PORT
        value: 5001
      - key: FLASK_ENV
        value: production
```

### Step 2: Deploy to Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `fraud-detection-ai`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python app.py`
   - **Root Directory**: `ai-service`
5. Add Environment Variables:
   - `PORT`: `5001`
   - `FLASK_ENV`: `production`

### Alternative: AWS Lambda

If deploying to AWS Lambda:

1. Use Serverless Framework or AWS SAM
2. Package the Flask app with `zappa` or `serverless-wsgi`
3. Configure API Gateway
4. Set environment variables in Lambda configuration

## Database Setup

### Production Database

Railway PostgreSQL is automatically configured. For manual setup:

1. Create database:
   ```sql
   CREATE DATABASE fraud_detection;
   ```

2. Run migrations:
   ```bash
   cd backend
   npm run migrate
   ```

3. Seed initial data:
   ```bash
   npm run seed
   ```

## Environment Variables Summary

### Frontend (.env)
```
VITE_API_URL=https://your-backend.railway.app/api
```

### Backend (.env)
```
DATABASE_URL=postgresql://user:pass@host:port/db
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
NODE_ENV=production
PORT=5000
AI_SERVICE_URL=https://your-ai-service.onrender.com
FRONTEND_URL=https://your-app.vercel.app
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
WEBHOOK_URL=https://your-webhook-endpoint.com
```

### AI Service (.env)
```
PORT=5001
FLASK_ENV=production
```

## Post-Deployment Checklist

- [ ] Frontend deployed and accessible
- [ ] Backend API responding to health checks
- [ ] AI service responding to `/health` endpoint
- [ ] Database migrations completed
- [ ] Seed data created (admin/analyst users)
- [ ] CORS configured correctly
- [ ] Environment variables set
- [ ] Email notifications working (test)
- [ ] Webhook notifications working (if configured)
- [ ] SSL certificates active (HTTPS)

## Monitoring

### Railway
- View logs in Railway dashboard
- Set up alerts for service failures
- Monitor database usage

### Vercel
- View deployment logs
- Monitor performance metrics
- Set up error tracking (Sentry recommended)

### Render
- View service logs
- Monitor uptime
- Set up health check alerts

## Troubleshooting

### Backend Issues
- Check Railway logs for errors
- Verify DATABASE_URL is correct
- Ensure migrations ran successfully
- Check JWT_SECRET is set

### AI Service Issues
- Check Render logs
- Verify model files are generated
- Test `/health` endpoint
- Check Python version compatibility

### Frontend Issues
- Check Vercel build logs
- Verify API URL is correct
- Check browser console for CORS errors
- Ensure environment variables are set

## Scaling Considerations

- **Database**: Use connection pooling (already configured)
- **Backend**: Railway auto-scales, but consider load balancing for high traffic
- **AI Service**: Render auto-scales, but consider caching predictions
- **Frontend**: Vercel CDN handles scaling automatically

## Security Best Practices

1. Use strong JWT secrets
2. Enable HTTPS everywhere
3. Set up rate limiting on API
4. Use environment variables for secrets
5. Regularly update dependencies
6. Enable database backups
7. Monitor for suspicious activity
8. Use secure password hashing (already implemented)

