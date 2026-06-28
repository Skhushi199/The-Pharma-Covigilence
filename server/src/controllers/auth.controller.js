const User = require('../models/User.model');
const jwt = require('jsonwebtoken');

// Generate signed JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// POST /api/auth/register
const register = async (req, res, next) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
  }

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    // Only allow 'patient' through public register; admin creation is separate
    const safeRole = role === 'admin' ? 'patient' : (role || 'patient');

    const user = await User.create({ name, email, password, role: safeRole });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      },
    });
  } catch (err) {
    return next(err);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password required' });
  }

  try {
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      },
    });
  } catch (err) {
    return next(err);
  }
};

// POST /api/auth/admin/register  (protected — requires existing admin or no admins in DB)
const registerAdmin = async (req, res, next) => {
  const { name, email, password, adminSecret } = req.body;

  // Simple guard: require an admin secret env var
  const ADMIN_SECRET = process.env.ADMIN_REGISTER_SECRET || 'PVAdminSetup2024';
  if (adminSecret !== ADMIN_SECRET) {
    return res.status(403).json({ success: false, message: 'Invalid admin registration secret' });
  }

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
  }

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({ name, email, password, role: 'admin' });

    return res.status(201).json({
      success: true,
      message: 'Admin account created',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      },
    });
  } catch (err) {
    return next(err);
  }
};

// GET /api/auth/me
const getMe = async (req, res, next) => {
  return res.status(200).json({
    success: true,
    data: {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
};

module.exports = { register, login, registerAdmin, getMe };
