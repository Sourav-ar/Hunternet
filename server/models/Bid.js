import mongoose from 'mongoose';

const bidSchema = new mongoose.Schema(
  {
    auction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Auction',
      required: true,
    },
    bidder: {
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
    amount: {
      type: Number,
      required: [true, 'Bid amount is required'],
      min: [1, 'Bid amount must be at least 1 Guild Token'],
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

const Bid = mongoose.model('Bid', bidSchema);

export default Bid;
