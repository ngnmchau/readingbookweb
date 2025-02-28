const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const path = require('path');

// Load env vars
dotenv.config({ path: './config/config.env' });

// Import các model
const Book = require('./models/Book');
const Chapter = require('./models/Chapter');
const User = require('./models/User');
const BlogPost = require ('./models/Blog')

const app = express();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// Set EJS as templating engine
app.set('view engine', 'ejs');

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

// Route files
const authRoutes = require('./routes/auth');
const bookRoutes = require('./routes/bookRoutes');
const indexRoutes = require('./routes/index');
const blogRoutes = require('./routes/blog');

// Mount routers
app.use('/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/', indexRoutes);
app.use('/blog', blogRoutes);
// API routes
app.post('/api/books/:id/favorites', (req, res) => {
  // Xử lý thêm sách vào danh sách yêu thích
  res.json({ success: true });
});

app.delete('/api/books/:id/favorites', (req, res) => {
  // Xử lý xóa sách khỏi danh sách yêu thích
  res.json({ success: true });
});

// Hàm kiểm tra và seed dữ liệu nếu cần
const checkAndSeedData = async () => {
  try {
    // Kiểm tra xem đã có dữ liệu chưa
    const bookCount = await Book.countDocuments();
    
    if (bookCount === 0) {
      console.log('Không tìm thấy dữ liệu, bắt đầu seed dữ liệu...');
      
      // Thêm code seed dữ liệu ở đây (tương tự như trong seeder.js)
      // ...
      
      console.log('Seed dữ liệu thành công!');
    } else {
      console.log(`Đã tìm thấy ${bookCount} sách trong database.`);
    }
  } catch (err) {
    console.error('Lỗi khi kiểm tra/seed dữ liệu:', err);
  }
};

//blog
app.get('/blog', (req, res) => {
  res.render('blog', { posts: [] }); 
});

// Lấy bài viết theo ID
app.get('/blog/:id', (req, res) => {
  const post = blogPosts.find(p => p.id == req.params.id);
  if (!post) return res.status(404).send("Bài viết không tồn tại");
  res.render('blog_post', { post });
});

// API Like bài viết
app.post('/blog/:id/like', (req, res) => {
  const post = blogPosts.find(p => p.id == req.params.id);
  if (post) {
    post.likes++;
    res.json({ likes: post.likes });
  } else {
    res.status(404).json({ message: "Bài viết không tồn tại" });
  }
});
// API Bình luận bài viết
app.post('/blog/:id/comment', (req, res) => {
  const post = blogPosts.find(p => p.id == req.params.id);
  if (post) {
    post.comments.push({ author: req.body.author, text: req.body.text });
    res.json({ comments: post.comments });
  } else {
    res.status(404).json({ message: "Bài viết không tồn tại" });
  }
});



// Xử lý 404
app.use((req, res) => {
  res.status(404).render('404', { 
    title: 'Không tìm thấy trang',
    user: null
  });
});

// Xử lý lỗi
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { 
    title: 'Lỗi máy chủ',
    message: 'Đã xảy ra lỗi, vui lòng thử lại sau',
    user: null
  });
});

// Gọi hàm kiểm tra và seed dữ liệu sau khi kết nối database
connectDB().then(async () => {
  console.log('Kết nối MongoDB thành công!');
  await checkAndSeedData();
}).catch(err => {
  console.error('Lỗi kết nối MongoDB:', err.message);
  process.exit(1);
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server đang chạy ở cổng ${PORT}`);
}); 