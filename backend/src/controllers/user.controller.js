const User = require('../models/User');

exports.search = async (req, res, next) => {
  try {
    const { search = '' } = req.query;
    const q = String(search).trim();
    const filter = q
      ? {
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } },
          ],
        }
      : {};
    const users = await User.find(filter).select('name email').limit(20);
    res.json({ users });
  } catch (err) {
    next(err);
  }
};
