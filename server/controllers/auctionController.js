import mongoose from 'mongoose';
import Auction from '../models/Auction.js';
import Item from '../models/Item.js';
import User from '../models/User.js';
import Bid from '../models/Bid.js';
import { createTimelineLog } from '../utils/timelineLogger.js';

/**
 * @desc    Create a new Marketplace Auction listing for an Approved Item
 * @route   POST /api/auctions
 * @access  Private (Authenticated Hunters)
 */
export const createAuction = async (req, res) => {
  try {
    const { itemId, startingBid, buyoutPrice, durationHours } = req.body;

    if (!itemId || !startingBid) {
      return res.status(400).json({
        success: false,
        message: 'Please provide required fields: itemId and startingBid.',
      });
    }

    if (!mongoose.isValidObjectId(itemId)) {
      return res.status(400).json({ success: false, message: 'Invalid item id.' });
    }

    if (buyoutPrice !== undefined && Number(buyoutPrice) <= Number(startingBid)) {
      return res.status(400).json({
        success: false,
        message: 'Buyout price must be strictly greater than starting bid.',
      });
    }

    // 1. Verify Item exists, belongs to guild, and is owned by seller or seller is guild officer
    const item = await Item.findOne({ _id: itemId, guild: req.user.guild });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found in your guild.' });
    }

    if (item.owner.toString() !== req.user._id.toString() && !['Guild Leader', 'Vice Leader'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only the item owner or guild officers can create an auction for this item.',
      });
    }

    if (item.status !== 'Approved') {
      return res.status(400).json({
        success: false,
        message: `Item must be in 'Approved' status to be listed in auction. Current status: '${item.status}'.`,
      });
    }

    // 2. Set auction end time (default 24 hours if unprovided)
    const hours = durationHours && durationHours > 0 ? durationHours : 24;
    const endTime = new Date(Date.now() + hours * 60 * 60 * 1000);

    // 3. Create Auction document
    const auction = await Auction.create({
      item: itemId,
      seller: req.user._id,
      guild: req.user.guild,
      startingBid: Number(startingBid),
      currentBid: Number(startingBid),
      buyoutPrice: buyoutPrice ? Number(buyoutPrice) : undefined,
      status: 'Active',
      startTime: Date.now(),
      endTime,
    });

    // 4. Update Item status to 'Auctioned'
    item.status = 'Auctioned';
    await item.save();

    const populatedAuction = await Auction.findById(auction._id)
      .populate('item')
      .populate('seller', 'name email role hunterRank profileImage');

    // Auto-Log to Timeline
    await createTimelineLog({
      actor: req.user._id,
      guild: req.user.guild,
      eventType: 'AUCTION_CREATED',
      title: `Auction Created: ${item.name}`,
      description: `${req.user.name} listed Grade-${item.grade} ${item.name} for auction starting at ${startingBid} Guild Tokens.`,
      relatedId: auction._id,
      onModel: 'Auction',
    });

    return res.status(201).json({
      success: true,
      message: 'Auction listed successfully.',
      data: populatedAuction,
    });
  } catch (error) {
    console.error('Create Auction Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to create auction.' });
  }
};

/**
 * @desc    Fetch all Marketplace Auctions
 * @route   GET /api/auctions
 * @access  Private (Guild Members)
 */
export const getAuctions = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { guild: req.user.guild, status: status || 'Active' };

    const auctions = await Auction.find(filter)
      .populate({
        path: 'item',
        populate: { path: 'owner creator', select: 'name email role hunterRank' },
      })
      .populate('seller', 'name email role hunterRank profileImage')
      .populate('winner', 'name email role hunterRank profileImage')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: auctions.length,
      data: auctions,
    });
  } catch (error) {
    console.error('Get Auctions Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to fetch auctions.' });
  }
};

/**
 * @desc    Fetch single Auction details by ID
 * @route   GET /api/auctions/:id
 * @access  Private (Guild Members)
 */
export const getAuctionById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid auction id.' });
    }

    const auction = await Auction.findOne({ _id: req.params.id, guild: req.user.guild })
      .populate({
        path: 'item',
        populate: { path: 'owner creator', select: 'name email role hunterRank' },
      })
      .populate('seller', 'name email role hunterRank profileImage')
      .populate('winner', 'name email role hunterRank profileImage');

    if (!auction) {
      return res.status(404).json({ success: false, message: 'Auction listing not found.' });
    }

    return res.json({
      success: true,
      data: auction,
    });
  } catch (error) {
    console.error('Get Auction By ID Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to fetch auction.' });
  }
};

/**
 * @desc    End / Close Auction & finalize winner settlement
 * @route   POST /api/auctions/:id/end
 * @access  Private (Seller, Guild Leader, Vice Leader, or Any Member if Expired)
 */
export const endAuction = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid auction id.' });
    }

    const auction = await Auction.findOne({ _id: req.params.id, guild: req.user.guild }).populate('item');
    if (!auction) {
      return res.status(404).json({ success: false, message: 'Auction not found.' });
    }

    if (auction.status !== 'Active') {
      return res.status(400).json({ success: false, message: `Auction is already '${auction.status}'.` });
    }

    const isExpired = auction.endTime <= new Date();
    const isSellerOrOfficer = auction.seller.toString() === req.user._id.toString() || ['Guild Leader', 'Vice Leader'].includes(req.user.role);

    if (!isExpired && !isSellerOrOfficer) {
      return res.status(403).json({ success: false, message: 'Only the seller or guild officers may end an active auction before its duration expires.' });
    }

    // Find top bid for this auction
    const highestBid = await Bid.findOne({ auction: auction._id })
      .sort({ amount: -1 })
      .populate('bidder');

    const item = await Item.findById(auction.item._id);

    if (highestBid) {
      const winnerUser = await User.findById(highestBid.bidder._id);
      const sellerUser = await User.findById(auction.seller);

      // Verify bidder has enough tokens at settlement
      if (!winnerUser || winnerUser.guildTokens < highestBid.amount) {
        // Winning bidder defaulted due to insufficient funds: revert item to Approved
        if (item) {
          item.status = 'Approved';
          await item.save();
        }
        auction.status = 'Ended';
        await auction.save();

        return res.status(400).json({
          success: false,
          message: 'Top bidder has insufficient Guild Tokens to complete purchase. Auction ended and item reverted to Approved.',
          data: auction,
        });
      }

      // 1. Settle Tokens: Transfer guildTokens from winner to seller
      winnerUser.guildTokens -= highestBid.amount;
      await winnerUser.save();

      if (sellerUser) {
        sellerUser.guildTokens += highestBid.amount;
        await sellerUser.save();
      }

      // 2. Transfer Item Ownership
      if (item) {
        item.owner = highestBid.bidder._id;
        item.status = 'Sold';
        await item.save();
      }

      // 3. Close Auction
      auction.status = 'Ended';
      auction.winner = highestBid.bidder._id;
      await auction.save();

      // Auto-Log to Timeline
      await createTimelineLog({
        actor: highestBid.bidder._id,
        guild: req.user.guild,
        eventType: 'ITEM_SOLD',
        title: `Auction Closed: ${item.name} Sold!`,
        description: `Hunter ${highestBid.bidder.name} won auction for ${item.name} at ${highestBid.amount} Guild Tokens.`,
        relatedId: auction._id,
        onModel: 'Auction',
      });

      return res.json({
        success: true,
        message: `Auction successfully closed. Item sold to ${highestBid.bidder.name} for ${highestBid.amount} Guild Tokens.`,
        data: auction,
      });
    } else {
      // No bids placed: Revert Item status to 'Approved'
      if (item) {
        item.status = 'Approved';
        await item.save();
      }

      auction.status = 'Ended';
      await auction.save();

      return res.json({
        success: true,
        message: 'Auction closed with no bids placed. Item status reverted to Approved.',
        data: auction,
      });
    }
  } catch (error) {
    console.error('End Auction Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to close auction.' });
  }
};

/**
 * @desc    Cancel an Active Auction
 * @route   POST /api/auctions/:id/cancel
 * @access  Private (Guild Leader & Vice Leader)
 */
export const cancelAuction = async (req, res) => {
  try {
    const auction = await Auction.findOne({ _id: req.params.id, guild: req.user.guild });
    if (!auction) {
      return res.status(404).json({ success: false, message: 'Auction not found.' });
    }

    if (auction.status !== 'Active') {
      return res.status(400).json({ success: false, message: `Auction is already '${auction.status}'.` });
    }

    // Revert Item status to Approved
    const item = await Item.findById(auction.item);
    if (item) {
      item.status = 'Approved';
      await item.save();
    }

    auction.status = 'Cancelled';
    await auction.save();

    return res.json({
      success: true,
      message: 'Auction cancelled successfully. Item status reverted to Approved.',
      data: auction,
    });
  } catch (error) {
    console.error('Cancel Auction Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to cancel auction.' });
  }
};
