import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import guildRoutes from './routes/guildRoutes.js';
import itemRoutes from './routes/itemRoutes.js';
import auctionRoutes from './routes/auctionRoutes.js';
import bidRoutes from './routes/bidRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import timelineRoutes from './routes/timelineRoutes.js';

// Middleware Imports
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

// Load environment variables
dotenv.config();

// Initialize Express application
const app = express();

// Connect to MongoDB Database
connectDB();

// Global Request Parsers & Security Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// System Healthcheck Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'HunterNet Express Backend Server is operational.',
    timestamp: new Date().toISOString(),
  });
});

// API Routes Mounting
app.use('/api/auth', authRoutes);
app.use('/api/guilds', guildRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/timeline', timelineRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`⚡ HunterNet Express Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
