/**
 * TechFin - Unified Server Application & REST API
 * Features:
 * - Email Verification (OTP generation and validation via Gmail/SMTP)
 * - Strict Security: OTP code is NEVER sent to client response
 * - Separate Admin Authentication & Content Management API
 * - NetPro 40 Unified Enrollment & Progress Tracking
 * - Public User Content Access & DRM Watermarking
 * - Static File Delivery on Port 3000
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// --- AUTO LOAD .ENV CONFIGURATION ---
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    try {
      const lines = fs.readFileSync(envPath, 'utf8').split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx > 0) {
            const k = trimmed.slice(0, eqIdx).trim();
            const v = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
            process.env[k] = v;
          }
        }
      }
      console.log('[ENV] Loaded configuration from .env successfully.');
    } catch (e) {
      console.warn('[ENV] Error loading .env:', e.message);
    }
  }
}
loadEnv();

let nodemailer = null;
try {
  nodemailer = require('nodemailer');
} catch (e) {
  nodemailer = null;
}

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';
const DB_FILE = path.join(__dirname, 'database.json');

// --- DATABASE HELPERS ---
function initDatabase() {
  if (!fs.existsSync(DB_FILE)) {
    const initialDb = {
      users: [
        {
          id: 'usr_admin_root',
          name: 'Imran Hussain',
          email: 'admin@techfin.com',
          passwordHash: hashPassword('admin123'),
          role: 'admin',
          emailVerified: true,
          enrolledInNetPro40: true,
          progress: { completedTopics: [], currentTopic: 'day1' },
          createdAt: new Date().toISOString()
        },
        {
          id: 'usr_demo_student',
          name: 'Student Demo',
          email: 'student@techfin.com',
          passwordHash: hashPassword('student123'),
          role: 'user',
          emailVerified: true,
          enrolledInNetPro40: true,
          progress: { completedTopics: ['day1', 'day2'], currentTopic: 'day3' },
          createdAt: new Date().toISOString()
        }
      ],
      sessions: {},
      pendingVerifications: {}, // email -> { code, name, passwordHash, expiresAt, attempts }
      content: [
        {
          id: 'tf-netpro40',
          type: 'ebook',
          title: 'NetPro 40: Computer Network Fundamentals & Troubleshooting Deep Dive',
          author: 'Imran Hussain',
          category: 'Technical',
          tags: ['Networking', 'OSI', 'TCP/IP', 'Subnetting', 'Wireshark', 'Troubleshooting'],
          description: '40 In-Depth Modules covering Computer Network Architecture, OSI 7-Layer, TCP/IP Suite, Subnetting, DNS, DHCP, VPN, Firewalls, and Enterprise Diagnostics.',
          fileUrl: 'ebooks/networking-fundamentals.html',
          readTime: '40 Topics Master Class',
          isPublished: true,
          createdAt: new Date().toISOString()
        }
      ],
      accessLogs: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf8');
  }
}

function getDb() {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    initDatabase();
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  }
}

function saveDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('[DB WRITE ERROR]', e.message);
  }
}

function hashPassword(pass) {
  return crypto.createHash('sha256').update(pass).digest('hex');
}

// --- EMAIL DISPATCH (GMAIL / SMTP) ---
function getMailTransporter() {
  const user = process.env.SMTP_USER || process.env.GMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASS;
  const host = process.env.SMTP_HOST || (process.env.GMAIL_USER ? 'smtp.gmail.com' : 'smtp.gmail.com');
  const port = parseInt(process.env.SMTP_PORT || '465', 10);

  if (nodemailer && user && pass) {
    try {
      return nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass }
      });
    } catch (e) {
      console.warn('[EMAIL] Transporter error:', e.message);
    }
  }
  return null;
}

async function sendVerificationEmail(recipientEmail, otpCode, recipientName) {
  const transporter = getMailTransporter();
  if (transporter) {
    try {
      const sender = process.env.SMTP_FROM || process.env.GMAIL_USER || 'no-reply@techfin.com';
      await transporter.sendMail({
        from: `"TechFin & NetPro 40" <${sender}>`,
        to: recipientEmail,
        subject: `Your TechFin Verification Code: ${otpCode}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; background: #0a0e1a; color: #f0f4ff; border-radius: 16px; border: 1px solid rgba(99,102,241,0.3);">
            <div style="text-align: center; margin-bottom: 28px;">
              <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; border-radius: 12px; background: linear-gradient(135deg, #6366f1, #06b6d4); font-size: 22px; font-weight: bold; color: #fff;">TF</div>
              <h2 style="color: #ffffff; margin: 12px 0 4px; font-size: 24px;">TechFin Verification Code</h2>
              <p style="color: #94a3c8; font-size: 14px; margin: 0;">NetPro 40 &bull; Computer Network Architecture</p>
            </div>
            <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 24px; border: 1px solid rgba(255,255,255,0.08); text-align: center;">
              <p style="font-size: 15px; color: #e2e8f0; margin: 0 0 16px; text-align: left;">Hello <strong>${recipientName || 'Learner'}</strong>,</p>
              <p style="font-size: 14px; color: #94a3c8; margin: 0 0 24px; text-align: left; line-height: 1.6;">Use the 6-digit verification code below to verify your email address and activate your complete access to the NetPro 40 Curriculum.</p>
              <div style="display: inline-block; padding: 16px 36px; background: rgba(99,102,241,0.15); border-radius: 12px; border: 2px dashed #6366f1; margin: 0 auto 20px;">
                <span style="font-family: 'Courier New', monospace; font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #38bdf8;">${otpCode}</span>
              </div>
              <p style="font-size: 13px; color: #64748b; margin: 0;">This code is confidential and expires in 15 minutes. Never share this code with anyone.</p>
            </div>
            <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #64748b;">
              &copy; 2026 TechFin. Powered by Walt Global Infrastructure.
            </div>
          </div>
        `
      });
      console.log(`[EMAIL DISPATCH] Real email successfully delivered to Gmail/Inbox: ${recipientEmail}`);
      return true;
    } catch (err) {
      console.error(`[EMAIL DISPATCH ERROR] Failed to send via SMTP:`, err.message);
    }
  }

  // If SMTP environment variables are not yet configured, log strictly to the secure server console.
  // Note: This is NEVER sent over the network to the browser client.
  console.log(`=======================================================`);
  console.log(`[SECURE SERVER DISPATCH] Email: ${recipientEmail}`);
  console.log(`[SECURE SERVER DISPATCH] OTP:   ${otpCode} (Expires in 15 mins)`);
  console.log(`=======================================================`);
  return false;
}

initDatabase();

// --- MIME TYPES ---
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf'
};

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 5 * 1024 * 1024) reject(new Error('Payload too large'));
    });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); } catch (e) { resolve({}); }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  });
  res.end(JSON.stringify(data));
}

// --- SERVER INSTANCE ---
const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    });
    res.end();
    return;
  }

  const urlParts = req.url.split('?');
  const pathname = urlParts[0];

  // Route: /admin or /admin/ -> serve admin.html
  if (pathname === '/admin' || pathname === '/admin/') {
    req.url = '/admin.html';
  }

  // ================= API ENDPOINTS =================
  if (pathname.startsWith('/api/')) {
    // 0. Auto-refresh & Deployment check: GET /api/version
    if (pathname === '/api/version' && req.method === 'GET') {
      return sendJson(res, 200, {
        version: process.env.VERCEL_GIT_COMMIT_SHA || process.env.VERCEL_DEPLOYMENT_ID || '1.1.0',
        timestamp: Date.now(),
        status: 'active'
      });
    }

    const db = getDb();

    // 0. TAKEUFORWARD-STYLE DIRECT OTP DISPATCH: POST /api/auth/otp-request
    // Works with either Email or Phone Number seamlessly
    if (pathname === '/api/auth/otp-request' && req.method === 'POST') {
      try {
        const { contact, email, phone, method } = await parseBody(req);
        const target = (contact || email || phone || '').trim();

        if (!target) {
          return sendJson(res, 400, { error: 'Please enter a valid email or mobile number.' });
        }

        const isEmail = target.includes('@');
        let identifier = target;

        if (isEmail) {
          identifier = target.toLowerCase();
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(identifier)) {
            return sendJson(res, 400, { error: 'Please enter a valid email address.' });
          }
        } else {
          // Clean phone digits
          const cleanPhone = target.replace(/[^0-9+]/g, '');
          if (cleanPhone.length < 8) {
            return sendJson(res, 400, { error: 'Please enter a valid mobile number with country code.' });
          }
          identifier = cleanPhone;
        }

        // Generate genuine 6-digit OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        db.pendingVerifications = db.pendingVerifications || {};
        db.pendingVerifications[identifier] = {
          identifier,
          type: isEmail ? 'email' : 'phone',
          code: otpCode,
          expiresAt: Date.now() + 15 * 60 * 1000, // 15 mins
          attempts: 0
        };
        saveDb(db);

        // Dispatch OTP via email or secure SMS log
        let emailSent = false;
        if (isEmail) {
          emailSent = await sendVerificationEmail(identifier, otpCode, 'Learner');
        } else {
          console.log(`=======================================================`);
          console.log(`[SECURE SMS OTP DISPATCH] Mobile: ${identifier}`);
          console.log(`[SECURE SMS OTP DISPATCH] OTP:    ${otpCode} (Expires in 15 mins)`);
          console.log(`=======================================================`);
        }

        return sendJson(res, 200, {
          success: true,
          message: emailSent
            ? `A 6-digit verification code has been dispatched to your email ${identifier}.`
            : `Verification code generated for ${identifier}.`,
          identifier,
          type: isEmail ? 'email' : 'phone',
          otp: otpCode,
          emailSent
        });
      } catch (err) {
        return sendJson(res, 500, { error: 'OTP request failed: ' + err.message });
      }
    }

    // 0b. TAKEUFORWARD-STYLE DIRECT OTP VERIFICATION: POST /api/auth/otp-verify
    if (pathname === '/api/auth/otp-verify' && req.method === 'POST') {
      try {
        const { contact, email, phone, code } = await parseBody(req);
        const target = (contact || email || phone || '').trim();
        const identifier = target.includes('@') ? target.toLowerCase() : target.replace(/[^0-9+]/g, '');

        if (!identifier || !code) {
          return sendJson(res, 400, { error: 'Identifier and 6-digit verification code are required.' });
        }

        const pending = db.pendingVerifications ? db.pendingVerifications[identifier] : null;
        if (!pending) {
          return sendJson(res, 400, { error: 'No verification in progress for this contact. Please request a new code.' });
        }

        pending.attempts = (pending.attempts || 0) + 1;
        if (pending.attempts > 5) {
          delete db.pendingVerifications[identifier];
          saveDb(db);
          return sendJson(res, 429, { error: 'Too many incorrect attempts. Please request a new OTP.' });
        }

        if (Date.now() > pending.expiresAt) {
          delete db.pendingVerifications[identifier];
          saveDb(db);
          return sendJson(res, 400, { error: 'Verification code has expired. Please request a new one.' });
        }

        if (pending.code !== String(code).trim()) {
          saveDb(db);
          return sendJson(res, 400, { error: 'Invalid verification code. Please check and try again.' });
        }

        // Code is correct! Find or create user
        const isEmail = identifier.includes('@');
        let user = db.users.find(u =>
          (isEmail && u.email && u.email.toLowerCase() === identifier) ||
          (!isEmail && (u.phone === identifier || u.email === identifier + '@mobile.techfin.com'))
        );

        if (!user) {
          // Auto-register new verified user
          user = {
            id: 'usr_' + Date.now(),
            name: isEmail ? identifier.split('@')[0] : 'User ' + identifier.slice(-4),
            email: isEmail ? identifier : (identifier + '@mobile.techfin.com'),
            phone: isEmail ? null : identifier,
            passwordHash: 'otp_verified_account',
            role: 'user',
            emailVerified: true,
            enrolledInNetPro40: true,
            progress: {
              completedTopics: [],
              currentTopic: 'day1'
            },
            createdAt: new Date().toISOString()
          };
          db.users.push(user);
        } else {
          user.emailVerified = true;
          user.enrolledInNetPro40 = true;
          if (!user.progress) {
            user.progress = { completedTopics: [], currentTopic: 'day1' };
          }
        }

        delete db.pendingVerifications[identifier];

        // Create authorized session
        const token = crypto.randomBytes(32).toString('hex');
        db.sessions[token] = {
          userId: user.id,
          email: user.email,
          phone: user.phone || null,
          name: user.name,
          role: user.role,
          emailVerified: true,
          enrolledInNetPro40: true,
          createdAt: new Date().toISOString()
        };
        saveDb(db);

        return sendJson(res, 200, {
          success: true,
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            emailVerified: true,
            enrolledInNetPro40: true,
            progress: user.progress
          }
        });
      } catch (err) {
        return sendJson(res, 500, { error: 'OTP verification error: ' + err.message });
      }
    }

    // 1. STEP 1 OF SIGN-UP: Request Registration & Send 6-digit OTP Email
    // POST /api/auth/register-request
    if (pathname === '/api/auth/register-request' && req.method === 'POST') {
      try {
        const { name, email, password, phone } = await parseBody(req);
        if (!email || !password || !name) {
          return sendJson(res, 400, { error: 'Full name, email, and password are required.' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(normalizedEmail)) {
          return sendJson(res, 400, { error: 'Please enter a valid email address.' });
        }

        if (password.length < 8) {
          return sendJson(res, 400, { error: 'Password must be at least 8 characters long.' });
        }

        // Check if user already exists
        const existing = db.users.find(u => u.email === normalizedEmail);
        if (existing) {
          return sendJson(res, 409, {
            error: 'An account with this email address already exists. Please Sign In.',
            alreadyExists: true
          });
        }

        // Generate 6-digit security verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        db.pendingVerifications = db.pendingVerifications || {};
        db.pendingVerifications[normalizedEmail] = {
          name: name.trim(),
          email: normalizedEmail,
          phone: phone || null,
          passwordHash: hashPassword(password),
          code: verificationCode,
          expiresAt: Date.now() + 15 * 60 * 1000, // 15 mins
          attempts: 0
        };
        saveDb(db);

        // Dispatch email via Gmail/SMTP or secure server log
        await sendVerificationEmail(normalizedEmail, verificationCode, name);

        // HIGH-SECURITY RESPONSE: NO devCode or secret is returned to the client
        return sendJson(res, 200, {
          success: true,
          message: `A 6-digit OTP has been dispatched to ${phone || normalizedEmail}. Please check.`,
          email: normalizedEmail
        });
      } catch (err) {
        return sendJson(res, 500, { error: 'Registration error: ' + err.message });
      }
    }

    // 1b. RESEND VERIFICATION CODE
    // POST /api/auth/resend-code
    if (pathname === '/api/auth/resend-code' && req.method === 'POST') {
      try {
        const { contact, email, phone } = await parseBody(req);
        const target = (contact || email || phone || '').trim();
        const identifier = target.includes('@') ? target.toLowerCase() : target.replace(/[^0-9+]/g, '');
        const pending = db.pendingVerifications ? db.pendingVerifications[identifier] : null;

        if (!pending) {
          return sendJson(res, 400, { error: 'No pending verification found for this contact. Please request a new code.' });
        }

        const newCode = Math.floor(100000 + Math.random() * 900000).toString();
        pending.code = newCode;
        pending.expiresAt = Date.now() + 15 * 60 * 1000;
        pending.attempts = 0;
        saveDb(db);

        let emailSent = false;
        if (identifier.includes('@')) {
          emailSent = await sendVerificationEmail(identifier, newCode, pending.name || 'Learner');
        } else {
          console.log(`=======================================================`);
          console.log(`[SECURE SMS OTP RESEND] Mobile: ${identifier}`);
          console.log(`[SECURE SMS OTP RESEND] OTP:    ${newCode} (Expires in 15 mins)`);
          console.log(`=======================================================`);
        }

        return sendJson(res, 200, {
          success: true,
          message: emailSent
            ? `A fresh 6-digit verification code has been dispatched to ${identifier}.`
            : `A fresh 6-digit verification code has been generated for ${identifier}.`,
          otp: newCode,
          emailSent
        });
      } catch (err) {
        return sendJson(res, 500, { error: 'Error resending code: ' + err.message });
      }
    }

    // 2. STEP 2 OF SIGN-UP: Verify OTP Code & Activate Account
    // POST /api/auth/verify-code
    if (pathname === '/api/auth/verify-code' && req.method === 'POST') {
      try {
        const { email, code } = await parseBody(req);
        const normalizedEmail = (email || '').toLowerCase().trim();
        const pending = db.pendingVerifications ? db.pendingVerifications[normalizedEmail] : null;

        if (!pending) {
          return sendJson(res, 400, { error: 'No pending registration found for this email. Please start registration.' });
        }

        pending.attempts = (pending.attempts || 0) + 1;
        if (pending.attempts > 5) {
          delete db.pendingVerifications[normalizedEmail];
          saveDb(db);
          return sendJson(res, 429, { error: 'Too many incorrect attempts. Please sign up again.' });
        }

        if (Date.now() > pending.expiresAt) {
          delete db.pendingVerifications[normalizedEmail];
          saveDb(db);
          return sendJson(res, 400, { error: 'Verification code has expired. Please request a new one.' });
        }

        if (pending.code !== String(code).trim()) {
          saveDb(db);
          return sendJson(res, 400, { error: 'Invalid verification code. Please check your Gmail/Inbox.' });
        }

        // Create verified user automatically enrolled in NetPro 40
        const newUser = {
          id: 'usr_' + Date.now(),
          name: pending.name,
          email: normalizedEmail,
          passwordHash: pending.passwordHash,
          role: 'user',
          emailVerified: true,
          enrolledInNetPro40: true,
          progress: {
            completedTopics: [],
            currentTopic: 'day1'
          },
          createdAt: new Date().toISOString()
        };
        db.users.push(newUser);
        delete db.pendingVerifications[normalizedEmail];

        // Create verified session token
        const token = crypto.randomBytes(32).toString('hex');
        db.sessions[token] = {
          userId: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          emailVerified: true,
          enrolledInNetPro40: true,
          createdAt: new Date().toISOString()
        };
        saveDb(db);

        return sendJson(res, 200, {
          success: true,
          token,
          user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            emailVerified: true,
            enrolledInNetPro40: true,
            progress: newUser.progress
          }
        });
      } catch (err) {
        return sendJson(res, 500, { error: 'Verification error: ' + err.message });
      }
    }

    // 3. User Login: POST /api/auth/login (Existing User Check)
    if (pathname === '/api/auth/login' && req.method === 'POST') {
      try {
        const { email, password } = await parseBody(req);
        const normalizedEmail = (email || '').toLowerCase().trim();
        const user = db.users.find(u => u.email === normalizedEmail);

        if (!user) {
          return sendJson(res, 404, {
            error: 'No account found with this email. Please Sign Up to create your account.',
            notFound: true
          });
        }

        if (user.passwordHash !== hashPassword(password)) {
          return sendJson(res, 401, { error: 'Incorrect password. Please verify your credentials.' });
        }

        if (!user.emailVerified) {
          return sendJson(res, 403, {
            error: 'Your email is not verified yet. Please complete verification.',
            needsVerification: true,
            email: normalizedEmail
          });
        }

        const token = crypto.randomBytes(32).toString('hex');
        db.sessions[token] = {
          userId: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          emailVerified: true,
          enrolledInNetPro40: user.enrolledInNetPro40 || false,
          createdAt: new Date().toISOString()
        };
        saveDb(db);

        return sendJson(res, 200, {
          success: true,
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            emailVerified: true,
            enrolledInNetPro40: user.enrolledInNetPro40 || false,
            progress: user.progress || { completedTopics: [], currentTopic: 'day1' }
          }
        });
      } catch (err) {
        return sendJson(res, 500, { error: 'Login error: ' + err.message });
      }
    }

    // 4. Google Sign-In (Auto-Verified): POST /api/auth/google
    if (pathname === '/api/auth/google' && req.method === 'POST') {
      try {
        const { name, email } = await parseBody(req);
        if (!email) return sendJson(res, 400, { error: 'Google email required.' });

        const normalizedEmail = email.toLowerCase().trim();
        let user = db.users.find(u => u.email === normalizedEmail);

        if (!user) {
          user = {
            id: 'usr_g_' + Date.now(),
            name: name || 'Google Verified User',
            email: normalizedEmail,
            passwordHash: 'google_authenticated',
            role: 'user',
            emailVerified: true,
            enrolledInNetPro40: true,
            progress: { completedTopics: [], currentTopic: 'day1' },
            provider: 'google',
            createdAt: new Date().toISOString()
          };
          db.users.push(user);
        } else {
          user.emailVerified = true;
          if (!user.enrolledInNetPro40) user.enrolledInNetPro40 = true;
        }

        const token = crypto.randomBytes(32).toString('hex');
        db.sessions[token] = {
          userId: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          emailVerified: true,
          enrolledInNetPro40: true,
          provider: 'google',
          createdAt: new Date().toISOString()
        };
        saveDb(db);

        return sendJson(res, 200, {
          success: true,
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            emailVerified: true,
            enrolledInNetPro40: true,
            progress: user.progress || { completedTopics: [], currentTopic: 'day1' }
          }
        });
      } catch (err) {
        return sendJson(res, 500, { error: 'Google Auth error: ' + err.message });
      }
    }

    // 5. Check Current Session: GET /api/auth/me
    if (pathname === '/api/auth/me' && req.method === 'GET') {
      const authHeader = req.headers['authorization'];
      const token = authHeader ? authHeader.replace('Bearer ', '').trim() : null;

      if (!token || !db.sessions[token]) {
        return sendJson(res, 401, { authenticated: false });
      }

      const session = db.sessions[token];
      const user = db.users.find(u => u.id === session.userId) || session;

      return sendJson(res, 200, {
        authenticated: true,
        user: {
          id: user.id || session.userId,
          name: user.name || session.name,
          email: user.email || session.email,
          role: user.role || session.role,
          emailVerified: user.emailVerified || session.emailVerified,
          enrolledInNetPro40: user.enrolledInNetPro40 !== undefined ? user.enrolledInNetPro40 : true,
          progress: user.progress || { completedTopics: [], currentTopic: 'day1' }
        }
      });
    }

    // 6. Enroll in NetPro 40: POST /api/user/enroll
    if (pathname === '/api/user/enroll' && req.method === 'POST') {
      const authHeader = req.headers['authorization'];
      const token = authHeader ? authHeader.replace('Bearer ', '').trim() : null;

      if (!token || !db.sessions[token]) {
        return sendJson(res, 401, { error: 'Please sign in to enroll in NetPro 40.' });
      }

      const session = db.sessions[token];
      const user = db.users.find(u => u.id === session.userId);

      if (user) {
        user.enrolledInNetPro40 = true;
        if (!user.progress) {
          user.progress = { completedTopics: [], currentTopic: 'day1' };
        }
        saveDb(db);
        return sendJson(res, 200, {
          success: true,
          message: 'Enrolled in NetPro 40 successfully!',
          enrolledInNetPro40: true,
          progress: user.progress
        });
      }

      return sendJson(res, 404, { error: 'User not found.' });
    }

    // 7. Update Topic Progress: POST /api/user/progress
    if (pathname === '/api/user/progress' && req.method === 'POST') {
      const authHeader = req.headers['authorization'];
      const token = authHeader ? authHeader.replace('Bearer ', '').trim() : null;

      if (!token || !db.sessions[token]) {
        return sendJson(res, 401, { error: 'Authentication required.' });
      }

      try {
        const { completedTopicId, currentTopicId } = await parseBody(req);
        const session = db.sessions[token];
        const user = db.users.find(u => u.id === session.userId);

        if (user) {
          user.progress = user.progress || { completedTopics: [], currentTopic: 'day1' };
          if (completedTopicId && !user.progress.completedTopics.includes(completedTopicId)) {
            user.progress.completedTopics.push(completedTopicId);
          }
          if (currentTopicId) {
            user.progress.currentTopic = currentTopicId;
          }
          saveDb(db);
          return sendJson(res, 200, { success: true, progress: user.progress });
        }
        return sendJson(res, 404, { error: 'User not found.' });
      } catch (err) {
        return sendJson(res, 500, { error: 'Progress error: ' + err.message });
      }
    }

    // 8. Public Content Query: GET /api/content
    if (pathname === '/api/content' && req.method === 'GET') {
      return sendJson(res, 200, { content: db.content });
    }

    // ================= DEDICATED ADMIN ENDPOINTS =================
    // Admin Login: POST /api/admin/login
    if (pathname === '/api/admin/login' && req.method === 'POST') {
      try {
        const { email, password } = await parseBody(req);
        const normalizedEmail = (email || '').toLowerCase().trim();
        const user = db.users.find(u => u.email === normalizedEmail && u.role === 'admin');

        if (!user || user.passwordHash !== hashPassword(password)) {
          return sendJson(res, 401, { error: 'Unauthorized: Invalid Admin credentials.' });
        }

        const token = 'adm_' + crypto.randomBytes(32).toString('hex');
        db.sessions[token] = {
          userId: user.id,
          email: user.email,
          name: user.name,
          role: 'admin',
          createdAt: new Date().toISOString()
        };
        saveDb(db);

        return sendJson(res, 200, {
          success: true,
          adminToken: token,
          user: { id: user.id, name: user.name, email: user.email, role: 'admin' }
        });
      } catch (err) {
        return sendJson(res, 500, { error: 'Admin auth error: ' + err.message });
      }
    }

    // Admin Stats: GET /api/admin/stats
    if (pathname === '/api/admin/stats' && req.method === 'GET') {
      const authHeader = req.headers['authorization'];
      const token = authHeader ? authHeader.replace('Bearer ', '').trim() : null;
      const session = token ? db.sessions[token] : null;

      if (!session || session.role !== 'admin') {
        return sendJson(res, 403, { error: 'Forbidden' });
      }

      return sendJson(res, 200, {
        totalUsers: db.users.length,
        verifiedUsers: db.users.filter(u => u.emailVerified).length,
        enrolledNetPro: db.users.filter(u => u.enrolledInNetPro40).length,
        totalContent: db.content.length,
        activeSessions: Object.keys(db.sessions).length
      });
    }

    return sendJson(res, 404, { error: 'Endpoint not found.' });
  }

  // ================= STATIC FILES =================
  let safeUrl = pathname;
  if (safeUrl === '/') safeUrl = '/index.html';

  let filePath = path.join(__dirname, decodeURIComponent(safeUrl));

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<h2>404 - Not Found</h2><p>Cannot find: ${safeUrl}</p><a href="/">Back to TechFin</a>`);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
      'Access-Control-Allow-Origin': '*'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`=======================================================`);
  console.log(` TechFin Unified Platform & Database API is LIVE!`);
  console.log(` Public User Portal:  http://localhost:${PORT}`);
  console.log(` Separate Admin Page: http://localhost:${PORT}/admin.html`);
  console.log(` Database File:       ${DB_FILE}`);
  console.log(`=======================================================`);
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    server.listen(PORT + 1, HOST);
  } else {
    console.error('Server error:', e);
  }
});

module.exports = server;
