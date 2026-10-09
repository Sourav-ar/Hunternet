import express from 'express';
import {
  getItems,
  getItemById,
  createItem,
  updateItemStatus,
  deleteItem,
} from '../controllers/itemController.js';
import { protect, requireGuild, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, requireGuild, getItems)
  .post(protect, requireGuild, createItem);

router.route('/:id')
  .get(protect, requireGuild, getItemById)
  .delete(protect, requireGuild, deleteItem);

router.route('/:id/status')
  .patch(protect, requireGuild, authorize('Guild Leader', 'Vice Leader', 'Analyzer'), updateItemStatus);

export default router;
