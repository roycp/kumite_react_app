import mongoose, { Schema } from 'mongoose';

const WeightClassSchema = new Schema(
  { id: String, label: String, minKg: Number, maxKg: Number },
  { _id: false },
);

const TemplateCategorySchema = new Schema(
  { id: String, name: String, discipline: String, gender: String, ageGroup: String, rankRange: String },
  { _id: false },
);

const TournamentTemplateSchema = new Schema(
  {
    name:         { type: String, required: true },
    description:  { type: String, default: '' },
    modalities:   [String],
    weightClasses: [WeightClassSchema],
    categories:   [TemplateCategorySchema],
    synced:       { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const TournamentTemplate = mongoose.model('TournamentTemplate', TournamentTemplateSchema);
