const express = require('express');
const router = express.Router();
const shotController = require('../controllers/shotController');
const { requireAuth, optionalAuth } = require('../middleware/authMiddleware');

router.post('/log', requireAuth, shotController.logShot);
router.get('/session/:sessionId', optionalAuth, shotController.getShotsBySession);

module.exports = router;
