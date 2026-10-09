import express from 'express';
import { registerUser, loginUser, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public Authentication Endpoints
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected User Profile Endpoint
router.get('/me', protect, getMe);

export default router;
