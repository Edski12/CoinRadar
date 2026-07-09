const navItems = [
    { label: 'Coins', href: 'coins.html', key: 'coins' },
    { label: 'Watchlist', href: 'watchlist.html', key: 'watchlist' },
    { label: 'Settings', href: 'settings.html', key: 'settings' }
];

function assetPath(path) {
    return window.location.pathname.includes('/pages/') ? `../${path}` : path;
}

function pageHref(href) {
    if (href === 'index.html') return window.location.pathname.includes('/pages/') ? '../index.html' : 'index.html';
    return window.location.pathname.includes('/pages/') ? href : `pages/${href}`;
}

function navLinks(extraClass = '') {
    return navItems.map(item => `
        <li class="nav-item mb-2">
            <a class="nav-link text-dark ${extraClass}" href="${pageHref(item.href)}" data-nav="${item.key}">
                <span class="nav-indicator" aria-hidden="true">&larr;</span>
                <span>${item.label}</span>
            </a>
        </li>
    `).join('');
}

export function renderNav() {
    const mobileTarget = document.querySelector('[data-cr-nav]');
    const sidebarTarget = document.querySelector('[data-cr-sidebar]');

    if (mobileTarget) {
        mobileTarget.innerHTML = `
            <nav class="navbar navbar-light bg-light border-bottom d-lg-none">
                <div class="container-fluid">
                    <a class="navbar-brand d-flex align-items-center mb-0" href="${pageHref('index.html')}">
                        <img src="${assetPath('assets/images/coinradarIcon.png')}" alt="Coin Radar logo" class="brand-icon-sm me-2">
                        <span class="fw-bold fst-italic">Coin Radar</span>
                    </a>
                    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#sidebarMenu"
                        aria-controls="sidebarMenu" aria-expanded="false" aria-label="Toggle navigation">
                        <span class="navbar-toggler-icon"></span>
                    </button>
                </div>
                <div class="collapse" id="sidebarMenu">
                    <ul class="nav flex-column sidebar-nav p-3">${navLinks('mobile-nav-link')}</ul>
                </div>
            </nav>
        `;
    }

    if (sidebarTarget) {
        sidebarTarget.innerHTML = `
            <aside class="bg-light border-end p-4 h-100">
                <a href="${pageHref('index.html')}" class="d-flex align-items-center mb-4 text-dark text-decoration-none">
                    <img src="${assetPath('assets/images/coinradarIcon.png')}" alt="Coin Radar logo" class="brand-icon me-2">
                    <span class="fw-bold h5 mb-0 fst-italic">Coin Radar</span>
                </a>
                <ul class="nav flex-column sidebar-nav">${navLinks()}</ul>
            </aside>
        `;
    }

    activateCurrentNav();
}

function activateCurrentNav() {
    const currentPage = window.location.pathname.split('/').pop().toLowerCase() || 'index.html';
    const mobileMenu = document.getElementById('sidebarMenu');

    document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => {
        const target = link.getAttribute('href').split('/').pop().split('?')[0].toLowerCase();
        const isActive = currentPage === target;
        link.classList.toggle('active', isActive);

        link.addEventListener('click', event => {
            if (window.innerWidth < 992 && mobileMenu && window.bootstrap) {
                window.bootstrap.Collapse.getOrCreateInstance(mobileMenu).hide();
            }

            if (link.classList.contains('active')) {
                event.preventDefault();
            }
        });
    });
}
