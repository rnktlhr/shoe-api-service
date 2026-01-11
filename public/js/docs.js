// Check if user is logged in and update nav
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
        // User is logged in
        document.getElementById('loginLink').style.display = 'none';
        document.getElementById('dashboardLink').style.display = 'inline-block';
    } else {
        // User not logged in
        document.getElementById('loginLink').style.display = 'inline-block';
        document.getElementById('dashboardLink').style.display = 'none';
    }

    // Smooth scroll for sidebar links
    setupSmoothScroll();
    
    // Highlight active section on scroll
    setupScrollSpy();
});

/* =========================
   COPY CODE FUNCTIONALITY
========================= */
function copyCode(button, codeId) {
    const codeElement = document.getElementById(codeId);
    const code = codeElement.textContent;
    
    navigator.clipboard.writeText(code).then(() => {
        // Change button text temporarily
        const originalText = button.textContent;
        button.textContent = '✅ Copied!';
        button.classList.add('copied');
        
        setTimeout(() => {
            button.textContent = originalText;
            button.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
        alert('Gagal menyalin kode. Silakan copy manual.');
    });
}

/* =========================
   SMOOTH SCROLL
========================= */
function setupSmoothScroll() {
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            const targetId = link.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                // Remove active class from all links
                document.querySelectorAll('.sidebar-link').forEach(l => {
                    l.classList.remove('active');
                });
                
                // Add active class to clicked link
                link.classList.add('active');
                
                // Smooth scroll to target
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

/* =========================
   SCROLL SPY
========================= */
function setupScrollSpy() {
    const sections = document.querySelectorAll('.docs-section');
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    
    const observerOptions = {
        root: null,
        rootMargin: '-20% 0px -75% 0px',
        threshold: 0
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                
                // Remove active class from all links
                sidebarLinks.forEach(link => {
                    link.classList.remove('active');
                });
                
                // Add active class to corresponding link
                const activeLink = document.querySelector(`.sidebar-link[href="#${id}"]`);
                if (activeLink) {
                    activeLink.classList.add('active');
                }
            }
        });
    }, observerOptions);
    
    sections.forEach(section => {
        observer.observe(section);
    });
}

/* =========================
   SEARCH FUNCTIONALITY (Optional Enhancement)
========================= */
function initSearch() {
    const searchInput = document.getElementById('docsSearch');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const sections = document.querySelectorAll('.docs-section');
        
        sections.forEach(section => {
            const text = section.textContent.toLowerCase();
            if (text.includes(query)) {
                section.style.display = 'block';
            } else {
                section.style.display = 'none';
            }
        });
    });
}

/* =========================
   COPY ALL CODE IN SECTION
========================= */
function copyAllCode(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;
    
    const codeBlocks = section.querySelectorAll('pre code');
    let allCode = '';
    
    codeBlocks.forEach((block, index) => {
        if (index > 0) allCode += '\n\n';
        allCode += block.textContent;
    });
    
    navigator.clipboard.writeText(allCode).then(() => {
        alert('✅ Semua kode berhasil disalin!');
    });
}

/* =========================
   KEYBOARD SHORTCUTS
========================= */
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K to focus search (if search exists)
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('docsSearch');
        if (searchInput) searchInput.focus();
    }
    
    // ESC to clear search
    if (e.key === 'Escape') {
        const searchInput = document.getElementById('docsSearch');
        if (searchInput) {
            searchInput.value = '';
            searchInput.blur();
            // Show all sections
            document.querySelectorAll('.docs-section').forEach(section => {
                section.style.display = 'block';
            });
        }
    }
});