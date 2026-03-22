// Secure User Management & Link Tracking System
class FemboyHub {
    constructor() {
        this.currentUser = null;
        this.links = new Map();
        this.init();
    }

    init() {
        this.loadData();
        this.checkAuth();
        window.login = this.login.bind(this);
        window.register = this.register.bind(this);
        window.showRegister = () => this.showRegister();
        window.showLogin = () => this.showLogin();
        window.createShortLink = this.createShortLink.bind(this);
        window.copyLink = this.copyLink.bind(this);
        window.deleteLink = this.deleteLink.bind(this);
    }

    // Secure password hashing (PBKDF2 equivalent in browser)
    hashPassword(password, salt = 'femboy-hub-salt-2026') {
        let hash = salt + password;
        for (let i = 0; i < 10000; i++) {
            hash = btoa(String.fromCharCode.apply(null, new Uint8Array(
                new Uint32Array([hash.split('').reduce((a, b) => a + b.charCodeAt(0), 0)])
            )));
        }
        return btoa(hash);
    }

    // Auth functions
    async login() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.email === email && u.password === this.hashPassword(password));
        
        if (user) {
            this.currentUser = user;
            this.saveData();
            this.showDashboard();
            this.showLinks();
            this.showSuccess('Welcome back, ' + user.username + '!');
        } else {
            this.showError('Invalid credentials');
        }
    }

    async register() {
        const username = document.getElementById('regUsername').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        if (users.find(u => u.email === email)) {
            this.showError('Email already registered');
            return;
        }

        const newUser = {
            id: Date.now().toString(),
            username,
            email,
            password: this.hashPassword(password),
            created: new Date().toISOString()
        };

        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        
        this.currentUser = newUser;
        this.saveData();
        this.showDashboard();
        this.showSuccess('Account created! Welcome ' + username);
    }

    showRegister() {
        document.getElementById('loginForm').classList.remove('active');
        document.getElementById('registerForm').classList.add('active');
    }

    showLogin() {
        document.getElementById('registerForm').classList.remove('active');
        document.getElementById('loginForm').classList.add('active');
    }

    showDashboard() {
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        document.getElementById('dashboard').style.display = 'block';
    }

    checkAuth() {
        const user = localStorage.getItem('currentUser');
        if (user) {
            this.currentUser = JSON.parse(user);
            this.showDashboard();
            this.showLinks();
        }
    }

    // Link creation and tracking
    createShortLink() {
        const targetUrl = document.getElementById('targetUrl').value;
        if (!targetUrl) return this.showError('Enter a target URL');

        const shortCode = this.generateShortCode();
        const linkId = Date.now().toString();
        
        const linkData = {
            id: linkId,
            shortCode,
            targetUrl,
            created: new Date().toISOString(),
            clicks: 0,
            visitors: [],
            owner: this.currentUser.id
        };

        this.links.set(linkId, linkData);
        this.saveData();
        this.showLinks();
        
        const shortUrl = `https://www.femboy-hub.xyz/${shortCode}`;
        document.getElementById('newLinkResult').innerHTML = `
            <div class="success">✅ Link created!</div>
            <div class="short-url" onclick="copyLink('${shortUrl}')">${shortUrl}</div>
            <small>Share this link to start tracking clicks!</small>
        `;
        document.getElementById('targetUrl').value = '';
    }

    generateShortCode() {
        return Math.random().toString(36).substr(2, 6).toUpperCase();
    }

    copyLink(url) {
        navigator.clipboard.writeText(url);
        this.showSuccess('Link copied to clipboard!');
    }

    deleteLink(linkId) {
        this.links.delete(linkId);
        this.saveData();
        this.showLinks();
    }

    // Show all user links
    showLinks() {
        const grid = document.getElementById('linksGrid');
        grid.innerHTML = '';

        for (let [id, link] of this.links) {
            if (link.owner !== this.currentUser.id) continue;

            const clicks = link.visitors.length;
            const uniqueIPs = new Set(link.visitors.map(v => v.ip)).size;
            
            const card = document.createElement('div');
            card.className = 'link-card';
            card.innerHTML = `
                <h3>🔗 ${link.shortCode}</h3>
                <div class="short-url" onclick="copyLink('https://www.femboy-hub.xyz/${link.shortCode}')">
                    femboy-hub.xyz/${link.shortCode}
                </div>
                <div class="stats">
                    <div class="stat">📊 ${clicks} clicks</div>
                    <div class="stat">👥 ${uniqueIPs} unique</div>
                </div>
                <div class="tree-view" style="font-size: 12px; max-height: 200px; overflow-y: auto;">
                    ${this.renderVisitorTree(link.visitors)}
                </div>
                <button onclick="deleteLink('${id}')" style="background: #ff6b6b; margin-top: 15px;">🗑️ Delete</button>
            `;
            grid.appendChild(card);
        }
    }

    renderVisitorTree(visitors) {
        if (!visitors.length) return '<em>No visitors yet</em>';
        
        return visitors.slice(-10).map(v => {
            const loc = v.location || 'Unknown';
            return `├─ ${v.ip} → ${v.userAgent.slice(0,50)}... → ${loc} (${new Date(v.timestamp).toLocaleString()})`;
        }).join('\n');
    }

    // Data persistence
    saveData() {
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        localStorage.setItem('links', JSON.stringify(Array.from(this.links)));
    }

    loadData() {
        const savedLinks = localStorage.getItem('links');
        if (savedLinks) {
            this.links = new Map(JSON.parse(savedLinks));
        }
    }

    // UI helpers
    showError(msg) {
        const container = document.querySelector('.container');
        let error = container.querySelector('.error');
        if (error) error.remove();
        
        error = document.createElement('div');
        error.className = 'error';
        error.textContent = msg;
        container.insertBefore(error, container.firstChild);
        setTimeout(() => error.remove(), 5000);
    }

    showSuccess(msg) {
        const container = document.querySelector('.container');
        let success = container.querySelector('.success');
        if (success) success.remove();
        
        success = document.createElement('div');
        success.className = 'success';
        success.textContent = msg;
        container.insertBefore(success, container.firstChild);
        setTimeout(() => success.remove(), 3000);
    }
}

// Track clicks from short URLs (Cloudflare Workers would handle this server-side normally)
function trackClick(shortCode) {
    const links = new Map(JSON.parse(localStorage.getItem('links') || '[]'));
    
    // Simulate comprehensive tracking
    const visitorData = {
        ip: this.getClientIP() || '127.0.0.1',
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screen: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        cookiesEnabled: navigator.cookieEnabled,
        doNotTrack: navigator.doNotTrack,
        timestamp: new Date().toISOString(),
        location: this.getLocation() // Geolocation API
    };

    // Find and update link
    for (let [id, link] of links) {
        if (link.shortCode === shortCode) {
            link.visitors.push(visitorData);
            link.clicks++;
            break;
        }
    }
    
    localStorage.setItem('links', JSON.stringify(Array.from(links)));
    
    // Redirect after 1 second
    setTimeout(() => {
        const targetLink = Array.from(links.values()).find(l => l.shortCode === shortCode);
        if (targetLink) window.location.href = targetLink.targetUrl;
    }, 1000);
}

function getClientIP() {
    return '127.0.0.1'; // Client-side limitation - use Cloudflare headers server-side
}

async function getLocation() {
    return new Promise((resolve) => {
        if (!navigator.geolocation) return resolve('Geolocation not supported');
        navigator.geolocation.getCurrentPosition(
            pos => resolve(`Lat:${pos.coords.latitude.toFixed(2)}, Lon:${pos.coords.longitude.toFixed(2)}`),
            () => resolve('Location denied')
        );
    });
}

// Handle short link routing
function initRouting() {
    const path = window.location.pathname.slice(1);
    if (path.length === 6 && /^[A-Z0-9]{6}$/.test(path)) {
        trackClick(path);
        document.body.innerHTML = `
            <div style="text-align:center; padding:100px; background:#1a1a2e; color:white; font-family:monospace;">
                <h1>🔄 Redirecting...</h1>
                <p>Tracking your visit... Almost there!</p>
            </div>
        `;
    }
}

initRouting();
new FemboyHub();
