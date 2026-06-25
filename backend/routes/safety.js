const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');

const nodemailer = require('nodemailer');
const router = express.Router();

// Configure Nodemailer Transporter (Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Get Aadhaar verification status
router.get('/aadhaar-status', authenticateToken, async (req, res) => {
  try {
    const rows = await db.callProc('sp_get_user_profile', [req.user.userId]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    
    res.json({
      status: rows[0].aadhaar_status,
      masked_number: rows[0].aadhaar_number_masked,
      email_verified: rows[0].email_verified,
      phone_verified: rows[0].phone_verified
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching Aadhaar status' });
  }
});

// Send Email OTP
router.post('/verify-email/send-otp', authenticateToken, async (req, res) => {
  try {
    const users = await db.callProc('sp_get_user_profile', [req.user.userId]);
    if (users.length === 0) return res.status(404).json({ error: 'User not found' });
    
    const email = users[0].email;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in database
    await db.query('DELETE FROM user_email_verifications WHERE user_id = ?', [req.user.userId]);
    await db.query('INSERT INTO user_email_verifications (user_id, email, code, expires_at) VALUES (?, ?, ?, ?)', 
      [req.user.userId, email, otp, expiresAt]);

    // Send Email
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Verify Your WanderMeets Email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #2D3436; text-align: center;">WanderMeets Verification</h2>
          <p>Hi there,</p>
          <p>Your one-time password (OTP) to verify your email address is:</p>
          <div style="background-color: #F3F4F6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #6C5CE7; border-radius: 8px;">
            ${otp}
          </div>
          <p>This code will expire in 10 minutes. Please do not share this code with anyone.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #636E72; text-align: center;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'Verification code sent to your email' });
  } catch (error) {
    console.error('Email OTP Error:', error);
    res.status(500).json({ error: 'Failed to send verification email' });
  }
});

// Verify Email OTP
router.post('/verify-email/confirm', [
  authenticateToken,
  body('code').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { code } = req.body;
    
    // Check code
    const verifications = await db.query(
      'SELECT email FROM user_email_verifications WHERE user_id = ? AND code = ? AND expires_at > NOW()',
      [req.user.userId, code]
    );

    if (verifications.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    const email = verifications[0].email;

    // Verify in user table
    await db.callProc('sp_verify_email', [req.user.userId, email]);
    
    // Cleanup
    await db.query('DELETE FROM user_email_verifications WHERE user_id = ?', [req.user.userId]);

    res.json({ message: 'Email verified successfully!' });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Error during email verification' });
  }
});

// Submit Aadhaar verification
router.post('/verify-aadhaar', [
  authenticateToken,
  upload.fields([
    { name: 'aadhaar_image', maxCount: 1 },
    { name: 'profile_photo', maxCount: 1 }
  ]),
  body('aadhaar_number').isLength({ min: 12, max: 12 }).withMessage('Aadhaar number must be 12 digits'),
  body('aadhaar_name').notEmpty().withMessage('Name as on Aadhaar card is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const aadhaarFile = req.files?.['aadhaar_image']?.[0];
  const profileFile = req.files?.['profile_photo']?.[0];

  if (!aadhaarFile) return res.status(400).json({ error: 'Aadhaar image is required' });
  if (!profileFile) return res.status(400).json({ error: 'Profile photo is required for verification' });

  try {
    const { aadhaar_number, aadhaar_name } = req.body;
    
    // Fetch profile name to match
    const profiles = await db.callProc('sp_get_user_profile', [req.user.userId]);
    if (profiles.length === 0) return res.status(404).json({ error: 'User profile not found' });
    
    const profileName = (profiles[0].full_name || '').trim().toLowerCase();
    const providedName = (aadhaar_name || '').trim().toLowerCase();
    
    if (providedName !== profileName) {
      return res.status(400).json({ 
        error: `Name on Aadhaar (${aadhaar_name}) does not match your profile name. Please ensure your profile name is correct before verifying.`,
        profile_name: profiles[0].full_name
      });
    }

    // Masking number: **** **** 1234
    const masked = `**** **** ${aadhaar_number.slice(-4)}`;
    const aadhaarUrl = `/uploads/${aadhaarFile.filename}`;
    const profileUrl = `/uploads/${profileFile.filename}`;

    await db.callProc('sp_submit_aadhaar_verification', [
      req.user.userId,
      masked,
      aadhaarUrl,
      profileUrl
    ]);

    res.json({ message: 'Verification submitted successfully! Our team will verify it in 24h.' });
  } catch (error) {
    console.error('Aadhaar submission error:', error);
    res.status(500).json({ error: 'Failed to submit verification' });
  }
});

// Get emergency contacts
router.get('/contacts', authenticateToken, async (req, res) => {
  try {
    const contacts = await db.callProc('sp_get_emergency_contacts', [req.user.userId]);
    res.json({ contacts });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching contacts' });
  }
});

// Add emergency contact
router.post('/contacts', [
  authenticateToken,
  body('name').trim().notEmpty().withMessage('Contact name is required'),
  body('relationship').trim().notEmpty().withMessage('Relationship is required'),
  body('phone').trim().notEmpty().withMessage('Phone number is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { name, relationship, phone } = req.body;
    const contacts = await db.callProc('sp_add_emergency_contact', [
      req.user.userId, name, relationship, phone
    ]);
    res.json({ message: 'Contact added successfully', contacts });
  } catch (error) {
    res.status(500).json({ error: 'Error adding contact' });
  }
});

// Delete emergency contact
router.delete('/contacts/:id', authenticateToken, async (req, res) => {
  try {
    const contacts = await db.callProc('sp_delete_emergency_contact', [
      req.params.id, req.user.userId
    ]);
    res.json({ message: 'Contact deleted successfully', contacts });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting contact' });
  }
});

// Initialize Twilio only if credentials exist
const twilioSid = process.env.TWILIO_ACCOUNT_SID;
const twilioToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
let twilioClient = null;

if (twilioSid && twilioSid.startsWith('AC') && twilioToken !== 'your_token') {
  try {
    twilioClient = require('twilio')(twilioSid, twilioToken);
    console.log('✅ Twilio SMS Gateway Activated');
  } catch (e) {
    console.error('❌ Failed to initialize Twilio:', e.message);
  }
}

// Utility to format phone number to E.164 (Twilio requirement)
const formatPhone = (phone) => {
  if (!phone) return null;
  let cleaned = phone.toString().replace(/\D/g, '');
  // Default to +91 for 10-digit Indian numbers
  if (cleaned.length === 10) return `+91${cleaned}`;
  // If already starts with 91 but no plus
  if (cleaned.length === 12 && cleaned.startsWith('91')) return `+${cleaned}`;
  // Already has +
  if (phone.toString().startsWith('+')) return phone;
  // Fallback
  return `+${cleaned}`;
};

// Send SOS Alert (Dual Channel: SMS + WhatsApp)
router.post('/sos', [
  authenticateToken,
  body('latitude').isNumeric(),
  body('longitude').isNumeric()
], async (req, res) => {
  try {
    const { latitude, longitude, message } = req.body;
    
    // 1. Log to Database
    await db.callProc('sp_send_sos', [
      req.user.userId, latitude, longitude, message || 'EMERGENCY SOS ALERT'
    ]);

    // 2. Fetch Guardian Contacts
    const contacts = await db.callProc('sp_get_emergency_contacts', [req.user.userId]);
    
    // 3. Send Real SMS & WhatsApp if Twilio is Configured
    let report = [];
    if (twilioClient && contacts.length > 0) {
      const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
      const sosBody = `${message || 'EMERGENCY SOS ALERT'}! \nFrom: ${req.user.email}\nLocation: ${mapsLink}`;
      
      const alertPromises = contacts.flatMap(contact => {
        const formattedTo = formatPhone(contact.phone_number);
        
        return [
          // SMS Alert
          twilioClient.messages.create({
            body: sosBody,
            from: twilioPhone,
            to: formattedTo
          }).then(m => { console.log(`✅ SMS Sent to ${contact.name}`); return 'SMS:OK'; })
            .catch(e => { console.error(`❌ SMS Failed for ${contact.name}:`, e.message); return `SMS:FAIL(${e.message})`; }),
          
          // WhatsApp Alert (Must use official Sandbox sender for trial accounts)
          twilioClient.messages.create({
            body: sosBody,
            from: `whatsapp:+14155238886`,
            to: `whatsapp:${formattedTo}`
          }).then(m => { console.log(`✅ WhatsApp Sent to ${contact.name}`); return 'WA:OK'; })
            .catch(e => { console.error(`❌ WhatsApp Failed for ${contact.name}:`, e.message); return `WA:FAIL(${e.message})`; })
        ];
      });
      
      report = await Promise.all(alertPromises);
    }

    res.json({ 
      success: true,
      message: `SOS Signal Logged • Alerts: ${report.join(', ')}`,
      status_report: report
    });
  } catch (error) {
    console.error('SOS System Error:', error);
    res.status(500).json({ error: 'Failed to process SOS signal' });
  }
});

// Get SOS History
router.get('/sos-history', authenticateToken, async (req, res) => {
  try {
    const history = await db.callProc('sp_get_user_sos_history', [req.user.userId]);
    res.json({ history });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching SOS history' });
  }
});

// Phone Verification (Twilio Verify)
const verifySid = process.env.TWILIO_VERIFY_SERVICE_ID;

// Send OTP
router.post('/send-otp', authenticateToken, async (req, res) => {
  try {
    const { phone } = req.body;
    const formattedPhone = formatPhone(phone);
    console.log(`[OTP DEBUG] Initiate -> Raw: ${phone}, Formatted: ${formattedPhone}`);

    if (!formattedPhone) return res.status(400).json({ error: 'Valid phone number is required' });
    if (!twilioClient) {
      console.error('[OTP ERROR] Twilio Client not initialized');
      return res.status(500).json({ error: 'SMS Gateway not configured' });
    }
    if (!verifySid || verifySid.startsWith('VA...')) {
      console.error('[OTP ERROR] Invalid Verify Service ID:', verifySid);
      return res.status(500).json({ error: 'Verify Service ID not configured' });
    }

    const verification = await twilioClient.verify.v2.services(verifySid)
      .verifications.create({ to: formattedPhone, channel: 'sms' });

    console.log(`✅ [OTP DEBUG] Verification SID: ${verification.sid} sent to ${formattedPhone}`);
    res.json({ success: true, message: 'Verification code sent to ' + formattedPhone });
  } catch (error) {
    console.error('❌ [OTP ERROR] Send Logic Failed:', error.message);
    res.status(500).json({ error: error.message || 'Failed to send OTP' });
  }
});

// Verify OTP
router.post('/verify-otp', authenticateToken, async (req, res) => {
  try {
    const { phone, code } = req.body;
    const formattedPhone = formatPhone(phone);
    console.log(`[OTP DEBUG] Check -> Raw: ${phone}, Formatted: ${formattedPhone}, Code: ${code}`);

    if (!formattedPhone || !code) return res.status(400).json({ error: 'Phone and Code are required' });
    if (!twilioClient) return res.status(500).json({ error: 'SMS Gateway not configured' });

    const check = await twilioClient.verify.v2.services(verifySid)
      .verificationChecks.create({ to: formattedPhone, code });

    console.log(`[OTP DEBUG] Twilio Response Status: ${check.status}`);

    if (check.status === 'approved') {
      console.log(`✅ [OTP DEBUG] ${formattedPhone} Approved! Updating DB...`);
      await db.callProc('sp_update_phone_status', [req.user.userId, 1]);
      res.json({ success: true, message: 'Phone verified successfully!' });
    } else {
      console.warn(`❌ [OTP DEBUG] ${formattedPhone} Rejected (Status: ${check.status})`);
      res.status(400).json({ error: 'Invalid or expired verification code' });
    }
  } catch (error) {
    console.error('❌ [OTP ERROR] Verification Logic Failed:', error.message);
    res.status(500).json({ error: error.message || 'Verification check failed' });
  }
});

// Add a review (for user, activity, wave, or marketplace)
router.post('/review', [
  authenticateToken,
  body('user_id').isInt(),
  body('rating').isInt({ min: 1, max: 5 }),
  body('comment').optional().isString(),
  body('entity_type').optional().isIn(['user', 'activity', 'wave', 'listing']),
  body('entity_id').optional().isInt(),
  body('entity_title').optional().isString()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { user_id, rating, comment, entity_type, entity_id, entity_title } = req.body;
    if (user_id === req.user.userId) return res.status(400).json({ error: 'Cannot review yourself' });

    await db.callProc('sp_add_user_review', [
      user_id, 
      req.user.userId, 
      entity_type || 'user', 
      entity_id || null, 
      entity_title || null, 
      rating, 
      comment
    ]);
    res.json({ message: 'Review added successfully' });
  } catch (error) {
    console.error('Review error:', error);
    res.status(500).json({ error: 'Error adding review' });
  }
});

// Report Fraud or Safety Concern
router.post('/report', [
  authenticateToken,
  body('reported_user_id').isInt(),
  body('reason').notEmpty(),
  body('entity_type').optional().isIn(['user', 'activity', 'wave', 'listing']),
  body('entity_id').optional().isInt(),
  body('description').optional().isString()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { reported_user_id, reason, entity_type, entity_id, description } = req.body;
    if (reported_user_id === req.user.userId) return res.status(400).json({ error: 'Cannot report yourself' });

    await db.callProc('sp_add_report', [
      req.user.userId,
      reported_user_id,
      entity_type || 'user',
      entity_id || null,
      reason,
      description
    ]);
    res.json({ message: 'Report submitted successfully' });
  } catch (error) {
    console.error('Report error:', error);
    res.status(500).json({ error: 'Error submitting report' });
  }
});

module.exports = router;
