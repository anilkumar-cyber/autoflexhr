# AutoFlexHR AI — Recruitment Intelligence Platform

> AI-Powered Enterprise ATS Platform built with React + FastAPI + PostgreSQL + OpenAI

---

## 🚀 Quick Start (Frontend Only — No Backend Needed)

The frontend works completely standalone using Google Sheets as the data source.

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

**Login credentials:**
- Admin: hr@autoflex.com / admin123
- Recruiter: recruiter@autoflex.com / recruiter123

---

## 📁 Project Structure

```
AutoFlexHR_AI/
├── frontend/                  # React + Vite + Tailwind
│   ├── src/
│   │   ├── pages/
│   │   │   ├── AuthPage.jsx         # Login + Register
│   │   │   ├── Dashboard.jsx        # Metrics + Charts
│   │   │   ├── Candidates.jsx       # Table + Modal + AI
│   │   │   ├── Analytics.jsx        # Full analytics
│   │   │   ├── Pipeline.jsx         # Kanban board
│   │   │   ├── AIAssistant.jsx      # AI interview + fraud
│   │   │   └── Settings.jsx         # Admin settings
│   │   ├── layouts/
│   │   │   └── DashboardLayout.jsx  # Sidebar + Topbar
│   │   ├── context/
│   │   │   └── store.js             # Zustand state
│   │   └── utils/
│   │       └── helpers.js           # Utilities
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
└── backend/                   # FastAPI + PostgreSQL
    ├── app/
    │   ├── main.py                  # Entry point
    │   ├── api/
    │   │   ├── auth.py              # JWT auth
    │   │   ├── candidates.py        # CRUD + Sheets sync
    │   │   ├── ai.py                # AI endpoints
    │   │   └── analytics.py        # Dashboard metrics
    │   ├── ai/
    │   │   └── ai_service.py        # GPT-4o-mini
    │   ├── core/
    │   │   ├── config.py            # Settings
    │   │   └── security.py          # JWT
    │   ├── database/
    │   │   └── models.py            # SQLAlchemy models
    │   └── schemas/
    │       └── schemas.py           # Pydantic schemas
    ├── requirements.txt
    └── .env
```

---

## ✨ Features

### Frontend (Works without backend)
- ✅ Login / Register with role-based access
- ✅ Dashboard with 8 metric cards + 6 chart types
- ✅ Candidates table — search, filter, sort, paginate, bulk actions
- ✅ Candidate modal — Profile, Resume PDF, Evaluation, Notes tabs
- ✅ Quick actions — Call, Email (with templates), WhatsApp, Calendar, Maps, Copy
- ✅ Kanban Pipeline — drag & drop between stages
- ✅ Analytics — bar, pie, radar, area, line charts
- ✅ Dark mode toggle
- ✅ Auto-refresh every 5 minutes with countdown timer
- ✅ Google Sheets live sync with proxy fallback
- ✅ Export CSV
- ✅ Mobile responsive
- ✅ Smooth Framer Motion animations

### Backend (Requires FastAPI + PostgreSQL + OpenAI)
- ✅ JWT Authentication
- ✅ PostgreSQL persistence
- ✅ Sync from Google Sheets to DB
- ✅ CRUD for candidates
- ✅ AI Interview Assistant (GPT-4o-mini)
- ✅ AI Fraud Detection (GPT-4o-mini)
- ✅ Analytics dashboard API

---

## 🔧 Backend Setup

### 1. Install PostgreSQL and create database
```sql
CREATE DATABASE autoflex_hr;
```

### 2. Configure .env
```bash
cd backend
cp .env .env.local
# Edit .env with your credentials:
DATABASE_URL=postgresql://postgres:password@localhost:5432/autoflex_hr
SECRET_KEY=your-super-secret-key
OPENAI_API_KEY=sk-your-openai-key
```

### 3. Install and run
```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

---

## 🔗 Google Sheets Setup

1. Make sure your sheet is shared: **Share → Anyone with the link → Viewer**
2. Go to Google Cloud Console → Enable **Google Sheets API**
3. Create an **API Key** → Remove domain restrictions → Allow Sheets API
4. In the app: **Settings** → paste API key → Save & Sync

### Expected Sheet Columns (Row 1):
```
Name | Email | Phone | City | Educational Qualification | Job title |
Job History | Skills | HR Evaluation | ATS Score | Interview Status |
Interview Date | Resume URL
```

---

## 🚀 Deploy

### Frontend (Vercel)
```bash
cd frontend
npm run build
# Push to GitHub → Connect to Vercel → Deploy
# Set env: VITE_API_URL=https://your-backend.railway.app
```

### Backend (Railway / Render)
```bash
# Push backend/ to GitHub
# Railway: New Project → Deploy from GitHub → Add PostgreSQL plugin
# Set environment variables from .env
```

---

## 🤖 AI Features (requires backend + OpenAI key)

### Interview Assistant
- Executive candidate summary
- Hire recommendation (Strong Hire / Hire / Maybe / No Hire)
- Strengths & weaknesses
- 5 tailored technical questions
- 3 HR questions
- Communication & leadership scores

### Fraud Detection
- Fraud risk score (0-100%)
- Risk level (Low / Medium / High / Critical)
- Suspicious indicators with severity
- Timeline & skill authenticity analysis
- Verification steps

---

## 📊 Role-Based Access

| Feature | HR Admin | Recruiter |
|---------|----------|-----------|
| View all candidates | ✅ | ✅ |
| Change candidate status | ✅ | ❌ |
| Bulk status updates | ✅ | ❌ |
| Move pipeline cards | ✅ | ❌ |
| Settings & API config | ✅ | ❌ |
| AI features | ✅ | ✅ |
| Export CSV | ✅ | ✅ |
| View analytics | ✅ | ✅ |

---

Built with ❤️ using React, Tailwind CSS, Framer Motion, FastAPI, and OpenAI
