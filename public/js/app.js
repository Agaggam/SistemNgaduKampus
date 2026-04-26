// NgaduKampus UMM - Main App Logic

// Global State
const state = window.state = {
  user: { name: '...', email: '...', role: '...' },
  role: 'mahasiswa',

  currentView: 'dashboard',
  sidebarOpen: true,
  data: {
    stats: { total: 0, proses: 0, selesai: 0, rating: 0 },
    reports: [],
    lostfound: [],
    notifications: []
  }
};

// UI Elements - Using a proxy to ensure we always get the latest DOM elements
const els = window.els = new Proxy({}, {
  get: (target, prop) => {
    const ids = {
      app: 'app',
      main: 'sidebar', // Changed from main-app to sidebar to check for dashboard context
      viewBox: 'view-box',
      toasts: 'toasts',
      modalBox: 'modal-box',
      modalOverlay: 'modal-overlay',
      sbNav: 'sb-nav',
      bcrumb: 'tb-breadcrumb',
      notifDot: 'notif-dot',
      clock: 'tb-clock'
    };

    return document.getElementById(ids[prop]);
  }
});



// ================= AUTH =================
function togglePass() {
  const inp = document.getElementById('inp-pass');
  const ico = document.getElementById('eye-ico');
  if (inp.type === 'password') {
    inp.type = 'text';
    ico.className = 'fas fa-eye-slash';
  } else {
    inp.type = 'password';
    ico.className = 'fas fa-eye';
  }
}

// ================= CORE APP =================
// Polling Logic for Real-time Feel
let globalPollInterval = null;

function startGlobalPolling() {
  if (globalPollInterval) clearInterval(globalPollInterval);
  globalPollInterval = setInterval(async () => {
    await syncData();
  }, 10000); // Check every 10 seconds
}

async function syncData() {
  try {
    // Stats Sync
    const sRes = await fetch('/api/stats');
    if (!sRes.ok) {
        console.warn('Stats API failed:', sRes.status);
        return;
    }
    const sData = await sRes.json();
    state.data.stats = sData;

    // Report Sync
    const rRes = await fetch('/api/reports');
    if (!rRes.ok) {
        console.warn('Reports API failed:', rRes.status);
        return;
    }
    const rData = await rRes.json();
    
    state.data.reports = rData.map(r => ({
      ...r,
      id: r.id,
      db_id: r.id,
      kode_tiket: r.kode_tiket || `RPT-${(r.id || '').toString().slice(0, 8)}`,
      title: r.title,
      category: r.category,
      status: r.status,
      urgensi: r.urgensi || 'normal',
      created_at: r.created_at,
      votes: r.votes_count || 0,
      desc: r.description
    }));

    await syncNotifications();

    // Re-render current view if needed
    refreshCurrentView();
  } catch (e) { 
      console.error('Sync error (Check if server returned HTML instead of JSON):', e); 
  }
}

async function syncNotifications() {
  try {
    const res = await fetch('/api/notifications');
    if (!res.ok) {
        console.warn('Notifications API failed:', res.status);
        return;
    }
    const data = await res.json();
    
    const oldUnread = state.data.notifications.filter(n => !n.is_read).length;
    state.data.notifications = data.notifications || [];
    const newUnread = data.unread_count || 0;

    if (newUnread > oldUnread) {
      const latest = data.notifications[0];
      showToast(`Notifikasi Baru: ${latest ? latest.title : 'Cek lonceng aduan'}`, 'info');
    }

    const dot = els.notifDot;
    if (dot) {
      dot.textContent = newUnread;
      dot.style.display = newUnread > 0 ? 'flex' : 'none';
    }
  } catch (e) { 
      console.error('Notif sync error (Server 500 or HTML response):', e); 
  }
}

function refreshCurrentView() {
  // Don't refresh if modal is open (user might be typing)
  if (document.querySelector('.modal-wrapper.active')) return;

  if (state.currentView === 'dashboard') renderDashboard();
  if (state.currentView === 'tracking') renderTracking();
  if (state.currentView === 'kpi') renderKPI();
  if (state.currentView === 'dash-petugas') renderDashPetugas();
  if (state.currentView === 'dash-manajemen') renderDashManajemen();
  if (state.currentView === 'kelola-akun') renderKelolaAkun();
  if (state.currentView === 'lostfound') renderLostFound();
  if (state.currentView === 'trending') renderTrending();
}


function initApp() {
  console.log('Initializing App...');
  if (!els.viewBox) {
    console.warn('viewBox not found. Waiting for DOM or not on a dashboard page.');
    return;
  }

  // Sync state from window if available
  if (window.APP_STATE && window.APP_STATE.user) {
    state.user = window.APP_STATE.user;
    state.role = (window.APP_STATE.user.role || 'mahasiswa').toString().toLowerCase().trim();
    console.log('User Role Detected & Normalized:', state.role);
  } else {
    console.warn('APP_STATE or User not found!');
    state.role = 'mahasiswa';
  }

  startGlobalPolling();

  // If we have sbNav, render the dynamic nav items (legacy support)
  if (els.sbNav) {
    renderNav();
  }

  updateClock();
  setInterval(updateClock, 1000);

  // Determine current view based on role IF we are not already on a specific view
  if (!state.currentView) {
    const defaultView = state.role === 'petugas' ? 'dash-petugas' : (state.role === 'manajemen' ? 'dash-manajemen' : 'dashboard');
    console.log('Redirecting to default view:', defaultView);
    navigate(defaultView);
  }

  syncData();
}





document.addEventListener('DOMContentLoaded', initApp);



function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('collapsed');
}

function updateClock() {
  const now = new Date();
  if (els.clock) els.clock.textContent = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}


// ================= NAVIGATION =================
const navItems = {
  mahasiswa: [
    { id: 'dashboard', icon: 'fa-home', label: 'Dashboard' },
    { id: 'buat-laporan', icon: 'fa-plus-circle', label: 'Buat Laporan' },
    { id: 'tracking', icon: 'fa-route', label: 'Lacak Laporan' },
    { id: 'trending', icon: 'fa-fire', label: 'Trending & Upvote' },
    { id: 'lostfound', icon: 'fa-box-open', label: 'Lost & Found' },
    { id: 'kpi', icon: 'fa-star', label: 'Beri Rating' },
    { id: 'settings', icon: 'fa-cog', label: 'Pengaturan' }
  ],
  petugas: [
    { id: 'dash-petugas', icon: 'fa-tasks', label: 'Tugas Masuk' },
    { id: 'lostfound', icon: 'fa-box-open', label: 'Kelola Lost&Found' },
    { id: 'settings', icon: 'fa-cog', label: 'Pengaturan' }
  ],
  manajemen: [
    { id: 'dash-manajemen', icon: 'fa-chart-pie', label: 'Analitik KPI' },
    { id: 'kelola-akun', icon: 'fa-users-cog', label: 'Kelola Akun' },
    { id: 'settings', icon: 'fa-cog', label: 'Pengaturan' }
  ]
};

function renderNav() {
  const roleKey = (state.role || '').toLowerCase();
  const items = navItems[roleKey];
  if (!els.sbNav || !items) return;

  // Only render if empty to allow Blade overrides
  if (els.sbNav.children.length > 0) {
    console.log('Nav already populated by Blade, skipping JS render.');
    return;
  }

  els.sbNav.innerHTML = items.map(item => `
    <a href="#" class="nav-item ${state.currentView === item.id ? 'active' : ''}" onclick="navigate('${item.id}'); return false;">
      <i class="fas ${item.icon}"></i>
      <span>${item.label}</span>
    </a>
  `).join('');
}



function navigate(viewId) {
  console.log('Navigating to:', viewId);

  // RBAC (Role Based Access Control)
  const role = state.role;
  const auth = {
    'dashboard': ['mahasiswa'],
    'buat-laporan': ['mahasiswa'],
    'tracking': ['mahasiswa'],
    'kpi': ['mahasiswa'],
    'dash-petugas': ['petugas'],
    'dash-manajemen': ['manajemen'],
    'kelola-akun': ['manajemen']
  };

  if (auth[viewId] && !auth[viewId].includes(role)) {
    console.warn('Unauthorized access to:', viewId, 'for role:', role);
    showToast('Akses Ditolak: Anda tidak memiliki izin.', 'error');
    const fallback = role === 'petugas' ? 'dash-petugas' : (role === 'manajemen' ? 'dash-manajemen' : 'dashboard');
    return navigate(fallback);
  }

  state.currentView = viewId;
  localStorage.setItem('last_view', viewId); // Save position

  try {
    // Sync active nav (Works for both JS and Blade nav)

    document.querySelectorAll('.nav-item').forEach(el => {
      const onclickAttr = el.getAttribute('onclick') || '';
      if (onclickAttr.includes(`navigate('${viewId}')`)) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });

    const bcrumb = els.bcrumb;
    const updateBcrumb = (html) => { if (bcrumb) bcrumb.innerHTML = html; };

    if (window.innerWidth <= 768) {
      const sidebar = document.getElementById('sidebar');
      if (sidebar) sidebar.classList.remove('active');
    }

    if (!els.viewBox) {
      console.error('view-box element NOT found!');
      return;
    }

    switch (viewId) {
      case 'dashboard': renderDashboard(); updateBcrumb(`<i class="fas fa-home"></i> Dashboard Mahasiswa`); break;
      case 'buat-laporan': renderBuatLaporan(); updateBcrumb(`<i class="fas fa-plus-circle"></i> Buat Laporan`); break;
      case 'tracking': renderTracking(); updateBcrumb(`<i class="fas fa-route"></i> Lacak Laporan`); break;
      case 'trending': renderTrending(); updateBcrumb(`<i class="fas fa-fire"></i> Trending`); break;
      case 'lostfound': renderLostFound(); updateBcrumb(`<i class="fas fa-box-open"></i> Lost & Found`); break;
      case 'kpi': renderKPI(); updateBcrumb(`<i class="fas fa-star"></i> Evaluasi Layanan`); break;
      case 'dash-petugas': renderDashPetugas(); updateBcrumb(`<i class="fas fa-tasks"></i> Dashboard Petugas`); break;
      case 'dash-manajemen': renderDashManajemen(); updateBcrumb(`<i class="fas fa-chart-pie"></i> Analitik & KPI`); break;
      case 'kelola-akun': renderKelolaAkun(); updateBcrumb(`<i class="fas fa-users-cog"></i> Manajemen Akun`); break;
      case 'settings': renderSettings(); updateBcrumb(`<i class="fas fa-cog"></i> Pengaturan Aplikasi`); break;
      default: els.viewBox.innerHTML = `<h2>View ${viewId} not found</h2>`;
    }
  } catch (err) {
    console.error('Navigation error:', err);
    showToast('Gagal memuat halaman', 'error');
  }
}




function renderKelolaAkun() {
  els.viewBox.innerHTML = `
        <div class="view-header">
          <div>
            <h2 class="view-title">Manajemen Akun Kampus</h2>
            <p class="view-desc">Kelola dan tambahkan akun Mahasiswa atau Petugas secara manual.</p>
          </div>
          <button class="btn-primary" onclick="showTambahAkun()"><i class="fas fa-user-plus"></i> Tambah Akun Baru</button>
        </div>

        <div class="filter-bar">
          <button class="filter-btn active" id="tab-mhs" onclick="switchUserTab('mahasiswa')">Daftar Mahasiswa 🎓</button>
          <button class="filter-btn" id="tab-ptg" onclick="switchUserTab('petugas')">Daftar Petugas 🛠️</button>
        </div>
        
        <div class="glass" style="padding:20px; overflow-x:auto;">
          <table class="glass-table">
            <thead>
              <tr id="user-table-head">
                <th>Nama</th>
                <th>NIM</th>
                <th>Email</th>
                <th>Terdaftar</th>
              </tr>
            </thead>
            <tbody id="user-list-body">
              <tr><td colspan="4">Memuat data akun...</td></tr>
            </tbody>
          </table>
        </div>
    `;
  window.currentUserTab = 'mahasiswa';
  fetchUsers();
}

function switchUserTab(role) {
  window.currentUserTab = role;
  document.getElementById('tab-mhs').classList.toggle('active', role === 'mahasiswa');
  document.getElementById('tab-ptg').classList.toggle('active', role === 'petugas');

  const head = document.getElementById('user-table-head');
  if (role === 'mahasiswa') {
    head.innerHTML = `<th>Nama</th><th>NIM</th><th>Email</th><th>Terdaftar</th><th>Aksi</th>`;
  } else {
    head.innerHTML = `<th>Nama</th><th>Email</th><th>Role Khusus</th><th>Terdaftar</th><th>Aksi</th>`;
  }

  fetchUsers();
}

async function fetchUsers() {
  const res = await fetch('/api/users');
  const data = await res.json();
  const tbody = document.getElementById('user-list-body');
  if (!tbody) return;

  const filtered = data.filter(u => u.role === window.currentUserTab);

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px;">Belum ada data ${window.currentUserTab}.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(u => {
    const btnHtml = `
            <div style="display:flex; gap:8px;">
                <button class="btn-ghost sm" style="padding:5px 8px; font-size:0.75rem; border-color:var(--c-warning); color:var(--c-warning);" onclick='showEditAkun(${JSON.stringify(u)})'>
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-ghost sm" style="padding:5px 8px; font-size:0.75rem; border-color:var(--c-danger); color:var(--c-danger);" onclick="deleteUser(${u.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

    if (window.currentUserTab === 'mahasiswa') {
      return `
                <tr>
                    <td>${u.name}</td>
                    <td><code style="color:var(--c-primary)">${u.nim}</code></td>
                    <td>${u.email}</td>
                    <td>${new Date(u.created_at).toLocaleDateString('id-ID')}</td>
                    <td>${btnHtml}</td>
                </tr>
            `;
    } else {
      return `
                <tr>
                    <td>${u.name}</td>
                    <td>${u.email}</td>
                    <td><span class="badge badge-warning">Petugas Lapangan</span></td>
                    <td>${new Date(u.created_at).toLocaleDateString('id-ID')}</td>
                    <td>${btnHtml}</td>
                </tr>
            `;
    }
  }).join('');
}


function showTambahAkun() {
  showModal('Tambah Akun Baru', `
        <div class="form-grp">
            <label>Nama Lengkap</label>
            <input type="text" id="u-name" class="inp" placeholder="Misal: Ahmad Dani" />
        </div>
        <div class="form-grp">
            <label>Email Kampus</label>
            <input type="email" id="u-email" class="inp" placeholder="user@umm.ac.id" />
        </div>
        <div class="form-row">
            <div class="form-grp">
                <label>Role</label>
                <select id="u-role" class="inp" onchange="toggleNimField(this.value)">
                    <option value="mahasiswa">Mahasiswa</option>
                    <option value="petugas">Petugas</option>
                </select>
            </div>
            <div class="form-grp" id="nim-grp">
                <label>NIM</label>
                <input type="text" id="u-nim" class="inp" placeholder="202110370311001" />
            </div>
        </div>
        <div class="form-grp">
            <label>Password</label>
            <input type="password" id="u-pass" class="inp" placeholder="Minimal 6 karakter" />
        </div>
        <button class="btn-primary w-full" onclick="submitTambahAkun()">Simpan Akun</button>
    `);
}

function toggleNimField(role) {
  const grp = document.getElementById('nim-grp');
  if (role === 'petugas') grp.style.display = 'none';
  else grp.style.display = 'block';
}

async function toggleVote(btn, currentVotes, db_id) {
  if (!db_id) {
    showToast('ID Laporan tidak ditemukan', 'error');
    return;
  }

  btn.disabled = true; // Prevent double click

  try {
    const res = await fetch(`/api/reports/${db_id}/vote`, {
      method: 'POST',
      headers: {
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
        'Accept': 'application/json'
      }
    });

    if (!res.ok) throw new Error('Server returned error');

    const data = await res.json();
    const countSpan = btn.nextElementSibling;

    if (data.voted) {
      btn.classList.add('voted');
      countSpan.textContent = parseInt(countSpan.textContent) + 1;
      countSpan.style.color = 'var(--c-primary)';
      showToast('Upvote berhasil!', 'success');
    } else {
      btn.classList.remove('voted');
      countSpan.textContent = parseInt(countSpan.textContent) - 1;
      countSpan.style.color = 'var(--c-text)';
      showToast('Upvote dibatalkan', 'info');
    }
  } catch (err) {
    console.error(err);
    showToast('Gagal memberikan vote. Silakan coba lagi.', 'error');
  } finally {
    btn.disabled = false;
  }
}

async function submitTambahAkun() {
  const name = document.getElementById('u-name').value;
  const email = document.getElementById('u-email').value;
  const role = document.getElementById('u-role').value;
  const password = document.getElementById('u-pass').value;
  let nim = document.getElementById('u-nim').value;
  if (role === 'petugas') nim = null;


  if (!name || !email || !password) return showToast('Harap isi semua field utama', 'error');

  try {
    showToast('Mendaftarkan akun...', 'info');
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
        'Accept': 'application/json'
      },
      body: JSON.stringify({ name, email, role, nim, password })
    });

    const data = await res.json();

    if (res.ok && data.success) {
      closeModal();
      showToast('Akun baru berhasil didaftarkan!', 'success');
      renderKelolaAkun();
    } else {
      // Handle validation errors from Laravel
      const errorMsg = data.errors ? Object.values(data.errors).flat().join(', ') : (data.message || 'Gagal menambah akun');
      showToast(errorMsg, 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('Koneksi terputus atau kesalahan server', 'error');
  }
}


// ================= VIEWS =================

function renderDashboard() {
  els.viewBox.innerHTML = `
    <div class="view-header">
      <div>
        <h2 class="view-title">Halo, ${(state.user && state.user.name) || 'User'} 👋</h2>
        <p class="view-desc">Pantau pengaduan dan layanan kampus secara real-time.</p>
      </div>
    </div>
    
    <div class="grid-4">
      <div class="glass stat-card sc-primary">
        <div class="stat-icon"><i class="fas fa-bullhorn"></i></div>
        <div class="stat-info"><h3>${state.data.stats.total}</h3><p>Total Laporanmu</p></div>
      </div>
      <div class="glass stat-card sc-warning">
        <div class="stat-icon"><i class="fas fa-spinner"></i></div>
        <div class="stat-info"><h3>${state.data.stats.proses}</h3><p>Sedang Diproses</p></div>
      </div>
      <div class="glass stat-card sc-success">
        <div class="stat-icon"><i class="fas fa-check-circle"></i></div>
        <div class="stat-info"><h3>${state.data.stats.selesai}</h3><p>Laporan Selesai</p></div>
      </div>
      <div class="glass stat-card sc-accent">
        <div class="stat-icon"><i class="fas fa-star"></i></div>
        <div class="stat-info"><h3>${state.data.stats.rating}</h3><p>Rating Sistem</p></div>
      </div>
    </div>

    <h3 style="margin-bottom:20px;font-family:var(--font-display);">Akses Cepat</h3>
    <div class="grid-2">
      <div class="glass action-card" onclick="navigate('buat-laporan')">
        <div class="ac-icon"><i class="fas fa-pen-nib"></i></div>
        <h4>Buat Laporan Baru</h4>
        <p style="color:var(--c-text-muted);font-size:0.85rem;margin-top:8px;">Laporkan masalah fasilitas, akademik, atau umum</p>
      </div>
      <div class="glass action-card ac-panic" onclick="triggerPanic()">
        <div class="ac-icon"><i class="fas fa-exclamation-triangle"></i></div>
        <h4 style="color:var(--c-danger);">Panic Button</h4>
        <p style="color:var(--c-text-muted);font-size:0.85rem;margin-top:8px;">Keadaan darurat / pelecehan / kekerasan</p>
      </div>
      <div class="glass action-card" onclick="fastTrackIT()">
        <div class="ac-icon"><i class="fas fa-bug"></i></div>
        <h4>IT Fast-Track</h4>
        <p style="color:var(--c-text-muted);font-size:0.85rem;margin-top:8px;">Laporkan bug sistem, WiFi, SSO error</p>
      </div>
      <div class="glass action-card" onclick="navigate('lostfound')">
        <div class="ac-icon"><i class="fas fa-search-location"></i></div>
        <h4>Lost & Found</h4>
        <p style="color:var(--c-text-muted);font-size:0.85rem;margin-top:8px;">Cari atau laporkan barang hilang/ditemukan</p>
      </div>
    </div>
  `;
}

function renderBuatLaporan() {
  els.viewBox.innerHTML = `
    <div class="view-header">
      <div>
        <h2 class="view-title">Kirim Pengaduan</h2>
        <p class="view-desc">Suarakan keluhan Anda. Sistem AI akan merutekan ke pihak yang tepat.</p>
      </div>
    </div>
    
    <div class="glass form-card">
      <div class="toggle-wrap" id="anon-toggle" onclick="this.classList.toggle('active')">
        <div class="toggle-bg"><div class="toggle-dot"></div></div>
        <span><strong>Mode Anonim:</strong> Sembunyikan identitas saya (Enkripsi End-to-End)</span>
      </div>

      <div class="form-grp">
        <label>Judul Laporan</label>
        <input type="text" class="inp" placeholder="Misal: AC Ruang Kuliah Mati" id="lap-judul"/>
      </div>

      <div class="grid-2">
        <div class="form-grp">
          <label>Kategori Laporan</label>
          <select class="inp" id="lap-cat">
            <option value="Umum">Pilih Kategori...</option>
            <option value="Fasilitas">Fasilitas & Gedung</option>
            <option value="IT">IT & Jaringan (WiFi/SSO)</option>
            <option value="Akademik">Akademik & Perkuliahan</option>
            <option value="Keuangan">Keuangan (UKT/Beasiswa)</option>
            <option value="Keamanan">Keamanan & Ketertiban</option>
          </select>
          <small id="smart-hint" style="color:var(--c-accent); display:none; margin-top:5px;"><i class="fas fa-lightbulb"></i> Disarankan berdasarkan judul Anda</small>
        </div>
        <div class="form-grp">
          <label>Lokasi Kejadian</label>
          <input type="text" class="inp" id="lap-loc" placeholder="Misal: GKB 1 Lantai 3" />
        </div>
      </div>

      <div class="form-grp">
        <label>Detail Laporan</label>
        <textarea class="inp textarea-inp" placeholder="Jelaskan secara detail masalah yang Anda alami..."></textarea>
      </div>

      <div class="form-grp">
        <label>Lampiran / Bukti Foto (Maks 2MB)</label>
        <div class="file-drop" onclick="document.getElementById('lap-img').click()">
          <i class="fas fa-cloud-upload-alt"></i>
          <p id="file-label">Klik untuk memilih foto bukti<br><small style="color:var(--c-text-muted)">Hanya JPG, PNG (Max 2MB)</small></p>
          <input type="file" id="lap-img" style="display:none" accept="image/*" onchange="handleFileSelect(this)"/>
        </div>
      </div>

      <div style="display:flex; justify-content:flex-end; gap:16px; margin-top:30px;">
        <button class="btn-ghost" onclick="navigate('dashboard')">Batal</button>
        <button class="btn-primary" onclick="submitLaporan()">Kirim Laporan <i class="fas fa-paper-plane"></i></button>
      </div>
    </div>
  `;

  // Smart Category Logic
  const titleInp = document.getElementById('lap-judul');
  const catSel = document.getElementById('lap-cat');
  const hint = document.getElementById('smart-hint');

  if (titleInp) {
    // Load Drafts
    const draft = JSON.parse(localStorage.getItem('rpt_draft') || '{}');
    if (draft.title) titleInp.value = draft.title;
    if (draft.cat) catSel.value = draft.cat;
    if (draft.loc) document.getElementById('lap-loc').value = draft.loc;
    if (draft.desc) document.querySelector('.textarea-inp').value = draft.desc;

    const saveDraft = () => {
      const d = {
        title: titleInp.value,
        cat: catSel.value,
        loc: document.getElementById('lap-loc').value,
        desc: document.querySelector('.textarea-inp').value
      };
      localStorage.setItem('rpt_draft', JSON.stringify(d));
    };

    titleInp.addEventListener('input', (e) => {
      saveDraft();
      // Smart Category Logic
      const val = e.target.value.toLowerCase();
      let suggested = '';
      if (val.includes('wifi') || val.includes('internet') || val.includes('sso') || val.includes('email')) suggested = 'IT';
      if (val.includes('parkir') || val.includes('maling') || val.includes('hilang') || val.includes('aman') || val.includes('security')) suggested = 'Keamanan';
      if (val.includes('ac') || val.includes('lampu') || val.includes('rusak') || val.includes('toilet') || val.includes('bocor')) suggested = 'Fasilitas';
      if (val.includes('ukt') || val.includes('beasiswa') || val.includes('bayar') || val.includes('keuangan')) suggested = 'Keuangan';
      if (val.includes('dosen') || val.includes('nilai') || val.includes('krs') || val.includes('kuliah')) suggested = 'Akademik';

      if (suggested) {
        catSel.value = suggested;
        hint.style.display = 'block';
        saveDraft();
      } else {
        hint.style.display = 'none';
      }
    });

    document.getElementById('lap-loc').addEventListener('input', saveDraft);
    catSel.addEventListener('change', saveDraft);
    document.querySelector('.textarea-inp').addEventListener('input', saveDraft);
  }
}



function handleFileSelect(input) {
  if (input.files && input.files[0]) {
    document.getElementById('file-label').innerHTML = `<strong style="color:var(--c-success)">${input.files[0].name}</strong> terpilih.`;
  }
}

function renderTracking() {
  const reports = state.data.reports;

  els.viewBox.innerHTML = `
    <div class="view-header">
      <div>
        <h2 class="view-title">Lacak Laporan Anda</h2>
        <p class="view-desc">Monitor progres semua pengaduan Anda secara real-time.</p>
      </div>
    </div>

    <div class="tracking-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap:20px;">
      ${reports.length === 0 ? `
        <div class="glass" style="padding:40px; text-align:center; grid-column: 1 / -1;">
          <p style="color:var(--c-text-muted);">Belum ada laporan yang dikirim.</p>
        </div>
      ` : reports.map(report => `
        <div class="glass track-card-compact">
          <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:15px;">
            <code style="background:var(--c-primary); color:white; padding:2px 8px; border-radius:4px; font-size:0.7rem;">${report.kode_tiket || 'RPT-GEN'}</code>
            <span class="badge badge-${report.status === 'finished' ? 'success' : 'warning'}" style="font-size:0.65rem;">
                ${report.status === 'finished' ? 'Selesai' : (report.status === 'process' ? 'Diproses' : 'Antrean')}
            </span>
          </div>
          
          <h4 style="font-size:1.1rem; margin-bottom:5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${report.title}</h4>
          <p style="color:var(--c-text-muted); font-size:0.8rem; margin-bottom:15px;">
            <i class="fas fa-tag"></i> ${report.category} • ${new Date(report.created_at || Date.now()).toLocaleDateString('id-ID')}
          </p>

          <div class="horizontal-timeline">
             ${renderReportTimeline(report)}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}


function renderTrending() {
  // Sort by votes descending
  const reports = [...state.data.reports].sort((a, b) => (b.votes_count || 0) - (a.votes_count || 0));

  const reportsHTML = reports.map(r => {
    const isAnon = r.mode === 'anonim';
    const reporterName = isAnon ? '<span style="color:var(--c-accent); font-weight:bold;"><i class="fas fa-user-secret"></i> IDENTITAS DIRAHASIAKAN</span>' : (r.user ? r.user.name : 'Mahasiswa UMM');

    return `
    <div class="glass feed-item" style="display:flex; gap:20px; padding:20px; margin-bottom:15px; align-items:start;">
      <div class="upvote-box" style="display:flex; flex-direction:column; align-items:center; background:rgba(255,255,255,0.05); padding:10px; border-radius:8px; min-width:60px;">
        <button class="btn-upvote" style="background:none; border:none; color:var(--c-text-muted); cursor:pointer; font-size:1.5rem;" onclick="handleUpvote('${r.id}')"><i class="fas fa-caret-up"></i></button>
        <span class="vote-count" style="font-weight:bold; font-size:1.2rem;">${r.votes_count || 0}</span>
      </div>
      <div class="feed-content" style="flex:1;">
        <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:5px;">
            <h4 class="feed-title">${r.title}</h4>
            <span style="font-size:0.7rem; color:var(--c-text-muted);">${reporterName}</span>
        </div>
        <div class="feed-meta" style="margin-bottom:10px; display:flex; gap:10px; font-size:0.8rem; color:var(--c-text-muted);">
          <span class="badge badge-${r.status === 'finished' ? 'success' : (r.status === 'process' ? 'warning' : 'primary')}">${r.status.toUpperCase()}</span>
          <span><i class="fas fa-tag"></i> ${r.category}</span>
          <span><i class="fas fa-clock"></i> ${new Date(r.created_at).toLocaleDateString('id-ID')}</span>
        </div>
        <p class="feed-desc" style="font-size:0.9rem; line-height:1.5; color:rgba(255,255,255,0.8);">${r.description || 'Tidak ada deskripsi.'}</p>
      </div>
    </div>
  `;
  }).join('');


  els.viewBox.innerHTML = `
    <div class="view-header">
      <div>
        <h2 class="view-title">Trending & Isu Terkini</h2>
        <p class="view-desc">Dukung keluhan yang sama dengan melakukan Upvote agar lebih cepat ditangani.</p>
      </div>
    </div>
    
    <div style="max-width: 800px; margin: 0 auto;">
      ${reportsHTML.length ? reportsHTML : '<div class="glass" style="padding:40px; text-align:center;"><p style="color:var(--c-text-muted);">Belum ada laporan publik untuk saat ini.</p></div>'}
    </div>
  `;
}


function renderLostFound() {
  els.viewBox.innerHTML = `
    <div class="view-header">
      <div>
        <h2 class="view-title">Katalog Lost & Found</h2>
        <p class="view-desc">Platform untuk melaporkan barang hilang atau ditemukan di area kampus.</p>
      </div>
      <button class="btn-primary" onclick="showLaporBarang()"><i class="fas fa-plus"></i> Lapor Barang</button>
    </div>
    <div class="lf-grid" id="lf-container">Memuat data...</div>
  `;
  fetchLostFound();
}

async function fetchLostFound() {
  try {
    const res = await fetch('/api/lost-founds');
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    
    const data = await res.json();
    const container = document.getElementById('lf-container');
    if (!container) return;

    if (data.length === 0) {
      container.innerHTML = '<div class="glass" style="grid-column:1/-1; padding:40px; text-align:center; color:var(--c-text-muted);">Belum ada barang hilang atau ditemukan.</div>';
      return;
    }

    container.innerHTML = data.map(item => {
      const isOwner = item.user_id === (window.APP_STATE.user ? window.APP_STATE.user.id : null);
      const isPetugas = state.role === 'petugas';
      const typeLabel = (item.type || 'unknown').toUpperCase();
      const userName = item.user ? item.user.name : 'Anonim';
      const userEmail = item.user ? item.user.email : '';

      return `
          <div class="glass lf-card">
            <div class="lf-img">
              <span class="lf-tag tag-${item.type || 'unknown'}">${typeLabel}</span>
              <i class="fas fa-${item.type === 'lost' ? 'search' : 'box'}"></i>
            </div>
            <div class="lf-info">
              <h4>${item.title || 'Tanpa Judul'}</h4>
              <p><i class="fas fa-map-marker-alt"></i> ${item.location || 'Lokasi tidak diketahui'}</p>
              <p><i class="fas fa-clock"></i> ${item.time_info || '-'}</p>
              
              <div style="margin-top:15px; display:flex; gap:10px;">
                  <button class="btn-primary w-full" style="padding:8px; font-size:0.85rem;" onclick="showContactModal('${userName}', '${userEmail}', '${item.title || 'Barang'}')">
                      <i class="fas fa-comments"></i> Hubungi
                  </button>
                  ${(isOwner || isPetugas) ? `
                      <button class="btn-ghost" style="padding:8px; border-color:var(--c-success); color:var(--c-success);" onclick="resolveLF('${item.id}')" title="${isPetugas ? 'Verifikasi & Selesaikan' : 'Selesaikan'}">
                          <i class="fas fa-check-circle"></i>
                      </button>
                  ` : ''}
              </div>
            </div>
          </div>
      `}).join('');

  } catch (err) {
    console.error('Fetch LF Error:', err);
    const container = document.getElementById('lf-container');
    if (container) container.innerHTML = `<div class="glass" style="grid-column:1/-1; padding:40px; text-align:center; color:var(--c-danger);">Gagal memuat data. Cek koneksi atau database.</div>`;
    showToast('Gagal mengambil data dari server hosting', 'error');
  }
}


function showContactModal(name, email, itemTitle) {
  showModal('Hubungi Pemilik/Penemu', `
        <div style="text-align:center; padding:10px;">
            <div class="sb-avatar" style="width:60px; height:60px; margin:0 auto 15px; font-size:1.5rem;">${name[0]}</div>
            <h3>${name}</h3>
            <p style="color:var(--c-text-muted); margin-bottom:20px;">Silakan hubungi orang ini untuk koordinasi pengambilan barang <strong>${itemTitle}</strong>.</p>
            
            <a href="mailto:${email}" class="btn-primary w-full" style="text-decoration:none; display:flex; align-items:center; justify-content:center; gap:10px; margin-bottom:10px;">
                <i class="fas fa-envelope"></i> Kirim Email Kampus
            </a>
            <button class="btn-ghost w-full" onclick="showToast('Fitur Chat segera hadir', 'info')">
                <i class="fas fa-comment-dots"></i> Chat via NgaduKampus
            </button>
        </div>
    `);
}

async function resolveLF(id) {
  if (!confirm('Tandai barang ini sebagai sudah ditemukan/diklaim?')) return;
  try {
    const res = await fetch(`/api/lost-founds/${id}/resolve`, {
      method: 'POST',
      headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content }
    });
    const data = await res.json();
    if (data.success) {
      showToast('Barang berhasil diselesaikan!', 'success');
      fetchLostFound();
    }
  } catch (e) { showToast('Gagal menyelesaikan laporan', 'error'); }
}

function showLaporBarang() {
  showModal('Lapor Barang Hilang/Temu', `
        <div class="form-grp">
            <label>Judul Barang</label>
            <input type="text" id="lf-title" class="inp" placeholder="Misal: Dompet Coklat" />
        </div>
        <div class="form-row">
            <div class="form-grp">
                <label>Tipe</label>
                <select id="lf-type" class="inp">
                    <option value="lost">Hilang</option>
                    <option value="found">Ditemukan</option>
                </select>
            </div>
            <div class="form-grp">
                <label>Lokasi</label>
                <input type="text" id="lf-loc" class="inp" placeholder="Misal: Lab Komputer" />
            </div>
        </div>
        <div class="form-grp">
            <label>Waktu Kejadian</label>
            <input type="text" id="lf-time" class="inp" placeholder="Misal: Hari ini jam 10" />
        </div>
        <div class="form-grp">
            <label>Foto Barang (Opsional)</label>
            <input type="file" id="lf-img" class="inp" accept="image/*" />
        </div>
        <button class="btn-primary w-full" onclick="submitLostFound()">Kirim Laporan</button>
    `);
}

async function submitLostFound() {
  const title = document.getElementById('lf-title').value;
  const type = document.getElementById('lf-type').value;
  const loc = document.getElementById('lf-loc').value;
  const time = document.getElementById('lf-time').value;
  const img = document.getElementById('lf-img').files[0];

  if (!title || !loc) return showToast('Judul dan Lokasi tidak boleh kosong', 'error');

  const formData = new FormData();
  formData.append('title', title);
  formData.append('type', type);
  formData.append('location', loc);
  formData.append('time_info', time);
  if (img) formData.append('image', img);

  try {
    showToast('Mengirim laporan...', 'info');
    await fetch('/api/lost-founds', {
      method: 'POST',
      headers: { 'X-CSRF-TOKEN': window.APP_STATE.csrf },
      body: formData
    });
    closeModal();
    showToast('Laporan Lost & Found terkirim!', 'success');
    renderLostFound();
  } catch (e) { showToast('Gagal mengirim laporan', 'error'); }
}

function renderKPI() {
  const finishedReports = state.data.reports.filter(r => r.status === 'finished');

  els.viewBox.innerHTML = `
    <div class="view-header">
      <div>
        <h2 class="view-title">Evaluasi Layanan</h2>
        <p class="view-desc">Berikan rating pada laporan Anda yang telah selesai untuk membantu kami meningkatkan layanan.</p>
      </div>
    </div>
    
    <div class="grid-2">
      ${finishedReports.length === 0 ? `
        <div class="glass" style="grid-column: 1/-1; padding:40px; text-align:center;">
          <p style="color:var(--c-text-muted);">Belum ada laporan selesai yang perlu dinilai.</p>
        </div>
      ` : finishedReports.map(r => `
        <div class="glass" style="padding:20px; display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
          <div>
            <h4 style="margin-bottom:5px;">${r.title}</h4>
            <p style="font-size:0.8rem; color:var(--c-text-muted);">Tiket: ${r.kode_tiket}</p>
          </div>
          <button class="btn-primary" onclick="openRatingModal('${r.id}', '${r.title}')">
            <i class="fas fa-star"></i> Beri Rating
          </button>
        </div>
      `).join('')}
    </div>

  `;
}

function openRatingModal(db_id, title) {
  currentRating = 0;
  showModal('Beri Penilaian', `
        <div style="text-align:center; padding:10px;">
            <p style="margin-bottom:20px;">Bagaimana kualitas penanganan untuk laporan:<br><strong>${title}</strong>?</p>
            <div class="rating-stars" id="rating-stars">
                <i class="fas fa-star" onclick="setRating(1)"></i>
                <i class="fas fa-star" onclick="setRating(2)"></i>
                <i class="fas fa-star" onclick="setRating(3)"></i>
                <i class="fas fa-star" onclick="setRating(4)"></i>
                <i class="fas fa-star" onclick="setRating(5)"></i>
            </div>
            <h4 id="rating-text" style="color:var(--c-primary); margin-bottom:20px;">Pilih Bintang</h4>
            <textarea id="rating-comment" class="inp" placeholder="Tulis masukan Anda (opsional)..." style="height:80px; margin-bottom:20px;"></textarea>
            <button class="btn-primary w-full" onclick="submitRating('${db_id}')">Kirim Penilaian</button>
        </div>
    `);
}

async function submitRating(db_id) {
  if (currentRating === 0) return showToast('Pilih jumlah bintang terlebih dahulu', 'warning');
  const comment = document.getElementById('rating-comment').value;

  try {
    const res = await fetch(`/api/reports/${db_id}/rate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': window.APP_STATE.csrf
      },
      body: JSON.stringify({ score: currentRating, comment: comment })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Terima kasih atas penilaian Anda!', 'success');
      closeModal();
      syncData();
    }
  } catch (e) { showToast('Gagal mengirim penilaian', 'error'); }
}

let currentRating = 0;
function setRating(val) {
  currentRating = val;
  const stars = document.getElementById('rating-stars').children;
  for (let i = 0; i < 5; i++) {
    if (i < val) stars[i].classList.add('active');
    else stars[i].classList.remove('active');
  }
  const texts = ['Sangat Buruk', 'Buruk', 'Cukup', 'Baik', 'Sangat Baik'];
  document.getElementById('rating-text').textContent = texts[val - 1];
}

function renderDashPetugas() {
  els.viewBox.innerHTML = `
        <div class="view-header">
            <div>
                <h2 class="view-title">Dashboard Petugas Keamanan</h2>
                <p class="view-desc">Monitor laporan masuk dan peringatan darurat.</p>
            </div>
        </div>
        
        <!-- Emergency Alerts Panel -->
        <div id="panic-alerts-panel" style="margin-bottom:30px;"></div>

        <div class="grid-2">
            <div class="glass" style="padding:20px;">
                <h4><i class="fas fa-tasks"></i> Laporan Perlu Penanganan</h4>
                <div id="petugas-report-list" style="margin-top:15px;">Memuat tugas...</div>
            </div>
            <div class="glass" style="padding:20px;">
                <h4><i class="fas fa-history"></i> Riwayat Penanganan</h4>
                <div id="petugas-history-list" style="margin-top:15px; color:var(--c-text-muted);">Belum ada riwayat.</div>
            </div>
        </div>

    `;
  fetchPetugasData();

  // Start Polling for Panic Alerts
  if (window.panicInterval) clearInterval(window.panicInterval);
  window.panicInterval = setInterval(fetchPanicAlerts, 5000);
  fetchPanicAlerts();
}

async function fetchPanicAlerts() {
  if (state.role !== 'petugas') return clearInterval(window.panicInterval);

  try {
    const res = await fetch('/api/panic/latest');
    const alerts = await res.json();
    const panel = document.getElementById('panic-alerts-panel');
    if (!panel) return;

    if (alerts.length > 0) {
      panel.innerHTML = alerts.map(a => `
                <div class="glass panic-alert-card animate-pulse">
                    <div class="pac-icon"><i class="fas fa-exclamation-triangle"></i></div>
                    <div class="pac-info">
                        <h4 style="color:var(--c-danger)">DARURAT: PERLU BANTUAN!</h4>
                        <p><strong>Pelapor:</strong> ${a.user.name}</p>
                        <p><strong>Lokasi:</strong> ${a.location_name} ${a.lat ? `(${a.lat}, ${a.lng})` : ''}</p>
                        <p><small>${new Date(a.created_at).toLocaleTimeString()}</small></p>
                    </div>
                    <button class="btn-primary" style="background:var(--c-success)" onclick="window.open('https://www.google.com/maps?q=${a.lat},${a.lng}')">LIHAT MAPS</button>
                </div>
            `).join('');

      // Audio Alert (Optional)
      if (!window.alertPlayed) {
        // new Audio('/assets/alert.mp3').play().catch(e => {}); 
        window.alertPlayed = true;
      }
    } else {
      panel.innerHTML = '';
      window.alertPlayed = false;
    }
  } catch (e) { }
}

function renderDashManajemen() {
  const stats = state.data.stats || { total: 0, sla_percent: 0, rating: 0 };

  els.viewBox.innerHTML = `
        <div class="view-header">
            <div>
                <h2 class="view-title">Analitik & KPI Kampus</h2>
                <p class="view-desc">Monitor performa layanan dan distribusikan laporan ke petugas.</p>
            </div>
            <a href="/api/reports/export" class="btn-primary" style="text-decoration:none;"><i class="fas fa-file-download"></i> Unduh Rekap CSV</a>
        </div>
        
        <div class="grid-2" style="margin-bottom:30px;">
            <div class="glass stat-card sc-primary">
                <h3>${stats.sla_percent}%</h3>
                <p>SLA Terpenuhi</p>
                <div style="font-size:0.7rem; opacity:0.7; margin-top:5px;">Total ${stats.total} Laporan</div>
            </div>
            <div class="glass stat-card sc-success">
                <h3>${stats.rating}</h3>
                <p>Rata-rata Rating</p>
                <div style="font-size:0.7rem; opacity:0.7; margin-top:5px;">Feedback Mahasiswa</div>
            </div>
        </div>

        <div class="glass" style="padding:20px;">
            <h3 style="margin-bottom:15px;"><i class="fas fa-clipboard-list"></i> Laporan Menunggu Disposisi</h3>
            <div id="mgt-pending-list">Memuat data...</div>
        </div>
    `;
  fetchManagementData();
}


async function fetchManagementData() {
  try {
    const res = await fetch('/api/reports');
    const reports = await res.json();
    const pending = reports.filter(r => r.status === 'pending');
    const list = document.getElementById('mgt-pending-list');
    if (!list) return;

    if (pending.length === 0) {
      list.innerHTML = '<p style="color:var(--c-text-muted); padding:20px; text-align:center;">Semua laporan telah didisposisikan.</p>';
      return;
    }

    list.innerHTML = `
            <table class="glass-table">
                <thead>
                    <tr>
                        <th>Tiket</th>
                        <th>Judul</th>
                        <th>Kategori</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    ${pending.map(r => `
                        <tr>
                            <td><code>${r.kode_tiket}</code></td>
                            <td>${r.title}</td>
                            <td>${r.category}</td>
                            <td>
                                <button class="btn-primary" style="padding:5px 12px; font-size:0.8rem;" onclick="showAssignModal('${r.id}', '${r.title}')">
                                    <i class="fas fa-user-plus"></i> Disposisi
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
  } catch (e) { showToast('Gagal memuat data manajemen', 'error'); }
}

async function showAssignModal(reportId, title) {
  try {
    const res = await fetch('/api/users');
    const users = await res.json();
    const petugas = users.filter(u => u.role === 'petugas');

    showModal('Disposisi Laporan', `
            <p style="margin-bottom:15px;">Tugaskan laporan <strong>${title}</strong> kepada petugas lapangan:</p>
            <div class="form-grp">
                <label>Pilih Petugas</label>
                <select id="assign-petugas-id" class="inp">
                    ${petugas.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
                </select>
            </div>
            <div class="form-grp">
                <label>Instruksi Khusus (Opsional)</label>
                <textarea id="assign-note" class="inp" placeholder="Misal: Segera cek ke lokasi GKB 1..." style="height:80px;"></textarea>
            </div>
            <button class="btn-primary w-full" onclick="submitAssignment('${reportId}')">Konfirmasi Disposisi</button>
        `);
  } catch (e) { showToast('Gagal memuat daftar petugas', 'error'); }
}

async function submitAssignment(reportId) {
  const petugasId = document.getElementById('assign-petugas-id').value;
  const note = document.getElementById('assign-note').value;

  try {
    const res = await fetch(`/api/reports/${reportId}/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': window.APP_STATE.csrf
      },
      body: JSON.stringify({ petugas_id: petugasId, catatan: note })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Laporan berhasil didisposisikan!', 'success');
      closeModal();
      renderDashManajemen();
    }
  } catch (e) { showToast('Gagal melakukan disposisi', 'error'); }
}


// ================= UTILS & ACTIONS =================

// Modal System
function showModal(title, content) {
  const mBox = document.getElementById('modal-box');
  const mOverlay = document.getElementById('modal-overlay');

  if (!mBox || !mOverlay) return console.error('Modal elements missing');

  mBox.innerHTML = `
        <div class="modal-header">
            <h3 class="modal-title">${title}</h3>
            <button class="modal-close" onclick="closeModal()"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body">${content}</div>
    `;

  // Reset state and force show
  mBox.style.display = 'block';
  mOverlay.style.display = 'block';
  mBox.classList.remove('hidden');
  mOverlay.classList.remove('hidden');

  // Trigger animation
  setTimeout(() => {
    mBox.classList.add('show');
    mOverlay.classList.add('show');
  }, 10);
}

function closeModal() {
  const mBox = document.getElementById('modal-box');
  const mOverlay = document.getElementById('modal-overlay');

  if (mBox) {
    mBox.classList.remove('show');
    setTimeout(() => mBox.style.display = 'none', 300);
  }
  if (mOverlay) {
    mOverlay.classList.remove('show');
    setTimeout(() => mOverlay.style.display = 'none', 300);
  }
}

// Toast
function showToast(msg, type = 'info') {
  const icons = { info: 'fa-info-circle', success: 'fa-check-circle', error: 'fa-exclamation-triangle', warning: 'fa-exclamation-circle' };
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<i class="fas ${icons[type]}"></i> <span>${msg}</span>`;
  const toastContainer = document.getElementById('toasts');
  if (toastContainer) toastContainer.appendChild(t);

  setTimeout(() => {
    t.classList.add('toast-fadeout');
    setTimeout(() => t.remove(), 300);
  }, 3000);
}

// ================= MISSING LOGIC =================

async function submitLaporan() {
  const title = document.getElementById('lap-judul').value;
  const category = document.getElementById('lap-cat').value;
  const location = document.getElementById('lap-loc').value;
  const desc = document.querySelector('.textarea-inp').value;
  const isAnon = document.getElementById('anon-toggle').classList.contains('active');
  const imageInput = document.getElementById('lap-img');

  if (!title || !desc || !location || category === 'Umum') {
    return showToast('Harap isi judul, lokasi, kategori, dan detail laporan', 'warning');
  }

  const formData = new FormData();
  formData.append('title', title);
  formData.append('category', category);
  formData.append('location', location);
  formData.append('description', desc);
  formData.append('mode', isAnon ? 'anonim' : 'reguler');
  formData.append('urgensi', 'sedang');

  if (category === 'IT') {
    formData.append('is_bug_report', '1');
    formData.append('it_details', JSON.stringify({
      browser: navigator.userAgent,
      platform: navigator.platform,
      screen: `${window.screen.width}x${window.screen.height}`
    }));
  }

  if (imageInput.files[0]) formData.append('image', imageInput.files[0]);

  try {
    showToast('Mengirim laporan...', 'info');
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: {
        'X-CSRF-TOKEN': window.APP_STATE.csrf,
        'Accept': 'application/json'
      },
      body: formData
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.removeItem('rpt_draft'); // Clear Draft
      showToast('Laporan berhasil dikirim!', 'success');
      navigate('tracking');
      syncData();
    } else {
      const errorMsg = data.errors ? Object.values(data.errors).flat().join(', ') : (data.message || 'Gagal mengirim laporan');
      showToast(errorMsg, 'error');
    }
  } catch (e) {
    console.error(e);
    showToast('Koneksi terputus atau file terlalu besar (Max 2MB)', 'error');
  }
}


function triggerPanic() {
  showModal('Emergency Alert (Panic Button)', `
        <div class="panic-wrapper">
            <div class="btn-panic-huge" onclick="confirmPanic()">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <p><strong>TAHAN TOMBOL UNTUK MENGIRIM SINYAL BAHAYA</strong></p>
            <p style="color:var(--c-text-muted); font-size:0.85rem; margin-top:10px;">
                Lokasi Anda akan dikirimkan secara real-time ke petugas keamanan kampus.
            </p>
        </div>
    `);
}

async function confirmPanic() {
  showToast('Mencari lokasi...', 'info');
  if (!navigator.geolocation) return showToast('GPS tidak didukung di browser ini', 'error');

  navigator.geolocation.getCurrentPosition(async (pos) => {
    try {
      const res = await fetch('/api/panic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': window.APP_STATE.csrf
        },
        body: JSON.stringify({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          location_name: 'Lokasi Pengguna (GPS)'
        })
      });
      const data = await res.json();
      if (data.success) {
        showModal('SOS Terkirim!', `
                    <div style="text-align:center; padding:20px;">
                        <i class="fas fa-check-circle" style="font-size:4rem; color:var(--c-success); margin-bottom:20px;"></i>
                        <h3>Bantuan Dalam Perjalanan</h3>
                        <p>Petugas keamanan telah menerima sinyal Anda. Tetap di tempat yang aman.</p>
                        <button class="btn-primary" onclick="closeModal()" style="margin-top:20px;">Siap</button>
                    </div>
                `);
      } else {
        showToast(data.message || 'Gagal mengirim sinyal SOS', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Gagal mengirim sinyal SOS (Koneksi Terputus)', 'error');
    }

  }, (err) => {
    showToast('Gagal mendapatkan lokasi. Pastikan GPS aktif.', 'error');
  });
}

function fastTrackIT() {
  navigate('buat-laporan');
  setTimeout(() => {
    document.getElementById('lap-kat').value = 'IT';
    document.getElementById('lap-judul').placeholder = 'Misal: WiFi GKB 3 Error';
    showToast('Kategori IT dipilih otomatis', 'info');
  }, 100);
}

function renderReportTimeline(report) {
  const stages = [
    { key: 'received', label: 'Diterima' },
    { key: 'assigned', label: 'Disposisi' },
    { key: 'process', label: 'Diproses' },
    { key: 'finished', label: 'Selesai' }
  ];

  let currentIdx = 0;
  if (report.status === 'process') currentIdx = 2;
  if (report.status === 'finished') currentIdx = 3;

  return stages.map((stage, i) => {
    const isDone = i < currentIdx || (report.status === 'finished');
    const isActive = i === currentIdx && report.status !== 'finished';

    return `
            <div class="ht-step ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}">
                <div class="ht-dot">${isDone ? '<i class="fas fa-check"></i>' : (i + 1)}</div>
                <div class="ht-label">${stage.label}</div>
            </div>
        `;
  }).join('');
}


async function fetchPetugasData() {
  try {
    const res = await fetch('/api/reports/assigned');
    const reports = await res.json();

    const activeList = document.getElementById('petugas-report-list');
    const historyList = document.getElementById('petugas-history-list');

    if (!activeList || !historyList) return;

    const active = reports.filter(r => r.status !== 'finished');
    const history = reports.filter(r => r.status === 'finished');

    // Render Active
    if (active.length === 0) {
      activeList.innerHTML = '<p style="color:var(--c-text-muted);">Tidak ada tugas aktif.</p>';
    } else {
      activeList.innerHTML = active.map(r => {
        const now = new Date();
        const exp = new Date(r.sla_expires_at);
        const diffHours = (exp - now) / (1000 * 60 * 60);

        let slaBadge = '';
        if (now > exp) {
          slaBadge = `<span style="color:var(--c-danger); font-size:0.7rem; font-weight:bold;"><i class="fas fa-exclamation-triangle"></i> MELEBIHI BATAS (SLA)</span>`;
        } else if (diffHours < 2) {
          slaBadge = `<span style="color:var(--c-warning); font-size:0.7rem; font-weight:bold;"><i class="fas fa-clock"></i> SEGERA (SISA < 2 JAM)</span>`;
        } else {
          slaBadge = `<span style="color:var(--c-success); font-size:0.7rem; font-weight:bold;"><i class="fas fa-check-circle"></i> DALAM SLA</span>`;
        }

        return `
                <div class="glass" style="padding:15px; margin-bottom:10px; border-left:4px solid ${now > exp ? 'var(--c-danger)' : 'var(--c-primary)'};">
                    <div style="display:flex; justify-content:space-between; align-items:start;">
                        <div style="flex:1;">
                            <h5 style="margin-bottom:3px;">${r.title}</h5>
                            <p style="font-size:0.8rem; color:var(--c-text-muted); margin-bottom:8px;"><i class="fas fa-tag"></i> ${r.category}</p>
                            ${slaBadge}
                        </div>
                        <button class="btn-primary" style="padding:5px 12px; font-size:0.75rem; white-space:nowrap;" onclick="updateStatus('${r.id}', 'finished')">SELESAIKAN</button>
                    </div>
                </div>
            `}).join('');
    }


    // Render History
    if (history.length === 0) {
      historyList.innerHTML = '<p style="color:var(--c-text-muted);">Belum ada riwayat.</p>';
    } else {
      historyList.innerHTML = history.map(r => `
                <div class="glass" style="padding:12px; margin-bottom:10px; opacity:0.8; border-left:4px solid var(--c-success);">
                    <h5 style="font-size:0.9rem; margin-bottom:3px;">${r.title}</h5>
                    <p style="font-size:0.75rem; color:var(--c-text-muted);"><i class="fas fa-check-circle"></i> Selesai pada: ${new Date(r.updated_at).toLocaleString('id-ID')}</p>
                </div>
            `).join('');
    }
  } catch (e) { }
}


async function updateStatus(id, status) {
  if (!confirm(`Ubah status laporan menjadi ${status.toUpperCase()}?`)) return;
  try {
    const res = await fetch(`/api/reports/${id}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': window.APP_STATE.csrf
      },
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Status berhasil diperbarui', 'success');
      fetchPetugasData();
    }
  } catch (e) { showToast('Gagal memperbarui status', 'error'); }
}

function showNotifications() {
  const notifs = state.data.notifications;
  const html = notifs.length === 0 ? '<p style="padding:20px; text-align:center;">Tidak ada notifikasi.</p>' :
    notifs.map(n => `
            <div class="notif-item ${n.is_read ? '' : 'unread'}" style="padding:15px; border-bottom:1px solid rgba(255,255,255,0.1);">
                <h5 style="margin-bottom:3px; color:${n.is_read ? 'var(--c-text-muted)' : 'var(--c-primary)'}">${n.title}</h5>
                <p style="font-size:0.85rem; color:var(--c-text-muted);">${n.message}</p>
                <small style="font-size:0.7rem; color:var(--c-text-muted);">${new Date(n.created_at).toLocaleString('id-ID')}</small>
            </div>
        `).join('');

  showModal('Notifikasi', `
        <div class="notif-list" style="max-height:400px; overflow-y:auto;">
            ${html}
        </div>
        <button class="btn-primary w-full" style="margin-top:20px;" onclick="markNotifsRead()">Tandai Semua Dibaca</button>
    `);

}

async function markNotifsRead() {
  try {
    await fetch('/api/notifications/read', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': window.APP_STATE.csrf
      }
    });
    syncNotifications();
    closeModal();
  } catch (e) { showToast('Gagal menandai notifikasi', 'error'); }
}

document.addEventListener('click', (e) => {
  if (e.target.closest('.notif-btn')) showNotifications();
});

function renderSettings() {
  const theme = document.body.getAttribute('data-theme') || 'dark';
  els.viewBox.innerHTML = `
        <div class="view-header">
            <div>
                <h2 class="view-title">Pengaturan Sistem</h2>
                <p class="view-desc">Kelola profil dan preferensi aplikasi Anda.</p>
            </div>
        </div>

        <div class="grid-2">
            <div class="glass" style="padding:25px;">
                <h3 style="margin-bottom:20px;"><i class="fas fa-user-circle"></i> Profil Saya</h3>
                <div class="form-grp">
                    <label>Nama Lengkap</label>
                    <input type="text" class="inp" value="${(state.user && state.user.name) || ''}" readonly style="opacity:0.7;">
                </div>
                <div class="form-grp">
                    <label>Email Institusi</label>
                    <input type="text" class="inp" value="${(state.user && state.user.email) || ''}" readonly style="opacity:0.7;">
                </div>
                <div class="form-grp">
                    <label>Peran / Role</label>
                    <div style="padding:10px; background:rgba(227,30,36,0.1); border-radius:8px; color:var(--c-primary); font-weight:600; text-transform:uppercase; display:inline-block; font-size:0.8rem;">
                        ${state.role}
                    </div>
                </div>
            </div>

            <div class="glass" style="padding:25px;">
                <h3 style="margin-bottom:20px;"><i class="fas fa-paint-brush"></i> Personalisasi Tampilan</h3>
                <p style="margin-bottom:20px; color:var(--c-text-muted);">Pilih tema yang paling nyaman untuk mata Anda saat menggunakan NgaduKampus.</p>
                
                <div class="theme-option ${theme === 'dark' ? 'active-theme' : ''}" onclick="setAppTheme('dark')" style="cursor:pointer; padding:15px; border-radius:12px; border:1px solid var(--c-border); margin-bottom:12px; display:flex; align-items:center; gap:15px; transition:0.3s;">
                    <div style="width:40px; height:40px; border-radius:50%; background:#1a1a1a; display:flex; align-items:center; justify-content:center; color:white;"><i class="fas fa-moon"></i></div>
                    <div style="flex:1;">
                        <h4 style="margin:0;">Tema Gelap (Default)</h4>
                        <small style="color:var(--c-text-muted);">Tampilan elegan dengan kontras tinggi.</small>
                    </div>
                    ${theme === 'dark' ? '<i class="fas fa-check-circle" style="color:var(--c-primary);"></i>' : ''}
                </div>

                <div class="theme-option ${theme === 'light' ? 'active-theme' : ''}" onclick="setAppTheme('light')" style="cursor:pointer; padding:15px; border-radius:12px; border:1px solid var(--c-border); display:flex; align-items:center; gap:15px; transition:0.3s;">
                    <div style="width:40px; height:40px; border-radius:50%; background:#f5f5f5; border:1px solid #ddd; display:flex; align-items:center; justify-content:center; color:#333;"><i class="fas fa-sun"></i></div>
                    <div style="flex:1;">
                        <h4 style="margin:0;">Tema Terang</h4>
                        <small style="color:var(--c-text-muted);">Tampilan bersih dan cerah di siang hari.</small>
                    </div>
                    ${theme === 'light' ? '<i class="fas fa-check-circle" style="color:var(--c-primary);"></i>' : ''}
                </div>
            </div>
        </div>

        <div class="glass" style="padding:25px; margin-top:25px; border-left: 4px solid var(--c-primary);">
            <h3 style="margin-bottom:10px;"><i class="fas fa-shield-alt"></i> Keamanan</h3>
            <p style="color:var(--c-text-muted); margin-bottom:20px;">Sesi login Anda dilindungi dengan enkripsi standar industri UMM.</p>
            <button class="btn-primary" onclick="showModal('Ganti Password', '<p style=\'padding:20px;\'>Fitur ganti password sedang dalam pemeliharaan berkala.</p>')">Ganti Password</button>
        </div>
    `;
}

function setAppTheme(theme) {
  document.body.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  renderSettings(); // Re-render to update active state
  showToast(`Tema ${theme === 'dark' ? 'Gelap' : 'Terang'} diaktifkan`, 'success');
}
async function handleUpvote(reportId) {
  try {
    const res = await fetch(`/api/reports/${reportId}/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': window.APP_STATE.csrf
      }
    });
    const data = await res.json();
    if (data.voted !== undefined) {
      showToast(data.voted ? 'Berhasil mendukung laporan!' : 'Dukungan dibatalkan', 'success');
      syncData();
    }
  } catch (e) { showToast('Gagal melakukan upvote', 'error'); }
}

async function deleteUser(id) {

  if (!confirm('Apakah Anda yakin ingin menghapus akun ini?')) return;

  try {
    const res = await fetch(`/api/users/${id}`, {
      method: 'DELETE',
      headers: {
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
        'Accept': 'application/json'
      }
    });
    const data = await res.json();
    if (data.success) {
      showToast('Akun berhasil dihapus', 'success');
      fetchUsers();
    } else {
      showToast(data.message || 'Gagal menghapus akun', 'error');
    }
  } catch (e) { showToast('Kesalahan sistem saat menghapus', 'error'); }
}

function showEditAkun(user) {
  showModal('Edit Akun', `
        <div class="form-grp">
            <label>Nama Lengkap</label>
            <input type="text" id="e-name" class="inp" value="${user.name}" />
        </div>
        <div class="form-grp">
            <label>Email Kampus</label>
            <input type="email" id="e-email" class="inp" value="${user.email}" />
        </div>
        <div class="form-row">
            <div class="form-grp">
                <label>Role</label>
                <select id="e-role" class="inp">
                    <option value="mahasiswa" ${user.role === 'mahasiswa' ? 'selected' : ''}>Mahasiswa</option>
                    <option value="petugas" ${user.role === 'petugas' ? 'selected' : ''}>Petugas</option>
                </select>
            </div>
            <div class="form-grp">
                <label>NIM (Kosongkan jika petugas)</label>
                <input type="text" id="e-nim" class="inp" value="${user.nim || ''}" />
            </div>
        </div>
        <div class="form-grp">
            <label>Ganti Password (Kosongkan jika tetap)</label>
            <input type="password" id="e-pass" class="inp" placeholder="Isi untuk ganti password" />
        </div>
        <button class="btn-primary w-full" onclick="submitEditAkun(${user.id})">Simpan Perubahan</button>
    `);
}

async function submitEditAkun(id) {
  const name = document.getElementById('e-name').value;
  const email = document.getElementById('e-email').value;
  const role = document.getElementById('e-role').value;
  const nim = document.getElementById('e-nim').value;
  const password = document.getElementById('e-pass').value;

  try {
    const res = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
        'Accept': 'application/json'
      },
      body: JSON.stringify({ name, email, role, nim, password })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      closeModal();
      showToast('Akun berhasil diperbarui!', 'success');
      fetchUsers();
    } else {
      const errorMsg = data.errors ? Object.values(data.errors).flat().join(', ') : (data.message || 'Gagal memperbarui akun');
      showToast(errorMsg, 'error');
    }
  } catch (e) { showToast('Kesalahan sistem saat memperbarui', 'error'); }
}



