const Task = require('../models/Task');
const Project = require('../models/Project');

exports.listTasks = async (req, res, next) => {
  try {
    const { status, assignedTo, priority } = req.query;
    const filter = { project: req.project._id };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo === 'me' ? req.user._id : assignedTo;

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ tasks });
  } catch (err) {
    next(err);
  }
};

exports.createTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, dueDate, assignedTo } = req.body;

    if (assignedTo && !req.project.isMember(assignedTo)) {
      return res.status(400).json({ message: 'Assignee must be a project member' });
    }

    const task = await Task.create({
      title,
      description,
      status,
      priority,
      dueDate: dueDate || null,
      assignedTo: assignedTo || null,
      project: req.project._id,
      createdBy: req.user._id,
    });

    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    res.status(201).json({ task: populated });
  } catch (err) {
    next(err);
  }
};

const loadTaskWithProject = async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) {
    res.status(404).json({ message: 'Task not found' });
    return null;
  }
  const project = await Project.findById(task.project).populate('members.user', 'name email');
  if (!project) {
    res.status(404).json({ message: 'Project for this task not found' });
    return null;
  }
  if (!project.isMember(req.user._id)) {
    res.status(403).json({ message: 'Access denied' });
    return null;
  }
  return { task, project };
};

exports.getTask = async (req, res, next) => {
  try {
    const ctx = await loadTaskWithProject(req, res);
    if (!ctx) return;
    const populated = await Task.findById(ctx.task._id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('project', 'name');
    res.json({ task: populated });
  } catch (err) {
    next(err);
  }
};

exports.updateTask = async (req, res, next) => {
  try {
    const ctx = await loadTaskWithProject(req, res);
    if (!ctx) return;
    const { task, project } = ctx;

    const isAdmin = project.isAdmin(req.user._id);
    const isAssignee = String(task.assignedTo || '') === String(req.user._id);

    const updates = req.body;
    const editableByAssignee = ['status'];
    const editableByAdmin = [
      'title',
      'description',
      'status',
      'priority',
      'dueDate',
      'assignedTo',
    ];

    const allowed = isAdmin ? editableByAdmin : isAssignee ? editableByAssignee : [];
    if (allowed.length === 0) {
      return res.status(403).json({ message: 'Not allowed to edit this task' });
    }

    for (const key of Object.keys(updates)) {
      if (!allowed.includes(key)) continue;
      if (key === 'assignedTo') {
        const val = updates[key];
        if (val && !project.isMember(val)) {
          return res.status(400).json({ message: 'Assignee must be a project member' });
        }
        task.assignedTo = val || null;
      } else if (key === 'dueDate') {
        task.dueDate = updates[key] || null;
      } else {
        task[key] = updates[key];
      }
    }

    await task.save();
    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');
    res.json({ task: populated });
  } catch (err) {
    next(err);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const ctx = await loadTaskWithProject(req, res);
    if (!ctx) return;
    const { task, project } = ctx;

    const isAdmin = project.isAdmin(req.user._id);
    const isAssignee = String(task.assignedTo || '') === String(req.user._id);
    if (!isAdmin && !isAssignee) {
      return res.status(403).json({ message: 'Not allowed to change status' });
    }

    const { status } = req.body;
    if (!['todo', 'in-progress', 'done'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    task.status = status;
    await task.save();
    res.json({ task });
  } catch (err) {
    next(err);
  }
};

exports.deleteTask = async (req, res, next) => {
  try {
    const ctx = await loadTaskWithProject(req, res);
    if (!ctx) return;
    const { task, project } = ctx;

    if (!project.isAdmin(req.user._id)) {
      return res.status(403).json({ message: 'Only admins can delete tasks' });
    }
    await Task.findByIdAndDelete(task._id);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
};

exports.dashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Projects the user belongs to
    const projects = await Project.find({ 'members.user': userId }).select('_id name');
    const projectIds = projects.map((p) => p._id);

    const now = new Date();

    const [
      totalAssigned,
      todo,
      inProgress,
      done,
      overdue,
      recentAssigned,
      allProjectTasks,
    ] = await Promise.all([
      Task.countDocuments({ assignedTo: userId }),
      Task.countDocuments({ assignedTo: userId, status: 'todo' }),
      Task.countDocuments({ assignedTo: userId, status: 'in-progress' }),
      Task.countDocuments({ assignedTo: userId, status: 'done' }),
      Task.countDocuments({
        assignedTo: userId,
        status: { $ne: 'done' },
        dueDate: { $ne: null, $lt: now },
      }),
      Task.find({ assignedTo: userId })
        .populate('project', 'name')
        .sort({ updatedAt: -1 })
        .limit(5),
      Task.countDocuments({ project: { $in: projectIds } }),
    ]);

    res.json({
      stats: {
        totalAssigned,
        todo,
        inProgress,
        done,
        overdue,
        projectsCount: projects.length,
        totalProjectTasks: allProjectTasks,
      },
      recentTasks: recentAssigned,
      projects,
    });
  } catch (err) {
    next(err);
  }
};
