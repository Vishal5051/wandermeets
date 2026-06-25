# WanderMates Deployment Guide

This document describes the step-by-step process to deploy the WanderMates application onto production using:
* **Database:** Railway MySQL
* **Backend:** Render
* **Frontend:** Netlify

---

## 🛠️ Step 1: Database Setup (Railway MySQL)

1. Sign in to your [Railway](https://railway.app/) dashboard.
2. Click **+ New Project** and select **Provision MySQL**.
3. Once the database is ready, go to the **MySQL service** settings and click on the **Variables** tab to find the connection details.
4. Copy the connection URL under **`MYSQL_URL`** (it has the format `mysql://root:password@host:port/railway`). This URL is fully supported by our backend configuration.

---

## 📡 Step 2: Backend Setup (Render)

1. Sign in to your [Render](https://render.com/) dashboard.
2. Click **New +** and select **Web Service**.
3. Connect your Git repository containing the project.
4. Configure the Web Service settings:
   * **Name:** `wandermates-backend`
   * **Root Directory:** `backend` (Ensure this is set so Render builds from the backend folder)
   * **Runtime:** `Node`
   * **Build Command:** `npm install`
   * **Start Command:** `node server.js`
5. Click **Advanced** and add the following **Environment Variables**:
   * `NODE_ENV`: `production`
   * `PORT`: `10000` (Render binds to this port automatically)
   * `MYSQL_URL`: *Paste the connection URL copied from Railway*
   * `JWT_SECRET`: *A secure random string (e.g. 32-character hexadecimal)*
   * `FRONTEND_URL`: *The URL of your Netlify frontend (e.g., `https://wandermates.netlify.app`). Multiple domains can be comma-separated.*
   * `UPLOAD_PATH`: `/data/uploads`
   * `MAX_FILE_SIZE`: `5242880` (5MB limit)
   * *Optional (SMS verification):* `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, `TWILIO_VERIFY_SERVICE_ID`
   * *Optional (Email OTP):* `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`
6. **Persistent Disk Setup (Required for Uploads):**
   * Under the Web Service page, go to **Disks** -> **Add Disk**.
   * **Name:** `uploads-volume`
   * **Mount Path:** `/data/uploads`
   * **Size:** `1GB` (or larger depending on preference)
   * *This ensures that images uploaded by users (Aadhaar cards, profile pictures, and memories) persist across server redeploys and restarts.*

7. **Database Initialization (Once database and backend are deployed):**
   * You need to populate the tables and stored procedures in your Railway MySQL database.
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

1. Sign in to your [Netlify](https://www.netlify.com/) dashboard.
2. Click **Add new site** -> **Import an existing project**.
3. Select your Git repository.
4. Configure build settings:
   * **Root Directory:** `frontend`
   * **Build Command:** `npm run build`
   * **Publish Directory:** `frontend/build` (Ensure it points to the build output within the frontend folder)
5. Add the following **Environment Variables** in site settings:
   * `REACT_APP_API_URL`: *The URL of your Render backend service (e.g., `https://wandermates-backend.onrender.com`)*
   * `REACT_APP_WS_URL`: *The WebSocket URL of your Render backend service using the `wss` protocol (e.g., `wss://wandermates-backend.onrender.com`)*
6. Click **Deploy site**. Netlify will build and deploy the frontend, and the `frontend/public/_redirects` file we created will automatically route all SPA traffic to `index.html` to prevent 404 errors on sub-routes (like `/login` or `/profile`).

---

## 📑 Required Environment Variables Summary

### Backend (`/backend`)
| Variable | Description | Example / Recommended Value |
| :--- | :--- | :--- |
| `PORT` | The port Express runs on | `10000` (Managed by Render) |
| `NODE_ENV` | Mode of operation | `production` |
| `MYSQL_URL` | Railway database connection string | `mysql://root:pass@host:port/database` |
| `JWT_SECRET` | Secure key for token authentication | *Generate a strong secret key* |
| `FRONTEND_URL` | CORS restriction origin | `https://your-site.netlify.app` |
| `UPLOAD_PATH` | Storage destination of multer uploads | `/data/uploads` (paired with Render disk) |
| `MAX_FILE_SIZE` | Size limit of uploaded files | `5242880` (5MB) |

### Frontend (`/frontend`)
| Variable | Description | Example / Recommended Value |
| :--- | :--- | :--- |
| `REACT_APP_API_URL` | Base URL of backend REST API | `https://wandermates-backend.onrender.com` |
| `REACT_APP_WS_URL` | URL of backend WebSocket server | `wss://wandermates-backend.onrender.com` |

---

## 🔄 Deployment Order

1. **Deploy Railway MySQL** to obtain the database URI.
2. **Deploy Render Backend** configured with the database URL.
3. **Run `npm run init-db`** via Render Shell to create the tables/procedures.
4. **Deploy Netlify Frontend** pointing to the Render backend URL.
5. **Update Render Environment** adding `FRONTEND_URL` to finalize security CORS limits.

---

## 🔍 Troubleshooting Guide

### 1. "Access Denied" or Connection Error during `init-db`
* **Symptom:** Scripts output `Error: Access denied...` or fail to connect.
* **Solution:** Ensure that your `MYSQL_URL` is correct. Railway MySQL sometimes restricts connections from external hosts. If this happens, verify you are copying the **Private Connection URL** (if running from a service inside the same Railway project) or **Public Connection URL** (when executing migrations from outside Railway or from Render).

### 2. Netlify returns "404 Not Found" on Page Refresh
* **Symptom:** Refreshing pages like `/login` or `/profile` gives a Netlify 404 page.
* **Solution:** The `_redirects` file must be located in Netlify's publish root folder. In React applications, putting it in `public/_redirects` ensures it is copied to the `build/` directory during compilation. Verify that `build/_redirects` exists after building.

### 3. WebSockets Fail to Connect on Frontend
* **Symptom:** The real-time map or chat console displays connection errors.
* **Solution:** Render's free tier has an idle timeout of 15 minutes of inactivity, which shuts down the server. The first request takes ~50 seconds to spin it back up. Furthermore, make sure `REACT_APP_WS_URL` uses the secure WebSocket protocol `wss://` rather than `ws://` in production, as web browsers block unsecure WebSocket connections from secure HTTPS sites.

### 4. Uploaded Images Fail to Display or disappear
* **Symptom:** Profile pictures or memory photos show broken links after a server redeploy.
* **Solution:** Verify that you have attached a Render Persistent Disk mounted at the same path as your backend `UPLOAD_PATH`. In Render, files stored on local folders (without a mounted disk) are deleted whenever the service redeploys or restarts.
