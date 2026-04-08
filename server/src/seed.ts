/**
 * server/src/seed.ts
 *
 * Idempotent admin-user seeder. Call after DB is connected.
 * Creates the admin user only if no user with ADMIN_EMAIL exists.
 * Safe to call on every server start.
 */

import bcrypt from 'bcryptjs';
import { User } from './models/User';

const SALT_ROUNDS = 12;

export async function seedAdmin(): Promise<void> {
  const email    = (process.env.ADMIN_EMAIL    ?? 'admin@kumite.app').toLowerCase();
  const password =  process.env.ADMIN_PASSWORD ?? 'Admin@1234';

  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`[seed] Admin user already exists: ${email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  await User.create({
    email,
    passwordHash,
    role:      'admin',
    fullName:  'Administrator',
    country:   '',
    age:       '',
    gender:    '',
    academy:   '',
    weight:    '',
    beltGrade: '',
    synced:    false,
  });

  console.log(`[seed] Admin user created: ${email}`);
}
