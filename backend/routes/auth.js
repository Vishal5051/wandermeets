const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');

const router = express.Router();

// Register new user
router.post('/register', [
  body('email').isEmail().withMessage('Please enter a valid email address').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('full_name').trim().isLength({ min: 2 }).withMessage('Display name must be at least 2 characters long'),
  body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters long').matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
  body('gender').optional({ checkFalsy: true }).isIn(['male', 'female', 'other', 'prefer_not_to_say']).withMessage('Invalid gender selection')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array().map(e => e.msg).join(', ') });
  }

  const { email, password, full_name, username, gender, date_of_birth, role } = req.body;

  try {
    // Check if user already exists
    const existing = await db.callProc('sp_check_user_exists', [email, username]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email or username already exists' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create user via stored procedure
    const rows = await db.callProc('sp_register_user', [
      email, password_hash, full_name, username, gender || null, date_of_birth || null,
      role || 'traveler'
    ]);
    const user = rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        username: user.username,
        gender: user.gender,
        trust_score: user.trust_score,
        role: user.role || 'traveler'
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login
router.post('/login', [
  body('email').notEmpty().withMessage('Email or Username is required'),
  body('password').exists().withMessage('Password is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array().map(e => e.msg).join(', ') });
  }

  const { email, password } = req.body;

  try {
    const rows = await db.callProc('sp_get_user_by_email', [email]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last active
    await db.callProc('sp_update_last_active', [user.id]);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        username: user.username,
        gender: user.gender,
        profile_photo: user.profile_photo,
        bio: user.bio,
        trust_score: user.trust_score,
        verification_level: user.verification_level,
        is_verified: user.is_verified,
        role: user.role || 'traveler'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

module.exports = router;
