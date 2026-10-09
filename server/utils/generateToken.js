import jwt from 'jsonwebtoken';

/**
 * Utility to generate a signed JSON Web Token (JWT).
 * @param {string} id - User MongoDB object ID
 * @returns {string} Signed JWT token
 */
const generateToken = (id) => {
  const secret = process.env.JWT_SECRET || 'supersecretjwtkey_change_in_production';
  const expiresIn = process.env.JWT_EXPIRE || '30d';

  return jwt.sign({ id }, secret, { expiresIn });
};

export default generateToken;
