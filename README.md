# 🏠 RentMate AI
> Find the Perfect Room. Find the Perfect Flatmate.

RentMate AI is a premium, full-stack, production-ready Room & Flatmate matching application built with **Next.js (App Router), Node/Express, TypeScript, TailwindCSS, Framer Motion, MongoDB Atlas, and Socket.io**. 

It features an intelligent AI compatibility matching engine, real-time messaging with online status sync and message seen receipts, email notifications via Nodemailer, and fully-featured dashboards for Tenants, Landlords, and Administrators.

---

## 📂 Table of Contents
1. [Tech Stack & Features](#-tech-stack--features)
2. [Folder Structure](#-folder-structure)
3. [Architecture & System Design](SYSTEM_DESIGN.md)
4. [Database Schema Specifications](DATABASE_SCHEMA.md)
5. [REST API Documentation](API_DOCUMENTATION.md)
6. [AI Match Engine Prompt Details](#-ai-match-engine-prompt-details)
7. [Setup & Installation Guide](#-setup--installation-guide)
8. [Deployment Instructions](#-deployment-instructions)

---

## 🛠️ Tech Stack & Features

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, TailwindCSS, Framer Motion, Recharts.
- **Backend**: Node.js, Express.js, TypeScript, Socket.io (WebSockets).
- **Database**: MongoDB Atlas (Mongoose) with custom indexes.
- **AI Matching**: Gemini API integration with a **Rule-Based Fallback Matching Engine**.
- **Real-Time Sockets**: Active chats, typing indicator states, online states, and seen receipt overlays.
- **Auth**: Secure JWT verification with role-based routing (Tenant, Owner, Admin) and password hashing (bcrypt).
- **Emails**: Nodemailer SMTP transporter (with Ethereal sandbox test fallback).

---

## 📂 Folder Structure

```
rentmate-ai/
├── package.json              # Monorepo concurrent script runner
├── SYSTEM_DESIGN.md          # Architecture & system design document
├── DATABASE_SCHEMA.md        # Database schema specifications
├── API_DOCUMENTATION.md      # REST API endpoints documentation
├── backend/                  # Node/Express TypeScript server
│   ├── src/
│   │   ├── config/           # Database, Sockets, and Mailer initialization
│   │   ├── controllers/      # Business logic (Auth, Listings, Interests, AI, Admin)
│   │   ├── middleware/       # JWT verification & role authorization guards
│   │   ├── models/           # Mongoose Collection Schemas & Indexes
│   │   ├── routes/           # REST endpoints mapping
│   │   ├── services/         # Mailer and AI match pipelines
│   │   └── index.ts          # Express gateway entrypoint
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
└── frontend/                 # Next.js App Router client
    ├── src/
    │   ├── app/              # Routes (Landing page, Dashboards, Auth, Chat, Settings)
    │   ├── components/       # Premium UI (ListingCard, InteractiveMap, QuickView, Assistant)
    │   ├── context/          # Theme, Auth, and Socket React contexts
    │   └── services/         # API HTTP fetch wrappers
    ├── package.json
    └── tsconfig.json
```

---

## 🧠 AI Match Engine Prompt Details

The AI Compatibility engine parses details from the Tenant Profile and listing options to calculate compatibility:

### LLM System Prompt
```
You are RentMate AI's matching specialist.
Compare the Tenant's profile with the Room Listing.

Tenant Preferences:
- Budget: $<budget_max>/month
- Preferred Location: <location_preference>
- Preferred Room Type: <room_type_preference>
- Preferred Furnished Status: <furnished_preference>
- Lifestyle Hobbies: <lifestyle_hobbies>

Room Listing Details:
- Rent: $<rent>/month
- Location: <location>
- Room Type: <room_type>
- Furnished Status: <furnished_status>
- Amenities: <amenities>
- Gender Preference: <gender_preference>

Output a JSON object ONLY. Do not wrap in markdown ```json blocks.
The JSON must contain these exact keys:
{
  "score": <number between 0 and 100>,
  "explanation": "<friendly, clear, premium conversational explanation of why they match, referencing details>",
  "breakdown": {
    "budget": <0-100 matching score>,
    "location": <0-100 matching score>,
    "moveIn": <0-100 matching score>,
    "roomType": <0-100 matching score>,
    "gender": <0-100 matching score>
  }
}
```

### Example Input Payload
- **Tenant Profile**: Budget `$1000/mo`, Preferred Location: `"Downtown"`, Room: `"Private Room"`, Lifestyle: `["reading", "yoga"]`.
- **Listing**: Rent: `$900/mo`, Location: `"Downtown"`, Room: `"Private Room"`, Furnished: `"furnished"`, Gender Preference: `"Any"`.

### Example Output JSON
```json
{
  "score": 95,
  "explanation": "Outstanding match! The rent ($900/mo) is comfortably under your budget limit of $1000/mo, and the private room configuration matches your preferred layout. The downtown location aligns 100% with your commute guidelines.",
  "breakdown": {
    "budget": 100,
    "location": 100,
    "moveIn": 90,
    "roomType": 100,
    "gender": 100
  }
}
```

---

## 🚀 Setup & Installation Guide

Follow these steps to run the application locally:

### 1. Prerequisites
Ensure you have **Node.js** (v18+) and **MongoDB** installed (or have a MongoDB Atlas connection string).

### 2. Configure Environment Variables
Inside the `backend/` directory, create a `.env` file (copied from `.env.example`):
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxx.mongodb.net/rentmate?retryWrites=true&w=majority
JWT_SECRET=rentmate_ai_secret_key_12345
GEMINI_API_KEY=AIzaSyYourGeminiApiKeyHere...

# SMTP credentials for nodemailer (Optional: falls back to Ethereal sandbox)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### 3. Bootstrap Dependencies
From the **root folder** of the project, run:
```bash
npm run install:all
```

### 4. Run Development Server
To launch the frontend and backend concurrently:
```bash
npm run dev
```
- **Next.js Frontend**: [http://localhost:3000](http://localhost:3000)
- **Express Backend & Sockets**: [http://localhost:5000](http://localhost:5000)

---

## 🚢 Deployment Instructions

### Frontend (Vercel)
1. Commit and push your frontend changes to your repository.
2. Link your repository in Vercel.
3. Configure the build options:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
4. Add environment variables:
   - `NEXT_PUBLIC_API_URL` (Points to your deployed Render API, e.g. `https://api.rentmate.com`)
5. Click **Deploy**.

### Backend (Render)
1. Create a new Web Service on Render.
2. Link your repository.
3. Configure build options:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Add Environment Variables:
   - `MONGODB_URI`, `JWT_SECRET`, `GEMINI_API_KEY`, `SMTP_HOST`, etc.
5. Click **Deploy**.
