import mongoose from 'mongoose';

const guildSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Guild name is required'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: 'A premier Hunter Guild operating in HunterNet.',
    },
    guildLeader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    memberCount: {
      type: Number,
      default: 1,
      min: 1,
    },
    guildLevel: {
      type: Number,
      default: 1,
      min: 1,
    },
    maxMembers: {
      type: Number,
      default: 10,
      min: 1,
    },
    treasuryValue: {
      type: Number,
      default: 0,
      min: 0,
      description: 'Guild treasury balance in Guild Tokens',
    },
  },
  {
    timestamps: true,
  }
);

const Guild = mongoose.model('Guild', guildSchema);

export default Guild;
