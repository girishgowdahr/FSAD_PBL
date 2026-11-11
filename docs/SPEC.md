# Automated URL Shortener with Analytics - Specification

> This is the preserved project specification for the MCA Semester III Project-Based Learning (PBL) application.

## 1. Project Summary
- Name: Automated URL Shortener with Analytics
- Type: Full-stack web application (MERN)
- Level: MCA Semester III, Project-Based Learning
- Goal: Convert long URLs into short links, redirect visitors, count clicks, and show an analytics dashboard

## 2. Tech Stack
- Frontend: React 18 + Vite, React Router, Axios, plain CSS, Recharts
- Backend: Node.js (v18+) with Express 4, ES Modules (`"type": "module"`)
- Database: MongoDB with Mongoose 8
- Security / utils: helmet, cors, express-rate-limit, dotenv, morgan
- Dev tools: nodemon, concurrently, Git, Postman
- Code generation: Node built-in crypto (no nanoid)

## 3. Architecture & Endpoints
- Port 5173 (React/Vite) proxies `/api` to Port 5000 (Express).
- Express performs 302 redirects on `GET /:shortCode` and counts clicks.
- `GET /health` -> health check
- `POST /api/urls` -> create short URL
- `GET /api/urls` -> list all URLs (newest first)
- `GET /api/urls/:id` -> get one URL
- `DELETE /api/urls/:id` -> delete URL and associated clicks
- `GET /api/urls/:id/analytics` -> 30-day analytics + top referrers
- `GET /api/analytics/summary` -> 7-day summary + top links
- `GET /:shortCode` -> 302 redirect & atomic click record
