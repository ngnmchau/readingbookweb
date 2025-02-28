const express = require('express');
const BlogPost = require('../models/Blog'); // Import model
const router = express.Router();

// Lấy danh sách bài viết
router.get('/', async (req, res) => {
  try {
    const posts = await BlogPost.find().sort({ createdAt: -1 });
    res.render('blog', { posts });
  } catch (err) {
    res.status(500).send("Lỗi khi tải bài viết");
  }
});

// Lấy bài viết theo ID
router.get('/:id', async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) return res.status(404).render('404', { message: "Bài viết không tồn tại!" });

    res.render('blog_post', { post });
  } catch (err) {
    res.status(500).send("Lỗi khi tải bài viết");
  }
});

// API Like bài viết
router.post('/:id/like', async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Bài viết không tồn tại" });

    post.likes++;
    await post.save();
    res.json({ likes: post.likes });
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi like bài viết" });
  }
});

// API Bình luận bài viết
router.post('/:id/comment', async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Bài viết không tồn tại" });

    post.comments.push({ author: req.body.author, text: req.body.text });
    await post.save();
    res.json({ comments: post.comments });
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi bình luận bài viết" });
  }
});

module.exports = router;
