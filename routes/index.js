const express = require('express');
const router = express.Router();
const { getBooks } = require('../controllers/bookController');
const { getLibrary, getBooksByCategory } = require('../controllers/libraryController');
const { protect, loadUser } = require('../middleware/auth');

// Áp dụng middleware loadUser cho tất cả các route
router.use(loadUser);

// Trang chủ
router.get('/', (req, res) => {
  // Dữ liệu mẫu cho trang chủ
  const featuredBooks = [
    {
      id: 1,
      title: 'Đắc Nhân Tâm',
      author: 'Dale Carnegie',
      cover: 'https://salt.tikicdn.com/cache/w1200/ts/product/df/7d/da/d340edda2b0eacb7ddc47537cddb5e08.jpg',
      rating: 4.8,
      categories: ['Tâm lý', 'Kỹ năng sống'],
      isFavorite: false
    },
    {
      id: 2,
      title: 'Nhà Giả Kim',
      author: 'Paulo Coelho',
      cover: 'https://salt.tikicdn.com/cache/w1200/ts/product/3b/a1/20/a841b467e20c1613a4773ad9ef1e0690.jpg',
      rating: 4.5,
      categories: ['Tiểu thuyết', 'Văn học'],
      isFavorite: true
    },
    {
      id: 3,
      title: 'Tư Duy Phản Biện',
      author: 'Richard Paul',
      cover: 'https://salt.tikicdn.com/cache/w1200/ts/product/22/cb/a9/524a27dcd45e8a13ae6eecb3dfacba7c.jpg',
      rating: 4.3,
      categories: ['Kỹ năng', 'Tâm lý'],
      isFavorite: false
    },
    {
      id: 4,
      title: 'Người Giàu Có Nhất Thành Babylon',
      author: 'George S. Clason',
      cover: 'https://salt.tikicdn.com/cache/w1200/ts/product/68/9a/2e/6c92d8d376a9b6a730d0964d43486ebe.jpg',
      rating: 4.6,
      categories: ['Kinh tế', 'Tài chính'],
      isFavorite: false
    }
  ];

  res.render('index', { 
    title: 'Trang chủ',
    featuredBooks: featuredBooks
  });
});

// Trang thư viện
router.get('/library', (req, res) => {
  // Dữ liệu mẫu cho thư viện sách
  const books = [
    {
      id: 1,
      title: 'Đắc Nhân Tâm',
      author: 'Dale Carnegie',
      cover: 'https://salt.tikicdn.com/cache/w1200/ts/product/df/7d/da/d340edda2b0eacb7ddc47537cddb5e08.jpg',
      rating: 4.8,
      categories: ['Tâm lý', 'Kỹ năng sống'],
      isFavorite: false
    },
    {
      id: 2,
      title: 'Nhà Giả Kim',
      author: 'Paulo Coelho',
      cover: 'https://salt.tikicdn.com/cache/w1200/ts/product/3b/a1/20/a841b467e20c1613a4773ad9ef1e0690.jpg',
      rating: 4.5,
      categories: ['Tiểu thuyết', 'Văn học'],
      isFavorite: true
    },
    // Thêm sách khác...
  ];

  res.render('books', { 
    title: 'Thư viện sách',
    books: books
  });
});

// Trang thể loại
router.get('/categories/:category', getBooksByCategory);
router.get('/categories', (req, res) => {
  res.render('categories', {
    title: 'Thể loại sách'
  });
});

// Trang chi tiết sách
router.get('/books/:id', (req, res) => {
  res.render('book-detail', { 
    title: 'Chi tiết sách',
    bookId: req.params.id
  });
});

// Trang đọc sách
router.get('/reader/:chapterId', (req, res) => {
  res.render('reader', { 
    title: 'Đọc sách',
    chapterId: req.params.chapterId
  });
});

// Trang hồ sơ (yêu cầu đăng nhập)
router.get('/profile', protect, (req, res) => {
  res.render('profile', {
    title: 'Hồ sơ của tôi'
  });
});

// Trang sách yêu thích (yêu cầu đăng nhập)
router.get('/favorites', protect, (req, res) => {
  res.render('favorites', {
    title: 'Sách yêu thích'
  });
});

// Trang lịch sử đọc (yêu cầu đăng nhập)
router.get('/reading-history', protect, (req, res) => {
  res.render('reading-history', {
    title: 'Lịch sử đọc'
  });
});

module.exports = router; 