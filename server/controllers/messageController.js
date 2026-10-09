import Message, { MESSAGE_CHANNELS } from '../models/Message.js';

/**
 * @desc    Fetch recent chat messages for a specific Guild Channel
 * @route   GET /api/messages
 * @access  Private (Authenticated Hunters)
 */
export const getChannelMessages = async (req, res) => {
  try {
    const channel = req.query.channel || 'General';

    if (!MESSAGE_CHANNELS.includes(channel)) {
      return res.status(400).json({
        success: false,
        message: `Invalid channel '${channel}'. Allowed channels: ${MESSAGE_CHANNELS.join(', ')}`,
      });
    }

    // Role check for Officer channel
    if (channel === 'Officer' && !['Guild Leader', 'Vice Leader', 'Analyzer'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only Officers (Guild Leader, Vice Leader, Analyzer) can view the Officer channel.',
      });
    }

    const messages = await Message.find({ guild: req.user.guild, channel })
      .populate('sender', 'name email role hunterRank profileImage')
      .sort({ createdAt: 1 })
      .limit(100);

    return res.json({
      success: true,
      channel,
      count: messages.length,
      data: messages,
    });
  } catch (error) {
    console.error('Get Messages Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to fetch channel messages.' });
  }
};

/**
 * @desc    Post a new message to a Guild Chat Channel
 * @route   POST /api/messages
 * @access  Private (Authenticated Hunters)
 */
export const sendMessage = async (req, res) => {
  try {
    const { message, channel } = req.body;
    const targetChannel = channel || 'General';

    if (!message || message.trim() === '') {
      return res.status(400).json({ success: false, message: 'Message content cannot be empty.' });
    }

    if (!MESSAGE_CHANNELS.includes(targetChannel)) {
      return res.status(400).json({
        success: false,
        message: `Invalid channel '${targetChannel}'. Allowed channels: ${MESSAGE_CHANNELS.join(', ')}`,
      });
    }

    // Role check for Officer channel posting
    if (targetChannel === 'Officer' && !['Guild Leader', 'Vice Leader', 'Analyzer'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only Officers can post in the Officer channel.',
      });
    }

    const newMessage = await Message.create({
      sender: req.user._id,
      guild: req.user.guild,
      message: message.trim(),
      channel: targetChannel,
    });

    const populatedMessage = await Message.findById(newMessage._id)
      .populate('sender', 'name email role hunterRank profileImage');

    return res.status(201).json({
      success: true,
      message: 'Message sent successfully.',
      data: populatedMessage,
    });
  } catch (error) {
    console.error('Send Message Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to send message.' });
  }
};
