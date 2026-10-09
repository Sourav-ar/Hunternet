import mongoose from 'mongoose';

export const AUCTION_STATUSES = [
  'Active',
  'Ended',
  'Cancelled',
];

const auctionSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
    },
    seller: {
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
    startingBid: {
      type: Number,
      required: [true, 'Starting bid is required'],
      min: [1, 'Starting bid must be at least 1 Guild Token'],
    },
    currentBid: {
      type: Number,
      required: true,
      min: 0,
    },
    buyoutPrice: {
      type: Number,
      min: 0,
    },
    status: {
      type: String,
      enum: {
        values: AUCTION_STATUSES,
        message: '{VALUE} is not a valid auction status',
      },
      default: 'Active',
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
      required: [true, 'Auction end time is required'],
    },
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

const Auction = mongoose.model('Auction', auctionSchema);

export default Auction;
