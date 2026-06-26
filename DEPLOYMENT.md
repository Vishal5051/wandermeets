# WanderMeets Deployment Guide

This document describes the step-by-step process to deploy the WanderMeets application onto production using:
* **Database:** Aiven MySQL (Free Forever Plan)
* **Backend:** Render (Free or Paid Service)
* **Frontend:** Netlify (Free Site)

---

## 🛠️ Step 1: Database Setup (Aiven MySQL)

1. Sign in to your [Aiven Console](https://console.aiven.io/).
2. Create a new service under the **Free** tier:
   * **Service type:** `MySQL`
   * **Service Plan:** `Free forever`
3. Once the database is ready (status: `Running`), look at the **Connection information** on the Service Overview page.
4. Copy the **Service URI** (it has the format `mysql://avnadmin:password@host:port/defaultdb?ssl-mode=REQUIRED`).
5. Aiven MySQL requires SSL mode by default. The application is pre-configured to parse this URI and automatically apply `{ ssl: { rejectUnauthorized: false } }`.
6. **Firewall Settings (Allowed IP Addresses)**:
   * By default, Aiven may restrict connections. To allow connections from both Render's servers and your local machine, add the wildcard IP rule `0.0.0.0/0` under the **Allowed IP addresses** section in the service settings.

---

## 📡 Step 2: Backend Setup (Render)

1. Sign in to your [Render](https://render.com/) dashboard.
2. Click **New +** and select **Web Service**.
3. Connect your Git repository containing the project.
4. Configure the Web Service settings:
   * **Name:** `wandermeets-backend`
   * **Branch:** `main` (or `feature-auth-fix`)
   * **Root Directory:** `backend` (Ensure this is set so Render builds from the backend folder)
   * **Runtime:** `Node`
   * **Build Command:** `npm install`
   * **Start Command:** `node server.js`
5. Click **Advanced** and add the following **Environment Variables**:
   * `NODE_ENV`: `production`
   * `MYSQL_URL`: *Paste the connection URI copied from Aiven*
   * `JWT_SECRET`: *A secure random string (e.g. 32-character hexadecimal)*
   * `FRONTEND_URL`: `https://wandermeets.netlify.app` *(The URL of your Netlify frontend)*
   * `UPLOAD_PATH`: `uploads` (relative path resolves inside the project root, keeping it safe from permission errors)
   * `MAX_FILE_SIZE`: `5242880` (5MB limit)
6. **Health Check Path**: Set this to exactly `/health` (Ensure there are no trailing spaces).

7. **Database Initialization (Once database and backend are deployed)**:
   * You need to populate the tables and stored procedures in your database.
   * In your Render dashboard, navigate to your backend web service, open the **Shell** tab, and run:
     ```bash
     npm run init-db
     ```
   * *Optional (extensive mock data):* If you want to populate additional mock data for testing, run:
     ```bash
     node scripts/seed-data.js
     ```

---

## 💻 Step 3: Frontend Setup (Netlify)

The project includes a root [netlify.toml](file:///d:/Programing/LANGUAGES/Full%20Stack/wandermate/netlify.toml) file that automatically configures Netlify.

1. Sign in to your [Netlify](https://www.netlify.com/) dashboard.
2. Click **Add new site** -> **Import an existing project**.
3. Select your Git repository.
4. Netlify will automatically detect and apply the configuration from the `netlify.toml` file:
   * **Base directory:** `frontend`
   * **Build Command:** `CI=false npm run build` (safely ignores minor compiler warnings)
   * **Publish Directory:** `build` (maps to `frontend/build` output)
5. **No Environment Variables Needed**:
   The frontend is pre-configured with **dynamic environment auto-detection**. It checks the browser hostname (`window.location.hostname`):
   * Localhost resolves to `http://localhost:5000`.
   * Production resolves to `https://wandermeets-backend.onrender.com`.
6. Click **Deploy site**. The deployment will build, and the routing rules will automatically forward all SPA routing to `index.html` to prevent 404 errors on refreshes.

---

## 📑 Required Environment Variables Summary

### Backend (`/backend`)
| Variable | Description | Example / Recommended Value |
| :--- | :--- | :--- |
| `NODE_ENV` | Mode of operation | `production` |
| `MYSQL_URL` | Aiven database connection string | `mysql://avnadmin:pass@host:port/defaultdb?ssl-mode=REQUIRED` |
| `JWT_SECRET` | Secure key for token authentication | *Generate a strong secret key* |
| `FRONTEND_URL` | CORS restriction origin | `https://wandermeets.netlify.app` |
| `UPLOAD_PATH` | Storage destination of multer uploads | `uploads` (local relative folder) |
| `MAX_FILE_SIZE` | Size limit of uploaded files | `5242880` (5MB) |

---

## 🔍 Troubleshooting Guide

### 1. Database Connection Timeout (`connect ETIMEDOUT`)
* **Symptom:** Scripts or server logs report timeouts connecting to Aiven.
* **Solution:** Aiven restricts connections to trusted IP addresses by default. Make sure you have added `0.0.0.0/0` to the **Allowed IP addresses** list in the Aiven Dashboard to permit Render to connect.

### 2. Aiven Database Paused/Rebuilding State
* **Symptom:** App returns `getaddrinfo ENOTFOUND`.
* **Solution:** On Aiven's Free Tier, services automatically power down when inactive. Log in to Aiven Console and click **Resume** on your MySQL service. Furthermore, Aiven has a strict concurrent connection limit (10-20 max). The application connection pool is set to `connectionLimit: 10` to avoid saturating limits and causing Aiven to automatically reboot/rebuild.

### 3. WebSockets Fail to Connect on Frontend
* **Symptom:** Real-time map or chat displays connection errors.
* **Solution:** The server uses the dynamic WebSocket protocol `wss://` when running on Netlify to comply with secure HTTPS requirements. Note that on Render's Free tier, the service spins down after 15 minutes of inactivity. The first request after spin-down takes about 50 seconds to boot the backend back up.

