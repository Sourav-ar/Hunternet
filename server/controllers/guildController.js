import mongoose from 'mongoose';
import Guild from '../models/Guild.js';
import GuildApplication from '../models/GuildApplication.js';
import User, { GUILD_ROLES } from '../models/User.js';
import Item from '../models/Item.js';
import Auction from '../models/Auction.js';
import Bid from '../models/Bid.js';
import Message from '../models/Message.js';
import Timeline from '../models/Timeline.js';

const guildView = (query) => query.populate('guildLeader', 'name email role hunterRank profileImage');
const validId = (id) => mongoose.isValidObjectId(id);

export const getGuilds = async (req, res) => {
  try {
    const query = req.query.q?.trim();
    const filter = query ? { name: { $regex: query, $options: 'i' } } : {};
    const guilds = await guildView(Guild.find(filter).sort({ name: 1 }));
    return res.json({ success: true, count: guilds.length, data: guilds });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to fetch guilds.' });
  }
};

export const searchGuilds = getGuilds;

export const getMyGuild = async (req, res) => {
  try {
    if (!req.user?.guild) {
      return res.json({ success: true, data: null });
    }
    const guild = await guildView(Guild.findById(req.user.guild));
    return res.json({ success: true, data: guild || null });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to fetch your guild.' });
  }
};

export const getGuildById = async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid guild id.' });
  try {
    const guild = await guildView(Guild.findById(req.params.id));
    if (!guild) return res.status(404).json({ success: false, message: 'Guild not found.' });
    return res.json({ success: true, data: guild });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to fetch guild.' });
  }
};

export const createGuild = async (req, res) => {
  const { name, description, treasuryValue } = req.body;
  if (!name?.trim()) return res.status(400).json({ success: false, message: 'A guild name is required.' });
  if (treasuryValue !== undefined && (!Number.isFinite(Number(treasuryValue)) || Number(treasuryValue) < 0)) return res.status(400).json({ success: false, message: 'Treasury value must be a non-negative number.' });
  try {
    const guild = await Guild.create({ name: name.trim(), description, treasuryValue: treasuryValue ?? 0, guildLeader: req.user._id, memberCount: 1 });
    req.user.guild = guild._id;
    req.user.role = 'Guild Leader';
    await req.user.save();
    return res.status(201).json({ success: true, message: 'Guild created. You are now its Guild Leader.', data: await guildView(Guild.findById(guild._id)) });
  } catch (error) {
    const message = error.code === 11000 ? 'A guild with that name already exists.' : error.message;
    return res.status(400).json({ success: false, message });
  }
};

export const applyToGuild = async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid guild id.' });
  try {
    const guild = await Guild.findById(req.params.id);
    if (!guild) return res.status(404).json({ success: false, message: 'Guild not found.' });
    const pending = await GuildApplication.findOne({ applicant: req.user._id, status: 'Pending' });
    if (pending) return res.status(409).json({ success: false, message: 'You already have a pending guild application.' });
    const application = await GuildApplication.findOneAndUpdate(
      { guild: guild._id, applicant: req.user._id },
      { guild: guild._id, applicant: req.user._id, status: 'Pending', reviewedBy: undefined, reviewedAt: undefined },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    return res.status(201).json({ success: true, message: 'Guild application submitted.', data: application });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to submit application.' });
  }
};

export const listApplications = async (req, res) => {
  const applications = await GuildApplication.find({ guild: req.user.guild, status: 'Pending' })
    .populate('applicant', 'name email hunterRank profileImage')
    .sort({ createdAt: 1 });
  return res.json({ success: true, count: applications.length, data: applications });
};

const ROLE_HIERARCHY = {
  'Guild Leader': 4,
  'Vice Leader': 3,
  'Analyzer': 2,
  'Team Leader': 2,
  'Hunter': 1,
};

const reviewApplication = async (req, res, approved) => {
  if (!validId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid application id.' });
  const application = await GuildApplication.findOne({ _id: req.params.id, guild: req.user.guild, status: 'Pending' });
  if (!application) return res.status(404).json({ success: false, message: 'Pending application not found in your guild.' });
  const applicant = await User.findById(application.applicant);
  if (!applicant || applicant.guild) return res.status(409).json({ success: false, message: 'Applicant is no longer eligible to join this guild.' });

  if (approved) {
    const guild = await Guild.findById(req.user.guild);
    if (guild && guild.memberCount >= (guild.maxMembers || 10)) {
      return res.status(400).json({
        success: false,
        message: `Cannot approve application. Guild has reached maximum capacity of ${guild.maxMembers || 10} members.`,
      });
    }
  }

  application.status = approved ? 'Approved' : 'Rejected'; application.reviewedBy = req.user._id; application.reviewedAt = new Date();
  await application.save();
  if (approved) {
    applicant.guild = req.user.guild; applicant.role = 'Hunter'; await applicant.save();
    await Guild.findByIdAndUpdate(req.user.guild, { $inc: { memberCount: 1 } });
    await GuildApplication.updateMany({ applicant: applicant._id, status: 'Pending', _id: { $ne: application._id } }, { $set: { status: 'Rejected', reviewedBy: req.user._id, reviewedAt: new Date() } });
  }
  return res.json({ success: true, message: approved ? 'Application approved; member added as Hunter.' : 'Application rejected.', data: application });
};

export const approveApplication = (req, res) => reviewApplication(req, res, true);
export const rejectApplication = (req, res) => reviewApplication(req, res, false);

export const kickMember = async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid member id.' });
  const member = await User.findOne({ _id: req.params.id, guild: req.user.guild });
  if (!member) return res.status(404).json({ success: false, message: 'Guild member not found.' });
  if (member._id.equals(req.user._id)) return res.status(400).json({ success: false, message: 'You cannot kick yourself.' });

  const actorLevel = ROLE_HIERARCHY[req.user.role] || 0;
  const targetLevel = ROLE_HIERARCHY[member.role] || 0;

  if (actorLevel <= targetLevel) {
    return res.status(403).json({
      success: false,
      message: `Access denied. You can only kick members of lower hierarchy rank than '${req.user.role}'.`,
    });
  }

  const guildId = req.user.guild;
  member.guild = null;
  member.role = 'Hunter';
  await member.save();

  await Guild.findByIdAndUpdate(guildId, { $inc: { memberCount: -1 } });

  await createTimelineLog({
    actor: req.user._id,
    guild: guildId,
    eventType: 'ANNOUNCEMENT',
    title: `Member Kicked: ${member.name}`,
    description: `${req.user.role} ${req.user.name} kicked ${member.name} from the guild.`,
    relatedId: member._id,
    onModel: 'User',
  });

  return res.json({ success: true, message: `Member ${member.name} was kicked from the guild.` });
};

export const updateMemberRole = async (req, res) => {
  const { role } = req.body;
  const assignable = ['Hunter', 'Vice Leader', 'Analyzer', 'Team Leader'];
  if (!validId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid member id.' });
  if (!assignable.includes(role) || !GUILD_ROLES.includes(role)) return res.status(400).json({ success: false, message: `Role must be one of: ${assignable.join(', ')}.` });
  const member = await User.findOne({ _id: req.params.id, guild: req.user.guild });
  if (!member) return res.status(404).json({ success: false, message: 'Guild member not found.' });
  if (member._id.equals(req.user._id)) return res.status(400).json({ success: false, message: 'Guild Leaders cannot change their own role.' });
  member.role = role; await member.save();
  return res.json({ success: true, message: 'Member role updated.', data: member });
};

export const getGuildMembers = async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid guild id.' });
  if (!req.user.guild.equals(req.params.id)) {
    return res.status(403).json({ success: false, message: 'You can only view members of your own guild.' });
  }
  try {
    const members = await User.find({ guild: req.user.guild }).select('-password').sort({ role: 1, name: 1 });
    return res.json({ success: true, count: members.length, data: members });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to fetch guild members.' });
  }
};

export const leaveGuild = async (req, res) => {
  try {
    const guildId = req.user.guild;
    const guild = await Guild.findById(guildId);
    if (!guild) return res.status(404).json({ success: false, message: 'Guild not found.' });

    if (req.user.role === 'Guild Leader') {
      const memberCount = await User.countDocuments({ guild: guildId });
      if (memberCount > 1) {
        return res.status(400).json({
          success: false,
          message: 'Guild Leaders cannot leave while other members remain. Transfer leadership or delete the guild.',
        });
      }
      // Single member guild deletion
      await Promise.all([
        Item.deleteMany({ guild: guildId }), Auction.deleteMany({ guild: guildId }), Bid.deleteMany({ guild: guildId }),
        Message.deleteMany({ guild: guildId }), Timeline.deleteMany({ guild: guildId }), GuildApplication.deleteMany({ guild: guildId }),
      ]);
      await Guild.findByIdAndDelete(guildId);
    } else {
      await Guild.findByIdAndUpdate(guildId, { $inc: { memberCount: -1 } });
    }

    req.user.guild = null;
    req.user.role = 'Hunter';
    await req.user.save();

    return res.json({ success: true, message: 'Successfully left the guild. You are now a guildless Hunter.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to leave guild.' });
  }
};

export const updateGuild = async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid guild id.' });
  if (!req.user.guild.equals(req.params.id)) return res.status(403).json({ success: false, message: 'You can only update your own guild.' });
  const { name, description, guildLevel, treasuryValue } = req.body;
  if (treasuryValue !== undefined && (!Number.isFinite(Number(treasuryValue)) || Number(treasuryValue) < 0)) return res.status(400).json({ success: false, message: 'Treasury value must be non-negative.' });
  try {
    const guild = await Guild.findByIdAndUpdate(req.user.guild, { ...(name && { name: name.trim() }), ...(description !== undefined && { description }), ...(guildLevel && { guildLevel }), ...(treasuryValue !== undefined && { treasuryValue }) }, { new: true, runValidators: true });
    return res.json({ success: true, message: 'Guild updated.', data: await guildView(Guild.findById(guild._id)) });
  } catch (error) {
    const message = error.code === 11000 ? 'A guild with that name already exists.' : error.message;
    return res.status(400).json({ success: false, message });
  }
};

export const deleteGuild = async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid guild id.' });
  if (!req.user.guild.equals(req.params.id)) return res.status(403).json({ success: false, message: 'You can only delete your own guild.' });
  try {
    const guildId = req.user.guild;
    await Promise.all([
      Item.deleteMany({ guild: guildId }), Auction.deleteMany({ guild: guildId }), Bid.deleteMany({ guild: guildId }),
      Message.deleteMany({ guild: guildId }), Timeline.deleteMany({ guild: guildId }), GuildApplication.deleteMany({ guild: guildId }),
    ]);
    await User.updateMany({ guild: guildId }, { $set: { guild: null, role: 'Hunter' } });
    await Guild.findByIdAndDelete(guildId);
    return res.json({ success: true, message: 'Guild and its tenant data were deleted; former members are now guildless Hunters.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to delete guild.' });
  }
};
