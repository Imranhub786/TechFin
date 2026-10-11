/**
 * Vercel Serverless Function Handler for TechFin & NetPro 40 REST API
 * Handles all /api/* routes seamlessly in Vercel's serverless environment.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

let nodemailer = null;
try {
  nodemailer = require('nodemailer');
} catch (e) {
  nodemailer = null;
}

// On Vercel, /tmp is writable
const LOCAL_DB = path.join(__dirname, '..', 'database.json');
const TMP_DB = path.join('/tmp', 'database.json');
const DB_PATH = process.env.VERCEL ? TMP_DB : LOCAL_DB;

function getDb() {
  if (process.env.VERCEL && !fs.existsSync(TMP_DB)) {
    try {
      if (fs.existsSync(LOCAL_DB)) {
        fs.copyFileSync(LOCAL_DB, TMP_DB);
      }
    } catch (e) {}
  }

  try {
    const raw = fs.readFileSync(fs.existsSync(DB_PATH) ? DB_PATH : LOCAL_DB, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return {
      users: [],
      sessions: {},
      pendingVerifications: {},
      content: []
    };
  }
}

function saveDb(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    try {
      fs.writeFileSync(LOCAL_DB, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {}
  }
}

function hashPassword(pass) {
  return crypto.createHash('sha256').update(pass).digest('hex');
}

function getMailTransporter() {
  const user = process.env.SMTP_USER || process.env.GMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASS;
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);

  if (nodemailer && user && pass) {
    try {
      return nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass }
      });
    } catch (e) {}
  }
  return null;
}

async function sendVerificationEmail(recipientEmail, otpCode, recipientName) {
  const transporter = getMailTransporter();
  if (transporter) {
    try {
      const sender = process.env.SMTP_FROM || process.env.GMAIL_USER || 'no-reply@techfin.com';
      await transporter.sendMail({
        from: `"TechFin NetPro 40" <${sender}>`,
        to: recipientEmail,
        subject: `Your TechFin Verification Code: ${otpCode}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; background: #0a0e1a; color: #f0f4ff; border-radius: 16px; border: 1px solid rgba(99,102,241,0.3);">
            <div style="text-align: center; margin-bottom: 24px;">
              <h2 style="color: #ffffff; margin: 0 0 6px;">TechFin &bull; NetPro 40</h2>
              <p style="color: #94a3c8; font-size: 14px; margin: 0;">Computer Network Architecture & Troubleshooting</p>
            </div>
            <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 24px; text-align: center;">
              <p style="font-size: 15px; color: #e2e8f0; margin: 0 0 16px; text-align: left;">Hello <strong>${recipientName || 'Student'}</strong>,</p>
              <p style="font-size: 14px; color: #94a3c8; margin: 0 0 24px; text-align: left; line-height: 1.6;">Use the 6-digit verification code below to activate your complete access to NetPro 40.</p>
              <div style="display: inline-block; padding: 14px 32px; background: rgba(99,102,241,0.15); border-radius: 10px; border: 2px dashed #6366f1; margin-bottom: 20px;">
                <span style="font-family: monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #38bdf8;">${otpCode}</span>
              </div>
              <p style="font-size: 12px; color: #64748b; margin: 0;">This code is valid for 15 minutes. Never share this code with anyone.</p>
            </div>
          </div>
        `
      });
      return true;
    } catch (err) {
      console.error('[EMAIL ERROR]', err.message);
    }
  }

  console.log(`[VERCEL SERVER LOG - OTP DISPATCH] Email: ${recipientEmail} | OTP: ${otpCode}`);
  return false;
}

function parseBody(req) {
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);
  if (typeof req.body === 'string') {
    try { return Promise.resolve(JSON.parse(req.body)); } catch(e) { return Promise.resolve({}); }
  }
  return new Promise((resolve) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); } catch (e) { resolve({}); }
    });
  });
}

function sendJson(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.end(JSON.stringify(data));
}

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.end();
    return;
  }

  const url = req.url || '';
  const pathname = url.split('?')[0];
  const db = getDb();

  // 0a. TAKEUFORWARD DIRECT OTP REQUEST: POST /api/auth/otp-request
  if (pathname === '/api/auth/otp-request' && req.method === 'POST') {
    try {
      const { contact, email, phone } = await parseBody(req);
      const target = (contact || email || phone || '').trim();
      if (!target) {
        return sendJson(res, 400, { error: 'Please enter a valid email address or mobile number.' });
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
        const cleanPhone = target.replace(/[^0-9+]/g, '');
        if (cleanPhone.length < 8) {
          return sendJson(res, 400, { error: 'Please enter a valid mobile number with country code.' });
        }
        identifier = cleanPhone;
      }

      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

      db.pendingVerifications = db.pendingVerifications || {};
      db.pendingVerifications[identifier] = {
        identifier,
        type: isEmail ? 'email' : 'phone',
        code: otpCode,
        expiresAt: Date.now() + 15 * 60 * 1000,
        attempts: 0
      };
      saveDb(db);

      let emailSent = false;
      if (isEmail) {
        emailSent = await sendVerificationEmail(identifier, otpCode, 'Learner');
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

  // 0b. TAKEUFORWARD DIRECT OTP VERIFICATION: POST /api/auth/otp-verify
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

      const isEmail = identifier.includes('@');
      let user = db.users.find(u =>
        (isEmail && u.email && u.email.toLowerCase() === identifier) ||
        (!isEmail && (u.phone === identifier || u.email === identifier + '@mobile.techfin.com'))
      );

      if (!user) {
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

  // 0c. RESEND CODE: POST /api/auth/resend-code
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

  // POST /api/auth/register-request
  if (pathname === '/api/auth/register-request' && req.method === 'POST') {
    try {
      const { name, email, password } = await parseBody(req);
      if (!name || !email || !password) {
        return sendJson(res, 400, { error: 'Full name, email, and password are required.' });
      }

      const normalizedEmail = email.toLowerCase().trim();
      const existing = db.users.find(u => u.email === normalizedEmail);
      if (existing) {
        return sendJson(res, 409, {
          error: 'An account with this email address already exists. Please Sign In.',
          alreadyExists: true
        });
      }

      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      db.pendingVerifications = db.pendingVerifications || {};
      db.pendingVerifications[normalizedEmail] = {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash: hashPassword(password),
        code: verificationCode,
        expiresAt: Date.now() + 15 * 60 * 1000,
        attempts: 0
      };
      saveDb(db);

      await sendVerificationEmail(normalizedEmail, verificationCode, name);

      // STRICT SECURITY: No code is leaked to the client
      return sendJson(res, 200, {
        success: true,
        message: `A 6-digit verification code has been dispatched to ${normalizedEmail}.`,
        email: normalizedEmail
      });
    } catch (err) {
      return sendJson(res, 500, { error: 'Registration error: ' + err.message });
    }
  }

  // POST /api/auth/resend-code
  if (pathname === '/api/auth/resend-code' && req.method === 'POST') {
    try {
      const { email } = await parseBody(req);
      const normalizedEmail = (email || '').toLowerCase().trim();
      const pending = db.pendingVerifications ? db.pendingVerifications[normalizedEmail] : null;

      if (!pending) {
        return sendJson(res, 400, { error: 'No pending registration found for this email.' });
      }

      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      pending.code = newCode;
      pending.expiresAt = Date.now() + 15 * 60 * 1000;
      pending.attempts = 0;
      saveDb(db);

      await sendVerificationEmail(normalizedEmail, newCode, pending.name);

      return sendJson(res, 200, {
        success: true,
        message: `Verification code resent to ${normalizedEmail}.`
      });
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  // POST /api/auth/verify-code
  if (pathname === '/api/auth/verify-code' && req.method === 'POST') {
    try {
      const { email, code } = await parseBody(req);
      const normalizedEmail = (email || '').toLowerCase().trim();
      const pending = db.pendingVerifications ? db.pendingVerifications[normalizedEmail] : null;

      if (!pending) {
        return sendJson(res, 400, { error: 'No pending registration found for this email. Please sign up again.' });
      }

      if (pending.code !== String(code).trim()) {
        return sendJson(res, 400, { error: 'Invalid verification code. Please check your Gmail/Inbox.' });
      }

      if (Date.now() > pending.expiresAt) {
        delete db.pendingVerifications[normalizedEmail];
        saveDb(db);
        return sendJson(res, 400, { error: 'Verification code expired. Please request a new one.' });
      }

      const newUser = {
        id: 'usr_' + Date.now(),
        name: pending.name,
        email: normalizedEmail,
        passwordHash: pending.passwordHash,
        role: 'user',
        emailVerified: true,
        enrolledInNetPro40: true,
        progress: { completedTopics: [], currentTopic: 'day1' },
        createdAt: new Date().toISOString()
      };
      db.users.push(newUser);
      delete db.pendingVerifications[normalizedEmail];

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

  // POST /api/auth/login
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
          error: 'Your email is not verified yet. Please enter the verification code.',
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

  // POST /api/auth/google
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

  // GET /api/auth/me
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

  // POST /api/user/enroll
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
      user.progress = user.progress || { completedTopics: [], currentTopic: 'day1' };
      saveDb(db);
      return sendJson(res, 200, {
        success: true,
        enrolledInNetPro40: true,
        progress: user.progress
      });
    }
    return sendJson(res, 404, { error: 'User not found.' });
  }

  // POST /api/user/progress
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
      return sendJson(res, 500, { error: err.message });
    }
  }

  // GET /api/content
  if (pathname === '/api/content' && req.method === 'GET') {
    return sendJson(res, 200, { content: db.content });
  }

  return sendJson(res, 404, { error: 'Endpoint not found.' });
};
