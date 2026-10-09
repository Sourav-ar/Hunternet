import mongoose from 'mongoose';

export const MESSAGE_CHANNELS = [
  'General',
  'Raid',
  'Officer',
];

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    guild: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Guild',
      required: true,
      index: true,
    },
    message: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
    },
    channel: {
      type: String,
      enum: {
        values: MESSAGE_CHANNELS,
        message: '{VALUE} is not a valid channel',
      },
      default: 'General',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Message = mongoose.model('Message', messageSchema);

export default Message;
