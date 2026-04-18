// ── Firebase ───────────────────────────────────────────────────────────────
const _fbConfig = {
  apiKey: "AIzaSyAAwBcRx-VsRWXUlSL0vD2e47pBlVi9XC4",
  authDomain: "movieplanner-8edfc.firebaseapp.com",
  projectId: "movieplanner-8edfc",
  storageBucket: "movieplanner-8edfc.firebasestorage.app",
  messagingSenderId: "875134358243",
  appId: "1:875134358243:web:aa1ee150dc5104adfeebd6"
};

// Loaded via CDN script tags in each HTML file
let _db = null;
let _stateDocRef = null;
let _state = null;

function _fbReady() { return typeof firebase !== 'undefined' && _db !== null; }

function _initFirebase() {
  if (typeof firebase === 'undefined') return;
  if (!firebase.apps.length) firebase.initializeApp(_fbConfig);
  _db = firebase.firestore();
  _stateDocRef = _db.collection('app').doc('state');
}

// ── State ──────────────────────────────────────────────────────────────────
const USERS = ['me', 'her'];
const _DEFAULT = { entries: [], names: { me: 'Me', her: 'Her' }, currentUser: 'me' };

async function initState() {
  _initFirebase();
  if (_fbReady()) {
    try {
      const snap = await _stateDocRef.get();
      if (snap.exists) {
        _state = snap.data();
      } else {
        const local = JSON.parse(localStorage.getItem('mpState') || 'null');
        _state = local ? { ..._DEFAULT, ...local } : { ..._DEFAULT };
        await _stateDocRef.set(_state);
      }
      localStorage.setItem('mpState', JSON.stringify(_state));
      return;
    } catch(e) { console.warn('Firebase load failed', e); }
  }
  _state = JSON.parse(localStorage.getItem('mpState') || 'null') || { ..._DEFAULT };
}

function startLiveSync(callback) {
  if (!_fbReady()) return;
  _stateDocRef.onSnapshot(snap => {
    if (snap.exists) {
      _state = snap.data();
      localStorage.setItem('mpState', JSON.stringify(_state));
      if (callback) callback();
    }
  });
}

function getState() {
  return _state || JSON.parse(localStorage.getItem('mpState') || 'null') || { ..._DEFAULT };
}

async function _save(s) {
  _state = s;
  localStorage.setItem('mpState', JSON.stringify(s));
  if (_fbReady()) {
    try { await _stateDocRef.set(s); } catch(e) { console.warn('Firebase save failed', e); }
  }
}

function getEntries()     { return getState().entries || []; }
function getNames()       { return getState().names; }
function getCurrentUser() { return getState().currentUser; }

async function setCurrentUser(u) { const s=getState(); s.currentUser=u; await _save(s); }
function forceCurrentUser(u) { const s=getState(); s.currentUser=u; _state=s; localStorage.setItem('mpState',JSON.stringify(s)); }
async function setName(user,name) { const s=getState(); s.names[user]=name; await _save(s); }

async function addEntry(entry) {
  const s = getState();
  entry.id = Date.now().toString();
  entry.addedBy = s.currentUser;
  entry.ratings = {};
  entry.reviews = {};
  s.entries.unshift(entry);
  await _save(s);
  return entry.id;
}

async function updateEntry(id, data) {
  const s = getState();
  const idx = s.entries.findIndex(e => e.id === id);
  if (idx === -1) return;
  s.entries[idx] = { ...s.entries[idx], ...data };
  await _save(s);
}

async function deleteEntry(id) {
  const s = getState();
  s.entries = s.entries.filter(e => e.id !== id);
  await _save(s);
}

function getEntry(id) { return getEntries().find(e => e.id === id) || null; }

// ── Genres ─────────────────────────────────────────────────────────────────
const GENRES = [
  'Action','Adventure','Animation','Comedy','Crime','Documentary',
  'Drama','Fantasy','Horror','Mystery','Romance','Sci-Fi',
  'Thriller','Western','Other'
];

// ── Helpers ─────────────────────────────────────────────────────────────────
function statusLabel(s) {
  return { towatch:'To Watch', watching:'Watching', watched:'Watched' }[s] || s;
}
function statusBadgeClass(s) {
  return { towatch:'badge-towatch', watching:'badge-watching', watched:'badge-watched' }[s] || '';
}
function whoLabel(w) {
  const n = getNames();
  return { together:'Together', me:'Just '+n.me, her:'Just '+n.her }[w] || w;
}
function starsHTML(rating) {
  let h = '<span class="stars">';
  for (let i=1;i<=5;i++) h += `<span class="star star-display ${rating>=i?'filled':''}">${rating>=i?'★':'☆'}</span>`;
  return h + '</span>';
}
function renderNavActive(page) {
  document.querySelectorAll('.nav-link').forEach(l => l.classList.toggle('active', l.dataset.page===page));
}
function navHTML() {
  const s = getState();
  const name = s.names[s.currentUser];
  const initial = name.charAt(0).toUpperCase();
  return `<nav>
    <a class="nav-logo" href="index.html"><div class="nav-logo-icon">🎬</div>Movie Planner</a>
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
async function switchUser() {
  const s = getState();
  const newUser = s.currentUser === 'me' ? 'her' : 'me';
  forceCurrentUser(newUser);
  await _save(getState());
  location.reload();
}
function imageToDataURL(file) {
  return new Promise((resolve, reject) => {
    if (file.size > 10*1024*1024) { reject('File too large (max 10MB)'); return; }
    const allowed = ['image/jpeg','image/png','image/webp'];
    if (!allowed.includes(file.type)) { reject('Only JPEG, PNG, WebP allowed'); return; }
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = () => reject('Failed to read file');
    reader.readAsDataURL(file);
  });
}

// ── Loading overlay ─────────────────────────────────────────────────────────
function showLoading() {
  if (document.getElementById('app-loading')) return;
  const el = document.createElement('div');
  el.id = 'app-loading';
  el.style.cssText = 'position:fixed;inset:0;background:rgba(12,15,13,0.85);backdrop-filter:blur(6px);z-index:999;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:14px;color:#7a9882;font-size:14px;font-family:inherit';
  el.innerHTML = '<div style="width:36px;height:36px;border:3px solid #2e5c3e;border-top-color:#6dba84;border-radius:50%;animation:spin 0.7s linear infinite"></div><div>Loading…</div>';
  if (!document.getElementById('spin-style')) {
    const st = document.createElement('style');
    st.id = 'spin-style';
    st.textContent = '@keyframes spin{to{transform:rotate(360deg)}}';
    document.head.appendChild(st);
  }
  document.body.appendChild(el);
}
function hideLoading() {
  const el = document.getElementById('app-loading');
  if (el) el.remove();
}
