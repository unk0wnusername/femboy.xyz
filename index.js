class LinkHub {
    constructor() {
        this.db = {
            users: JSON.parse(localStorage.getItem('linkhub_users')) || [],
            links: JSON.parse(localStorage.getItem('linkhub_links')) || [],
            visits: JSON.parse(localStorage.getItem('linkhub_visits')) || {}
        };
        this.currentUser = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkAuth();
        this.updateStats();
    }

    bindEvents() {
        // Auth events
        document.getElementById('authForm').addEventListener('submit', (e) => this.handleAuth(e));
        document.getElementById('toggleAuth').addEventListener('click', () => this.toggleAuthMode());
        
        // Dashboard events
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        document.getElementById('createLinkBtn').addEventListener('click', () => this.createShortLink());
        document.getElementById('randomLinkBtn').addEventListener('click', () => this.generateRandomLink());
        document.getElementById('copyShortUrl').addEventListener('click', () => this.copyShortUrl());
        document.getElementById('searchLinks').addEventListener('input', debounce(() => this.renderLinks(), 300));
        document.getElementById('refreshLinks').addEventListener('click', () => this.renderLinks());
        document.getElementById('closeDetailsModal').addEventListener('click', () => this.closeDetailsModal());
        
        // Global click tracking
        window.addEventListener('click', (e) => {
            if (e.target.matches('[data-link-id]')) {
                const linkId = e.target.closest('[data-link-id]').dataset.linkId;
                this.showLinkDetails(linkId);
            }
        });
    }

    // Secure auth with PBKDF2 hashing
    hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const key = crypto.subtle.importKey('raw', data, { name: 'PBKDF2' }, false, ['deriveBits']);
        return crypto.subtle.deriveBits(
            { name: 'PBKDF2', salt: encoder.encode('linkhub-salt-2026'), iterations: 100000, hash: 'SHA-256' },
            key, 256
        ).then(buffer => Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join(''));
    }

    async handleAuth(e) {
        e.preventDefault();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const isLogin = document.getElementById('authBtnText').textContent === 'Login';

        if (!username || !password) return;

        const hash = await this.hashPassword(password);
        let user = this.db.users.find(u => u.username === username && u.hash === hash);

        if (isLogin) {
            if (!user) {
                this.showMessage('Invalid credentials', 'error');
                return;
            }
        } else {
            if (this.db.users.find(u => u.username === username)) {
                this.showMessage('Username already exists', 'error');
                return;
            }
            user = { username, hash, created: Date.now(), links: [] };
            this.db.users.push(user);
        }

        this.login(user);
        this.saveData();
    }

    toggleAuthMode() {
        const isLogin = document.getElementById('authBtnText').textContent === 'Login';
        document.getElementById('authBtnText').textContent = isLogin ? 'Register' : 'Login';
        document.getElementById('toggleText').textContent = isLogin ? 'Login' : 'Register';
    }

    login(user) {
        this.currentUser = user;
        document.getElementById('currentUser').textContent = user.username;
        document.getElementById('authModal').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        this.renderLinks();
        this.updateStats();
    }

    logout() {
        this.currentUser = null;
        document.getElementById('authModal').classList.remove('hidden');
        document.getElementById('dashboard').classList.add('hidden');
        document.getElementById('authForm').reset();
        document.getElementById('authBtnText').textContent = 'Login';
        document.getElementById('toggleText').textContent = 'Register';
    }

    checkAuth() {
        const savedUser = localStorage.getItem('linkhub_current_user');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            document.getElementById('currentUser').textContent = this.currentUser.username;
            document.getElementById('authModal').classList.add('hidden');
            document.getElementById('dashboard').classList.remove('hidden');
            this.renderLinks();
            this.updateStats();
        }
    }

    async createShortLink() {
        const url = document.getElementById('originalUrl').value.trim();
        if (!this.isValidUrl(url)) {
            this.showMessage('Please enter a valid URL', 'error');
            return;
        }

        const linkId = this.generateLinkId();
        const shortUrl = `${window.location.origin}/#${linkId}`;
        
        const link = {
            id: linkId,
            originalUrl: url,
            shortUrl,
            user: this.currentUser.username,
            created: Date.now(),
            clicks: 0,
            uniqueIPs: new Set()
        };

        this.db.links.push(link);
        this.currentUser.links = this.currentUser.links || [];
        this.currentUser.links.push(linkId);
        this.saveData();

        document.getElementById('shortUrl').textContent = shortUrl;
        document.getElementById('shortLinkResult').classList.remove('hidden');
        document.getElementById('originalUrl').value = '';
        this.renderLinks();
        this.updateStats();

        this.showMessage('Short link created successfully!', 'success');
    }

    generateRandomLink() {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        window.history.pushState({}, '', `/#${result}`);
        document.getElementById('originalUrl').focus();
    }

    generateLinkId() {
        return 'lh_' + Math.random().toString(36).substr(2, 9);
    }

    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    copyShortUrl() {
        const shortUrl = document.getElementById('shortUrl').textContent;
        navigator.clipboard.writeText(shortUrl).then(() => {
            const btn = document.getElementById('copyShortUrl');
            const original = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => btn.innerHTML = original, 2000);
        });
    }

    renderLinks(filter = '') {
        const tbody = document.getElementById('linksTableBody');
        const userLinks = this.db.links.filter(link => 
            link.user === this.currentUser.username &&
            (filter === '' || link.shortUrl.includes(filter) || link.originalUrl.includes(filter))
        ).sort((a, b) => b.created - a.created);

        if (userLinks.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="py-12 text-center text-[var(--text-secondary)]">No links yet. Create your first short link above!</td></tr>';
            return;
        }

        tbody.innerHTML = userLinks.map(link => `
            <tr class="border-b border-[var(--border)] hover:bg-[var(--glass)] transition-all group" data-link-id="${link.id}">
                <td class="py-4 pr-6 font-mono">
                    <div class="flex items-center space-x-2">
                        <span class="text-[var(--accent)] font-bold">${link.shortUrl.split('/').pop()}</span>
                        <button class="opacity-0 group-hover:opacity-100 p-1 hover:bg-[var(--accent)] hover:text-black rounded transition-all" onclick="navigator.clipboard.writeText('${link.shortUrl}')">
                            <i class="fas fa-copy text-xs"></i>
                        </button>
                    </div>
                </td>
                <td class="py-4 px-6 max-w-xs truncate text-[var(--text-secondary)] hidden md:table-cell">${link.originalUrl}</td>
                <td class="py-4 px-6">
                    <span class="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium">${link.clicks}</span>
                </td>
                <td class="py-4 px-6 text-[var(--text-secondary)] text-sm">${this.formatDate(link.created)}</td>
                <td class="py-4 pl-6">
                    <button class="text-[var(--accent)] hover:text-[var(--accent-hover)] p-2 transition-all" data-link-id="${link.id}" title="View analytics">
                        <i class="fas fa-chart-bar"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    showLinkDetails(linkId) {
        const link = this.db.links.find(l => l.id === linkId);
        if (!link) return;

        const visits = this.db.visits[linkId] || [];
        document.getElementById('linkDetailsContent').innerHTML = this.renderLinkDetails(link, visits);
        document.getElementById('linkDetailsModal').classList.remove('hidden');
    }

    renderLinkDetails(link, visits) {
        const uniqueIPs = new Set(visits.map(v => v.ip)).size;
        return `
            <div class="space-y-8">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 p-6 glass rounded-2xl">
                    <div class="text-center">
                        <div class="text-3xl font-bold text-[var(--accent)]">${link.clicks}</div>
                        <div class="text-[var(--text-secondary)]">Total Clicks</div>
                    </div>
                    <div class="text-center">
                        <div class="text-3xl font-bold text-blue-400">${uniqueIPs}</div>
                        <div class="text-[var(--text-secondary)]">Unique IPs</div>
                    </div>
                    <div class="text-center">
                        <div class="text-3xl font-bold text-green-400">${visits.length}</div>
                        <div class="text-[var(--text-secondary)]">Visit Records</div>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div class="glass rounded-2xl p-6">
                        <h3 class="font-bold text-lg mb-4 flex items-center"><i class="fas fa-link mr-2 text-[var(--accent)]"></i>Link Info</h3>
                        <div class="space-y-3">
                            <div><span class="text-[var(--text-secondary)]">Short:</span> <span class="font-mono text-[var(--accent)]">${link.shortUrl}</span></div>
                            <div><span class="text-[var(--text-secondary)]">Original:</span> <a href="${link.originalUrl}" target="_blank" class="font-mono hover:text-[var(--accent)]">${link.originalUrl}</a></div>
                            <div><span class="text-[var(--text-secondary)]">Created:</span> ${this.formatDate(link.created)}</div>
                        </div>
                    </div>

                    <div class="glass rounded-2xl p-6">
                        <h3 class="font-bold text-lg mb-4 flex items-center"><i class="fas fa-clock mr-2 text-[var(--accent)]"></i>Recent Activity</h3>
                        <div class="space-y-2 max-h-64 overflow-y-auto">
                            ${visits.slice(0, 10).map(visit => `
                                <div class="flex items-center justify-between p-3 hover:bg-[var(--glass)] rounded-xl transition-all">
                                    <div class="flex items-center space-x-3">
                                        <div class="w-10 h-10 bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] rounded-xl flex items-center justify-center text-black font-bold text-sm">${visit.ua.slice(0,2).toUpperCase()}</div>
                                        <div>
                                            <div class="font-mono text-sm">${visit.ip}</div>
                                            <div class="text-[var(--text-secondary)] text-xs">${visit.location || 'Unknown'} • ${this.formatDate(visit.timestamp)}</div>
                                        </div>
                                    </div>
                                    <div class="text-right">
                                        <div class="text-xs text-[var(--text-secondary)]">${visit.device}</div>
                                        <div class="text-xs font-mono">${visit.ua.split(' ')[0]}</div>
                                    </div>
                                </div>
                            `).join('') || '<div class="text-center py-8 text-[var(--text-secondary)]">No visits yet</div>'}
                        </div>
                    </div>
                </div>

                ${visits.length > 0 ? `
                <div class="glass rounded-2xl p-6">
                    <h3 class="font-bold text-lg mb-6 flex items-center"><i class="fas fa-list mr-2 text-[var(--accent)]"></i>All Visits (${visits.length})</h3>
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead>
                                <tr class="border-b border-[var(--border)]">
                                    <th class="text-left py-3 px-4 font-medium">IP Address</th>
                                    <th class="text-left py-3 px-4 font-medium">Location</th>
                                    <th class="text-left py-3 px-4 font-medium">User Agent</th>
                                    <th class="text-left py-3 px-4 font-medium">Device</th>
                                    <th class="text-left py-3 px-4 font-medium">Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${visits.map(visit => `
                                    <tr class="border-b border-[var(--border)] hover:bg-[var(--glass)]">
                                        <td class="py-3 px-4 font-mono">${visit.ip}</td>
                                        <td class="py-3 px-4">${visit.location || 'Unknown'}</td>
                                        <td class="py-3 px-4 max-w-xs truncate">${visit.ua}</td>
                                        <td class="py-3 px-4">${visit.device}</td>
                                        <td class="py-3 px-4 text-[var(--text-secondary)] text-sm">${this.formatDate(visit.timestamp)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
                ` : ''}
            </div>
        `;
    }

    closeDetailsModal() {
        document.getElementById('linkDetailsModal').classList.add('hidden');
    }

    updateStats() {
        const userLinks = this.db.links.filter(l => l.user === this.currentUser.username);
        const totalClicks = userLinks.reduce((sum, link) => sum + link.clicks, 0);
        const uniqueIPs = new Set(userLinks.flatMap(link => Array.from((this.db.visits[link.id] || []).map(v => v.ip)))).size;

        document.getElementById('totalLinks').textContent = userLinks.length;
        document.getElementById('totalClicks').textContent = totalClicks;
        document.getElementById('uniqueIPs').textContent = uniqueIPs;
    }

    formatDate(timestamp) {
        return new Date(timestamp).toLocaleString();
    }

    showMessage(message, type = 'info') {
        // Simple toast notification
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 p-4 rounded-xl shadow-2xl z-50 transition-all transform translate-x-full ${type === 'success' ? 'bg-green-500/20 border-green-500/30 text-green-300 border' : 'bg-red-500/20 border-red-500/30 text-red-300 border'}`;
        toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-2"></i>${message}`;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.remove('translate-x-full'), 100);
        setTimeout(() => {
            toast.classList.add('translate-x-full');
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    }

    saveData() {
        localStorage.setItem('linkhub_users', JSON.stringify(this.db.users));
        localStorage.setItem('linkhub_links', JSON.stringify(this.db.links));
        localStorage.setItem('linkhub_visits', JSON.stringify(this.db.visits));
        if (this.currentUser) {
            localStorage.setItem('linkhub_current_user', JSON.stringify(this.currentUser));
        }
    }
}

// Track clicks from hash links
function trackVisit(linkId) {
    if (!linkId) return;
    
    const link = window.linkHub?.db.links.find(l => l.id === linkId);
    if (!link) return;

    const visit = {
        ip: '127.0.0.1', // Client-side demo - use backend API for real IP
        ua: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screen: `${screen.width}x${screen.height}`,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timestamp: Date.now(),
        location: 'Demo Location', // Use IP geolocation API in production
        device: /Mobi|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
        referrer: document.referrer
    };

    if (!window.linkHub.db.visits[linkId]) {
        window.linkHub.db.visits[linkId] = [];
    }
    window.linkHub.db.visits[linkId].push(visit);

    // Update link stats
    link.clicks++;
    const ipSet = window.linkHub.db.links.find(l => l.id === linkId).uniqueIPs;
    ipSet.add(visit.ip);

    window.linkHub.saveData();
    
    // Redirect after short delay
    setTimeout(() => {
        window.location.href = link.originalUrl;
    }, 1500);
}

// Initialize app
const linkHub = window.linkHub = new LinkHub();

// Handle hash links for tracking
window.addEventListener('hashchange', () => {
    const linkId = window.location.hash.slice(1);
    if (linkId.startsWith('lh_')) {
        trackVisit(linkId);
    }
});

// Check initial hash
if (window.location.hash.startsWith('#lh_')) {
    trackVisit(window.location.hash.slice(1));
}

// Utility function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
                }
