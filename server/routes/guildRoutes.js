import express from 'express';
import {
  getGuilds, searchGuilds, getGuildById, createGuild, updateGuild, deleteGuild,
  applyToGuild, listApplications, approveApplication, rejectApplication, updateMemberRole,
  leaveGuild, getGuildMembers, getMyGuild, kickMember,
} from '../controllers/guildController.js';
import { protect, requireGuild, requireNoGuild, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getGuilds);
router.get('/search', searchGuilds);
router.get('/me', protect, getMyGuild);
router.post('/', protect, requireNoGuild, createGuild);
router.post('/leave', protect, requireGuild, leaveGuild);
router.get('/applications', protect, requireGuild, authorize('Guild Leader'), listApplications);
router.patch('/applications/:id/approve', protect, requireGuild, authorize('Guild Leader'), approveApplication);
router.patch('/applications/:id/reject', protect, requireGuild, authorize('Guild Leader'), rejectApplication);
router.patch('/members/:id/role', protect, requireGuild, authorize('Guild Leader'), updateMemberRole);
router.delete('/members/:id', protect, requireGuild, kickMember);
router.get('/:id/members', protect, requireGuild, getGuildMembers);
router.post('/:id/apply', protect, requireNoGuild, applyToGuild);
router.get('/:id', getGuildById);
router.put('/:id', protect, requireGuild, authorize('Guild Leader', 'Vice Leader'), updateGuild);
router.delete('/:id', protect, requireGuild, authorize('Guild Leader'), deleteGuild);

export default router;
