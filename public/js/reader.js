document.addEventListener('DOMContentLoaded', function() {
  const chapterId = document.querySelector('.reader-container').dataset.chapterId;
  const readerContent = document.querySelector('.reader-content');
  const prevButton = document.querySelector('.nav-button.prev');
  const nextButton = document.querySelector('.nav-button.next');
  const fontSizeIncrease = document.getElementById('font-size-increase');
  const fontSizeDecrease = document.getElementById('font-size-decrease');
  const themeButtons = document.querySelectorAll('.theme-btn');
  const toggleChapterList = document.getElementById('toggle-chapter-list');
  const chapterListContainer = document.querySelector('.chapter-list-container');
  const closeChapterList = document.querySelector('.close-chapter-list');
  const overlay = document.querySelector('.overlay');
  
  // Fetch chapter data
  fetch(`/api/books/chapters/${chapterId}`)
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Update chapter content
        readerContent.innerHTML = data.data.chapter.content;
        
        // Update navigation buttons
        if (!data.data.navigation.prev) {
          prevButton.classList.add('disabled');
        } else {
          prevButton.href = `/reader/${data.data.navigation.prev}`;
        }
        
        if (!data.data.navigation.next) {
          nextButton.classList.add('disabled');
        } else {
          nextButton.href = `/reader/${data.data.navigation.next}`;
        }
      }
    })
    .catch(error => console.error('Error fetching chapter:', error));
  
  // Font size controls
  let currentFontSize = parseInt(localStorage.getItem('readerFontSize')) || 18;
  readerContent.style.fontSize = `${currentFontSize}px`;
  
  if (fontSizeIncrease) {
    fontSizeIncrease.addEventListener('click', function() {
      if (currentFontSize < 24) {
        currentFontSize += 1;
        readerContent.style.fontSize = `${currentFontSize}px`;
        localStorage.setItem('readerFontSize', currentFontSize);
      }
    });
  }
}); 