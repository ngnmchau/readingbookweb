const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;

// Cấu hình đường dẫn
app.set("view engine", "ejs"); // Sử dụng EJS để render HTML động
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public"))); // Chỉ định thư mục chứa file tĩnh

// Danh sách sách mẫu
const books = [
  { id: 1, title: "The Great Gatsby", author: "F. Scott Fitzgerald" },
  { id: 2, title: "1984", author: "George Orwell" },
  { id: 3, title: "To Kill a Mockingbird", author: "Harper Lee" },
];

// Đường dẫn chính (trang chủ)
app.get("/", (req, res) => {
  res.render("index", { books }); // Truyền dữ liệu sách sang giao diện
});

// Đường dẫn chi tiết sách
app.get("/book/:id", (req, res) => {
  const book = books.find((b) => b.id === parseInt(req.params.id));
  if (!book) return res.status(404).send("Book not found");
  res.render("book", { book });
});

// Khởi chạy server
app.listen(PORT, () => {
  console.log(`Server đang chạy tại: http://localhost:${PORT}`);
});
