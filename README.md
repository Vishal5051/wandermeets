# WanderMeets MVP - Full Stack Social Travel Platform

A complete working MVP of the WanderMeets social travel platform with real-time features, interactive maps, and travel journaling.

## 🚀 Features Implemented

### Core Features
- ✅ **Real-Time Social Map** - Interactive map showing nearby activities with live updates
- ✅ **Activity Creation & RSVP** - Host meetups and join others' activities
- ✅ **User Authentication** - Secure login/registration with JWT
- ✅ **Profile Management** - Update bio, interests, and view activity history
- ✅ **Private Travel Journal** - Document memories with location pins
- ✅ **Trust & Safety** - Verification levels and trust scores
- ✅ **Gender Filters** - Privacy controls for activity visibility
- ✅ **Crowdsourced Recommendations** - Organic location recommendations based on user pins
- ✅ **WebSocket Real-Time Updates** - Live activity updates without refresh

### Tech Stack

**Backend:**
- Node.js + Express
- MySQL 8.x (relational tables & stored procedures)
- WebSocket for real-time updates
- JWT authentication
- RESTful API

**Frontend:**
- React 18
- React Leaflet (interactive maps)
- Axios (API client)
- React Router (navigation)
- CSS3 with design system

## 📋 Prerequisites

Before running this project, make sure you have:

1. **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
2. **MySQL** (v8.x or higher) - [Download](https://dev.mysql.com/downloads/)
3. **npm** or **yarn** package manager

## 🛠️ Installation & Setup

### Step 1: Install & Run MySQL

Ensure MySQL is running on your machine.

#### macOS:
```bash
brew install mysql
brew services start mysql
```

#### Ubuntu/Debian:
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
```

#### Windows:
Download and install the MySQL Installer from [dev.mysql.com](https://dev.mysql.com/downloads/installer/).

### Step 2: Create Database

```sql
-- Connect to MySQL CLI:
mysql -u root -p

-- In the MySQL shell:
CREATE DATABASE wandermeets;
EXIT;
```

### Step 3: Configure Environment Variables

#### Backend (.env):
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` with your database credentials:
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=wandermeets
DB_USER=root
DB_PASSWORD=your_mysql_root_password

PORT=5000
JWT_SECRET=change-this-to-a-random-secret-key
```

### Step 4: Install Dependencies

#### Backend:
```bash
cd backend
npm install
```

#### Frontend:
```bash
cd frontend
npm install
```

### Step 5: Initialize Database

```bash
cd backend
npm run init-db
```

This will create all tables, indexes, and sample data.

### Step 6: Start the Application

#### Terminal 1 - Start Backend:
```bash
cd backend
npm start
```

Backend will run on: http://localhost:5000

#### Terminal 2 - Start Frontend:
```bash
cd frontend
npm start
```

Frontend will open automatically at: http://localhost:3000

## 🔐 Demo Login Credentials

```
Email: sarah@example.com
Password: password123
```

Additional test users:
```
Email: alex@example.com
Password: password123

Email: priya@example.com
Password: password123
```

## 📱 How to Use

### 1. Login/Register
- Use demo credentials or create a new account
- Gender field is required for activity filtering

### 2. Explore the Map
- The map centers on your current location (or Rishikesh by default)
- See nearby activities with custom markers
- Adjust radius filter (1-50 km)
- Toggle gender filter for privacy
- Enable "Show Recommendations" to see popular places

### 3. Create an Activity
- Click "+ Create Activity" button
- Fill in details (title, type, location, time)
- Use "Use Current Location" to auto-fill coordinates
- Set capacity and gender filter
- Activity appears on map in real-time

### 4. Join Activities
- Click on any activity marker on the map
- View full details and host information
- Click "Join Activity" to RSVP
- See other attendees

### 5. Travel Journal
- Navigate to "Journal" in top menu
- Click "+ Add Entry" to create private pins
- Document memories with notes and moods
- Entries are private and only visible to you
- When 15+ users pin the same location, it becomes a recommendation

### 6. Profile
- View and edit your profile
- See your hosted and attending activities
- Update bio, interests, and location

## 🗺️ API Endpoints

### Authentication
```
POST /api/auth/register - Register new user
POST /api/auth/login - Login user
```

### Activities
```
GET  /api/activities/nearby - Get activities within radius
GET  /api/activities/:id - Get activity details
POST /api/activities - Create new activity
POST /api/activities/:id/rsvp - RSVP to activity
DELETE /api/activities/:id/rsvp - Cancel RSVP
DELETE /api/activities/:id - Delete activity (host only)
```

### Users
```
GET /api/users/me - Get current user profile
GET /api/users/:id - Get user by ID
PATCH /api/users/me - Update profile
GET /api/users/me/activities - Get user's activities
```

### Private Pins (Journal)
```
GET /api/pins - Get user's private pins
GET /api/pins/:id - Get single pin
POST /api/pins - Create new pin
PATCH /api/pins/:id - Update pin
DELETE /api/pins/:id - Delete pin
```

### Recommendations
```
GET /api/recommendations/nearby - Get recommendations near location
GET /api/recommendations/:id - Get recommendation details
```

## 🏗️ Project Structure

```
wandermeets-mvp/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── middleware/
│   │   └── auth.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── activities.js
│   │   ├── users.js
│   │   ├── pins.js
│   │   └── recommendations.js
│   ├── scripts/
│   │   └── init-db.js
│   ├── server.js
│   ├── package.json
│   └── .env
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── Auth/
    │   │   │   ├── Login.js
    │   │   │   ├── Register.js
    │   │   │   └── Auth.css
    │   │   ├── Map/
    │   │   │   ├── MapView.js
    │   │   │   └── MapView.css
    │   │   ├── Activities/
    │   │   │   ├── CreateActivity.js
    │   │   │   ├── ActivityDetails.js
    │   │   │   └── Activities.css
    │   │   ├── Profile/
    │   │   │   ├── Profile.js
    │   │   │   └── Profile.css
    │   │   ├── Journal/
    │   │   │   ├── TravelJournal.js
    │   │   │   └── TravelJournal.css
    │   │   └── Layout/
    │   │       ├── Navbar.js
    │   │       └── Navbar.css
    │   ├── utils/
    │   │   ├── api.js
    │   │   └── websocket.js
    │   ├── App.js
    │   ├── App.css
    │   ├── index.js
    │   └── index.css
    ├── package.json
    └── .env
```

## 🔍 Troubleshooting

### Database Connection Issues
```bash
# Check if MySQL is running
sudo systemctl status mysql  # Linux
brew services list  # macOS

# Test connection
mysql -u root -p -d wandermeets
```

### Node Modules Issues
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 🚀 Production Deployment

### Environment Variables for Production

**Backend:**
```env
NODE_ENV=production
DB_HOST=your-production-db-host
JWT_SECRET=strong-random-secret-key
```

**Frontend:**
```env
REACT_APP_API_URL=https://your-api-domain.com
REACT_APP_WS_URL=wss://your-api-domain.com
```

### Build Commands

```bash
# Frontend
cd frontend
npm run build

# Backend (use process manager like PM2)
npm install -g pm2
pm2 start server.js --name wandermeets-api
```

## 🎯 Future Enhancements (Not in MVP)

- Wave Journey Matching System
- AI Travel Planner
- Vendor Marketplace
- Chat/Messaging System
- Photo uploads to journal entries
- Voice notes for journal
- Email verification
- Phone verification
- Advanced search filters
- Push notifications
- Mobile app (React Native)

## 📄 License

This is a portfolio/demo project. 

## 🤝 Support

For issues or questions:
1. Check the troubleshooting section
2. Review API documentation
3. Check browser console for errors
4. Check backend logs for server errors

## 🎉 Demo Features to Try

1. **Create an activity** near your location
2. **RSVP to sample activities** in Rishikesh
3. **Add journal entries** for places you've visited
4. **Edit your profile** with bio and interests
5. **Test gender filters** to see how visibility changes
6. **Watch real-time updates** when activities are created

---

**Built with ❤️ for travelers, by travelers**
