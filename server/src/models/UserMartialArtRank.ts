import mongoose, { Schema } from 'mongoose';

const UserMartialArtRankSchema = new Schema(
  {
    userId:       { type: String, required: true },
    martialArtId: { type: String, required: true },
    rankSystemId: { type: String, required: true },
    synced:       { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

UserMartialArtRankSchema.index({ userId: 1, martialArtId: 1 }, { unique: true });

export const UserMartialArtRank = mongoose.model('UserMartialArtRank', UserMartialArtRankSchema);
