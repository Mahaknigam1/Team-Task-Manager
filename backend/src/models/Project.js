const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['admin', 'member'], default: 'member' },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: { type: [memberSchema], default: [] },
  },
  { timestamps: true }
);

projectSchema.index({ 'members.user': 1 });

// helpers
projectSchema.methods.getMember = function (userId) {
  const uid = String(userId);
  return this.members.find((m) => String(m.user?._id || m.user) === uid);
};

projectSchema.methods.isAdmin = function (userId) {
  const m = this.getMember(userId);
  return !!m && m.role === 'admin';
};

projectSchema.methods.isMember = function (userId) {
  return !!this.getMember(userId);
};

module.exports = mongoose.model('Project', projectSchema);
