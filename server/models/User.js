import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export const GUILD_ROLES = [
  'Guild Leader',
  'Vice Leader',
  'Analyzer',
  'Team Leader',
  'Hunter',
];

export const HUNTER_RANKS = [
  'E',
  'D',
  'C',
  'B',
  'A',
  'S',
  'National Level',
];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: GUILD_ROLES,
        message: '{VALUE} is not a valid guild role',
      },
      default: 'Hunter',
    },
    hunterRank: {
      type: String,
      enum: {
        values: HUNTER_RANKS,
        message: '{VALUE} is not a valid hunter rank',
      },
      default: 'E',
    },
    guildTokens: {
      type: Number,
      default: 1000,
      min: [0, 'Guild Tokens balance cannot be negative'],
    },
    contribution: {
      type: Number,
      default: 0,
      min: 0,
    },
    guild: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Guild',
      default: null,
      index: true,
    },
    profileImage: {
      type: String,
      default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving to database
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password with hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
