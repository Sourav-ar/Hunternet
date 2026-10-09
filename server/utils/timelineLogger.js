import Timeline from '../models/Timeline.js';

/**
 * Utility helper to generate system and user event logs in the Timeline audit log.
 */
export const createTimelineLog = async ({
  actor,
  guild,
  eventType,
  title,
  description,
  relatedId,
  onModel,
}) => {
  try {
    if (!actor || !guild || !eventType || !title) {
      console.warn('Timeline Log Warning: Missing required audit parameters.');
      return null;
    }

    const log = await Timeline.create({
      actor,
      guild,
      eventType,
      title,
      description,
      relatedId,
      onModel,
    });

    return log;
  } catch (error) {
    console.error('Failed to write Timeline log:', error.message);
    // Non-blocking catch to ensure core transactions complete even if logging fails
    return null;
  }
};
