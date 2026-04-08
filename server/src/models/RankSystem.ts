import { Schema, model, Document } from 'mongoose';

export interface IRankSystem extends Document {
  martialArtId: string;
  name: string;
  description: string;
  rank: number;
  classification: 'beginner' | 'advanced';
  applicableTo: 'children' | 'adults' | 'both';
  synced: boolean;
}

const rankSystemSchema = new Schema<IRankSystem>(
  {
    martialArtId:   { type: String, required: true },
    name:           { type: String, required: true },
    description:    { type: String, default: '' },
    rank:           { type: Number, required: true },
    classification: { type: String, enum: ['beginner', 'advanced'], required: true },
    applicableTo:   { type: String, enum: ['children', 'adults', 'both'], required: true },
    synced:         { type: Boolean, default: false },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } },
);

export const RankSystem = model<IRankSystem>('RankSystem', rankSystemSchema);
