const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { getPool } = require('../config/mysql');
const { protect } = require('../middleware/auth');

const router = express.Router();

// ─── Helper: sign JWT ─────────────────────────────────────────────────────────
const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// ─── Helper: validation error check ──────────────────────────────────────────
const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }
  return null;
};

// ─── POST /api/users/register ─────────────────────────────────────────────────
router.post(
  '/register',
  [
    body('username')
      .trim()
      .notEmpty().withMessage('Username is required')
      .isLength({ min: 3, max: 50 }).withMessage('Username must be 3–50 characters')
      .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, underscores'),
    body('email')
      .trim()
      .isEmail().withMessage('Valid email is required')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
      .matches(/\d/).withMessage('Password must contain at least one number'),
  ],
  async (req, res) => {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    const { username, email, password } = req.body;

    try {
      const pool = getPool();

      // Check if username or email already exists
      const [existing] = await pool.execute(
        'SELECT id FROM users WHERE username = ? OR email = ?',
        [username, email]
      );

      if (existing.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Username or email already in use',
        });
      }

      // Hash password with bcrypt (salt rounds = 12)
      const hashedPassword = await bcrypt.hash(password, 12);

      // Insert user
      const [result] = await pool.execute(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [username, email, hashedPassword]
      );

      const userId = result.insertId;
      const token = signToken({ id: userId, username });

      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: { id: userId, username, email },
        token,
      });
    } catch (error) {
      console.error('Registration error:', error.message);
      res.status(500).json({ success: false, message: 'Server error during registration' });
    }
  }
);

// ─── POST /api/users/login ────────────────────────────────────────────────────
router.post(
  '/login',
  [
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    const { username, password } = req.body;

    try {
      const pool = getPool();

      // Fetch user
      const [rows] = await pool.execute(
        'SELECT id, username, email, password FROM users WHERE username = ?',
        [username]
      );

      if (rows.length === 0) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const user = rows[0];

      // Compare hashed password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const token = signToken({ id: user.id, username: user.username });

      res.json({
        success: true,
        message: 'Login successful',
        data: { id: user.id, username: user.username, email: user.email },
        token,
      });
    } catch (error) {
      console.error('Login error:', error.message);
      res.status(500).json({ success: false, message: 'Server error during login' });
    }
  }
);

// ─── GET /api/users/profile ───────────────────────────────────────────────────
router.get('/profile', protect, async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT id, username, email, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── GET /api/users (Admin: list all users) ───────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT id, username, email, created_at FROM users ORDER BY created_at DESC'
    );
    res.json({ success: true, data: rows, total: rows.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
