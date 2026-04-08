import { Schema, model, Document } from 'mongoose';

export interface IRoleDefinition extends Document {
  name: string;
  displayName: string;
  permissions: string[];
  synced: boolean;
}

const roleDefinitionSchema = new Schema<IRoleDefinition>(
  {
    name:        { type: String, required: true, unique: true },
    displayName: { type: String, required: true },
    permissions: [{ type: String }],
    synced:      { type: Boolean, default: false },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } },
);

export const RoleDefinition = model<IRoleDefinition>('RoleDefinition', roleDefinitionSchema);
