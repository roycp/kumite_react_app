import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { connectDB, disconnectDB } from './db';
import { seedAdmin } from './seed';

const PORT     = process.env.PORT     ?? 3001;
const MONGO_URI = process.env.MONGO_URI ?? 'mongodb://localhost:27017/kumite';

async function main() {
  await connectDB(MONGO_URI);
  console.log(`Connected to MongoDB: ${MONGO_URI}`);
  await seedAdmin();

  const server = app.listen(PORT, () => {
    console.log(`KumiteApp server listening on port ${PORT}`);
  });

  const shutdown = async () => {
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT',  shutdown);
}

main().catch(err => {
  console.error('Server startup failed:', err);
  process.exit(1);
});
