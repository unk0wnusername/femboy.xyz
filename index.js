// ─── THEMES ────────────────────────────────────────────────────────────────────
const THEMES = {
  midnight: { name:'Midnight', grad:'linear-gradient(135deg,#05050f,#0a0820)', accent:'#c084fc', text:'#f1f0ff', muted:'rgba(241,240,255,0.45)', border:'rgba(192,132,252,0.14)', linkBg:'rgba(255,255,255,0.04)', avatarGrad:'linear-gradient(135deg,#c084fc,#818cf8)' },
  rose:     { name:'Rose',     grad:'linear-gradient(135deg,#0f050a,#1a0810)', accent:'#fb7185', text:'#fff1f2', muted:'rgba(255,241,242,0.45)', border:'rgba(251,113,133,0.14)', linkBg:'rgba(255,255,255,0.04)', avatarGrad:'linear-gradient(135deg,#fb7185,#f43f5e)' },
  ocean:    { name:'Ocean',    grad:'linear-gradient(135deg,#020c14,#050f1f)', accent:'#38bdf8', text:'#f0f9ff', muted:'rgba(240,249,255,0.45)', border:'rgba(56,189,248,0.14)',  linkBg:'rgba(255,255,255,0.04)', avatarGrad:'linear-gradient(135deg,#38bdf8,#0ea5e9)' },
  forest:   { name:'Forest',   grad:'linear-gradient(135deg,#030c05,#061508)', accent:'#4ade80', text:'#f0fdf4', muted:'rgba(240,253,244,0.45)', border:'rgba(74,222,128,0.14)',  linkBg:'rgba(255,255,255,0.04)', avatarGrad:'linear-gradient(135deg,#4ade80,#16a34a)' },
  amber:    { name:'Amber',    grad:'linear-gradient(135deg,#0f0900,#1a1000)', accent:'#fbbf24', text:'#fffbeb', muted:'rgba(255,251,235,0.45)', border:'rgba(251,191,36,0.14)',  linkBg:'rgba(255,255,255,0.04)', avatarGrad:'linear-gradient(135deg,#fbbf24,#d97706)' },
  mono:     { name:'Mono',     grad:'linear-gradient(135deg,#080808,#111)',    accent:'#e5e5e5', text:'#f5f5f5', muted:'rgba(245,245,245,0.4)',  border:'rgba(255,255,255,0.1)',   linkBg:'rgba(255,255,255,0.04)', avatarGrad:'linear-gradient(135deg,#ccc,#888)' },
};

// ─── STORAGE ───────────────────────────────────────────────────────────────────
const getUsers   = () => { try { return JSON.parse(localStorage.getItem('fh_users') || '{}'); } catch { return {}; } };
const saveUsers  = u  => localStorage.setItem('fh_users', JSON.stringify(u));
const getSession = () => localStorage.getItem('fh_session');
const setSession = u  => u ? localStorage.setItem('fh_session', u) : localStorage.removeItem('fh_session');
const getUser    = u  => { const all = getUsers(); return all[u.toLowerCase()] || null; };

function updateUser(username, data) {
  const all = getUsers(), k = username.toLowerCase();
  if (!all[k]) return;
  Object.assign(all[k], data);
  saveUsers(all);
}

function createUser(username, password) {
  const all = getUsers(), k = username.toLowerCase();
  if (all[k]) return false;
  all[k] = {
    username: k, displayName: username, password: btoa(password),
    bio: '', avatar: '', pronouns: '', location: '',
    links: [], theme: 'midnight', createdAt: Date.now(),
  };
  saveUsers(all);
  return true;
}

// ─── ROUTING ───────────────────────────────────────────────────────────────────
// Cloudflare Pages + the _redirects file sends ALL paths to index.html.
// We read window.location.pathname to figure out which "page" to show.

const RESERVED = new Set(['login', 'register', 'dashboard', 'index.html', '']);

function getSlug() {
  return window.location.pathname.replace(/^\/+/, '').replace(/\/+$/, '').toLowerCase();
}

function navigate(path) {
  window.history.pushState({}, '', path ? '/' + path : '/');
  route();
}

function route() {
  const slug = getSlug();
  const sess = getSession();

  if (!slug)              { sess ? openDashboard() : showPage('home');  return; }
  if (slug === 'login')   { sess ? openDashboard() : showPage('login'); return; }
  if (slug === 'register'){ sess ? openDashboard() : showPage('register'); return; }
  if (slug === 'dashboard'){ sess ? openDashboard() : showPage('login'); return; }

  // Try to load a user profile page (e.g. /reagentc)
  const user = getUser(slug);
  if (user) { renderPublicProfile(user); return; }

  showPage('404');
}

function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const el = document.getElementById('page-' + name);
  if (el) el.classList.add('active');
  window.scrollTo(0, 0);
}

window.addEventListener('popstate', route);

// ─── AUTH ──────────────────────────────────────────────────────────────────────
function doLogin() {
  const u   = document.getElementById('login-user').value.trim().toLowerCase();
  const p   = document.getElementById('login-pass').value;
  const err = document.getElementById('login-err');
  err.classList.remove('show');
  const user = getUser(u);
  if (!user || atob(user.password) !== p) { err.classList.add('show'); return; }
  setSession(u);
  navigate('dashboard');
}

function doRegister() {
  const u   = document.getElementById('reg-user').value.trim().toLowerCase();
  const p   = document.getElementById('reg-pass').value;
  const p2  = document.getElementById('reg-pass2').value;
  const err = document.getElementById('reg-err');
  err.classList.remove('show');

  if (!u || u.length < 2)                   { showErr(err, 'Username must be at least 2 characters.'); return; }
  if (!/^[a-z0-9_-]+$/.test(u))             { showErr(err, 'Only letters, numbers, - and _ allowed.'); return; }
  if (RESERVED.has(u))                       { showErr(err, 'That username is reserved.'); return; }
  if (p.length < 6)                          { showErr(err, 'Password must be at least 6 characters.'); return; }
  if (p !== p2)                              { showErr(err, 'Passwords do not match.'); return; }
  if (!createUser(u, p))                     { showErr(err, 'Username is already taken.'); return; }

  setSession(u);
  navigate('dashboard');
}

function showErr(el, msg) { el.textContent = msg; el.classList.add('show'); }

function doLogout() { setSession(null); navigate(''); }

// ─── DASHBOARD ─────────────────────────────────────────────────────────────────
let pickedTheme = 'midnight';
let pickedEmoji = '🔗';

function openDashboard() {
  const sess = getSession();
  if (!sess) { showPage('login'); return; }
  const user = getUser(sess);

  document.getElementById('sb-name').textContent  = user.displayName || user.username;
  document.getElementById('sb-slug').textContent   = user.username;
  document.getElementById('copy-slug').textContent = user.username;

  showPage('dashboard');
  switchSection('overview');
  refreshStats();
  loadProfileForm();
  renderLinks();
  renderThemeGrid();
}

function switchSection(name) {
  document.querySelectorAll('.dash-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.sb-item').forEach(s => s.classList.remove('active'));
  document.getElementById('section-' + name).classList.add('active');
  const nav = document.getElementById('nav-' + name);
  if (nav) nav.classList.add('active');
}

function refreshStats() {
  const user = getUser(getSession());
  if (!user) return;
  document.getElementById('stat-links').textContent = (user.links || []).length;
  document.getElementById('stat-theme').textContent = (THEMES[user.theme] || THEMES.midnight).name;
}

// ─── PROFILE EDITOR ────────────────────────────────────────────────────────────
function loadProfileForm() {
  const user = getUser(getSession());
  if (!user) return;
  document.getElementById('edit-display').value  = user.displayName || '';
  document.getElementById('edit-bio').value      = user.bio        || '';
  document.getElementById('edit-avatar').value   = user.avatar     || '';
  document.getElementById('edit-pronouns').value = user.pronouns   || '';
  document.getElementById('edit-location').value = user.location   || '';
  livePreview();
}

function livePreview() {
  const display = document.getElementById('edit-display').value || getSession() || '?';
  const bio     = document.getElementById('edit-bio').value     || 'No bio yet';
  const avatar  = document.getElementById('edit-avatar').value.trim();
  document.getElementById('pv-name').textContent = display;
  document.getElementById('pv-bio').textContent  = bio;
  const av = document.getElementById('av-preview');
  const init = (display[0] || '?').toUpperCase();
  if (avatar) {
    av.innerHTML = `<img src="${avatar}" onerror="this.style.display='none';this.parentElement.textContent='${init}'">`;
  } else {
    av.textContent = init;
  }
}

function saveProfile() {
  const sess    = getSession();
  const display = document.getElementById('edit-display').value.trim() || sess;
  updateUser(sess, {
    displayName: display,
    bio:         document.getElementById('edit-bio').value.trim(),
    avatar:      document.getElementById('edit-avatar').value.trim(),
    pronouns:    document.getElementById('edit-pronouns').value.trim(),
    location:    document.getElementById('edit-location').value.trim(),
  });
  document.getElementById('sb-name').textContent = display;
  refreshStats();
  toast('Profile saved ✓');
}

// ─── LINKS ─────────────────────────────────────────────────────────────────────
const EMOJIS = ['🔗','🐦','💬','🎮','🎵','📺','📸','💻','✉️','🌐','🎨','📱','🌙','⚡','🔥','💜','❤️','🎯','🏠','🎲','🦋','🌸','✨','👾','🚀','🦊','💎','🌈','🍀','🎀'];

function renderEmojiGrid() {
  document.getElementById('emoji-grid').innerHTML = EMOJIS.map(e =>
    `<div class="eq${e === pickedEmoji ? ' sel' : ''}" onclick="pickEmoji('${e}')">${e}</div>`
  ).join('');
}

function pickEmoji(e) { pickedEmoji = e; renderEmojiGrid(); }

function toggleAddLink() {
  const f = document.getElementById('add-form');
  f.classList.toggle('show');
  if (f.classList.contains('show')) {
    pickedEmoji = '🔗';
    renderEmojiGrid();
    document.getElementById('new-title').value = '';
    document.getElementById('new-url').value   = '';
  }
}

function addLink() {
  const title = document.getElementById('new-title').value.trim();
  let   url   = document.getElementById('new-url').value.trim();
  if (!title || !url) { toast('Please fill in both fields'); return; }
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

  const sess  = getSession();
  const user  = getUser(sess);
  const links = user.links || [];
  links.push({ id: Date.now(), icon: pickedEmoji, title, url });
  updateUser(sess, { links });
  renderLinks();
  toggleAddLink();
  refreshStats();
  toast('Link added ✓');
}

function removeLink(idx) {
  const sess = getSession(), user = getUser(sess);
  user.links.splice(idx, 1);
  updateUser(sess, { links: user.links });
  renderLinks(); refreshStats();
}

function moveLink(idx, dir) {
  const sess = getSession(), user = getUser(sess);
  const ni = idx + dir;
  if (ni < 0 || ni >= user.links.length) return;
  [user.links[ni], user.links[idx]] = [user.links[idx], user.links[ni]];
  updateUser(sess, { links: user.links });
  renderLinks();
}

function renderLinks() {
  const user  = getUser(getSession());
  const list  = document.getElementById('links-list');
  const links = user.links || [];
  if (!links.length) {
    list.innerHTML = '<div style="color:var(--muted);font-size:.84rem;padding:.4rem 0 .9rem">No links yet — add your first one below!</div>';
    return;
  }
  list.innerHTML = links.map((l, i) => `
    <div class="link-item">
      <div class="li-icon">${l.icon}</div>
      <div class="li-info">
        <div class="li-title">${l.title}</div>
        <div class="li-url">${l.url}</div>
      </div>
      <div class="li-actions">
        <button class="btn btn-ghost btn-sm" onclick="moveLink(${i},-1)">↑</button>
        <button class="btn btn-ghost btn-sm" onclick="moveLink(${i}, 1)">↓</button>
        <button class="btn btn-danger btn-sm" onclick="removeLink(${i})">✕</button>
      </div>
    </div>
  `).join('');
}

// ─── APPEARANCE ────────────────────────────────────────────────────────────────
function renderThemeGrid() {
  const user = getUser(getSession());
  pickedTheme = user.theme || 'midnight';
  document.getElementById('theme-grid').innerHTML = Object.entries(THEMES).map(([k, t]) => `
    <div class="theme-opt${pickedTheme === k ? ' sel' : ''}"
         style="background:${t.grad};color:${t.text};" onclick="pickTheme('${k}')">
      <span class="t-check" style="color:${t.accent}">✓</span>
      ${t.name}
    </div>
  `).join('');
}

function pickTheme(k) { pickedTheme = k; renderThemeGrid(); }

function saveAppearance() {
  updateUser(getSession(), { theme: pickedTheme });
  refreshStats();
  toast('Theme saved ✓');
}

// ─── PUBLIC PROFILE ────────────────────────────────────────────────────────────
function renderPublicProfile(user) {
  const t = THEMES[user.theme] || THEMES.midnight;

  // Theme the whole profile page bg
  document.getElementById('page-profile').style.background = t.grad;

  showPage('profile');

  const name     = user.displayName || user.username;
  const initials = (name[0] || '?').toUpperCase();
  const avHtml   = user.avatar
    ? `<img src="${user.avatar}" alt="${name}" onerror="this.style.display='none';this.parentElement.textContent='${initials}'">`
    : initials;

  const badges = [];
  if (user.pronouns) badges.push(user.pronouns);
  if (user.location) badges.push('📍 ' + user.location);

  const links     = user.links || [];
  const linksHtml = links.length
    ? `<hr class="pub-divider" style="border-color:${t.border};">
       <div class="pub-links">
         ${links.map(l => `
           <a href="${l.url}" target="_blank" rel="noopener noreferrer" class="pub-link"
              style="background:${t.linkBg};border-color:${t.border};color:${t.text};"
              onmouseover="this.style.borderColor='${t.accent}';this.style.background='${t.accent}18';"
              onmouseout="this.style.borderColor='${t.border}';this.style.background='${t.linkBg}';">
             <span class="pub-link-icon">${l.icon}</span>
             <span class="pub-link-text">${l.title}</span>
           </a>
         `).join('')}
       </div>`
    : `<p style="color:${t.muted};font-size:.85rem;margin-top:.5rem;">No links added yet.</p>`;

  document.getElementById('pub-card').innerHTML = `
    <div class="pub-avatar" style="background:${t.avatarGrad};">${avHtml}</div>
    <div class="pub-name"  style="color:${t.text};">${name}</div>
    ${user.bio ? `<div class="pub-bio" style="color:${t.muted};">${user.bio}</div>` : ''}
    ${badges.length ? `<div class="pub-badges">${badges.map(b =>
      `<span class="pub-badge" style="color:${t.accent};background:${t.accent}18;border-color:${t.border};">${b}</span>`
    ).join('')}</div>` : ''}
    ${linksHtml}
    <div class="pub-footer" style="color:${t.muted};">
      <a href="/" style="color:${t.accent};opacity:.65;">femboy-hub.xyz</a> — your hub, your rules
    </div>
  `;
}

// ─── UTILS ─────────────────────────────────────────────────────────────────────
function viewMyProfile() {
  const sess = getSession();
  if (!sess) return;
  navigate(sess);
}

function copyUrl() {
  const sess = getSession();
  navigator.clipboard.writeText(window.location.origin + '/' + sess)
    .then(() => toast('Copied!'))
    .catch(() => toast('Could not copy — try manually'));
}

let _toastTimer;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 2300);
}

// Enter key on auth forms
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  const id = document.querySelector('.page.active')?.id;
  if (id === 'page-login')    doLogin();
  if (id === 'page-register') doRegister();
});

// ─── BOOT ──────────────────────────────────────────────────────────────────────
// GitHub Pages 404 trick: if we were redirected via 404.html, restore the path
(function () {
  const redirect = sessionStorage.getItem('gh_redirect');
  if (redirect && redirect !== '/') {
    sessionStorage.removeItem('gh_redirect');
    window.history.replaceState(null, '', redirect);
  }
})();

route();
