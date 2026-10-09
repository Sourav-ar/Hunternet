import express from 'express';
import { getTimelineEvents, createTimelineEvent } from '../controllers/timelineController.js';
import { protect, requireGuild, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, requireGuild, getTimelineEvents)
  .post(protect, requireGuild, authorize('Guild Leader', 'Vice Leader'), createTimelineEvent);

export default router;
