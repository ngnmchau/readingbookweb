const express = require('express');
const { register, login, logout, getMe, updateProfile, changePassword, updateAvatar, deleteAccount } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const User = require('../models/User');

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

// Chỉ sử dụng trong môi trường phát triển
router.get('/make-admin/:email', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ success: false, message: 'Không được phép trong môi trường production' });
  }
  
  try {
    const user = await User.findOneAndUpdate(
      { email: req.params.email },
      { role: 'admin' },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }
    
    res.json({ 
      success: true, 
      message: `Người dùng ${user.email} đã được nâng cấp thành admin`,
      user
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router; 