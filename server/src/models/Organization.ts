import { Schema, model, Document } from 'mongoose';

export interface IOrganization extends Document {
  name: string;
  acronym: string;
  description: string;
  logo: string;
  martialArtId: string;
  synced: boolean;
}

const organizationSchema = new Schema<IOrganization>(
  {
    name:         { type: String, required: true },
    acronym:      { type: String, default: '' },
    description:  { type: String, default: '' },
    logo:         { type: String, default: '' },
    martialArtId: { type: String, required: true },
    synced:       { type: Boolean, default: false },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } },
);

export const Organization = model<IOrganization>('Organization', organizationSchema);
