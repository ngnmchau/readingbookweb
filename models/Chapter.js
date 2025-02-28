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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Tạo index cho book và chapterNumber
ChapterSchema.index({ book: 1, chapterNumber: 1 }, { unique: true });

module.exports = mongoose.model('Chapter', ChapterSchema); 