/**
 * TechFin Admin Content Management Controller
 * Handles publishing e-books, blogs, and courses to backend database.json via REST API.
 */

const Admin = {
  init() {
    this.setupListeners();
  },

  setupListeners() {
    const uploadNavBtn = document.getElementById('btn-open-upload');
    const heroAdminBtn = document.getElementById('hero-admin-cta');
    const modal = document.getElementById('admin-modal');
    const closeBtn = document.getElementById('close-admin-modal');
    const form = document.getElementById('admin-upload-form');
    const typeSelect = document.getElementById('upload-content-type');
    const categorySelect = document.getElementById('upload-category');
    const tagsInput = document.getElementById('upload-tags');
    const sourceModeSelect = document.getElementById('upload-source-mode');

    if (uploadNavBtn) {
      uploadNavBtn.addEventListener('click', () => this.openModal());
    }
    if (heroAdminBtn) {
      heroAdminBtn.addEventListener('click', () => {
        if (!Auth.isAdmin()) {
          Auth.showModal('login');
          showToast('Please sign in with Admin credentials to upload content.', 'info');
        } else {
          this.openModal();
        }
      });
    }

    if (closeBtn) closeBtn.addEventListener('click', () => this.closeModal());
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeModal();
      });
    }

    // Auto-suggest tags based on category selection
    if (categorySelect && tagsInput) {
      categorySelect.addEventListener('change', (e) => {
        if (e.target.value === 'Finance') {
          tagsInput.value = 'Forex, Nifty 50, Binance Futures';
        } else {
          tagsInput.value = 'Networking, Linux, Cloud, Cyber';
        }
      });
    }

    // Toggle Link vs Text content
    if (sourceModeSelect) {
      sourceModeSelect.addEventListener('change', (e) => {
        const linkGroup = document.getElementById('upload-link-group');
        const textGroup = document.getElementById('upload-text-group');
        if (e.target.value === 'link') {
          if (linkGroup) linkGroup.style.display = 'block';
          if (textGroup) textGroup.style.display = 'none';
        } else {
          if (linkGroup) linkGroup.style.display = 'none';
          if (textGroup) textGroup.style.display = 'block';
        }
      });
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSubmit();
      });
    }
  },

  openModal() {
    if (!Auth.isAdmin()) {
      showToast('Admin privilege required to upload content.', 'error');
      Auth.showModal('login');
      return;
    }
    const modal = document.getElementById('admin-modal');
    modal.classList.add('active');
  },

  closeModal() {
    const modal = document.getElementById('admin-modal');
    if (modal) modal.classList.remove('active');
  },

  async handleSubmit() {
    const type = document.getElementById('upload-content-type').value;
    const category = document.getElementById('upload-category').value;
    const title = document.getElementById('upload-title').value.trim();
    const author = document.getElementById('upload-author').value.trim() || 'Imran Hussain';
    const tags = document.getElementById('upload-tags').value.trim();
    const readTime = document.getElementById('upload-readtime').value.trim() || '20 min';
    const description = document.getElementById('upload-desc').value.trim();
    const sourceMode = document.getElementById('upload-source-mode').value;
    const submitBtn = document.getElementById('admin-submit-btn');

    let fileUrl = '';
    let contentBody = '';

    if (sourceMode === 'link') {
      fileUrl = document.getElementById('upload-fileurl').value.trim();
      if (!fileUrl) {
        showToast('Please provide the HTML file path or web URL.', 'error');
        return;
      }
    } else {
      contentBody = document.getElementById('upload-content-body').value.trim();
      if (!contentBody) {
        showToast('Please enter the content body text.', 'error');
        return;
      }
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Publishing to Database...';

    const payload = {
      type,
      category,
      title,
      author,
      tags: tags.split(',').map(s => s.trim()).filter(Boolean),
      readTime,
      description,
      fileUrl: fileUrl || undefined,
      contentBody: contentBody || undefined
    };

    try {
      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Auth.token || ''}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed.');

      showToast(`🎉 "${title}" published to TechFin Database!`, 'success');
      this.closeModal();
      document.getElementById('admin-upload-form').reset();
    } catch (err) {
      alert('Upload error: ' + err.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Publish Content to Database';
    }
  }
};
