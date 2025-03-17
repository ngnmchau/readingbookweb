document.addEventListener('DOMContentLoaded', function() {
  const chapterId = document.querySelector('#chapter-content').dataset.chapterId;
  
  // Lấy nội dung chương từ API
  fetchChapterContent(chapterId);
  
  // Lưu vị trí đọc hiện tại khi cuộn
  window.addEventListener('scroll', debounce(saveReadingPosition, 200));
  
  // Khôi phục vị trí đọc trước đó
  restoreReadingPosition();
});

// Lấy nội dung chương từ API
function fetchChapterContent(chapterId) {
  fetch(`/api/books/chapters/${chapterId}`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Không thể tải nội dung chương');
      }
      return response.json();
    })
    .then(data => {
      if (!data.success) {
        throw new Error('Dữ liệu không hợp lệ');
      }
      
      // Cập nhật nội dung chương
      document.querySelector('.chapter-content').innerHTML = data.data.chapter.content;
      
      // Cập nhật tiêu đề
      document.title = data.data.chapter.title + ' - ReadingBook';
      document.querySelector('.chapter-title').textContent = data.data.chapter.title;
      document.querySelector('#bookTitle').textContent = data.data.book.title;
      
      // Cập nhật điều hướng chương
      updateChapterNavigation(data.data);
    })
    .catch(error => {
      console.error('Lỗi:', error);
      document.querySelector('.chapter-content').innerHTML = 
        '<div class="alert alert-danger">Không thể tải nội dung chương. Vui lòng thử lại sau.</div>';
    });
}

// Cập nhật nút điều hướng chương
function updateChapterNavigation(data) {
  const prevChapterBtn = document.querySelector('#prev-chapter');
  const nextChapterBtn = document.querySelector('#next-chapter');
  
  if (data.navigation.prev) {
    prevChapterBtn.href = `/reader/${data.navigation.prev}`;
    prevChapterBtn.classList.remove('disabled');
  } else {
    prevChapterBtn.href = '#';
    prevChapterBtn.classList.add('disabled');
  }
  
  if (data.navigation.next) {
    nextChapterBtn.href = `/reader/${data.navigation.next}`;
    nextChapterBtn.classList.remove('disabled');
  } else {
    nextChapterBtn.href = '#';
    nextChapterBtn.classList.add('disabled');
  }
  
  // Cập nhật link quay lại trang chi tiết sách
  document.querySelector('#back-to-book').href = `/books/${data.book._id}`;
}

// Lưu vị trí đọc
function saveReadingPosition() {
  const scrollPosition = window.scrollY;
  const chapterId = document.querySelector('#chapter-content').dataset.chapterId;
  localStorage.setItem(`reading-position-${chapterId}`, scrollPosition);
}

// Khôi phục vị trí đọc
function restoreReadingPosition() {
  const chapterId = document.querySelector('#chapter-content').dataset.chapterId;
  const savedPosition = localStorage.getItem(`reading-position-${chapterId}`);
  if (savedPosition) {
    setTimeout(() => {
      window.scrollTo(0, parseInt(savedPosition));
    }, 200);
  }
}

// Hàm debounce để tránh gọi hàm quá nhiều lần
function debounce(func, wait) {
  let timeout;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
} 