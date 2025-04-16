# 🧱 Sadaora Test App

A full-stack member profile + public feed application built with React (Vite), Node.js (Express), PostgreSQL, Prisma, and RTK Query. Users can register, update their profile (with image uploads), browse public profiles, and like others' profiles (like Instagram).

---

## 🚀 Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/dev-nezuko/member-profile-feed-app.git
cd member-profile-feed-app
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Fill in DB and JWT values in .env
npx prisma migrate dev --name init
npm run dev
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
```

The frontend runs on http://localhost:5173 and backend on http://localhost:3001

## 🧠 Architectural Decisions

- **RTK Query** is used for all frontend API communication to ensure data consistency, built-in caching, and simplified hooks.
- **Profile images** are uploaded to the server and stored locally under `/uploads`. Image paths are exposed via Express static middleware and returned as full URLs.
- The app uses **form-data** on the frontend for file uploads and **multer** middleware on the backend to handle `multipart/form-data` payloads.
- **Like functionality** follows a toggle system with optimistic UI updates to enhance responsiveness and mimic Instagram-like behavior.
- The **feed supports pagination** via "Load More" and avoids duplicates by clearing data when re-visiting the route.

---

## 📌 Assumptions Made

- **Profile image storage** is local-only (e.g., `/uploads`) — not using cloud services like S3 or Cloudinary.
- One **profile per authenticated user** (users can't create multiple profiles).
- **Interests** are stored as a comma-separated string and split into arrays in backend logic.
- **Like functionality** is limited to one like per user per profile — no dislike history or list of who liked.
- **JWT** is stored in `localStorage` and manually attached via `prepareHeaders` in RTK Query.
