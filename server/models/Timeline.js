import mongoose from 'mongoose';

export const TIMELINE_EVENT_TYPES = [
  'AUCTION_CREATED',
  'BID_PLACED',
  'ITEM_SOLD',
  'RAID_COMPLETED',
  'RANK_UPGRADE',
  'ANNOUNCEMENT',
];

const timelineSchema = new mongoose.Schema(
  {
    actor: {
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
    eventType: {
      type: String,
      enum: {
        values: TIMELINE_EVENT_TYPES,
        message: '{VALUE} is not a valid timeline event type',
      },
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
    },
    description: {
      type: String,
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'onModel',
    },
    onModel: {
      type: String,
      enum: ['Auction', 'Item', 'User'],
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

const Timeline = mongoose.model('Timeline', timelineSchema);

export default Timeline;
