/**
 * TechFin Main Application & NetPro 40 Learning Hub Controller
 * 
 * Manages:
 * - Light & Dark Mode theme toggling with persistent state
 * - Unified NetPro 40 single curriculum with 3-Phase Side-View:
 *     Phase 1: Topics 1 to 20
 *     Phase 2: Topics 21 to 30 (10 topics)
 *     Phase 3: Topics 31 to 40 (10 topics)
 * - Sequential One-by-One Topic Reader & Interactive Navigation
 * - Real Progress Tracking (Completed Topics & Next Topic)
 * - DRM Forensic Watermarking & Security Shields
 */

function showToast(message, type = 'success') {
  let box = document.getElementById('toast-box');
  if (!box) {
    box = document.createElement('div');
    box.id = 'toast-box';
    box.className = 'toast-box';
    document.body.appendChild(box);
  }

  const toast = document.createElement('div');
  toast.className = `toast-item ${type}`;
  toast.innerHTML = message;
  box.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.25s ease';
    setTimeout(() => toast.remove(), 280);
  }, 3500);
}

const App = {
  currentTopicIndex: 0, // 0 to 39
  activePhaseFilter: 'all',
  searchQuery: '',
  theme: 'dark',
  completedTopics: new Set(),

  async init() {
    this.initTheme();

    if (typeof Auth !== 'undefined' && Auth.init) {
      await Auth.init();
    }

    this.loadUserProgress();
    this.renderSideViewCurriculum();
    this.loadTopic(0);
    this.setupListeners();
    this.setupSecurityShield();
    this.applySecurityWatermark();
    this.initAutoRefreshTracker();
  },

  // ================= AUTO-REFRESH ON VERCEL DEPLOYMENT =================
  currentDeploymentVersion: null,

  initAutoRefreshTracker() {
    const checkVersion = async () => {
      try {
        const res = await fetch('/api/version?_t=' + Date.now(), { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data && data.version) {
            if (this.currentDeploymentVersion && this.currentDeploymentVersion !== data.version) {
              console.log('[Auto-Refresh] New Vercel deployment detected! Refreshing...');
              if (typeof showToast === 'function') {
                showToast('⚡ New update deployed on Vercel! Refreshing...', 'info');
              }
              setTimeout(() => window.location.reload(), 1200);
            } else {
              this.currentDeploymentVersion = data.version;
            }
          }
        }
      } catch (e) {}
    };

    checkVersion();
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') checkVersion();
    });
    setInterval(checkVersion, 60000);
  },

  // ================= THEME CONTROLLER (LIGHT & DARK MODE) =================
  initTheme() {
    const savedTheme = localStorage.getItem('techfin_theme') || 'dark';
    this.setTheme(savedTheme);

    const themeToggleBtn = document.getElementById('btn-theme-toggle');
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        const nextTheme = this.theme === 'dark' ? 'light' : 'dark';
        this.setTheme(nextTheme);
      });
    }
  },

  setTheme(themeName) {
    this.theme = themeName;
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('techfin_theme', themeName);

    const iconEl = document.getElementById('theme-toggle-icon');

    if (iconEl) {
      iconEl.textContent = themeName === 'dark' ? '☀️' : '🌙';
    }
  },

  // ================= PROGRESS TRACKING =================
  loadUserProgress() {
    const local = localStorage.getItem('techfin_completed_topics');
    if (local) {
      try {
        const arr = JSON.parse(local);
        this.completedTopics = new Set(arr);
      } catch (e) {}
    }

    if (Auth.currentUser && Auth.currentUser.progress && Auth.currentUser.progress.completedTopics) {
      Auth.currentUser.progress.completedTopics.forEach(id => this.completedTopics.add(id));
    }
    this.updateProgressBar();
  },

  saveUserProgress() {
    const arr = Array.from(this.completedTopics);
    localStorage.setItem('techfin_completed_topics', JSON.stringify(arr));

    if (Auth.token) {
      const current = NETPRO_TOPICS[this.currentTopicIndex];
      fetch('/api/user/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Auth.token}`
        },
        body: JSON.stringify({
          completedTopicId: current ? current.id : null,
          currentTopicId: current ? current.id : 'day1'
        })
      }).catch(() => {});
    }
    this.updateProgressBar();
  },

  updateProgressBar() {
    const fill = document.getElementById('curriculum-progress-fill');
    const label = document.getElementById('curriculum-progress-label');
    const pct = Math.round((this.completedTopics.size / 40) * 100);

    if (fill) fill.style.width = `${pct}%`;
    if (label) label.textContent = `${this.completedTopics.size} of 40 Completed (${pct}%)`;
  },

  // ================= SIDE VIEW CURRICULUM =================
  renderSideViewCurriculum() {
    const container = document.getElementById('sideview-phases-container');
    if (!container || typeof NETPRO_TOPICS === 'undefined') return;

    // Filter by search query if present
    const q = this.searchQuery.toLowerCase().trim();

    let html = '';

    NETPRO_PHASES.forEach(phase => {
      // Phase 1: topics 1-20
      // Phase 2: topics 21-30
      // Phase 3: topics 31-40
      const phaseTopics = NETPRO_TOPICS.filter(t => t.phase === phase.phaseNum);
      const filtered = q ? phaseTopics.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.desc.toLowerCase().includes(q) ||
        t.tag.toLowerCase().includes(q) ||
        `topic ${t.num}`.includes(q)
      ) : phaseTopics;

      if (filtered.length === 0) return;

      const phaseCompletedCount = phaseTopics.filter(t => this.completedTopics.has(t.id)).length;

      html += `
        <div class="phase-group" data-phase="${phase.phaseNum}">
          <div class="phase-header" onclick="App.togglePhaseAccordion(${phase.phaseNum})">
            <div class="phase-header-left">
              <span class="phase-number-tag">Phase ${phase.phaseNum}</span>
              <div class="phase-header-titles">
                <h4>${phase.title.replace(`Phase ${phase.phaseNum}: `, '')}</h4>
                <span class="phase-meta">${phase.range} &bull; ${phaseCompletedCount}/${phase.topicCount} Done</span>
              </div>
            </div>
            <div class="phase-toggle-icon" id="phase-icon-${phase.phaseNum}">▼</div>
          </div>

          <div class="phase-topic-list" id="phase-list-${phase.phaseNum}">
            ${filtered.map(topic => {
              const globalIndex = topic.num - 1;
              const isActive = globalIndex === this.currentTopicIndex;
              const isDone = this.completedTopics.has(topic.id);
              const numPadded = String(topic.num).padStart(2, '0');

              return `
                <div class="sideview-topic-item ${isActive ? 'active' : ''} ${isDone ? 'completed' : ''}" 
                     data-index="${globalIndex}"
                     onclick="App.loadTopic(${globalIndex})">
                  <div class="topic-item-left">
                    <span class="topic-num-badge">${numPadded}</span>
                    <div class="topic-info-wrap">
                      <div class="topic-item-title">${topic.title}</div>
                      <div class="topic-item-sub">
                        <span class="topic-tag-chip">${topic.tag}</span>
                        <span class="topic-read-time">⏱ ${topic.readTime}</span>
                      </div>
                    </div>
                  </div>
                  <div class="topic-status-check">
                    ${isDone ? '<span class="check-done" title="Completed">✓</span>' : '<span class="check-pending">○</span>'}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  },

  togglePhaseAccordion(phaseNum) {
    const list = document.getElementById(`phase-list-${phaseNum}`);
    const icon = document.getElementById(`phase-icon-${phaseNum}`);
    if (list) {
      const isHidden = list.style.display === 'none';
      list.style.display = isHidden ? 'flex' : 'none';
      if (icon) icon.textContent = isHidden ? '▼' : '▶';
    }
  },

  // ================= LOAD & DISPLAY TOPIC =================
  loadTopic(index) {
    if (index < 0 || index >= NETPRO_TOPICS.length) return;
    this.currentTopicIndex = index;
    const topic = NETPRO_TOPICS[index];

    // Update active highlight in side view
    const items = document.querySelectorAll('.sideview-topic-item');
    items.forEach(el => {
      const elIdx = parseInt(el.dataset.index, 10);
      el.classList.toggle('active', elIdx === index);
    });

    // Update Topic Header elements
    const titleEl = document.getElementById('active-topic-title');
    const phaseTagEl = document.getElementById('active-topic-phase-badge');
    const numBadgeEl = document.getElementById('active-topic-num-badge');
    const tagEl = document.getElementById('active-topic-tag');
    const readTimeEl = document.getElementById('active-topic-readtime');
    const btnPrev = document.getElementById('btn-prev-topic');
    const btnNext = document.getElementById('btn-next-topic');
    const btnComplete = document.getElementById('btn-mark-completed');

    if (titleEl) titleEl.textContent = topic.title;
    if (phaseTagEl) phaseTagEl.textContent = `Phase ${topic.phase}`;
    if (numBadgeEl) numBadgeEl.textContent = `Topic ${String(topic.num).padStart(2, '0')} of 40`;
    if (tagEl) tagEl.textContent = topic.tag;
    if (readTimeEl) readTimeEl.textContent = `⏱ ${topic.readTime}`;

    // Prev / Next button states
    if (btnPrev) {
      btnPrev.disabled = index === 0;
      btnPrev.title = index > 0 ? `Previous: Topic ${index}` : 'First Topic';
    }
    if (btnNext) {
      btnNext.disabled = index === NETPRO_TOPICS.length - 1;
      btnNext.title = index < 39 ? `Next: Topic ${index + 2}` : 'Last Topic';
    }

    if (btnComplete) {
      const isDone = this.completedTopics.has(topic.id);
      btnComplete.innerHTML = isDone 
        ? `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Completed &bull; Next Topic &rarr;`
        : `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Mark Complete &amp; Next &rarr;`;
    }

    // Dynamic Topic Overview Card
    const overviewEl = document.getElementById('topic-overview-box');
    if (overviewEl) {
      overviewEl.innerHTML = `
        <div class="topic-overview-card">
          <div class="overview-header">
            <span class="overview-badge">Core Engineering Objective</span>
            <span style="font-size: 0.8rem; color: var(--text-muted);">Topic ${topic.num} &bull; ${topic.tag}</span>
          </div>
          <p class="overview-desc">${topic.desc}</p>
          <div class="overview-takeaway">
            <strong>Key Concept:</strong> ${topic.keyTakeaway}
          </div>
        </div>
      `;
    }

    // Load iframe content if authenticated
    this.updateReaderSecurityGate(topic.id);
  },

  updateReaderSecurityGate(topicId) {
    const readerIframe = document.getElementById('main-reader-iframe');
    if (readerIframe) {
      const targetUrl = `ebooks/networking-fundamentals.html#${topicId}`;
      try {
        if (readerIframe.contentWindow && readerIframe.src.includes('networking-fundamentals.html')) {
          readerIframe.contentWindow.location.hash = `#${topicId}`;
        } else {
          readerIframe.src = targetUrl;
        }
      } catch (e) {
        readerIframe.src = targetUrl;
      }
    }
  },

  markCurrentCompletedAndNext() {
    const current = NETPRO_TOPICS[this.currentTopicIndex];
    if (current) {
      this.completedTopics.add(current.id);
      this.saveUserProgress();
      this.renderSideViewCurriculum();
      showToast(`Topic ${current.num} marked as completed!`, 'success');
    }

    if (this.currentTopicIndex < NETPRO_TOPICS.length - 1) {
      this.loadTopic(this.currentTopicIndex + 1);
    } else {
      showToast('🎉 Congratulations! You have finished all 40 topics of NetPro 40!', 'success');
    }
  },

  setupListeners() {
    // Topic Navigation Buttons
    const btnPrev = document.getElementById('btn-prev-topic');
    const btnNext = document.getElementById('btn-next-topic');
    const btnComplete = document.getElementById('btn-mark-completed');

    if (btnPrev) btnPrev.addEventListener('click', () => this.loadTopic(this.currentTopicIndex - 1));
    if (btnNext) btnNext.addEventListener('click', () => this.loadTopic(this.currentTopicIndex + 1));
    if (btnComplete) btnComplete.addEventListener('click', () => this.markCurrentCompletedAndNext());

    // Search Box
    const searchInput = document.getElementById('sideview-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.renderSideViewCurriculum();
      });
    }

    // Fullscreen buttons
    const btnFullscreen = document.getElementById('btn-fullscreen-reader');
    const btnHeaderFs = document.getElementById('btn-header-fullscreen');
    const btnCloseFs = document.getElementById('btn-close-fullscreen');
    const fsModal = document.getElementById('fullscreen-modal');

    if (btnFullscreen) btnFullscreen.addEventListener('click', () => this.openFullscreen());
    if (btnHeaderFs) btnHeaderFs.addEventListener('click', () => this.openFullscreen());
    if (btnCloseFs) btnCloseFs.addEventListener('click', () => this.closeFullscreen());

    // Section Switching Navigation Tabs
    const tabHome = document.getElementById('tab-nav-home');
    const tabEbooks = document.getElementById('tab-nav-ebooks');
    const tabBlogs = document.getElementById('tab-nav-blogs');
    const tabCourses = document.getElementById('tab-nav-courses');
    const tabFinance = document.getElementById('tab-nav-finance');

    const secHome = document.getElementById('section-home');
    const secEbooks = document.getElementById('section-ebooks');
    const secBlogs = document.getElementById('section-blogs');
    const secCourses = document.getElementById('section-courses');
    const secFinance = document.getElementById('section-finance');

    const switchSection = (btn, sec) => {
      [tabHome, tabEbooks, tabBlogs, tabCourses, tabFinance].forEach(b => b && b.classList.remove('active'));
      [secHome, secEbooks, secBlogs, secCourses, secFinance].forEach(s => s && (s.style.display = 'none'));
      if (btn) btn.classList.add('active');
      if (sec) sec.style.display = 'block';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (tabHome) tabHome.addEventListener('click', () => switchSection(tabHome, secHome));
    if (tabEbooks) tabEbooks.addEventListener('click', () => this.openFullscreen());
    if (tabBlogs) tabBlogs.addEventListener('click', () => switchSection(tabBlogs, secBlogs));
    if (tabCourses) tabCourses.addEventListener('click', () => switchSection(tabCourses, secCourses));
    if (tabFinance) tabFinance.addEventListener('click', () => switchSection(tabFinance, secFinance));

    // Dashboard & Hover Net Pro 40 Access Link Listeners (Fullscreen Default)
    const openNetProHub = () => {
      this.openFullscreen();
    };

    const hoverNetProLink = document.getElementById('hover-netpro-link');
    if (hoverNetProLink) hoverNetProLink.addEventListener('click', openNetProHub);

    const dashNetproBtn = document.getElementById('dash-netpro-access-btn');
    if (dashNetproBtn) dashNetproBtn.addEventListener('click', openNetProHub);

    const btnOpenNetproDash = document.getElementById('btn-open-netpro-dash');
    if (btnOpenNetproDash) {
      btnOpenNetproDash.addEventListener('click', (e) => {
        e.stopPropagation();
        openNetProHub();
      });
    }

    const dashPortionBlogs = document.getElementById('dash-portion-blogs');
    if (dashPortionBlogs) dashPortionBlogs.addEventListener('click', () => switchSection(tabBlogs, secBlogs));

    const dashPortionCourses = document.getElementById('dash-portion-courses');
    if (dashPortionCourses) dashPortionCourses.addEventListener('click', () => switchSection(tabCourses, secCourses));

    const dashPortionFinance = document.getElementById('dash-portion-finance');
    if (dashPortionFinance) dashPortionFinance.addEventListener('click', () => switchSection(tabFinance, secFinance));

    // Vercel Guide Modal triggers
    const vercelGuideBtn = document.getElementById('btn-vercel-guide');
    const vercelModal = document.getElementById('vercel-modal');
    const closeVercelBtn = document.getElementById('close-vercel-modal');

    if (vercelGuideBtn && vercelModal) {
      vercelGuideBtn.addEventListener('click', () => vercelModal.classList.add('active'));
    }
    if (closeVercelBtn && vercelModal) {
      closeVercelBtn.addEventListener('click', () => vercelModal.classList.remove('active'));
    }
    if (vercelModal) {
      vercelModal.addEventListener('click', (e) => {
        if (e.target === vercelModal) vercelModal.classList.remove('active');
      });
    }
  },

  openFullscreen(topicIndex) {
    const idx = (typeof topicIndex === 'number') ? topicIndex : this.currentTopicIndex;
    const current = (typeof NETPRO_TOPICS !== 'undefined') ? (NETPRO_TOPICS[idx] || NETPRO_TOPICS[0]) : null;
    const fsModal = document.getElementById('fullscreen-modal');
    const fsIframe = document.getElementById('fs-reader-iframe');
    if (fsIframe && current) {
      fsIframe.src = `ebooks/networking-fundamentals.html#${current.id}`;
    }
    if (fsModal) fsModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  },

  closeFullscreen() {
    const fsModal = document.getElementById('fullscreen-modal');
    if (fsModal) fsModal.classList.remove('active');
    document.body.style.overflow = '';
  },

  onAuthSuccess() {
    this.updateProgressBar();
    this.renderSideViewCurriculum();
    this.loadTopic(this.currentTopicIndex);
  },

  onLogout() {
    this.updateProgressBar();
    this.renderSideViewCurriculum();
    this.loadTopic(this.currentTopicIndex);
  },

  updateEnrollmentUI() {
    this.updateProgressBar();
    this.renderSideViewCurriculum();
    this.loadTopic(this.currentTopicIndex);
  },

  applySecurityWatermark() {
    // Completely removed DRM watermarking to allow clean, direct reader access
    const wmEl = document.getElementById('security-watermark-overlay');
    if (wmEl) {
      wmEl.style.display = 'none';
      wmEl.innerHTML = '';
    }
  },

  setupSecurityShield() {
    // DRM restrictions completely removed: open direct learning access for all users
  }
};

window.App = App;

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
