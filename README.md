# Automated URL Shortener with Analytics (V2)

> **MCA Semester III - Project-Based Learning (PBL)**  
> Full-Stack MERN Application (MongoDB, Express.js, React.js 18, Node.js) with JWT Auth, Custom Aliases, Expiration Controls, QR Codes, and CSV Exports.

---

## 1. Project Overview

**Automated URL Shortener with Analytics V2** is a feature-packed full-stack web application that allows visitors and registered users to shorten long URLs, customize vanity aliases, enforce link expiration dates, generate scannable QR codes, download Excel-ready CSV reports, and observe real-time visitor analytics across light and dark themes.

### V2 Enhancements Summary
- **E1: Authentication & Personal Dashboards:** JWT-based authentication with bcrypt (cost 12) password hashing. Users have their own scoped dashboard, links, and click metrics.
- **E2: Custom Vanity Aliases & Expiration Dates:** Logged-in users can select custom 4-20 character aliases (e.g., `/summer-sale`) and set expiration dates (up to 365 days). Expired links return HTTP 410 Gone and stop logging clicks.
- **E3: QR Codes & CSV Exports:** Instant scannable QR code generation per link with high-resolution PNG download. Complete system and per-link CSV exports protected against spreadsheet formula injection with UTF-8 BOM encoding.
- **E4: Search, Filters, Dark Theme & UI Polish:** Real-time debounced search, status filtering (`all`, `active`, `expired`), multi-key sorting, pagination, light/dark mode with OS detection, accessible modals, skeleton loading states, and toast notifications.

---

## 2. Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18, Vite | Component-based UI with fast HMR |
| **Routing** | React Router DOM | Client-side routes (`/`, `/login`, `/register`, `/dashboard`) |
| **HTTP Client** | Axios | REST API client with request/response interceptors |
| **Charts** | Recharts | SVG Area charts with theme-aware grid and tick colors |
| **QR Generation** | `qrcode.react` | HTML5 Canvas QR code rendering and PNG download |
| **Styling** | Plain CSS | Theme variables, dark mode, responsive (360px+) |
| **Backend** | Node.js (v18+), Express 4 | RESTful API server (ES Modules) |
| **Database** | MongoDB, Mongoose 8 | Collections: `users`, `urls`, `clicks` |
| **Security** | Helmet, CORS, Rate Limiters, JWT, bcryptjs | Header hardening and abuse prevention |

---

## 3. Architecture & Data Model

```
User Browser (React + Vite, Port 5173)
        │
        ▼ (Vite Proxy: /api/* -> Port 5000)
Express.js Server (Port 5000)
  ├── Middleware: Helmet, CORS, Rate Limiters, Auth (JWT), Morgan
  ├── Validation: Protocol check, alias format check, expiry bounds
  ├── Code Generator: crypto.randomInt (6-char base62) + Custom Aliases
  ├── Endpoints:
  │     ├── /health
  │     ├── /api/auth (register, login, me)
  │     ├── /api/urls (CRUD, search, filter, pagination, export.csv)
  │     ├── /api/analytics (summary, export.csv)
  │     └── /:shortCode (Atomic $inc, 410 if expired, 302 Redirect)
  └── Database Layer:
        ▼
   MongoDB Database (Collections: users, urls, clicks)
```

### Data Models

#### 1. `users` Collection (`User` Model)
| Field | Type | Attributes | Description |
|---|---|---|---|
| `_id` | ObjectId | Auto | Primary key |
| `name` | String | Required, Trimmed, 2-50 chars | User's full name |
| `email` | String | Required, Unique Index, Lowercase | User email address |
| `passwordHash` | String | Required, bcrypt (cost 12), `select: false` | Hashed password |
| `createdAt` / `updatedAt` | Date | Auto timestamps | Timestamps |

#### 2. `urls` Collection (`Url` Model)
| Field | Type | Attributes | Description |
|---|---|---|---|
| `_id` | ObjectId | Auto | Primary key |
| `originalUrl` | String | Required, Trimmed, Max 2048 | Destination URL |
| `shortCode` | String | Required, Unique Index, 4-20 chars | Alphanumeric short code |
| `clicks` | Number | Default: 0, Min: 0 | Atomic redirect count |
| `userId` | ObjectId | Ref: `User`, Default: `null`, Indexed | Owner user ID |
| `isCustom` | Boolean | Default: `false` | True if vanity alias was chosen |
| `expiresAt` | Date | Default: `null` | Expiration date/time |
| `status` | Virtual | String (`"active"` or `"expired"`) | Link status |
| `shortUrl` | Virtual | String (`${BASE_URL}/${shortCode}`) | Public short URL |

#### 3. `clicks` Collection (`Click` Model)
| Field | Type | Attributes | Description |
|---|---|---|---|
| `_id` | ObjectId | Auto | Primary key |
| `urlId` | ObjectId | Ref: `Url`, Indexed | Associated URL identifier |
| `clickedAt` | Date | Default: `Date.now`, Indexed | Timestamp of redirect |
| `referrer` | String | Max 500, Default: `""` | HTTP Referer header ("Direct" if empty) |

---

## 4. Environment Variables

Create or update `server/.env` (and see `server/.env.example`):

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/url_shortener
BASE_URL=http://localhost:5000
CLIENT_URL=http://localhost:5173
NODE_ENV=development
JWT_SECRET=super_secret_jwt_key_url_shortener_v2_pbl_auth_32chars_secure
JWT_EXPIRES_IN=7d
```

---

## 5. REST API Reference

| Method | Endpoint | Auth | Description | Status Code |
|---|---|---|---|---|
| `GET` | `/health` | Public | Server health status | `200 OK` |
| `POST` | `/api/auth/register` | Public | Register new user account | `201 Created` |
| `POST` | `/api/auth/login` | Public | Log in and receive JWT token | `200 OK` |
| `GET` | `/api/auth/me` | Bearer Token | Get current authenticated user | `200 OK` |
| `POST` | `/api/urls` | Optional | Create short URL (alias & expiry require auth) | `201 Created` |
| `GET` | `/api/urls` | Bearer Token | List user's URLs with search, filter, sort, page | `200 OK` |
| `GET` | `/api/urls/:id` | Bearer Token | Get single URL (owner-scoped) | `200 OK` |
| `DELETE` | `/api/urls/:id` | Bearer Token | Delete URL and associated clicks | `200 OK` |
| `GET` | `/api/urls/:id/analytics` | Bearer Token | 30-day clicks & top referrers | `200 OK` |
| `GET` | `/api/urls/:id/analytics/export.csv` | Bearer Token | Download 30-day click trends as CSV | `200 OK` |
| `GET` | `/api/analytics/summary` | Bearer Token | User's link counts, top links, and 7-day chart | `200 OK` |
| `GET` | `/api/analytics/export.csv` | Bearer Token | Download all user links and metrics as CSV | `200 OK` |
| `GET` | `/:shortCode` | Public | Atomic redirect (302) or expired notice (410) | `302 / 410` |

---

## 6. How to Run Locally

### Start MongoDB
```powershell
& "C:\Program Files\MongoDB\Server\9.0\bin\mongod.exe" --dbpath "C:\Users\admin\.gemini\antigravity\scratch\mongodb_data" --port 27017 --bind_ip 127.0.0.1
```

### Start the Application
From the project root:
```bash
npm run dev
```
- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:5000](http://localhost:5000)

*Or double-click `start.bat` for one-click launch!*

---

## 7. Demonstration Flow (Project Review / Viva)

1. **Guest Experience & Dark Mode:**
   - Open [http://localhost:5173](http://localhost:5173). Toggle dark/light mode using the sun/moon icon.
   - Shorten a URL as a guest. Notice advanced options are locked with an invitation to sign up.
2. **Registration & Login:**
   - Click **Sign Up**, enter name, email, and password. Show validation rules (min 8 chars with letter & number).
   - Upon registration, automatically log in and land on the personalized dashboard.
3. **Custom Vanity Alias & Expiration:**
   - Return to Home, open **Advanced Options**, and enter a custom alias (e.g. `pbl-demo`) and an expiration date.
   - Click **Shorten URL**. View the generated link, click **Copy** (toast appears), and open **QR Code** to download a scannable PNG.
4. **Redirection & Real-Time Tracking:**
   - Open `/pbl-demo` in a new tab; observe immediate HTTP 302 redirection.
   - Return to the Dashboard and click **Refresh** to see total clicks increment in real-time.
5. **Search, Filter, Sort & Pagination:**
   - Use the search bar to filter by keyword (debounced).
   - Filter by status (`Active` or `Expired`), and sort by `Most Clicks`.
6. **Excel-Ready CSV Exports:**
   - Click **Export CSV** on the dashboard toolbar to download a report of all your links.
   - Select a link's **Stats** view and click **Export 30d CSV** to download date-wise traffic data.
7. **Expiration Enforcement:**
   - Demonstrate that when a link passes its expiration date, visiting its short URL returns **HTTP 410 Gone** and does not log clicks.
8. **Owner Isolation & Security:**
   - Delete a short link using the accessible confirmation dialog.
   - Log out and observe that `/dashboard` is securely guarded, redirecting unauthenticated users to `/login`.
