import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  role: string;
  fullName: string;
  country: string;
  age: string;
  gender: string;
  academy: string;
  weight: string;
  beltGrade: string;
  createdAt: Date;
  synced: boolean;
}

const userSchema = new Schema<IUser>(
  {
    email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role:         { type: String, required: true, default: 'athlete' },
    fullName:     { type: String, required: true },
    country:      { type: String, default: '' },
    age:          { type: String, default: '' },
    gender:       { type: String, default: '' },
    academy:      { type: String, default: '' },
    weight:       { type: String, default: '' },
    beltGrade:    { type: String, default: '' },
    synced:       { type: Boolean, default: false },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } },
);

export const User = model<IUser>('User', userSchema);
