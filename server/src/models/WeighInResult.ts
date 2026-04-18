import mongoose, { Schema } from 'mongoose';

const WeighInResultSchema = new Schema(
  {
    tournamentId:   { type: String, required: true },
    registrationId: { type: String, required: true },
    athleteName:    { type: String, required: true },
    discipline:     { type: String, required: true },
    weightDivision: { type: String, default: null },
    actualWeightKg: { type: Number, required: true },
    status:         { type: String, enum: ['meets_weight', 'lost_weight'], required: true },
    synced:         { type: Boolean, default: false },
    timestamp:      { type: Date, default: Date.now },
  },
);

export const WeighInResult = mongoose.model('WeighInResult', WeighInResultSchema);
