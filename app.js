const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const Book = require('./model/book');
const bookRoutes = require('./routes/bookRoutes');


const app = express();
const router = express.Router();

app.use(express.static("public"));

// Định nghĩa route API
app.use('/api', bookRoutes);


// Cấu hình EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public")); // Đảm bảo có thư mục public chứa CSS, JS
app.use((req, res, next) => {
  res.locals.user = null;  
  next();
});



// Kết nối MongoDB
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://ngnmchau14:123@readingbookweb.noj8w.mongodb.net/readingbookweb";
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ Kết nối MongoDB thành công!"))
  .catch(err => console.error("❌ Lỗi kết nối MongoDB: ", err));


// 👉 Route Đăng nhập - Đăng ký
app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/register", (req, res) => {
    res.render("register");
});

// 👉 Trang chủ - Hiển thị danh sách sách
app.get("/", async (req, res) => {
    try {
      const books = await Book.find();
      res.render("index", { books, user: null }); // Nếu chưa có user, đặt là null
    } catch (err) {
      res.status(500).send("❌ Lỗi khi tải danh sách sách!");
    }
  });
  
// 👉 API JSON - Danh sách sách
app.get("/api/books", async (req, res) => {
  try {
    const books = await Book.find();
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi lấy danh sách sách!" });
  }
});

// 👉 Trang chi tiết sách
app.get("/book/:id", async (req, res) => {
  try {
      const book = await Book.findById(req.params.id);
      if (!book) return res.status(404).send("📕 Không tìm thấy sách!");

      // Nếu sách có đánh giá thì truyền vào, nếu không thì truyền mảng rỗng
      const reviews = book.reviews || [];

      res.render("book_detail", { book, reviews });
  } catch (err) {
      res.status(500).send("❌ Lỗi khi lấy dữ liệu sách!");
  }
});


// 👉 Trang danh sách sách theo thể loại
app.get("/category/:name", async (req, res) => {
  try {
    const books = await Book.find({ category: req.params.name });
    res.render("category", { books, category: req.params.name });
  } catch (err) {
    res.status(500).send("❌ Lỗi khi lấy danh sách sách!");
  }
});

// 👉 Trang thêm sách
app.get("/add-book", (req, res) => {
  res.render("add-book");
});

app.post("/add-book", async (req, res) => {
  try {
    const { title, author, cover, category, description } = req.body;
    if (!title) return res.status(400).send("❌ Tiêu đề sách không được để trống!");

    const newBook = new Book({ title, author, cover, category, description });
    await newBook.save();
    res.redirect("/");
  } catch (err) {
    res.status(500).send("❌ Lỗi khi thêm sách!");
  }
});

// 👉 Trang chỉnh sửa sách
app.get("/edit-book/:id", async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).send("📕 Không tìm thấy sách!");
    res.render("edit-book", { book });
  } catch (err) {
    res.status(500).send("❌ Lỗi khi lấy dữ liệu sách!");
  }
});

app.post("/edit-book/:id", async (req, res) => {
  try {
    const { title, author, cover, category, description } = req.body;
    if (!title) return res.status(400).send("❌ Tiêu đề sách không được để trống!");

    await Book.findByIdAndUpdate(req.params.id, { title, author, cover, category, description });
    res.redirect("/");
  } catch (err) {
    res.status(500).send("❌ Lỗi khi cập nhật sách!");
  }
});

// 👉 Xóa sách
app.post("/delete-book/:id", async (req, res) => {
  try {
    await Book.findByIdAndDelete(req.params.id);
    res.redirect("/");
  } catch (err) {
    res.status(500).send("❌ Lỗi khi xóa sách!");
  }
});

// 👉 Khởi động server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server chạy tại http://localhost:${PORT}`);
});
