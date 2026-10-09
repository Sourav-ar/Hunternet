import mongoose from 'mongoose';

const guildApplicationSchema = new mongoose.Schema({
  guild: { type: mongoose.Schema.Types.ObjectId, ref: 'Guild', required: true, index: true },
  applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending', index: true },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
}, { timestamps: true });

guildApplicationSchema.index({ guild: 1, applicant: 1 }, { unique: true });

export default mongoose.model('GuildApplication', guildApplicationSchema);
