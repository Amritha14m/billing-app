# BizLedger Web App Deployment Guide

This guide details how to deploy the production build of BizLedger across **Netlify**, **Vercel**, **Firebase Hosting**, and **GitHub Pages**, along with the required **Supabase Authentication** URL configurations.

---

## 1. Environment Variables Configuration

Both the Web App and Android APK communicate with the same Supabase project. Configure the following environment variables:

| Variable | Description | Example |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | Your Supabase Project HTTPS endpoint | `https://xyzproject.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Public anonymous API key (`anon` `public`) | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

> ⚠️ **CRITICAL SECURITY RULE:** Never put the Supabase `service_role` key in any web build or repository settings. The `anon` key is strictly protected by Supabase Row-Level Security (RLS).

---

## 2. Supabase Authentication URL Configuration

In your **Supabase Dashboard**, navigate to **Authentication** > **URL Configuration**:

### A. Site URL
Set the primary production domain where users will log in (e.g., your Netlify or custom domain):
```
https://bizledger.netlify.app
```
*(Or your custom domain / GitHub Pages URL)*

### B. Redirect URLs
Add all allowed callback URLs (including local testing and each preview/production host):
```
http://localhost:5173/**
http://localhost:4173/**
https://localhost/**
https://bizledger.netlify.app/**
https://*.netlify.app/**
https://*.vercel.app/**
https://<your-firebase-project-id>.web.app/**
https://<your-firebase-project-id>.firebaseapp.com/**
https://<your-username>.github.io/billing-app/**
```

---

## 3. Deploy to Netlify

### Option A: Drag-and-Drop (Instant 1-Minute Deploy)
1. In your project terminal, run:
   ```bash
   npm run build:web
   ```
2. This creates `bizledger-web.zip` in your project root.
3. Open [Netlify Drop](https://app.netlify.com/drop).
4. Drag and drop `bizledger-web.zip` directly onto the browser window.
5. In Netlify Site Settings > **Environment variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Trigger a redeploy to apply variables.

### Option B: Git Repository Integration
- **Build command:** `npm run build`
- **Publish directory:** `dist`
- Netlify automatically detects `netlify.toml` and `public/_redirects` to handle Single-Page Application (SPA) routing and security headers.

---

## 4. Deploy to Vercel

1. Push your code to GitHub.
2. In [Vercel Dashboard](https://vercel.com/), click **Add New** > **Project** and import your repository.
3. Configure the build settings:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Click **Deploy**.
- `vercel.json` is pre-configured with SPA route rewriting (`/*` -> `/index.html`) and HTTP security headers (`X-Frame-Options`, `X-Content-Type-Options`).

---

## 5. Deploy to Firebase Hosting

1. Install Firebase CLI (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```
2. Log in and initialize:
   ```bash
   firebase login
   firebase use <your-firebase-project-id>
   ```
3. Build the web app:
   ```bash
   npm run build
   ```
4. Deploy:
   ```bash
   firebase deploy --only hosting
   ```
- `firebase.json` is pre-configured with `dist` as the public directory, single-page app rewrites, and security headers.

---

## 6. Deploy to GitHub Pages

1. **Enable GitHub Pages via Actions:**
   - Go to your repository on GitHub: **Settings** > **Pages**.
   - Under **Build and deployment** > **Source**, select **GitHub Actions**.
2. **Add Supabase Secrets to GitHub Actions:**
   - Go to **Settings** > **Secrets and variables** > **Actions**.
   - Click **New repository secret** and add:
     - `VITE_SUPABASE_URL`: Your Supabase URL.
     - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key.
3. **Workflow Deployment:**
   - On every push to `main`, `.github/workflows/deploy.yml` builds the app with repository base path `/billing-app/` and deploys it to GitHub Pages.
   - Live URL: `https://<username>.github.io/billing-app/`

---

## 7. Progressive Web App (PWA) Verification

- The web app includes `public/manifest.json` and a production service worker `public/sw.js`.
- It can be installed directly from Chromium/Safari ("Install BizLedger" button in the address bar).
- **Stale Data Prevention:** `public/sw.js` specifically bypasses all `supabase.co` and financial API requests, ensuring real-time accounting and ledger accuracy while caching static UI assets for offline launch.
