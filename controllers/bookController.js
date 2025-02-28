const Book = require('../models/Book');
const Chapter = require('../models/Chapter');
const User = require('../models/User');

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

// Lấy thông tin chi tiết sách
exports.getBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    
    if (!book) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy sách'
      });
    }
    
    // Tăng lượt xem
    book.views += 1;
    await book.save();
    
    // Lấy danh sách chương
    const chapters = await Chapter.find({ bookId: book._id }).sort('createdAt');
    
    // Lấy sách liên quan (cùng thể loại)
    const relatedBooks = await Book.find({
      categories: { $in: book.categories },
      _id: { $ne: book._id }
    }).limit(4);
    
    // Kiểm tra xem sách có trong danh sách yêu thích không (nếu đã đăng nhập)
    let isFavorite = false;
    if (req.user) {
      const user = await User.findById(req.user.id);
      isFavorite = user.favorites.includes(book._id);
    }
    
    // Lấy tiến độ đọc (nếu đã đăng nhập)
    let readingProgress = null;
    if (req.user) {
      const user = await User.findById(req.user.id);
      const historyEntry = user.readingHistory.find(
        entry => entry.book.toString() === book._id.toString()
      );
      
      if (historyEntry) {
        readingProgress = {
          lastChapter: historyEntry.chapter,
          lastRead: historyEntry.lastRead
        };
      }
    }
    
    res.render('book-detail', {
      book,
      chapters,
      relatedBooks,
      isFavorite,
      readingProgress
    });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Lỗi máy chủ'
    });
  }
};

// Lấy danh sách chương của một sách
exports.getBookChapters = async (req, res, next) => {
  try {
    const chapters = await Chapter.find({ book: req.params.id })
      .sort('chapterNumber')
      .select('title chapterNumber createdAt views');
    
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
    const chapters = await Chapter.find({ bookId: book._id }).sort('createdAt');
    
    // Tìm chương trước và chương sau
    const currentIndex = chapters.findIndex(c => c._id.toString() === chapter._id.toString());
    const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
    const nextChapter = currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;
    
    // Tăng lượt xem
    chapter.views += 1;
    await chapter.save();
    
    // Cập nhật lịch sử đọc nếu người dùng đã đăng nhập
    if (req.user) {
      await User.findByIdAndUpdate(req.user.id, {
        $pull: { readingHistory: { book: chapter.book } },
      });
      
      await User.findByIdAndUpdate(req.user.id, {
        $push: {
          readingHistory: {
            $each: [{ book: chapter.book, chapter: chapter._id, lastRead: new Date() }],
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
        navigation: {
          prev: prevChapter ? prevChapter._id : null,
          next: nextChapter ? nextChapter._id : null,
        },
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// Thêm sách vào danh sách yêu thích
exports.addToFavorites = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy người dùng',
      });
    }
    
    // Kiểm tra xem sách đã có trong danh sách yêu thích chưa
    if (user.favorites.includes(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: 'Sách đã có trong danh sách yêu thích',
      });
    }
    
    user.favorites.push(req.params.id);
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