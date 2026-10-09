import express from 'express';
import {
  getAuctions,
  getAuctionById,
  createAuction,
  endAuction,
  cancelAuction,
} from '../controllers/auctionController.js';
import { placeBid, getBidsForAuction } from '../controllers/bidController.js';
import { protect, requireGuild, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, requireGuild, getAuctions)
  .post(protect, requireGuild, createAuction);

router.route('/:id')
  .get(protect, requireGuild, getAuctionById);

router.route('/:id/end')
  .post(protect, requireGuild, endAuction);

router.route('/:id/cancel')
  .post(protect, requireGuild, authorize('Guild Leader', 'Vice Leader'), cancelAuction);

// RESTful Bidding endpoints under /api/auctions/:auctionId/bid
router.route('/:auctionId/bid')
  .get(protect, requireGuild, getBidsForAuction)
  .post(protect, requireGuild, placeBid);

export default router;
