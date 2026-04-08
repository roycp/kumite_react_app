import express from 'express';
import cors from 'cors';
import { User } from './models/User';
import registrationsRouter   from './routes/registrations';
import tournamentsRouter      from './routes/tournaments';
import martialArtsRouter      from './routes/martialArts';
import organizationsRouter    from './routes/organizations';
import rankSystemsRouter      from './routes/rankSystems';
import roleDefinitionsRouter  from './routes/roleDefinitions';

const app = express();

app.use(cors());
app.use(express.json());

// ── Health check ──────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Users ─────────────────────────────────────────────────────────────────────

app.get('/api/users', async (_req, res) => {
  try {
    const users = await User.find({}, { passwordHash: 0 }).lean();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id, { passwordHash: 0 }).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { email, passwordHash, role, fullName, country, age, gender, academy, weight, beltGrade } = req.body;
    if (!email || !passwordHash || !fullName) {
      return res.status(400).json({ error: 'email, passwordHash, and fullName are required' });
    }
    const user = await User.create({ email, passwordHash, role: role ?? 'athlete', fullName, country, age, gender, academy, weight, beltGrade });
    const { passwordHash: _ph, ...safeUser } = user.toObject();
    res.status(201).json(safeUser);
  } catch (err: any) {
    if (err.code === 11000) return res.status(409).json({ error: 'Email already registered' });
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.patch('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true, projection: { passwordHash: 0 } }).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ── Additional resource routes ─────────────────────────────────────────────────

app.use('/api/registrations',    registrationsRouter);
app.use('/api/tournaments',      tournamentsRouter);
app.use('/api/martial-arts',     martialArtsRouter);
app.use('/api/organizations',    organizationsRouter);
app.use('/api/rank-systems',     rankSystemsRouter);
app.use('/api/role-definitions', roleDefinitionsRouter);

export default app;
