# TechFin & NetPro 40 &mdash; Official Vercel Deployment Guide

## Architecture Overview
TechFin is configured for zero-config, ultra-fast deployment on **[Vercel](https://vercel.com)**:
- **Edge Static CDN**: Serves HTML, CSS, JavaScript, 3D Globe, and the full 4,400+ line interactive `ebooks/networking-fundamentals.html` textbook globally with low latency.
- **Serverless API Engine (`/api/*`)**: Runs serverless functions in [api/index.js](file:///c:/Users/Imran%20Hussain/Downloads/FMA/TechFin/api/index.js) handling TakeUForward-style email & mobile OTP authentication (`/api/auth/otp-request`, `/api/auth/otp-verify`, `/api/auth/resend-code`), user sessions, and learning progress tracking.
- **Open Direct Reader**: Full-screen reader is the default with zero sidebar, accessible to all users.

---

## Method 1: Deploy via GitHub (Recommended & Easiest)

This is the standard, 100% free way to deploy. Any future updates you make will automatically redeploy.

### Step 1: Create a GitHub Repository
1. Go to [github.com/new](https://github.com/new).
2. Enter a repository name, e.g. `techfin` or `TechFin-NetPro`.
3. Choose **Public** or **Private** and click **Create repository**.

### Step 2: Push your Local Code to GitHub
Open PowerShell in your TechFin folder (`c:\Users\Imran Hussain\Downloads\FMA\TechFin`) and run:
```powershell
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPOSITORY_NAME.git
git branch -M main
git push -u origin main
```
*(Replace `YOUR_GITHUB_USERNAME` and `YOUR_REPOSITORY_NAME` with your actual GitHub username and repository name).*

### Step 3: Import Project into Vercel
1. Go to [vercel.com](https://vercel.com) and log in (or sign up with GitHub).
2. Click **Add New...** &rarr; **Project**.
3. Under **Import Git Repository**, find your `techfin` repository and click **Import**.
4. In the Project Configuration screen:
   - **Framework Preset**: Other (automatically detected from `vercel.json`)
   - **Root Directory**: `./` (default)
5. Under **Environment Variables**, add:
   - `GMAIL_USER`: `imranhp108@gmail.com`
   - `GMAIL_APP_PASS`: `YOUR_16_DIGIT_GOOGLE_APP_PASSWORD` (e.g. `abcd efgh ijkl mnop`)
6. Click **Deploy**.

Vercel will build and assign a live production URL like `https://techfin-xxxx.vercel.app` with free SSL and worldwide edge caching!

---

## Method 2: Deploy Directly via Terminal (`npx vercel`)

If you prefer deploying directly from your command line:

### Step 1: Log in to Vercel in Terminal
Run in PowerShell:
```powershell
npx vercel login
```
Choose **Continue with GitHub** or enter your email. A verification link will be sent to your email to confirm.

### Step 2: Deploy to Production
Run:
```powershell
npx vercel --prod
```
Answer the quick setup prompts:
- **Set up and deploy?**: `Y`
- **Which scope?**: Select your personal account
- **Link to existing project?**: `N`
- **What’s your project’s name?**: `techfin` (or press Enter)
- **In which directory is your code located?**: `./` (press Enter)
- **Want to modify settings?**: `N`

Vercel will upload and provide your live link!

### Step 3: Add Environment Variables on Vercel
To enable live Gmail OTP delivery on Vercel:
```powershell
npx vercel env add GMAIL_USER production
# When prompted, enter: imranhp108@gmail.com

npx vercel env add GMAIL_APP_PASS production
# When prompted, enter your 16-character Google App Password
```

---

## How to Generate Google App Password for Gmail OTP
1. Go to your [Google Account Security Settings](https://myaccount.google.com/security).
2. Ensure **2-Step Verification** is turned ON.
3. Search for **App passwords** or go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
4. Enter an App name: `TechFin` and click **Create**.
5. Copy the 16-letter code (e.g., `abcd efgh ijkl mnop`) and use it for `GMAIL_APP_PASS`.

---

## Platform Features on Production
- **Navbar**: Clean single **Get Started** button triggering the TakeUForward OTP dialog.
- **Theme Switcher**: Instant light/dark mode with icon-only button (`☀️` / `🌙`).
- **NetPro Reader**: Opens in full-screen default view with no cramped sidebar.
- **OTP Fallback**: If an App Password is not yet entered, the OTP code is displayed on-screen with a **"⚡ Quick-Fill & Verify"** button so sign-in is never blocked.
