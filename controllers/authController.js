const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Tạo và gửi token trong cookie
const sendTokenResponse = (user, statusCode, res, redirect) => {
  // Tạo token
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });

  const options = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  if (redirect) {
    return res
      .status(statusCode)
      .cookie('token', token, options)
      .redirect(redirect);
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token
    });
};

// @desc    Hiển thị form đăng ký
// @route   GET /auth/register
// @access  Public
exports.getRegisterForm = (req, res) => {
  if (res.locals.user) {
    return res.redirect('/');
  }
  
  res.render('register', {
    title: 'Đăng ký tài khoản',
    page: 'auth'
  });
};

// @desc    Đăng ký người dùng
// @route   POST /auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    
    // Tạo username từ email (phần trước @)
    const username = email.split('@')[0];
    
    // Tạo người dùng mới
    await User.create({
      name,
      email,
      password,
      username
    });

    // Chuyển hướng đến trang đăng nhập
    res.redirect('/auth/login?registered=true');
  } catch (err) {
    console.error(err);
    
    // Kiểm tra lỗi trùng lặp (duplicate key error)
    if (err.code === 11000) {
      // Xác định trường nào gây ra lỗi
      const field = Object.keys(err.keyPattern)[0];
      let errorMessage = '';
      
      if (field === 'email') {
        errorMessage = 'Email này đã được đăng ký';
      } else if (field === 'username') {
        errorMessage = 'Tên đăng nhập này đã tồn tại';
      } else {
        errorMessage = 'Thông tin đăng ký đã tồn tại';
      }
      
      return res.render('register', {
        title: 'Đăng ký tài khoản',
        page: 'auth',
        error: errorMessage,
        name: req.body.name,
        email: field === 'email' ? '' : req.body.email
      });
    }
    
    // Xử lý các lỗi khác
    res.render('register', {
      title: 'Đăng ký tài khoản',
      page: 'auth',
      error: 'Đã xảy ra lỗi, vui lòng thử lại',
      name: req.body.name,
      email: req.body.email
    });
  }
};

// @desc    Hiển thị form đăng nhập
// @route   GET /auth/login
// @access  Public
exports.getLoginForm = (req, res) => {
  if (res.locals.user) {
    return res.redirect('/');
  }
  
  const registered = req.query.registered === 'true';
  const redirect = req.query.redirect || '';
  
  res.render('login', {
    title: 'Đăng nhập',
    page: 'auth',
    registered,
    redirect
  });
};

// @desc    Đăng nhập người dùng
// @route   POST /auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const redirect = req.body.redirect || '/';

    // Kiểm tra email và password
    if (!email || !password) {
      return res.render('login', {
        title: 'Đăng nhập',
        page: 'auth',
        error: 'Vui lòng nhập email và mật khẩu',
        email
      });
    }

    // Kiểm tra user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.render('login', {
        title: 'Đăng nhập',
        page: 'auth',
        error: 'Email hoặc mật khẩu không chính xác',
        email
      });
    }

    // Kiểm tra mật khẩu
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.render('login', {
        title: 'Đăng nhập',
        page: 'auth',
        error: 'Email hoặc mật khẩu không chính xác',
        email
      });
    }

    // Tạo token và đăng nhập
    sendTokenResponse(user, 200, res, redirect);
  } catch (err) {
    console.error(err);
    res.render('login', {
      title: 'Đăng nhập',
      page: 'auth',
      error: 'Đã xảy ra lỗi, vui lòng thử lại',
      email: req.body.email
    });
  }
};

// @desc    Đăng xuất người dùng
// @route   GET /auth/logout
// @access  Private
exports.logout = (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  
  res.redirect('/');
};

// @desc    Hiển thị form quên mật khẩu
// @route   GET /auth/forgot-password
// @access  Public
exports.getForgotPasswordForm = (req, res) => {
  res.render('forgot-password', {
    title: 'Quên mật khẩu',
    page: 'auth'
  });
};

// @desc    Xử lý quên mật khẩu
// @route   POST /auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.render('forgot-password', {
        title: 'Quên mật khẩu',
        page: 'auth',
        error: 'Không tìm thấy tài khoản với email này',
        email
      });
    }

    // Trong thực tế, bạn sẽ gửi email reset password ở đây
    // Nhưng hiện tại chúng ta sẽ chỉ hiển thị thông báo thành công

    res.render('forgot-password', {
      title: 'Quên mật khẩu',
      page: 'auth',
      success: 'Hướng dẫn đặt lại mật khẩu đã được gửi đến email của bạn',
      email
    });
  } catch (err) {
    console.error(err);
    res.render('forgot-password', {
      title: 'Quên mật khẩu',
      page: 'auth',
      error: 'Đã xảy ra lỗi, vui lòng thử lại',
      email: req.body.email
    });
  }
};

// @desc    Lấy thông tin người dùng hiện tại
// @route   GET /auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.render('profile', {
      user,
      title: 'Hồ sơ của tôi'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Lỗi máy chủ'
    });
  }
};

// @desc    Cập nhật thông tin người dùng
// @route   POST /auth/update-profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, username, email } = req.body;
    
    // Kiểm tra nếu email hoặc username đã tồn tại
    const existingUser = await User.findOne({
      $or: [
        { email, _id: { $ne: req.user.id } },
        { username, _id: { $ne: req.user.id } }
      ]
    });
    
    if (existingUser) {
      return res.render('profile', {
        user: req.user,
        title: 'Hồ sơ của tôi',
        error: 'Email hoặc tên đăng nhập đã tồn tại'
      });
    }
    
    // Cập nhật thông tin người dùng
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, username, email },
      { new: true, runValidators: true }
    );
    
    res.render('profile', {
      user,
      title: 'Hồ sơ của tôi',
      success: 'Thông tin đã được cập nhật thành công'
    });
  } catch (err) {
    console.error(err);
    res.render('profile', {
      user: req.user,
      title: 'Hồ sơ của tôi',
      error: 'Đã xảy ra lỗi, vui lòng thử lại'
    });
  }
};

// @desc    Đổi mật khẩu
// @route   POST /auth/change-password
// @access  Private
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    // Kiểm tra xác nhận mật khẩu
    if (newPassword !== confirmPassword) {
      return res.render('profile', {
        user: req.user,
        title: 'Hồ sơ của tôi',
        error: 'Mật khẩu xác nhận không khớp',
        activeTab: 'settings'
      });
    }
    
    // Lấy người dùng có mật khẩu
    const user = await User.findById(req.user.id).select('+password');
    
    // Kiểm tra mật khẩu hiện tại
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.render('profile', {
        user: req.user,
        title: 'Hồ sơ của tôi',
        error: 'Mật khẩu hiện tại không đúng',
        activeTab: 'settings'
      });
    }
    
    // Cập nhật mật khẩu
    user.password = newPassword;
    await user.save();
    
    res.render('profile', {
      user,
      title: 'Hồ sơ của tôi',
      success: 'Mật khẩu đã được cập nhật thành công',
      activeTab: 'settings'
    });
  } catch (err) {
    console.error(err);
    res.render('profile', {
      user: req.user,
      title: 'Hồ sơ của tôi',
      error: 'Đã xảy ra lỗi, vui lòng thử lại',
      activeTab: 'settings'
    });
  }
};

// @desc    Cập nhật avatar
// @route   POST /auth/update-avatar
// @access  Private
exports.updateAvatar = async (req, res, next) => {
  try {
    // Xử lý tải lên avatar (cần thiết lập multer trước)
    if (!req.file) {
      return res.render('profile', {
        user: req.user,
        title: 'Hồ sơ của tôi',
        error: 'Vui lòng chọn một file ảnh'
      });
    }
    
    // Cập nhật đường dẫn avatar
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: `/uploads/avatars/${req.file.filename}` },
      { new: true }
    );
    
    res.render('profile', {
      user,
      title: 'Hồ sơ của tôi',
      success: 'Ảnh đại diện đã được cập nhật thành công'
    });
  } catch (err) {
    console.error(err);
    res.render('profile', {
      user: req.user,
      title: 'Hồ sơ của tôi',
      error: 'Đã xảy ra lỗi, vui lòng thử lại'
    });
  }
};

// @desc    Xóa tài khoản
// @route   POST /auth/delete-account
// @access  Private
exports.deleteAccount = async (req, res, next) => {
  try {
    const { password } = req.body;
    
    // Lấy người dùng có mật khẩu
    const user = await User.findById(req.user.id).select('+password');
    
    // Kiểm tra mật khẩu
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.render('profile', {
        user: req.user,
        title: 'Hồ sơ của tôi',
        error: 'Mật khẩu không đúng',
        activeTab: 'settings'
      });
    }
    
    // Xóa tài khoản
    await User.findByIdAndDelete(req.user.id);
    
    // Xóa cookie token
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });
    
    res.redirect('/auth/login?deleted=true');
  } catch (err) {
    console.error(err);
    res.render('profile', {
      user: req.user,
      title: 'Hồ sơ của tôi',
      error: 'Đã xảy ra lỗi, vui lòng thử lại',
      activeTab: 'settings'
    });
  }
}; 