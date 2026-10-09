import mongoose from 'mongoose';
import Bid from '../models/Bid.js';
import Auction from '../models/Auction.js';
import Item from '../models/Item.js';
import User from '../models/User.js';
import { createTimelineLog } from '../utils/timelineLogger.js';

/**
 * @desc    Place a new Bid on an Active Auction
 * @route   POST /api/auctions/:auctionId/bid or POST /api/bids
 * @access  Private (Authenticated Hunters)
 */
export const placeBid = async (req, res) => {
  try {
    const targetAuctionId = req.params.auctionId || req.body.auctionId;
    const { amount } = req.body;

    if (!targetAuctionId || !mongoose.isValidObjectId(targetAuctionId)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid auction ID.' });
    }

    const bidAmount = Number(amount);

    if (!bidAmount || bidAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Please provide a valid bid amount.' });
    }

    // 1. Locate auction
    const auction = await Auction.findOne({ _id: targetAuctionId, guild: req.user.guild }).populate('item');
    if (!auction) {
      return res.status(404).json({ success: false, message: 'Auction not found.' });
    }

    if (auction.status !== 'Active') {
      return res.status(400).json({ success: false, message: `Cannot bid. Auction is '${auction.status}'.` });
    }

    // 2. Prevent seller from bidding on their own auction
    if (auction.seller.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Sellers cannot bid on their own auctions.' });
    }

    // 3. Verify bidder has sufficient Guild Tokens
    const bidderUser = await User.findById(req.user._id);
    if (bidderUser.guildTokens < bidAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient Guild Tokens. You have ${bidderUser.guildTokens} GT, but bid requires ${bidAmount} GT.`,
      });
    }

    // 4. Check for Buyout trigger
    const isBuyout = auction.buyoutPrice && bidAmount >= auction.buyoutPrice;

    if (!isBuyout && bidAmount <= auction.currentBid) {
      return res.status(400).json({
        success: false,
        message: `Bid amount must be strictly greater than the current bid of ${auction.currentBid} Guild Tokens.`,
      });
    }

    // 5. Create Bid record
    const bid = await Bid.create({
      auction: auction._id,
      bidder: req.user._id,
      guild: req.user.guild,
      amount: bidAmount,
    });

    if (isBuyout) {
      // Execute Immediate Buyout Settlement
      const sellerUser = await User.findById(auction.seller);

      bidderUser.guildTokens -= bidAmount;
      await bidderUser.save();

      if (sellerUser) {
        sellerUser.guildTokens += bidAmount;
        await sellerUser.save();
      }

      if (auction.item) {
        await Item.findByIdAndUpdate(auction.item._id, { owner: req.user._id, status: 'Sold' });
      }

      auction.currentBid = bidAmount;
      auction.status = 'Ended';
      auction.winner = req.user._id;
      await auction.save();

      await createTimelineLog({
        actor: req.user._id,
        guild: req.user.guild,
        eventType: 'ITEM_SOLD',
        title: `Auction Buyout: ${auction.item?.name || 'Item'} Sold!`,
        description: `${req.user.name} triggered buyout for ${auction.item?.name || 'Item'} at ${bidAmount} Guild Tokens.`,
        relatedId: auction._id,
        onModel: 'Auction',
      });

      const populatedBid = await Bid.findById(bid._id).populate('bidder', 'name email role hunterRank profileImage');

      return res.status(201).json({
        success: true,
        message: `Buyout successful! You purchased ${auction.item?.name || 'Item'} for ${bidAmount} Guild Tokens.`,
        data: populatedBid,
      });
    }

    // 6. Regular Bid update
    auction.currentBid = bidAmount;
    await auction.save();

    const populatedBid = await Bid.findById(bid._id)
      .populate('bidder', 'name email role hunterRank profileImage');

    // Auto-Log to Timeline
    await createTimelineLog({
      actor: req.user._id,
      guild: req.user.guild,
      eventType: 'BID_PLACED',
      title: `New Bid Placed: ${auction.item?.name || 'Auction'}`,
      description: `${req.user.name} placed a bid of ${bidAmount} Guild Tokens.`,
      relatedId: auction._id,
      onModel: 'Auction',
    });

    return res.status(201).json({
      success: true,
      message: `Bid of ${bidAmount} Guild Tokens placed successfully.`,
      data: populatedBid,
    });
  } catch (error) {
    console.error('Place Bid Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to place bid.' });
  }
};

/**
 * @desc    Fetch all Bids placed on a specific Auction
 * @route   GET /api/auctions/:auctionId/bid or GET /api/bids/auction/:auctionId
 * @access  Private (Guild Members)
 */
export const getBidsForAuction = async (req, res) => {
  try {
    const { auctionId } = req.params;

    if (!auctionId || !mongoose.isValidObjectId(auctionId)) {
      return res.status(400).json({ success: false, message: 'Invalid auction id.' });
    }

    const auction = await Auction.findOne({ _id: auctionId, guild: req.user.guild });
    if (!auction) return res.status(404).json({ success: false, message: 'Auction not found.' });

    const bids = await Bid.find({ auction: auctionId, guild: req.user.guild })
      .populate('bidder', 'name email role hunterRank profileImage')
      .sort({ amount: -1, createdAt: -1 });

    return res.json({
      success: true,
      count: bids.length,
      data: bids,
    });
  } catch (error) {
    console.error('Get Bids Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to fetch bids.' });
  }
};
