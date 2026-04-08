import { Schema, model, Document } from 'mongoose';

export interface ITournament extends Document {
  name: string;
  date: string;
  location: string;
  logo: string;
  description: string;
  status: 'upcoming' | 'active' | 'closed' | 'cancelled';
  martialArtIds: string[];
  registrationStart: string | null;
  registrationEnd: string | null;
  registrationForceOpen: boolean | null;
  templateId: string | null;
  synced: boolean;
}

const tournamentSchema = new Schema<ITournament>(
  {
    name:                  { type: String, required: true },
    date:                  { type: String, required: true },
    location:              { type: String, default: '' },
    logo:                  { type: String, default: '' },
    description:           { type: String, default: '' },
    status:                { type: String, enum: ['upcoming', 'active', 'closed', 'cancelled'], default: 'upcoming' },
    martialArtIds:         [{ type: String }],
    registrationStart:     { type: String, default: null },
    registrationEnd:       { type: String, default: null },
    registrationForceOpen: { type: Boolean, default: null },
    templateId:            { type: String, default: null },
    synced:                { type: Boolean, default: false },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } },
);

export const Tournament = model<ITournament>('Tournament', tournamentSchema);
