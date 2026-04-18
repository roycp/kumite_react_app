import mongoose, { Schema } from 'mongoose';

const BracketSeedSchema = new Schema(
  {
    tournamentId: { type: String, required: true, unique: true },
    seeds:        { type: Map, of: [String], default: {} },
  },
  { timestamps: { createdAt: false, updatedAt: 'updatedAt' } },
);

export const BracketSeed = mongoose.model('BracketSeed', BracketSeedSchema);
