const express = require('express');
const { register, login, logout, getMe, updateProfile, changePassword, updateAvatar, deleteAccount } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/logout', logout);
router.get('/me', protect, getMe);

// Routes cho profile
router.post('/update-profile', protect, updateProfile);
router.post('/change-password', protect, changePassword);
router.post('/update-avatar', protect, updateAvatar);
router.post('/delete-account', protect, deleteAccount);

// Endpoint API để kiểm tra trạng thái đăng nhập
router.get('/check-login', (req, res) => {
  const isLoggedIn = req.user ? true : false;
  res.json({ isLoggedIn });
});

module.exports = router; 