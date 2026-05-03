const router = require('express').Router();
const { body } = require('express-validator');

const { protect } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const ctrl = require('../controllers/task.controller');

router.use(protect);

router.get('/me/dashboard', ctrl.dashboard);

router.get('/:id', ctrl.getTask);

router.put(
  '/:id',
  [
    body('title').optional().trim().isLength({ min: 2, max: 200 }),
    body('description').optional().isLength({ max: 2000 }),
    body('status').optional().isIn(['todo', 'in-progress', 'done']),
    body('priority').optional().isIn(['low', 'medium', 'high']),
    body('dueDate').optional({ nullable: true }).isISO8601(),
    body('assignedTo').optional({ nullable: true }).isMongoId(),
  ],
  validate,
  ctrl.updateTask
);

router.patch(
  '/:id/status',
  [body('status').isIn(['todo', 'in-progress', 'done'])],
  validate,
  ctrl.updateStatus
);

router.delete('/:id', ctrl.deleteTask);

module.exports = router;
