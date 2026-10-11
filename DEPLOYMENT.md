# Deployment & Supabase Setup Guide

This guide explains how to connect your Supabase database and deploy the **Cyber Password Analyzer** to **Vercel** and **Render / Railway**.

---

## Part 1: Connect to Supabase

### Step 1.1: Run the Database Schema in Supabase
1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Open your project, then click **SQL Editor** in the left sidebar.
3. Click **New Query**, then open and copy the entire contents of [`backend/supabase_schema.sql`](backend/supabase_schema.sql).
4. Paste the SQL and click **Run**.
5. This creates:
   - The `analysis_history` table.
   - An index on `date`.
   - Row Level Security (RLS) policies allowing public read, insert, and delete.

### Step 1.2: Get Your Supabase API Credentials
1. In your Supabase project dashboard, navigate to **Project Settings** (gear icon) -> **API**.
2. Copy:
   - **Project URL** (`https://xyz.supabase.co`)
   - **anon / public key** (`eyJhbGciOi...`)

### Step 1.3: Configure Locally (Optional)
Create a `.env` file inside `backend/.env`:
```env
PORT=4000
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-public-key
```
Restart the server (`npm start`), and the backend will automatically log:
`[Supabase] Client initialized successfully for: https://...`

---

## Part 2: Deploy to Vercel (Frontend + Serverless API)

The project includes pre-configured [`vercel.json`](vercel.json) and [`api/index.js`](api/index.js) so Vercel serves the static frontend via Edge CDN and routes `/api/*` to the Express backend serverless function automatically.

### Option A: Deploy via GitHub (Recommended)
1. Initialize git and commit your project (if not already committed):
   ```bash
   git init
   git add .
   git commit -m "feat: complete cyber password analyzer with 4k intro and supabase"
   ```
2. Create a repository on [GitHub](https://github.com/new) and push your code:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/cyber-password-analyzer.git
   git branch -M main
   git push -u origin main
   ```
3. Go to [Vercel](https://vercel.com/new), select your GitHub repository, and click **Import**.
4. In the **Environment Variables** section on Vercel, add:
   - `SUPABASE_URL` = your Supabase Project URL
   - `SUPABASE_ANON_KEY` = your Supabase Anon Key
5. Click **Deploy**. Your app will be live with a production HTTPS URL in under 60 seconds!

### Option B: Deploy via Vercel CLI Directly
From this directory, run:
```bash
npx vercel
```
Follow the prompts, link your project, and set the environment variables when prompted.

---

## Part 3: Deploy Backend on Render / Railway (Optional Standalone)

If you prefer hosting the backend as an independent long-running web service:

### Render Deployment:
1. Push to GitHub.
2. Go to [Render Dashboard](https://dashboard.render.com/) -> **New** -> **Web Service** (or use the included [`render.yaml`](render.yaml)).
3. Connect your repository.
4. Set:
   - **Build Command**: `npm install && cd backend && npm install`
   - **Start Command**: `node backend/server.js`
5. Add Environment Variables:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
6. Click **Create Web Service**.
7. If your frontend on Vercel needs to point to this standalone Render backend, set `window.CYBER_API_URL = "https://your-app.onrender.com"` in `frontend/index.html` or `frontend/app.js`.
