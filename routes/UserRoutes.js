const express = require('express');
const { signup, login, getProfile } = require('../controllers/UserController');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/profile', auth, getProfile); // Apply auth middleware to protect this route

module.exports = router;
