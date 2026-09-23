const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const { requireAuth, optionalAuth } = require('../middleware/authMiddleware');

router.get('/', optionalAuth, sessionController.getSessions);
router.get('/:id', optionalAuth, sessionController.getSessionById);
router.post('/', requireAuth, sessionController.createSession);
router.delete('/:id', requireAuth, sessionController.deleteSession);

module.exports = router;
