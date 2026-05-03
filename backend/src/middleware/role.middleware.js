const Project = require('../models/Project');

/**
 * Loads the project from :id or :projectId and attaches to req.project.
 * Ensures current user is at least a member.
 */
const loadProject = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.params.id;
    if (!projectId) return res.status(400).json({ message: 'Project id required' });

    const project = await Project.findById(projectId)
      .populate('members.user', 'name email')
      .populate('createdBy', 'name email');

    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (!project.isMember(req.user._id)) {
      return res.status(403).json({ message: 'Access denied: not a project member' });
    }

    req.project = project;
    req.projectRole = project.getMember(req.user._id)?.role || 'member';
    next();
  } catch (err) {
    next(err);
  }
};

const requireProjectAdmin = (req, res, next) => {
  if (req.projectRole !== 'admin') {
    return res.status(403).json({ message: 'Admin privileges required' });
  }
  next();
};

module.exports = { loadProject, requireProjectAdmin };
