const express = require('express');
const router = express.Router();
const serverController = require('../controllers/serverController');
const authMiddleware = require('../middleware/auth');

// Apply auth middleware to all routes below
router.use(authMiddleware);

router.post('/create', serverController.createServer);
router.delete('/:id', serverController.deleteServer);
router.get('/:id/files', serverController.readFiles);
router.post('/:id/files/edit', serverController.editFile);
router.post('/:id/start', serverController.startServer);
router.post('/:id/stop', serverController.stopServer);
router.get('/:id/console', serverController.getConsole);

module.exports = router;
