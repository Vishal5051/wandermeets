# 🚀 WanderMeets MVP - Quick Start Guide

## ⚡ 5-Minute Setup (If you have PostgreSQL installed)

### 1. Create Database (30 seconds)
```bash
psql -U postgres -c "CREATE DATABASE wandermeets;"
```

### 2. Setup Backend (2 minutes)
```bash
cd backend
cp .env.example .env
# Edit .env with your PostgreSQL password
npm install
npm run init-db
```

### 3. Setup Frontend (2 minutes)
```bash
cd frontend
npm install
```

### 4. Start Everything (30 seconds)
```bash
# Terminal 1 - Backend
cd backend && npm start

# Terminal 2 - Frontend  
cd frontend && npm start
```

### 5. Login & Explore!
Open http://localhost:3000

**Demo Login:**
- Email: sarah@example.com
- Password: password123

---

## 📦 First Time PostgreSQL Installation

### macOS (Homebrew)
```bash
brew install postgresql@14 postgis
brew services start postgresql@14
createdb wandermeets
```

### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib postgis
sudo systemctl start postgresql
sudo -u postgres createdb wandermeets
```

### Windows
1. Download PostgreSQL from https://www.postgresql.org/download/windows/
2. Run installer (remember the password you set!)
3. Open pgAdmin 4 and create database 'wandermeets'

---

## ✅ What You Get

- ✨ Interactive map with real-time activity pins
- 👥 Create and join meetups
- 📝 Private travel journal
- 👤 User profiles with trust scores
- 🔒 Gender-filtered privacy controls
- ⭐ Crowdsourced recommendations
- 🔄 Live WebSocket updates

---

## 🎯 First Things to Try

1. **Login** with demo account
2. **Create an activity** (use "Use Current Location" button)
3. **Join sample activities** in Rishikesh
4. **Add a journal entry** from the Journal menu
5. **Edit your profile** with bio and interests

---

## 🆘 Common Issues

**"Database connection failed"**
```bash
# Make sure PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list | grep postgresql  # macOS
```

**"Port 5000 already in use"**
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9
```

**"PostGIS extension not found"**
```bash
# Install PostGIS extension
sudo apt install postgis  # Linux
brew install postgis  # macOS
```

---

## 📖 Full Documentation

See README.md for complete API documentation, project structure, and deployment guide.

---

**Happy Wandering! 🌍✈️**
