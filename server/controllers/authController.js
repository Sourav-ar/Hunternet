import User, { HUNTER_RANKS } from '../models/User.js';
import generateToken from '../utils/generateToken.js';

/**
 * @desc    Register a new Hunter profile
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, hunterRank, profileImage } = req.body;

    // 1. Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, and password.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    // 2. Check if user already exists
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'A Hunter profile with this email address already exists.',
      });
    }

    // Roles are never accepted from clients. New accounts are always guildless Hunters.
    // Validate Hunter Rank if provided.
    let assignedRank = 'E';
    if (hunterRank) {
      if (!HUNTER_RANKS.includes(hunterRank)) {
        return res.status(400).json({
          success: false,
          message: `Invalid rank '${hunterRank}'. Allowed ranks: ${HUNTER_RANKS.join(', ')}`,
        });
      }
      assignedRank = hunterRank;
    }

    // Create User (password is automatically hashed by UserSchema pre('save') hook)
    const user = await User.create({
      name,
      email,
      password,
      role: 'Hunter',
      hunterRank: assignedRank,
      guildTokens: 1000, // Initial economy starting balance
      profileImage,
    });

    if (user) {
      const token = generateToken(user._id);

      return res.status(201).json({
        success: true,
        message: 'Hunter profile created successfully.',
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          hunterRank: user.hunterRank,
          guildTokens: user.guildTokens,
          contribution: user.contribution,
          profileImage: user.profileImage,
          joinedAt: user.joinedAt,
          guild: user.guild,
          token,
        },
      });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid user registration data.' });
    }
  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error occurred during registration.',
    });
  }
};

/**
 * @desc    Authenticate Hunter credentials & issue JWT token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Basic validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    // 2. Locate user by email and select password field
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
      });
    }

    // 3. Verify password match
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
      });
    }

    // 4. Generate token
    const token = generateToken(user._id);

    return res.json({
      success: true,
      message: 'Login successful.',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        hunterRank: user.hunterRank,
        guildTokens: user.guildTokens,
        contribution: user.contribution,
        profileImage: user.profileImage,
        joinedAt: user.joinedAt,
        guild: user.guild,
        token,
      },
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error occurred during login.',
    });
  }
};

/**
 * @desc    Get currently logged-in Hunter profile
 * @route   GET /api/auth/me
 * @access  Private (Bearer JWT Token Required)
 */
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Hunter profile not found.' });
    }

    return res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('GetMe Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching profile.',
    });
  }
};
