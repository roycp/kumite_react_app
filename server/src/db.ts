import mongoose from 'mongoose';

/**
 * Connect to MongoDB using MONGO_URI from environment.
 * Returns the mongoose connection for lifecycle management.
 */
export async function connectDB(uri: string): Promise<typeof mongoose> {
  await mongoose.connect(uri);
  return mongoose;
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}
