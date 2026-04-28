const express = require('express');
const router = express.Router();
const { register, login, logout, me } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', authMiddleware, logout);
router.get('/me', authMiddleware, me);

module.exports = router;