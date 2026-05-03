const router = require('express').Router();
const { body } = require('express-validator');

const { protect } = require('../middleware/auth.middleware');
const { loadProject, requireProjectAdmin } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validate.middleware');
const ctrl = require('../controllers/project.controller');
const taskCtrl = require('../controllers/task.controller');

router.use(protect);

router.get('/', ctrl.listProjects);

router.post(
  '/',
  [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name 2-100 chars'),
    body('description').optional().isLength({ max: 1000 }),
  ],
  validate,
  ctrl.createProject
);

router.get('/:id', loadProject, ctrl.getProject);

router.put(
  '/:id',
  loadProject,
  requireProjectAdmin,
  [
    body('name').optional().trim().isLength({ min: 2, max: 100 }),
    body('description').optional().isLength({ max: 1000 }),
  ],
  validate,
  ctrl.updateProject
);

router.delete('/:id', loadProject, requireProjectAdmin, ctrl.deleteProject);

// Members
router.post(
  '/:id/members',
  loadProject,
  requireProjectAdmin,
  [
    body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
    body('role').optional().isIn(['admin', 'member']),
  ],
  validate,
  ctrl.addMember
);
router.delete('/:id/members/:userId', loadProject, requireProjectAdmin, ctrl.removeMember);
router.put(
  '/:id/members/:userId/role',
  loadProject,
  requireProjectAdmin,
  [body('role').isIn(['admin', 'member'])],
  validate,
  ctrl.updateMemberRole
);

// Tasks nested under project
router.get('/:projectId/tasks', loadProject, taskCtrl.listTasks);
router.post(
  '/:projectId/tasks',
  loadProject,
  requireProjectAdmin,
  [
    body('title').trim().isLength({ min: 2, max: 200 }).withMessage('Title 2-200 chars'),
    body('description').optional().isLength({ max: 2000 }),
    body('status').optional().isIn(['todo', 'in-progress', 'done']),
    body('priority').optional().isIn(['low', 'medium', 'high']),
    body('dueDate').optional({ nullable: true }).isISO8601().withMessage('Invalid date'),
    body('assignedTo').optional({ nullable: true }).isMongoId(),
  ],
  validate,
  taskCtrl.createTask
);

module.exports = router;
