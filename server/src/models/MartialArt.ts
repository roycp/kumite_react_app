import { Schema, model, Document } from 'mongoose';

export interface IMartialArt extends Document {
  name: string;
  logo: string;
  synced: boolean;
}

const martialArtSchema = new Schema<IMartialArt>(
  {
    name:   { type: String, required: true },
    logo:   { type: String, default: '' },
    synced: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } },
);

export const MartialArt = model<IMartialArt>('MartialArt', martialArtSchema);
