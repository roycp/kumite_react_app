import mongoose, { Schema } from 'mongoose';

const CoachAssignmentSchema = new Schema(
  {
    coachId:   { type: String, required: true },
    athleteId: { type: String, required: true },
    synced:    { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

CoachAssignmentSchema.index({ coachId: 1, athleteId: 1 }, { unique: true });

export const CoachAssignment = mongoose.model('CoachAssignment', CoachAssignmentSchema);
