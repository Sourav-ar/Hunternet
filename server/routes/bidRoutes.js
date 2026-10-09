import express from 'express';
import { getBidsForAuction, placeBid } from '../controllers/bidController.js';
import { protect, requireGuild } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, requireGuild, placeBid);

router.route('/auction/:auctionId')
  .get(protect, requireGuild, getBidsForAuction);

export default router;
