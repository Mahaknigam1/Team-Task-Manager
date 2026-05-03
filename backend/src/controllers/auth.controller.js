const User = require('../models/User');
const { signToken } = require('../utils/jwt');

const buildAuthResponse = (user) => ({
  token: signToken({ id: user._id }),
  user: {
    id: user._id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  },
});

exports.signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const user = await User.create({ name, email, password });
    return res.status(201).json(buildAuthResponse(user));
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ message: 'Invalid email or password' });

    return res.json(buildAuthResponse(user));
  } catch (err) {
    next(err);
  }
};

exports.me = async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      createdAt: req.user.createdAt,
    },
  });
};
