# WanderMeets MVP - Project Overview

## 📊 What You're Getting

This is a **complete, working MVP** of the WanderMeets social travel platform. Everything is functional and ready to run locally on your machine.

### Package Contents

```
wandermeets-mvp/
├── README.md              ← Full documentation
├── QUICKSTART.md          ← 5-minute setup guide
├── setup.sh               ← Automated setup (Mac/Linux)
├── setup.bat              ← Automated setup (Windows)
├── .gitignore
│
├── backend/               ← Node.js + Express + PostgreSQL
│   ├── config/
│   ├── middleware/
│   ├── routes/
│   ├── scripts/
│   ├── server.js
│   ├── package.json
│   └── .env
│
└── frontend/              ← React + Leaflet Maps
    ├── public/
    ├── src/
    ├── package.json
    └── .env
```

## 🎯 Features Implemented

### ✅ Working Features

1. **Real-Time Social Map**
   - Interactive Leaflet map showing your location
   - Activity pins with custom icons by type
   - Live updates via WebSocket
   - Radius filter (1km - 50km)
   - Gender-based visibility filters

2. **Activity Management**
   - Create activities with location, time, capacity
   - RSVP system with capacity limits
   - View activity details and attendees
   - Host can delete their activities
   - Real-time participant count

3. **User System**
   - Secure registration and login (JWT)
   - Profile management
   - Trust score system (0-100)
   - Verification levels
   - Activity history (hosted & attending)

4. **Private Travel Journal**
   - Create location-based journal entries
   - Add notes, titles, moods (emojis)
   - Timeline view of all entries
   - Private - only visible to you
   - GPS coordinates tracked

5. **Crowdsourced Recommendations**
   - Automatic recommendation generation
   - Based on 15+ user pins at same location
   - Anonymous aggregation
   - Organic discovery (no paid placement)

6. **Real-Time Updates**
   - WebSocket connection for live updates
   - New activities appear instantly
   - RSVP notifications to hosts

### 🗄️ Database Schema

**10 Tables:**
- `users` - User accounts and profiles
- `activities` - Public meetup activities
- `activity_rsvps` - Join requests
- `private_pins` - Travel journal entries
- `recommendations` - Crowdsourced locations
- `journeys` - Wave travel buddy system (schema only)
- `journey_requests` - Journey match requests (schema only)
- `conversations` - Chat system (schema only)
- `messages` - Chat messages (schema only)
- `user_reports` - Safety reporting (schema only)

**PostGIS Integration:**
- Geographic point storage
- Fast radius queries using ST_DWithin
- Spatial indexes for performance

## 🔧 Technical Details

### Backend Stack
- **Runtime:** Node.js 16+
- **Framework:** Express.js
- **Database:** PostgreSQL 12+ with PostGIS
- **Auth:** JWT (JSON Web Tokens)
- **Real-time:** WebSocket (ws library)
- **Validation:** express-validator
- **Security:** bcryptjs for password hashing

### Frontend Stack
- **Library:** React 18
- **Maps:** Leaflet + React-Leaflet
- **HTTP:** Axios with interceptors
- **Routing:** React Router v6
- **Styling:** Custom CSS with design system
- **Real-time:** WebSocket client

### Design System
Based on WanderMeets design specification:
- **Colors:** Primary Blue, Ocean Blue, Sunset Orange, Forest Green
- **Typography:** System fonts (SF Pro / Roboto)
- **Spacing:** 8pt grid system
- **Components:** Cards, buttons, forms, badges
- **Mobile-first:** Responsive design

## 📈 Performance Considerations

### Optimizations Included
- Spatial indexing on location fields
- Database connection pooling
- JWT token expiration (7 days)
- Efficient radius queries (PostGIS)
- Client-side caching of user data
- WebSocket reconnection logic

### Scalability Notes
- Stateless backend (horizontal scaling ready)
- Database indexes for fast queries
- WebSocket can be separated to different service
- File uploads ready (path configured)

## 🔐 Security Features

1. **Authentication**
   - Password hashing with bcrypt (10 rounds)
   - JWT tokens with secret key
   - Token validation middleware
   - Secure HTTP-only cookies ready

2. **Authorization**
   - Route-level authentication
   - Owner-only actions (delete, edit)
   - Gender-based visibility filtering

3. **Data Privacy**
   - Private pins never shared
   - Recommendation anonymization
   - User data access controls

4. **Input Validation**
   - express-validator on all routes
   - SQL injection prevention (parameterized queries)
   - XSS protection (React escaping)

## 📱 User Flow

### New User Journey
1. Register account (email, username, password, gender)
2. Login → redirected to map
3. See nearby activities
4. Create first activity OR join existing one
5. Add journal entries from past travels
6. Edit profile with bio and interests

### Returning User Journey
1. Login
2. Map shows current location
3. See real-time activities nearby
4. Check "My Activities" in profile
5. Add new journal entries

## 🌐 API Architecture

### RESTful Endpoints
- `/api/auth/*` - Authentication
- `/api/activities/*` - Activity CRUD
- `/api/users/*` - User profiles
- `/api/pins/*` - Journal entries
- `/api/recommendations/*` - Verified places

### WebSocket Events
- `auth` - User authentication
- `activity_created` - Broadcast new activity
- `activity_rsvp` - Notify host of RSVP
- `new_rsvp` - RSVP confirmation
- `auth_success` - Connection established

## 🚧 Not Implemented (Future Scope)

These features are in the original design but not in this MVP:

- ❌ Wave Journey Matching System
- ❌ AI Travel Planner
- ❌ Vendor Marketplace
- ❌ In-app Chat/Messaging
- ❌ Photo uploads (infrastructure ready)
- ❌ Voice notes for journal
- ❌ Email/SMS verification
- ❌ Push notifications
- ❌ Advanced search and filters
- ❌ Social feed
- ❌ Trip publishing to web

## 💾 Sample Data Included

The database initializer creates:

**3 Sample Users:**
- sarah@example.com (verified, trust score 75)
- alex@example.com (verified, trust score 80)
- priya@example.com (phone verified, trust score 70)

**3 Sample Activities in Rishikesh:**
- Morning Yoga by the Ganges
- Cafe Hopping in Tapovan
- Sunset Hike to Neer Garh

All passwords: `password123`

## 🔍 Testing the Application

### Manual Testing Checklist

**Authentication:**
- [ ] Register new user
- [ ] Login with demo account
- [ ] Logout and login again

**Map Features:**
- [ ] View activities on map
- [ ] Change radius filter
- [ ] Toggle gender filter
- [ ] Click on activity marker
- [ ] Enable recommendations view

**Activities:**
- [ ] Create new activity
- [ ] Use current location feature
- [ ] RSVP to activity
- [ ] View activity details
- [ ] Cancel RSVP
- [ ] Delete own activity

**Journal:**
- [ ] Create journal entry
- [ ] Add note and mood
- [ ] View all entries
- [ ] Delete entry

**Profile:**
- [ ] View profile
- [ ] Edit bio and interests
- [ ] See activity history
- [ ] View trust score

**Real-Time:**
- [ ] Open in two browsers
- [ ] Create activity in one
- [ ] See it appear in other instantly

## 📊 Database Queries

### Key Queries to Understand

**Find nearby activities:**
```sql
SELECT * FROM activities 
WHERE ST_DWithin(location, ST_GeogFromText('POINT(lng lat)'), radius)
```

**Count unique users at location:**
```sql
SELECT COUNT(DISTINCT user_id) 
FROM private_pins 
WHERE ST_DWithin(location, ST_GeogFromText('POINT(lng lat)'), 50)
```

## 🎓 Learning Opportunities

This project demonstrates:
- Full-stack JavaScript development
- PostgreSQL with geographic data (PostGIS)
- RESTful API design
- WebSocket real-time communication
- JWT authentication
- React component architecture
- Responsive CSS design
- Spatial data queries
- Database schema design

## 📞 Support & Troubleshooting

### Common Issues

1. **"Cannot connect to database"**
   - Check PostgreSQL is running
   - Verify .env credentials
   - Ensure database exists

2. **"Port already in use"**
   - Kill existing process
   - Change PORT in .env

3. **"Map not loading"**
   - Check browser console
   - Allow location permissions
   - Check internet connection (for map tiles)

4. **"Activities not appearing"**
   - Check WebSocket connection
   - Verify radius filter
   - Check gender filter settings

### Debug Mode

Enable detailed logging:
```env
NODE_ENV=development
```

Check logs in terminal running backend.

## 🚀 Next Steps

### To Continue Development

1. **Add Chat System**
   - Use existing schema in database
   - Implement WebSocket messaging
   - Add UI components

2. **Photo Uploads**
   - Configure multer middleware
   - Add S3 or local storage
   - Update journal UI

3. **Email Verification**
   - Add SendGrid/Mailgun
   - Verification token system
   - Email templates

4. **Mobile App**
   - React Native version
   - Reuse API endpoints
   - Add push notifications

### Deployment Checklist

- [ ] Change JWT_SECRET to random string
- [ ] Setup production database
- [ ] Configure CORS for production domain
- [ ] Setup SSL/HTTPS
- [ ] Use environment-specific configs
- [ ] Setup monitoring (PM2, New Relic)
- [ ] Add rate limiting
- [ ] Setup backup strategy

## 📄 File Descriptions

**Backend:**
- `server.js` - Express app + WebSocket server
- `config/database.js` - PostgreSQL connection pool
- `middleware/auth.js` - JWT verification
- `routes/*.js` - API endpoints
- `scripts/init-db.js` - Database initialization

**Frontend:**
- `App.js` - Main app component + routing
- `components/Map/MapView.js` - Interactive map
- `components/Auth/*.js` - Login/Register
- `components/Activities/*.js` - Activity management
- `components/Profile/Profile.js` - User profile
- `components/Journal/*.js` - Travel journal
- `utils/api.js` - API client
- `utils/websocket.js` - WebSocket client

## 🎉 Success Metrics

You'll know it's working when:
1. ✅ Frontend loads at http://localhost:3000
2. ✅ Backend API responds at http://localhost:5000/health
3. ✅ You can login with demo credentials
4. ✅ Map shows your current location
5. ✅ Sample activities appear on map
6. ✅ You can create and join activities
7. ✅ Real-time updates work across browser tabs
8. ✅ Journal entries save and display

---

**Built with ❤️ based on the WanderMeets design specification**

Version: 1.0.0 (MVP)
Created: April 2026
