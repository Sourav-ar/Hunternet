import express from 'express';
import { getChannelMessages, sendMessage } from '../controllers/messageController.js';
import { protect, requireGuild } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, requireGuild, getChannelMessages)
  .post(protect, requireGuild, sendMessage);

export default router;
