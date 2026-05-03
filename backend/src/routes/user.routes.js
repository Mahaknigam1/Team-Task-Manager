const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/user.controller');

router.use(protect);

router.get('/', ctrl.search);

module.exports = router;
