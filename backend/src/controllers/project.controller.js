const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');

exports.listProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({ 'members.user': req.user._id })
      .populate('createdBy', 'name email')
      .populate('members.user', 'name email')
      .sort({ updatedAt: -1 });

    // attach counts
    const withCounts = await Promise.all(
      projects.map(async (p) => {
        const [total, done] = await Promise.all([
          Task.countDocuments({ project: p._id }),
          Task.countDocuments({ project: p._id, status: 'done' }),
        ]);
        const obj = p.toObject();
        obj.taskCount = total;
        obj.completedCount = done;
        obj.myRole = p.getMember(req.user._id)?.role || 'member';
        return obj;
      })
    );

    res.json({ projects: withCounts });
  } catch (err) {
    next(err);
  }
};

exports.createProject = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const project = await Project.create({
      name,
      description,
      createdBy: req.user._id,
      members: [{ user: req.user._id, role: 'admin' }],
    });

    const populated = await Project.findById(project._id)
      .populate('createdBy', 'name email')
      .populate('members.user', 'name email');

    res.status(201).json({ project: populated });
  } catch (err) {
    next(err);
  }
};

exports.getProject = async (req, res) => {
  const obj = req.project.toObject();
  obj.myRole = req.projectRole;
  res.json({ project: obj });
};

exports.updateProject = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (name !== undefined) req.project.name = name;
    if (description !== undefined) req.project.description = description;
    await req.project.save();
    const populated = await Project.findById(req.project._id)
      .populate('createdBy', 'name email')
      .populate('members.user', 'name email');
    res.json({ project: populated });
  } catch (err) {
    next(err);
  }
};

exports.deleteProject = async (req, res, next) => {
  try {
    await Task.deleteMany({ project: req.project._id });
    await Project.findByIdAndDelete(req.project._id);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    next(err);
  }
};

exports.addMember = async (req, res, next) => {
  try {
    const { email, role = 'member' } = req.body;
    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (req.project.isMember(user._id)) {
      return res.status(409).json({ message: 'User is already a member' });
    }

    req.project.members.push({ user: user._id, role: role === 'admin' ? 'admin' : 'member' });
    await req.project.save();

    const populated = await Project.findById(req.project._id)
      .populate('createdBy', 'name email')
      .populate('members.user', 'name email');

    res.status(201).json({ project: populated });
  } catch (err) {
    next(err);
  }
};

exports.removeMember = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (String(userId) === String(req.project.createdBy._id || req.project.createdBy)) {
      return res.status(400).json({ message: 'Cannot remove the project creator' });
    }
    const before = req.project.members.length;
    req.project.members = req.project.members.filter(
      (m) => String(m.user?._id || m.user) !== String(userId)
    );
    if (req.project.members.length === before) {
      return res.status(404).json({ message: 'Member not found' });
    }
    await req.project.save();

    // unassign any tasks from removed user
    await Task.updateMany(
      { project: req.project._id, assignedTo: userId },
      { $set: { assignedTo: null } }
    );

    res.json({ message: 'Member removed' });
  } catch (err) {
    next(err);
  }
};

exports.updateMemberRole = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    if (!['admin', 'member'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    const member = req.project.members.find(
      (m) => String(m.user?._id || m.user) === String(userId)
    );
    if (!member) return res.status(404).json({ message: 'Member not found' });
    member.role = role;
    await req.project.save();
    res.json({ message: 'Role updated' });
  } catch (err) {
    next(err);
  }
};
