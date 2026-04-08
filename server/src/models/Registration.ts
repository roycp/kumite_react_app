import { Schema, model, Document } from 'mongoose';

interface ModalityEntry {
  discipline: string;
  weightDivision: string | null;
  gender: string;
  ageGroup: string;
}

export interface IRegistration extends Document {
  userId: string;
  tournamentId: string;
  tournamentName: string;
  athleteName: string;
  email?: string;
  academy?: string;
  grade?: string;
  modalities: ModalityEntry[];
  timestamp: Date;
  synced: boolean;
}

const registrationSchema = new Schema<IRegistration>(
  {
    userId:         { type: String, required: true },
    tournamentId:   { type: String, required: true },
    tournamentName: { type: String, required: true },
    athleteName:    { type: String, required: true },
    email:          { type: String },
    academy:        { type: String },
    grade:          { type: String },
    modalities:     [{ discipline: String, weightDivision: { type: String, default: null }, gender: String, ageGroup: String }],
    timestamp:      { type: Date, default: Date.now },
    synced:         { type: Boolean, default: false },
  },
);

export const Registration = model<IRegistration>('Registration', registrationSchema);
