// ── State ──────────────────────────────────────────────────────────────────
const USERS = ['me', 'her'];
const DEFAULT_NAMES = { me: 'Me', her: 'Her' };

function getState() {
  return JSON.parse(localStorage.getItem('mpState') || 'null') || {
    entries: [],
    names: { me: 'Me', her: 'Her' },
    currentUser: 'me'
  };
}

function saveState(s) {
  localStorage.setItem('mpState', JSON.stringify(s));
}

function getEntries() { return getState().entries; }
function getNames() { return getState().names; }
function getCurrentUser() { return getState().currentUser; }

function setCurrentUser(u) {
  const s = getState(); s.currentUser = u; saveState(s);
}

function setName(user, name) {
  const s = getState(); s.names[user] = name; saveState(s);
}

function addEntry(entry) {
  const s = getState();
  entry.id = Date.now().toString();
  entry.addedBy = s.currentUser;
  entry.ratings = {};
  entry.reviews = {};
  s.entries.unshift(entry);
  saveState(s);
  return entry.id;
}

function updateEntry(id, data) {
  const s = getState();
  const idx = s.entries.findIndex(e => e.id === id);
  if (idx === -1) return;
  s.entries[idx] = { ...s.entries[idx], ...data };
  saveState(s);
}

function deleteEntry(id) {
  const s = getState();
  s.entries = s.entries.filter(e => e.id !== id);
  saveState(s);
}

function getEntry(id) {
  return getEntries().find(e => e.id === id) || null;
}

// ── Genres ─────────────────────────────────────────────────────────────────
const GENRES = [
  'Action','Adventure','Animation','Comedy','Crime','Documentary',
  'Drama','Fantasy','Horror','Mystery','Romance','Sci-Fi',
  'Thriller','Western','Other'
];

// ── Helpers ─────────────────────────────────────────────────────────────────
function statusLabel(s) {
  return { towatch: 'To Watch', watching: 'Watching', watched: 'Watched' }[s] || s;
}

function statusBadgeClass(s) {
  return { towatch: 'badge-watchlist', watching: 'badge-watching', watched: 'badge-watched' }[s] || '';
}

function whoLabel(w) {
  return { together: 'Together', me: 'Just Me', her: 'Just Her' }[w] || w;
}

function starsHTML(rating, interactive = false, prefix = '') {
  let html = `<span class="stars" ${interactive ? `data-prefix="${prefix}"` : ''}>`;
  for (let i = 1; i <= 5; i++) {
    html += `<span class="star ${interactive ? 'interactive-star' : 'star-display'} ${rating >= i ? 'filled' : ''}" data-val="${i}">${rating >= i ? '★' : '☆'}</span>`;
  }
  html += '</span>';
  return html;
}

function renderNavActive(page) {
  document.querySelectorAll('.nav-link').forEach(l => {
    l.classList.toggle('active', l.dataset.page === page);
  });
}

function navHTML() {
  const s = getState();
  const name = s.names[s.currentUser];
  const initial = name.charAt(0).toUpperCase();
  return `
    <nav>
      <a class="nav-logo" href="index.html">
        <div class="nav-logo-icon">🎬</div>
        Movie Planner
      </a>
      <a class="nav-link" href="index.html" data-page="home">Home</a>
      <a class="nav-link" href="stats.html" data-page="stats">Stats</a>
      <div class="nav-spacer"></div>
      <div class="nav-user" onclick="switchUser()" title="Switch user">
        <div class="nav-avatar">${initial}</div>
        <span class="nav-username">${name}</span>
      </div>
      <a class="nav-link" href="profile.html" data-page="profile">Profile</a>
    </nav>`;
}

function switchUser() {
  const s = getState();
  s.currentUser = s.currentUser === 'me' ? 'her' : 'me';
  saveState(s);
  location.reload();
}

function imageToDataURL(file) {
  return new Promise((resolve, reject) => {
    if (file.size > 10 * 1024 * 1024) { reject('File too large (max 10MB)'); return; }
    const allowed = ['image/jpeg','image/png','image/webp'];
    if (!allowed.includes(file.type)) { reject('Only JPEG, PNG, WebP allowed'); return; }
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = () => reject('Failed to read file');
    reader.readAsDataURL(file);
  });
}

function posterHTML(entry, cls = '') {
  if (entry.poster) {
    return `<img src="${entry.poster}" class="${cls}" alt="${entry.title} poster">`;
  }
  return `<div class="${cls}-placeholder"><span>🎬</span></div>`;
}
