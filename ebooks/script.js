// ===== NAVIGATION & SECTION MANAGEMENT =====
function showSection(sectionId) {
    // Hide all sections with fade-out
    document.querySelectorAll('.day-section').forEach(section => {
        section.classList.remove('active');
    });

    // Show target section with fade-in
    const targetSection = document.getElementById('section-' + sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-section') === sectionId) {
            item.classList.add('active');
        }
    });

    // Update progress
    updateProgress(sectionId);

    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Close sidebar on mobile
    if (window.innerWidth <= 1024) {
        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('sidebarOverlay').classList.remove('active');
    }

    // Save state to localStorage
    localStorage.setItem('currentSection', sectionId);
}

function updateProgress(sectionId) {
    const dayNumber = parseInt(sectionId.replace('day', ''));
    if (!isNaN(dayNumber)) {
        const percentage = (dayNumber / 20) * 100;
        const fill = document.getElementById('progressBarFill');
        const text = document.getElementById('progressText');
        if (fill) fill.style.width = percentage + '%';
        if (text) text.textContent = `Day ${dayNumber} / 20`;

        // Mark completed days in sidebar
        for (let i = 1; i < dayNumber; i++) {
            const navItem = document.querySelector(`[data-section="day${i}"] .nav-day-number`);
            if (navItem && !navItem.classList.contains('completed')) {
                navItem.classList.add('completed');
            }
        }
    } else {
        const fill = document.getElementById('progressBarFill');
        const text = document.getElementById('progressText');
        if (fill) fill.style.width = '0%';
        if (text) text.textContent = 'Day 0 / 20';
    }
}

// ===== SIDEBAR TOGGLE =====
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('active');
}

// ===== IMAGE ERROR HANDLING =====
function handleImageErrors() {
    document.querySelectorAll('.visual-container img').forEach(img => {
        img.addEventListener('error', function() {
            // Hide the broken image and show a styled placeholder
            this.style.display = 'none';
            const container = this.closest('.visual-container');
            if (container && !container.querySelector('.img-placeholder')) {
                const placeholder = document.createElement('div');
                placeholder.className = 'img-placeholder';
                placeholder.innerHTML = '<div style="text-align:center;padding:40px 20px;background:rgba(99,102,241,0.08);border-radius:12px;border:1px dashed rgba(99,102,241,0.3);"><div style="font-size:48px;margin-bottom:12px;">🖼️</div><div style="color:var(--text-secondary);font-size:14px;">Visual illustration loading...</div></div>';
                container.insertBefore(placeholder, container.firstChild);
            }
        });
    });
}

// ===== SEARCH FUNCTIONALITY =====
function searchContent(query) {
    if (!query || query.length < 2) return [];
    
    const results = [];
    const q = query.toLowerCase();
    
    document.querySelectorAll('.day-section').forEach(section => {
        const sectionId = section.id.replace('section-', '');
        const title = section.querySelector('.day-title');
        const content = section.textContent.toLowerCase();
        
        if (content.includes(q) && title) {
            results.push({
                sectionId: sectionId,
                title: title.textContent,
                dayBadge: section.querySelector('.day-number-badge')?.textContent || ''
            });
        }
    });
    
    return results;
}

// ===== RESTORE STATE ON LOAD =====
document.addEventListener('DOMContentLoaded', () => {
    // Restore last viewed section
    const savedSection = localStorage.getItem('currentSection');
    if (savedSection) {
        showSection(savedSection);
    }

    // Handle image errors
    handleImageErrors();

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        // Don't interfere with input fields
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            navigateDay(1);
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            navigateDay(-1);
        } else if (e.key === 'Escape') {
            // Close sidebar on Escape
            document.getElementById('sidebar')?.classList.remove('open');
            document.getElementById('sidebarOverlay')?.classList.remove('active');
        }
    });

    // Add entrance animation to cards when they come into view
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.content-card, .interview-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(card);
    });

    // Make active section cards visible immediately
    setTimeout(() => {
        const activeSection = document.querySelector('.day-section.active');
        if (activeSection) {
            activeSection.querySelectorAll('.content-card, .interview-card').forEach(card => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            });
        }
    }, 100);
});

// ===== DAY NAVIGATION =====
function navigateDay(direction) {
    const current = localStorage.getItem('currentSection') || 'home';
    const dayNum = parseInt(current.replace('day', ''));

    if (current === 'home' && direction === 1) {
        showSection('day1');
    } else if (!isNaN(dayNum)) {
        const nextDay = dayNum + direction;
        if (nextDay >= 1 && nextDay <= 20) {
            showSection('day' + nextDay);
        } else if (nextDay < 1) {
            showSection('home');
        }
    }
}

// ===== INTERVIEW CARD INTERACTIONS =====
document.addEventListener('click', (e) => {
    const card = e.target.closest('.interview-card');
    if (card) {
        const hint = card.querySelector('.toggle-hint');
        if (hint) {
            hint.textContent = card.classList.contains('expanded')
                ? 'Click to hide answer'
                : 'Click to reveal answer';
        }
    }
});

// ===== PRINT FUNCTION =====
function printEbook() {
    // Show all sections for printing
    document.querySelectorAll('.day-section').forEach(section => {
        section.style.display = 'block';
    });
    window.print();
    // Restore after printing
    document.querySelectorAll('.day-section').forEach(section => {
        section.style.display = '';
    });
}

// ===== READING TIME ESTIMATOR =====
function getReadingTime(sectionId) {
    const section = document.getElementById('section-' + sectionId);
    if (!section) return 0;
    const text = section.textContent || '';
    const wordCount = text.trim().split(/\s+/).length;
    return Math.ceil(wordCount / 200); // Assume 200 words per minute
}
