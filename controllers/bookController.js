const Book = require('../models/Book');
const Chapter = require('../models/Chapter');
const User = require('../models/User');
const Rating = require('../models/Rating');


// Lấy tất cả sách
exports.getBooks = async (req, res, next) => {
  try {
    let query;
   
    // Sao chép req.query
    const reqQuery = { ...req.query };
   
    // Các trường cần loại bỏ
    const removeFields = ['select', 'sort', 'page', 'limit'];
   
    // Loại bỏ các trường không cần thiết khỏi reqQuery
    removeFields.forEach(param => delete reqQuery[param]);
   
    // Tạo query string
    let queryStr = JSON.stringify(reqQuery);
   
    // Tạo các toán tử ($gt, $gte, v.v.)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
   
    // Tìm tài nguyên
    query = Book.find(JSON.parse(queryStr));
   
    // Select Fields
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }
   
    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }
   
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Book.countDocuments();
   
    query = query.skip(startIndex).limit(limit);
   
    // Thực thi query
    const books = await query;
   
    // Pagination result
    const pagination = {};
   
    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit,
      };
    }
   
    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit,
      };
    }
   
    res.status(200).json({
      success: true,
      count: books.length,
      pagination,
      data: books,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};


// Lấy thông tin chi tiết của một cuốn sách
exports.getBook = async (req, res) => {
  try {
    const { id } = req.params;


    // Tăng lượt xem cho sách
    const book = await Book.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true }
    )
      .populate("author", "name")
      .populate("categories", "name slug");


    if (!book) {
      return res.status(404).render("error", {
        statusCode: 404,
        message: "Không tìm thấy sách",
      });
    }


    // Lấy tất cả chương của cuốn sách và sắp xếp theo thứ tự
    const chapters = await Chapter.find({ bookId: book._id }).sort({ order: 1 });


    // Lấy sách cùng thể loại
    const relatedBooks = await Book.find({
      categories: { $in: book.categories.map((cat) => cat._id) },
      _id: { $ne: book._id },
    })
      .populate("author", "name")
      .limit(3);


    // Kiểm tra xem người dùng đã thêm sách vào yêu thích chưa
    let isFavorited = false;
    if (req.user) {
      const user = await User.findById(req.user._id);
      isFavorited = user.favoriteBooks.includes(book._id);
    }


    res.render("book-detail", {
      title: book.title,
      description: book.description,
      user: req.user,
      book,
      chapters,
      relatedBooks,
      isFavorited,
    });
  } catch (error) {
    console.error("Error in getBook:", error);
    res.status(500).render("error", {
      statusCode: 500,
      message: "Đã xảy ra lỗi khi lấy thông tin sách",
    });
  }
};


// Lấy danh sách chương của một sách
exports.getBookChapters = async (req, res, next) => {
  try {
    // Sửa từ book thành bookId để phù hợp với schema của Chapter
    const chapters = await Chapter.find({ bookId: req.params.id })
      .sort('order')
      .select('title order createdAt views');
   
    res.status(200).json({
      success: true,
      count: chapters.length,
      data: chapters,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};


// Lấy nội dung chương sách
exports.getChapter = async (req, res, next) => {
  try {
    const chapter = await Chapter.findById(req.params.chapterId);
   
    if (!chapter) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy chương sách'
      });
    }
   
    // Lấy thông tin sách
    const book = await Book.findById(chapter.bookId);
   
    // Lấy tất cả chương của sách
    const chapters = await Chapter.find({ bookId: book._id }).sort('order');
   
    // Tìm chương trước và chương sau
    const currentIndex = chapters.findIndex(c => c._id.toString() === chapter._id.toString());
    const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
    const nextChapter = currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;
   
    // Tăng lượt xem
    chapter.views += 1;
    await chapter.save();
   
    // Cập nhật lịch sử đọc nếu người dùng đã đăng nhập
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { readingHistory: { book: chapter.bookId } }
      });
     
      await User.findByIdAndUpdate(req.user._id, {
        $push: {
          readingHistory: {
            $each: [{ book: chapter.bookId, chapter: chapter._id, lastRead: new Date() }],
            $position: 0,
            $slice: 20, // Giữ 20 mục gần nhất
          },
        },
      });
    }
   
    res.status(200).json({
      success: true,
      data: {
        chapter,
        book,
        navigation: {
          prev: prevChapter ? prevChapter._id : null,
          next: nextChapter ? nextChapter._id : null,
        },
      },
    });
  } catch (error) {
    console.error('Lỗi khi lấy chương sách:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};


// Thêm đánh giá cho sách
exports.addBookReview = async (req, res) => {
  try {
    const bookId = req.params.id;
    let { rating, content = "" } = req.body;


    rating = Number(rating);


    if (!req.user) {
      return res.status(401).json({ success: false, message: "Bạn cần đăng nhập để đánh giá" });
    }


    if (isNaN(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: "Vui lòng cung cấp đánh giá từ 1-5 sao" });
    }


    let book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ success: false, message: "Không tìm thấy sách" });
    }


    if (!Array.isArray(book.comments)) {
      book.comments = [];
    }


    const existingComment = book.comments.find(
      (comment) => comment.user.toString() === req.user._id.toString()
    );


    if (existingComment) {
      existingComment.content = content;
      existingComment.rating = rating;
      existingComment.createdAt = Date.now();
    } else {
      book.comments.push({
        user: req.user._id,
        content,
        rating,
        createdAt: Date.now(),
      });
    }


    const totalRating = book.comments.reduce((acc, comment) => acc + comment.rating, 0);
    book.rating = book.comments.length > 0 ? totalRating / book.comments.length : 0;


    await book.save();


    book = await Book.findById(bookId).populate({
      path: "comments.user",
      select: "username avatar",
    });


    console.log("🚀 Dữ liệu gửi về client:", JSON.stringify(book.comments, null, 2));


    res.status(200).json({
      success: true,
      message: "Đã thêm đánh giá của bạn",
      data: book.comments.map((comment) => ({
        username: comment.user?.username || "Ẩn danh",
        avatar: comment.user?.avatar || "/uploads/users/default-avatar.jpg",
        content: comment.content,
        rating: comment.rating,
        createdAt: comment.createdAt,
      })),
    });
  } catch (error) {
    console.error("Lỗi khi thêm đánh giá:", error);
    res.status(500).json({ success: false, message: "Có lỗi xảy ra", error: error.message });
  }
};


// Thêm sách vào mục yêu thích
exports.addToFavorites = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
   
    const book = await Book.findById(id);
   
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sách'
      });
    }
   
    const user = await User.findById(userId);
   
    // Kiểm tra xem sách đã có trong danh sách yêu thích chưa
    if (user.favorites.includes(id)) {
      return res.status(400).json({
        success: false,
        message: 'Sách đã có trong danh sách yêu thích của bạn'
      });
    }
   
    // Thêm sách vào danh sách yêu thích
    user.favorites.push(id);
    await user.save();
   
    res.status(200).json({
      success: true,
      message: 'Đã thêm sách vào danh sách yêu thích'
    });
  } catch (error) {
    console.error('Lỗi khi thêm vào yêu thích:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi thêm vào danh sách yêu thích'
    });
  }
};


// Xóa sách khỏi danh sách yêu thích
exports.removeFromFavorites = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
   
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy người dùng',
      });
    }
   
    user.favorites = user.favorites.filter(
      bookId => bookId.toString() !== req.params.id
    );
   
    await user.save();
   
    res.status(200).json({
      success: true,
      data: user.favorites,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};
