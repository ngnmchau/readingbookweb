const mongoose = require('mongoose');

const ChapterSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Vui lòng thêm tiêu đề chương'],
    trim: true,
    maxlength: [200, 'Tiêu đề không được quá 200 ký tự']
  },
  content: {
    type: String,
    required: [true, 'Vui lòng thêm nội dung chương']
  },
  bookId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Book',
    required: true
  },
  order: {
    type: Number,
    required: [true, 'Vui lòng thêm số thứ tự chương']
  },
  views: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Sửa index để sử dụng bookId và order thay vì book và chapterNumber
ChapterSchema.index({ bookId: 1, order: 1 }, { unique: true });

module.exports = mongoose.model('Chapter', ChapterSchema); 