import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { signToken } from '../middleware/auth';

const router = Router();
const SALT_ROUNDS = 12;

/**
 * POST /api/auth/register
 * Body: { email, password, fullName, role?, country?, age?, gender?, academy?, weight?, beltGrade? }
 * Returns: { token, user }
 */
router.post('/register', async (req, res) => {
  const { email, password, fullName, role, country, age, gender, academy, weight, beltGrade } = req.body;

  if (!email || !password || !fullName) {
    return res.status(400).json({ error: 'email, password, and fullName are required' });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({
    email: email.toLowerCase(),
    passwordHash,
    role: role ?? 'athlete',
    fullName,
    country: country ?? '',
    age:     age     ?? '',
    gender:  gender  ?? '',
    academy: academy ?? '',
    weight:  weight  ?? '',
    beltGrade: beltGrade ?? '',
  });

  const token = signToken(String(user._id), user.role);
  const { passwordHash: _ph, ...safeUser } = user.toObject();
  res.status(201).json({ token, user: safeUser });
});

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Returns: { token, user }
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = signToken(String(user._id), user.role);
  const { passwordHash: _ph, ...safeUser } = user.toObject();
  res.json({ token, user: safeUser });
});

export default router;
