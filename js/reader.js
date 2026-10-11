/**
 * TechFin Unified Reader Module
 * Supports both standalone HTML E-Books (embedded iframe) and In-App Blog Articles.
 */

const Reader = {
  currentItem: null,

  init() {
    this.setupListeners();
  },

  setupListeners() {
    const closeBtn = document.getElementById('btn-close-reader');
    const newTabBtn = document.getElementById('btn-reader-new-tab');

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    if (newTabBtn) {
      newTabBtn.addEventListener('click', () => {
        if (this.currentItem && this.currentItem.fileUrl) {
          window.open(this.currentItem.fileUrl, '_blank');
        }
      });
    }

    // ESC key closes reader
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const modal = document.getElementById('reader-modal');
        if (modal && modal.classList.contains('active')) {
          this.close();
        }
      }
    });
  },

  open(itemId) {
    const item = TechFinDB.getContentById(itemId);
    if (!item) {
      showToast('Item not found!', 'error');
      return;
    }

    this.currentItem = item;

    const modal = document.getElementById('reader-modal');
    const titleEl = document.getElementById('reader-title-text');
    const tagEl = document.getElementById('reader-tag-text');
    const iframeEl = document.getElementById('reader-iframe');
    const articleWrap = document.getElementById('reader-article-wrap');
    const articleContent = document.getElementById('reader-article-content');
    const newTabBtn = document.getElementById('btn-reader-new-tab');

    if (titleEl) titleEl.textContent = item.title;
    if (tagEl) tagEl.textContent = `(${item.tag || item.category})`;

    document.body.style.overflow = 'hidden';
    modal.classList.add('active');

    // Case 1: Standalone HTML E-Book (like networking-fundamentals.html)
    if (item.fileUrl) {
      if (iframeEl) {
        iframeEl.style.display = 'block';
        iframeEl.src = item.fileUrl;
      }
      if (articleWrap) articleWrap.style.display = 'none';
      if (newTabBtn) newTabBtn.style.display = 'inline-flex';
    } 
    // Case 2: In-app blog post / chapter text
    else {
      if (iframeEl) {
        iframeEl.style.display = 'none';
        iframeEl.src = 'about:blank';
      }
      if (articleWrap) articleWrap.style.display = 'flex';
      if (newTabBtn) newTabBtn.style.display = 'none';

      if (articleContent) {
        if (item.chapters && item.chapters.length > 0) {
          articleContent.innerHTML = item.chapters[0].content;
        } else {
          articleContent.innerHTML = `<h1>${item.title}</h1><p>${item.description}</p>`;
        }
      }
    }
  },

  close() {
    const modal = document.getElementById('reader-modal');
    const iframeEl = document.getElementById('reader-iframe');
    if (modal) modal.classList.remove('active');
    if (iframeEl) iframeEl.src = 'about:blank';
    document.body.style.overflow = '';
    this.currentItem = null;
  }
};
