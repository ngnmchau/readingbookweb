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

    // Kiểm tra email đã tồn tại chưa
    let user = await User.findOne({ email });

    if (user) {
      return res.render('register', {
        title: 'Đăng ký tài khoản',
        page: 'auth',
        error: 'Email đã được sử dụng',
        name,
        email
      });
    }

    // Tạo user mới
    user = await User.create({
      name,
      email,
      password
    });

    // Chuyển hướng đến trang đăng nhập
    res.redirect('/auth/login?registered=true');
  } catch (err) {
    console.error(err);
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