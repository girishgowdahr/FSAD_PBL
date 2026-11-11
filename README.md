# Automated URL Shortener with Analytics

> **MCA Semester III - Project-Based Learning (PBL)**  
> Full-Stack MERN Application (MongoDB, Express.js, React.js, Node.js)

---

## 1. Project Overview

**Automated URL Shortener with Analytics** is a production-grade full-stack web application that transforms long web links into concise 6-character short URLs, provides fast HTTP 302 redirections, and tracks visitor analytics in real-time.

### Key Capabilities
- **URL Shortening:** Generates collision-resistant 6-character alphanumeric short codes using Node.js `crypto`.
- **Atomic 302 Redirection:** Atomically increments click counters and redirects visitors to original destinations without caching interference.
- **Real-Time Click Analytics:** Captures date-wise click records and referrer domains.
- **Interactive Visualizations:** Renders 7-day system activity trends and 30-day per-link engagement charts using Recharts with zero-filled missing days.
- **Strict Privacy & Security:** Zero storage of visitor IP addresses or user agents; rate limiting (Express Rate Limit), input sanitization, and security headers (Helmet).
- **Responsive Interface:** Mobile-first responsive UI built with React 18 and Vite, tested down to 360px viewport width.

---

## 2. Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18, Vite | Component-based UI with fast HMR |
| **Routing** | React Router DOM | Client-side routing (`/`, `/dashboard`) |
| **HTTP Client** | Axios | REST API communication via `/api` proxy |
| **Charts** | Recharts | SVG Area & Line charts for click metrics |
| **Styling** | Plain CSS | Responsive, mobile-first design system |
| **Backend** | Node.js (v18+), Express 4 | RESTful API server (ES Modules) |
| **Database** | MongoDB, Mongoose 8 | Document storage & aggregation pipelines |
| **Security** | Helmet, CORS, Express-Rate-Limit | Header hardening and abuse prevention |
| **Process Mgmt** | Concurrently, Nodemon | Unified dev environment script |

---

## 3. Architecture & Data Flow

```
User Browser (React + Vite, Port 5173)
        │
        ▼ (Vite Proxy: /api/* -> Port 5000)
Express.js Server (Port 5000)
  ├── Middleware: Helmet, CORS, Rate Limiters, Morgan
  ├── Validation: Protocol check, length check, self-loop prevention
  ├── Code Generator: crypto.randomInt (6-char base62, collision retry)
  ├── Endpoints:
  │     ├── /health
  │     ├── /api/urls (CRUD + analytics)
  │     ├── /api/analytics/summary
  │     └── /:shortCode (Atomic $inc, Click doc, 302 Redirect)
  └── Database Layer:
        ▼
   MongoDB Database (Collections: urls, clicks)
```

### Database Schema

#### `urls` Collection (`Url` Model)
| Field | Type | Attributes | Description |
|---|---|---|---|
| `_id` | ObjectId | Auto | Primary key |
| `originalUrl` | String | Required, Trimmed, Max 2048 | Original destination |
| `shortCode` | String | Required, Unique Index, 4-12 chars | 6-char alphanumeric code |
| `clicks` | Number | Default: 0, Min: 0 | Total atomic redirect count |
| `createdAt` | Date | Auto (timestamps) | Creation timestamp |
| `updatedAt` | Date | Auto (timestamps) | Last update timestamp |
| `shortUrl` | Virtual | String (`${BASE_URL}/${shortCode}`) | Full public URL |

#### `clicks` Collection (`Click` Model)
| Field | Type | Attributes | Description |
|---|---|---|---|
| `_id` | ObjectId | Auto | Primary key |
| `urlId` | ObjectId | Ref: `Url`, Indexed | Associated URL identifier |
| `clickedAt` | Date | Default: `Date.now`, Indexed | Timestamp of redirect |
| `referrer` | String | Max 500, Default: `""` | HTTP Referer header ("Direct" if empty) |

*Privacy note: No personal visitor data, IP addresses, or User-Agent strings are recorded.*

---

## 4. Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB**: Local MongoDB instance running on `127.0.0.1:27017` or a MongoDB Atlas URI

### Installation

1. **Clone or enter repository:**
   ```bash
   cd url-shortener
   ```

2. **Install all dependencies (root, server, and client):**
   ```bash
   npm run install:all
   ```

3. **Configure Environment Variables:**
   The `server/.env.example` file is provided. Create `server/.env`:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/url_shortener
   BASE_URL=http://localhost:5000
   CLIENT_URL=http://localhost:5173
   NODE_ENV=development
   ```

4. **Start Application:**
   Run both backend and frontend concurrently with a single command from the project root:
   ```bash
   npm run dev
   ```

   - **Frontend:** `http://localhost:5173`
   - **Backend API:** `http://localhost:5000`

---

## 5. API Reference

All API routes return JSON with standardized envelopes:
- **Success:** `{ "message": "...", "data": ... }`
- **Error:** `{ "error": { "message": "..." } }`

| Method | Endpoint | Description | Status Code |
|---|---|---|---|
| `GET` | `/health` | Server health check | `200 OK` |
| `POST` | `/api/urls` | Create shortened URL | `201 Created` |
| `GET` | `/api/urls` | List all URLs (newest first) | `200 OK` |
| `GET` | `/api/urls/:id` | Get details for single URL | `200 OK` |
| `DELETE` | `/api/urls/:id` | Delete URL and associated clicks | `200 OK` |
| `GET` | `/api/urls/:id/analytics` | 30-day click trends & top referrers | `200 OK` |
| `GET` | `/api/analytics/summary` | 7-day system totals & top links | `200 OK` |
| `GET` | `/:shortCode` | Atomic click increment & 302 redirect | `302 Found` |

---

## 6. Testing & cURL Examples

### 1. Health Check
```bash
curl -i http://localhost:5000/health
```

### 2. Create Short URL
```bash
curl -i -X POST http://localhost:5000/api/urls \
  -H "Content-Type: application/json" \
  -d '{"originalUrl":"https://developer.mozilla.org/en-US/docs/Web/JavaScript"}'
```

### 3. List All URLs
```bash
curl -i http://localhost:5000/api/urls
```

### 4. Test 302 Redirection
```bash
# Replace <shortCode> with generated 6-character code
curl -i http://localhost:5000/<shortCode>
```

### 5. Fetch Dashboard Summary
```bash
curl -i http://localhost:5000/api/analytics/summary
```

### 6. Fetch Per-Link Analytics
```bash
# Replace <id> with URL's MongoDB ObjectId
curl -i http://localhost:5000/api/urls/<id>/analytics
```

### 7. Delete URL
```bash
curl -i -X DELETE http://localhost:5000/api/urls/<id>
```

---

## 7. Demonstration Flow (Project Review / Viva)

1. **Homepage URL Creation:**
   - Navigate to `http://localhost:5173`.
   - Enter a target URL (e.g. `https://github.com/facebook/react`) and click **Shorten URL**.
   - Show instantaneous validation and result box with generated short URL (e.g., `http://localhost:5000/xY72bA`).
   - Test the **Copy** button (displays green "Copied!" feedback).
2. **Redirection & Click Recording:**
   - Click the **Open** button or paste the short link into a new browser tab.
   - Show HTTP 302 redirect directly landing on the destination website.
3. **Analytics Dashboard:**
   - Navigate to the **Dashboard** page (`/dashboard`).
   - Click **Refresh Data** to see the total click counter increment immediately.
   - Demonstrate the **7-Day System Activity** chart.
   - Click **Stats** on any link row to open the **Per-Link 30-Day Activity** breakdown and Top Referrers list.
4. **Validation & Security Controls:**
   - Attempt shortening an invalid string (`invalid-link`), non-HTTP protocol (`javascript:alert(1)`), or self-referencing link (`http://localhost:5000/test`). Show clear client and server error handling.
5. **Deletion & Cascade Cleanup:**
   - Click the delete button on a short link, confirm the browser prompt.
   - Show the link removed from the dashboard and subsequent access to its short code returns a friendly 404.

---

## 8. Project Structure

```
url-shortener/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx          # Top navigation with responsive mobile toggle
│   │   │   ├── UrlForm.jsx         # Input form, validation, and result box with copy
│   │   │   ├── UrlList.jsx         # Responsive links table with copy, stats, and delete
│   │   │   ├── AnalyticsCard.jsx   # Metrics card component
│   │   │   └── ClicksChart.jsx     # Recharts AreaChart with zero-filled day sequence
│   │   ├── pages/
│   │   │   ├── Home.jsx            # Landing page with form, recent links, and features
│   │   │   └── Dashboard.jsx       # Analytics dashboard with metrics, charts, and table
│   │   ├── services/
│   │   │   └── api.js              # Axios instance and API functions
│   │   ├── App.jsx                 # Routing and layout structure
│   │   ├── main.jsx                # React root mount
│   │   └── index.css               # Global responsive styling
│   ├── index.html
│   ├── vite.config.js              # Vite config with /api proxy to port 5000
│   └── package.json
├── server/
│   ├── config/
│   │   └── db.js                   # Mongoose connection with error handling
│   ├── models/
│   │   ├── Url.js                  # URL model with virtual shortUrl & unique index
│   │   └── Click.js                # Click event log for analytics
│   ├── controllers/
│   │   ├── urlController.js        # Create, list, get, delete, and 302 redirect
│   │   └── analyticsController.js  # 7-day summary & 30-day per-link aggregations
│   ├── routes/
│   │   ├── urlRoutes.js            # /api/urls endpoints
│   │   └── analyticsRoutes.js      # /api/analytics endpoints
│   ├── middleware/
│   │   ├── errorHandler.js         # Centralized JSON error handler
│   │   └── rateLimiters.js         # Rate limiting for creation & redirects
│   ├── utils/
│   │   ├── generateCode.js         # crypto-based 6-character random generator
│   │   └── validateUrl.js          # URL protocol & self-referencing validator
│   ├── server.js                   # Express application setup
│   ├── .env.example                # Example environment variables
│   └── package.json
├── docs/
│   └── SPEC.md                     # Preserved project specification
├── .gitignore                      # Git ignore rules
├── package.json                    # Root package.json with concurrently
└── README.md                       # Complete project documentation
```
