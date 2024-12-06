import express from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';

const router = express.Router();

// Define routes and link to AppController methods
router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);

// Route for creating users
router.post('/users', UsersController.postNew);

export default router;
