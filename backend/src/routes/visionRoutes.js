const express = require('express');
const router = express.Router();
const visionController = require('../controllers/visionController');
const upload = require('../middleware/uploadMiddleware');

router.get('/health', visionController.getServiceHealth);
router.post('/process-frame', visionController.processFrame);
router.post('/upload-video', upload.single('video'), visionController.uploadAndAnalyzeVideo);
router.post('/compute-kinematics', visionController.computeKinematics);

module.exports = router;

