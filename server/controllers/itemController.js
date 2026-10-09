import mongoose from 'mongoose';
import Item, { ITEM_CATEGORIES, ITEM_GRADES, ITEM_STATUSES } from '../models/Item.js';
import { createTimelineLog } from '../utils/timelineLogger.js';

/**
 * @desc    Upload / Register a new Item to Guild Treasury Inventory
 * @route   POST /api/items
 * @access  Private (Authenticated Hunters)
 */
export const createItem = async (req, res) => {
  try {
    const { name, category, grade, description, estimatedValue, imageUrl } = req.body;

    if (!name || !category || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, category, description.',
      });
    }

    if (!ITEM_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category '${category}'. Allowed categories: ${ITEM_CATEGORIES.join(', ')}`,
      });
    }

    if (grade && !ITEM_GRADES.includes(grade)) {
      return res.status(400).json({
        success: false,
        message: `Invalid grade '${grade}'. Allowed grades: ${ITEM_GRADES.join(', ')}`,
      });
    }

    const item = await Item.create({
      name,
      category,
      grade: grade || 'E',
      description,
      owner: req.user._id,
      creator: req.user._id,
      guild: req.user.guild,
      status: 'Pending',
      estimatedValue: estimatedValue || 0,
      imageUrl,
    });

    const populatedItem = await Item.findById(item._id)
      .populate('owner', 'name email role hunterRank')
      .populate('creator', 'name email role hunterRank');

    // Auto-Log to Timeline
    await createTimelineLog({
      actor: req.user._id,
      guild: req.user.guild,
      eventType: 'ANNOUNCEMENT',
      title: `Item Uploaded: ${item.name}`,
      description: `Hunter ${req.user.name} registered a Grade-${item.grade} ${item.category} for appraisal.`,
      relatedId: item._id,
      onModel: 'Item',
    });

    return res.status(201).json({
      success: true,
      message: 'Item uploaded to inventory successfully. Status: Pending Appraisal.',
      data: populatedItem,
    });
  } catch (error) {
    console.error('Create Item Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to upload item.' });
  }
};

/**
 * @desc    Fetch all Items in Inventory with optional filters
 * @route   GET /api/items
 * @access  Private (Guild Members)
 */
export const getItems = async (req, res) => {
  try {
    const { status, category, grade, owner } = req.query;
    const filter = { guild: req.user.guild };

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (grade) filter.grade = grade;
    if (owner) filter.owner = owner;

    const items = await Item.find(filter)
      .populate('owner', 'name email role hunterRank profileImage')
      .populate('creator', 'name email role hunterRank profileImage')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error) {
    console.error('Get Items Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to fetch items.' });
  }
};

/**
 * @desc    Fetch single Item details by ID
 * @route   GET /api/items/:id
 * @access  Private (Guild Members)
 */
export const getItemById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid item id.' });
    }

    const item = await Item.findOne({ _id: req.params.id, guild: req.user.guild })
      .populate('owner', 'name email role hunterRank profileImage')
      .populate('creator', 'name email role hunterRank profileImage');

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found.' });
    }

    return res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error('Get Item By ID Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to fetch item.' });
  }
};

/**
 * @desc    Update Item Status (Analyzer Review / Leader Approval)
 * @route   PATCH /api/items/:id/status
 * @access  Private (Analyzer, Vice Leader, Guild Leader)
 */
export const updateItemStatus = async (req, res) => {
  try {
    const { status, estimatedValue } = req.body;

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid item id.' });
    }

    if (!status || !ITEM_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid or missing status. Allowed statuses: ${ITEM_STATUSES.join(', ')}`,
      });
    }

    if (!['Analyzed', 'Approved'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Items may only be manually changed to Analyzed or Approved.' });
    }

    const item = await Item.findOne({ _id: req.params.id, guild: req.user.guild });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found.' });
    }

    if (['Auctioned', 'Sold'].includes(item.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot modify item status when item is currently '${item.status}'.`,
      });
    }

    // Role Permission Checks
    const userRole = req.user.role;
    if (status === 'Analyzed' && !['Analyzer', 'Vice Leader', 'Guild Leader'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Only Analyzers or Officers can perform item appraisals.',
      });
    }

    if (status === 'Approved' && !['Guild Leader', 'Vice Leader'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Only Guild Leader or Vice Leader can approve items for auction.',
      });
    }

    item.status = status;
    if (estimatedValue !== undefined && estimatedValue >= 0) {
      item.estimatedValue = estimatedValue;
    }

    await item.save();

    const updatedItem = await Item.findById(item._id)
      .populate('owner', 'name email role hunterRank')
      .populate('creator', 'name email role hunterRank');

    // Auto-Log to Timeline
    await createTimelineLog({
      actor: req.user._id,
      guild: req.user.guild,
      eventType: 'ANNOUNCEMENT',
      title: `Item Status Updated: ${item.name} -> [${status}]`,
      description: `${userRole} ${req.user.name} marked item '${item.name}' as ${status}.${estimatedValue ? ` Estimated Value: ${estimatedValue} GT.` : ''}`,
      relatedId: item._id,
      onModel: 'Item',
    });

    return res.json({
      success: true,
      message: `Item status successfully updated to '${status}'.`,
      data: updatedItem,
    });
  } catch (error) {
    console.error('Update Item Status Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to update item status.' });
  }
};

/**
 * @desc    Delete Item from Inventory
 * @route   DELETE /api/items/:id
 * @access  Private (Owner or Guild Leader)
 */
export const deleteItem = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid item id.' });
    }

    const item = await Item.findOne({ _id: req.params.id, guild: req.user.guild });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found.' });
    }

    if (item.owner.toString() !== req.user._id.toString() && req.user.role !== 'Guild Leader') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this item.' });
    }

    await item.deleteOne();
    return res.json({ success: true, message: 'Item deleted successfully.' });
  } catch (error) {
    console.error('Delete Item Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to delete item.' });
  }
};
