import Timeline from '../models/Timeline.js';

/**
 * @desc    Fetch all Timeline Activity Logs
 * @route   GET /api/timeline
 * @access  Public
 */
export const getTimelineEvents = async (req, res) => {
  try {
    const { eventType, limit } = req.query;
    const filter = { guild: req.user.guild, ...(eventType ? { eventType } : {}) };
    const maxLogs = limit ? parseInt(limit, 10) : 50;

    const logs = await Timeline.find(filter)
      .populate('actor', 'name email role hunterRank profileImage')
      .populate('relatedId')
      .sort({ createdAt: -1 })
      .limit(maxLogs);

    return res.json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    console.error('Get Timeline Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to fetch timeline logs.' });
  }
};

/**
 * @desc    Manually record an Announcement / Timeline Event
 * @route   POST /api/timeline
 * @access  Private (Guild Leader & Vice Leader)
 */
export const createTimelineEvent = async (req, res) => {
  try {
    const { eventType, title, description, relatedId, onModel } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Event title is required.' });
    }

    const event = await Timeline.create({
      actor: req.user._id,
      guild: req.user.guild,
      eventType: eventType || 'ANNOUNCEMENT',
      title,
      description,
      relatedId,
      onModel,
    });

    const populatedEvent = await Timeline.findById(event._id)
      .populate('actor', 'name email role hunterRank profileImage');

    return res.status(201).json({
      success: true,
      message: 'Timeline event recorded successfully.',
      data: populatedEvent,
    });
  } catch (error) {
    console.error('Create Timeline Event Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to record timeline event.' });
  }
};
