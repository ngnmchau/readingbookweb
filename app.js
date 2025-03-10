const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const path = require('path');
const fs = require('fs');

// Load env vars
dotenv.config({ path: './config/config.env' });

// Import các model
const Book = require('./models/Book');
const Chapter = require('./models/Chapter');
const User = require('./models/User');
const Category = require('./models/Category');
const BlogPost = require('./models/Blog');

const app = express();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// Set EJS as templating engine
app.set('view engine', 'ejs');

// Đảm bảo các thư mục uploads tồn tại
const uploadDirs = [
  path.join(__dirname, 'public/uploads'),
  path.join(__dirname, 'public/uploads/books'),
  path.join(__dirname, 'public/uploads/users'),
  path.join(__dirname, 'public/uploads/categories'),
];

uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Đã tạo thư mục ${dir} thành công!`);
  }
});

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

// Route files
const authRoutes = require('./routes/auth');
const bookRoutes = require('./routes/bookRoutes');
const indexRoutes = require('./routes/index');
const adminRoutes = require('./routes/admin'); // Make sure this path is correct
const blogRoutes = require('./routes/blog');


// Mount routers
app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/admin', adminRoutes);
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
    const userCount = await User.countDocuments();
    const bookCount = await Book.countDocuments();
    const categoryCount = await Category.countDocuments();
    
    console.log(`Kiểm tra dữ liệu: ${userCount} người dùng, ${bookCount} sách, ${categoryCount} thể loại`);
    
    // Tạo tài khoản admin mặc định nếu chưa có
    if (userCount === 0) {
      console.log('Không tìm thấy người dùng, tạo tài khoản admin mặc định...');
      
      const admin = new User({
        name: 'Administrator',
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin'
      });
      
      await admin.save();
      console.log('Tài khoản admin mặc định đã được tạo!');
    }
    
    // Tạo thể loại mẫu nếu chưa có
    if (categoryCount === 0) {
      console.log('Không tìm thấy thể loại, tạo dữ liệu thể loại mẫu...');
      
      const sampleCategories = [
        {
          name: 'Tiểu thuyết',
          description: 'Sách thuộc thể loại tiểu thuyết'
        },
        {
          name: 'Kỹ năng sống',
          description: 'Sách phát triển kỹ năng sống'
        },
        {
          name: 'Tâm lý',
          description: 'Sách về tâm lý học'
        },
        {
          name: 'Kinh doanh',
          description: 'Sách về kinh doanh và quản lý'
        },
        {
          name: 'Khoa học',
          description: 'Sách khoa học'
        }
      ];
      
      await Category.insertMany(sampleCategories);
      console.log('Dữ liệu thể loại mẫu đã được tạo!');
    }
    
    // Tạo sách mẫu nếu chưa có
    if (bookCount === 0) {
      console.log('Không tìm thấy sách, tạo dữ liệu sách mẫu...');
      
      const sampleBooks = [
        {
          title: 'Đắc Nhân Tâm',
          author: 'Dale Carnegie',
          description: 'Cuốn sách nổi tiếng về kỹ năng giao tiếp và phát triển bản thân',
          pages: 320,
          language: 'Tiếng Việt',
          categories: ['Kỹ năng sống', 'Tâm lý'],
          publishDate: new Date('1936-10-01'),
          rating: 4.5,
          views: 1250
        },
        {
          title: 'Nhà Giả Kim',
          author: 'Paulo Coelho',
          description: 'Câu chuyện về hành trình khám phá bản thân của chàng chăn cừu Santiago',
          pages: 224,
          language: 'Tiếng Việt',
          categories: ['Tiểu thuyết', 'Tâm linh'],
          publishDate: new Date('1988-01-01'),
          rating: 4.7,
          views: 980
        },
        {
          title: 'Tuổi Trẻ Đáng Giá Bao Nhiêu',
          author: 'Rosie Nguyễn',
          description: 'Suy ngẫm về cuộc sống, tuổi trẻ và những giá trị theo đuổi',
          pages: 285,
          language: 'Tiếng Việt',
          categories: ['Kỹ năng sống', 'Tự truyện'],
          publishDate: new Date('2016-02-28'),
          rating: 4.2,
          views: 875
        }
      ];
      
      await Book.insertMany(sampleBooks);
      console.log('Dữ liệu sách mẫu đã được tạo!');
    }
    
    console.log('Kiểm tra và seed dữ liệu hoàn tất!');
  } catch (err) {
    console.error('Lỗi khi kiểm tra/seed dữ liệu:', err);
  }
};


// Middleware xử lý lỗi
app.use((err, req, res, next) => {
  console.error('Lỗi ứng dụng:', err.stack);
  res.status(500).render('error', {
    title: 'Lỗi Hệ Thống',
    message: 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại sau.',
    user: req.user
  });
});

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
    res.json({ success: true });
  } else {
    res.status(404).json({ message: "Bài viết không tồn tại" });
  }
});

// Xử lý 404 - Xóa một cái để tránh định nghĩa trùng
app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Không Tìm Thấy Trang',
    message: 'Trang bạn đang tìm kiếm không tồn tại.',
    user: req.user
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