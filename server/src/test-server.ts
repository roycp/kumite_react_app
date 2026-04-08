/**
 * server/src/test-server.ts
 *
 * Test helper: starts the Express app with an in-memory MongoDB.
 * Import and use in Playwright specs that need the real server.
 */
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Server } from 'http';
import app from './app';
import { connectDB, disconnectDB } from './db';

let mongod: MongoMemoryServer;
let server: Server;
let port: number;

export async function startTestServer(listenPort = 0): Promise<string> {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await connectDB(uri);

  await new Promise<void>(resolve => {
    server = app.listen(listenPort, resolve);
  });
  port = (server.address() as { port: number }).port;
  return `http://localhost:${port}`;
}

export async function stopTestServer(): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close(err => (err ? reject(err) : resolve()));
  });
  await disconnectDB();
  await mongod.stop();
}

export function getBaseURL(): string {
  return `http://localhost:${port}`;
}
