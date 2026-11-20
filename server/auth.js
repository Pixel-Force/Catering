/**
 * Grand Heritage Catering - Authentication & Session Middleware
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'heritage-catering-super-secret-key-2026';

async function hashPassword(plainText) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainText, salt);
}

async function verifyPassword(plainText, hash) {
  return bcrypt.compare(plainText, hash);
}

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      full_name: user.full_name
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function authenticateAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Session expired or invalid' });
  }
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  authenticateAdmin
};
