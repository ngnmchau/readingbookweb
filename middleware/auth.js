const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Bảo vệ route - yêu cầu đăng nhập
exports.protect = async (req, res, next) => {
  let token;

  // Kiểm tra token từ cookie
  if (req.cookies.token) {
    token = req.cookies.token;
  }

  // Nếu không có token
  if (!token) {
    return res.redirect('/auth/login?redirect=' + encodeURIComponent(req.originalUrl));
  }

  try {
    // Xác thực token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Tìm user từ id trong token
    req.user = await User.findById(decoded.id);
    
    if (!req.user) {
      return res.redirect('/auth/login?redirect=' + encodeURIComponent(req.originalUrl));
    }

    next();
  } catch (err) {
    return res.redirect('/auth/login?redirect=' + encodeURIComponent(req.originalUrl));
  }
};

// Thêm thông tin user vào tất cả các request
exports.loadUser = async (req, res, next) => {
  let token;

  // Kiểm tra token từ cookie
  if (req.cookies.token) {
    token = req.cookies.token;
  }

  // Nếu không có token, tiếp tục nhưng không có user
  if (!token) {
    res.locals.user = null;
    return next();
  }

  try {
    // Xác thực token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Tìm user từ id trong token
    const user = await User.findById(decoded.id);
    
    // Thêm user vào res.locals để sử dụng trong views
    res.locals.user = user;
    next();
  } catch (err) {
    res.locals.user = null;
    next();
  }
};

// Cấp quyền truy cập cho các vai trò
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Vai trò ${req.user.role} không có quyền truy cập vào route này`,
      });
    }
    next();
  };
}; 