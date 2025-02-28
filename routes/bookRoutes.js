const express = require('express');
const {
  getBooks,
  getBook,
  getBookChapters,
  getChapter,
  addToFavorites,
  removeFromFavorites,
} = require('../controllers/bookController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.route('/').get(getBooks);
router.route('/:id').get(getBook);
router.route('/:id/chapters').get(getBookChapters);
router.route('/chapters/:chapterId').get(getChapter);
router.route('/:id/favorites').post(protect, addToFavorites);
router.route('/:id/favorites').delete(protect, removeFromFavorites);

module.exports = router; 