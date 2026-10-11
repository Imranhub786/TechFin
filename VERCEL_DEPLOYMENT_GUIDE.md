# TechFin & NetPro 40 &mdash; Vercel Deployment & Access Guide

## Overview
TechFin is configured for zero-config, high-performance deployment on **Vercel.com**.
It combines:
- **Static Assets at the Edge**: Instant global caching for HTML, CSS, JavaScript, and the complete 4,400+ line interactive textbook `ebooks/networking-fundamentals.html`.
- **Vercel Serverless Function API**: Handles all `/api/*` requests (`register-request`, `verify-code`, `login`, `enroll`, and `progress`) via [api/index.js](file:///c:/Users/Imran%20Hussain/Downloads/FMA/TechFin/api/index.js).
- **Strict Security Architecture**: 6-digit OTP verification codes are never leaked to the client browser, headers, or toasts. Dispatched directly to the user's Gmail/Inbox.

---

## 1. How to Deploy to Vercel

### Option A: Using Vercel CLI (Fastest)
1. In your terminal:
   ```bash
   npm install -g vercel
   vercel login
   ```
2. Navigate to your project directory and run:
   ```bash
   vercel --prod
   ```
3. Vercel will automatically read [vercel.json](file:///c:/Users/Imran%20Hussain/Downloads/FMA/TechFin/vercel.json), bundle static files, and deploy the serverless API.

### Option B: Deploy via GitHub (Recommended for Teams)
1. Push your project to a GitHub repository:
   ```bash
   git add .
   git commit -m "TechFin NetPro 40 with 3D Globe, Light/Dark mode, and Vercel support"
   git push origin main
   ```
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your repository. Vercel automatically detects the configuration from `vercel.json`.
4. Click **Deploy**.

---

## 2. Environment Variables Configuration (For Gmail OTP)

In your **Vercel Dashboard &rarr; Project &rarr; Settings &rarr; Environment Variables**, add the following keys:

| Environment Variable | Description | Example Value |
|---|---|---|
| `GMAIL_USER` | Your Google Workspace or personal Gmail address | `admin@yourdomain.com` or `mytechfin@gmail.com` |
| `GMAIL_APP_PASS` | 16-character Google App Password (generated from your Google Account &rarr; Security &rarr; App Passwords) | `abcd efgh ijkl mnop` |
| `SMTP_FROM` *(optional)* | Custom sender display name and email | `"TechFin NetPro 40" <no-reply@yourdomain.com>` |

> **Note on Security:**
> If `GMAIL_USER` and `GMAIL_APP_PASS` are provided, real emails with the 6-digit OTP code will be sent immediately to the user's Gmail inbox.
> If running without SMTP credentials, the server generates the secure code and logs it strictly in the Vercel function runtime logs without ever leaking it to the user's browser.

---

## 3. How NetPro Users & the Tag Team Access the Platform

1. **Production URL**:
   - Vercel automatically assigns a domain: `https://your-project.vercel.app`
   - You can connect your custom domain (e.g. `https://techfin.com` or `https://netpro40.com`) under Vercel **Settings &rarr; Domains**.

2. **Accessing Curriculum One-by-One**:
   - Any student who opens the URL sees the **NetPro 40** curriculum prominently displayed in the **Resources** tab and hero banner.
   - Users click **"Sign Up Free"** in the top-right corner, enter their details, and verify their 6-digit OTP code received in their Gmail.
   - Upon verification, their account is automatically enrolled in **NetPro 40**.
   - Students navigate topic by topic:
     - **Phase 1: Foundation & Core Protocols (Topics 1 to 20)**
     - **Phase 2: Transport, Security & Infrastructure (Topics 21 to 30)**
     - **Phase 3: Diagnostics & Enterprise Troubleshooting (Topics 31 to 40)**
   - Progress is automatically saved: each topic can be marked as complete, and the progress bar updates in real time.

3. **Tag Team & Collaboration**:
   - In Vercel, invite teammates under **Project Settings &rarr; Members** so they can review deployments, check logs, and inspect runtime metrics.
