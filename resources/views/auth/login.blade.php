@extends('layouts.app')

@section('content')
  <!-- ===== LOGIN SCREEN ===== -->
  <div id="login-screen">
    <div class="login-bg">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>
    </div>
    <div class="login-wrap">
      <!-- Left Panel -->
      <div class="login-left">
        <div class="brand-row">
          <div class="brand-icon"><i class="fas fa-shield-halved"></i></div>
          <div>
            <div class="brand-name">NgaduKampus</div>
            <div class="brand-sub">Universitas Muhammadiyah Malang</div>
          </div>
        </div>
        <h1 class="login-title">Suara Mahasiswa,<br/><span>Didengar & Ditindak</span></h1>
        <p class="login-desc">Platform pengaduan digital kampus yang transparan, aman, dan responsif. Setiap laporan Anda berarti.</p>
        <div class="feat-grid">
          <div class="feat-item"><i class="fas fa-lock"></i><span>Enkripsi End-to-End</span></div>
          <div class="feat-item"><i class="fas fa-eye-slash"></i><span>Mode Anonim</span></div>
          <div class="feat-item"><i class="fas fa-bolt"></i><span>SLA 24 Jam</span></div>
          <div class="feat-item"><i class="fas fa-chart-line"></i><span>Tracking Real-Time</span></div>
          <div class="feat-item"><i class="fas fa-route"></i><span>Smart Routing</span></div>
          <div class="feat-item"><i class="fas fa-star"></i><span>Rating & KPI</span></div>
        </div>
        <div class="login-stats">
          <div class="ls-item"><span class="ls-num">2,847</span><span class="ls-lbl">Laporan Selesai</span></div>
          <div class="ls-div"></div>
          <div class="ls-item"><span class="ls-num">98%</span><span class="ls-lbl">Kepuasan</span></div>
          <div class="ls-div"></div>
          <div class="ls-item"><span class="ls-num">4.2j</span><span class="ls-lbl">Rata-rata SLA</span></div>
        </div>
      </div>

      <!-- Right Panel (Card) -->
      <div class="login-right">
        <div class="login-card">
          <div class="card-header-flex">
            <div class="sso-badge"><i class="fas fa-shield-check"></i> Terproteksi SSO Kampus</div>
            <button type="button" class="theme-toggle sm" onclick="toggleTheme()"><i class="fas fa-moon" id="theme-icon"></i></button>
          </div>
          <h2>Masuk ke NgaduKampus</h2>
          <p class="card-sub">Pilih jenis akun akademik UMM Anda</p>

          <form id="form-login">
              <div class="form-grp">
                <label id="lbl-id"><i class="fas fa-id-card"></i> NIM Mahasiswa</label>
                <input type="text" name="identifier" id="inp-nim" class="inp" placeholder="Masukkan 15 digit NIM" />
              </div>
              <div class="form-grp">
                <label><i class="fas fa-lock"></i> Password SSO</label>
                <div class="inp-wrap">
                  <input type="password" name="password" id="inp-pass" class="inp" placeholder="Password Anda" />
                  <button type="button" class="eye-btn" id="eye-btn" onclick="togglePass()"><i class="fas fa-eye" id="eye-ico"></i></button>
                </div>
              </div>
              
              <button type="submit" class="btn-primary w-full" id="btn-login">
                <span id="login-txt"><i class="fas fa-sign-in-alt"></i> Masuk dengan SSO</span>
                <span id="login-load" class="hidden"><i class="fas fa-spinner fa-spin"></i> Memverifikasi SSO...</span>
              </button>
          </form>

          <div class="or-divider"><span>Pilih Jenis Akun</span></div>

          <div class="role-selector">
            <button type="button" class="role-btn active" id="role-mhs" onclick="selectRole('mhs')">
              <i class="fas fa-user-graduate"></i>
              <span>Mahasiswa</span>
            </button>
            <button type="button" class="role-btn" id="role-staff" onclick="selectRole('staff')">
              <i class="fas fa-user-shield"></i>
              <span>Petugas</span>
            </button>
            <button type="button" class="role-btn" id="role-admin" onclick="selectRole('admin')">
              <i class="fas fa-user-tie"></i>
              <span>Manajemen</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
@endsection

@push('scripts')
<script>
document.getElementById('form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const identifier = document.getElementById('inp-nim').value;
    const password = document.getElementById('inp-pass').value;
    
    if(!identifier || !password) return showToast('Harap isi semua field', 'error');

    document.getElementById('login-txt').classList.add('hidden');
    document.getElementById('login-load').classList.remove('hidden');
    document.getElementById('btn-login').disabled = true;

    try {
        const payload = identifier.includes('@') ? { email: identifier, password } : { nim: identifier, password };
        const res = await fetch('/login', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
            },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if(data.success) {
            window.location.href = '/dashboard';
        } else {
            showToast(data.message, 'error');
            document.getElementById('login-txt').classList.remove('hidden');
            document.getElementById('login-load').classList.add('hidden');
            document.getElementById('btn-login').disabled = false;
        }
    } catch(err) {
        showToast('Terjadi kesalahan server', 'error');
        document.getElementById('login-txt').classList.remove('hidden');
        document.getElementById('login-load').classList.add('hidden');
        document.getElementById('btn-login').disabled = false;
    }
});

function selectRole(role) {
    const btnMhs = document.getElementById('role-mhs');
    const btnStaff = document.getElementById('role-staff');
    const btnAdmin = document.getElementById('role-admin');
    const lblId = document.getElementById('lbl-id');
    const inpId = document.getElementById('inp-nim');

    // Reset all
    [btnMhs, btnStaff, btnAdmin].forEach(b => b.classList.remove('active'));

    if(role === 'mhs') {
        btnMhs.classList.add('active');
        lblId.innerHTML = '<i class="fas fa-id-card"></i> NIM Mahasiswa';
        inpId.placeholder = 'Masukkan 15 digit NIM';
    } else if(role === 'staff') {
        btnStaff.classList.add('active');
        lblId.innerHTML = '<i class="fas fa-envelope"></i> Email Petugas';
        inpId.placeholder = 'petugas@umm.ac.id';
    } else {
        btnAdmin.classList.add('active');
        lblId.innerHTML = '<i class="fas fa-user-shield"></i> Email Manajemen';
        inpId.placeholder = 'admin@umm.ac.id';
    }
}

function toggleTheme() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    const icon = document.getElementById('theme-icon');
    if(icon) icon.className = newTheme === 'light' ? 'fas fa-sun' : 'fas fa-moon';
}

const savedTheme = localStorage.getItem('theme') || 'dark';
document.body.setAttribute('data-theme', savedTheme);
if(savedTheme === 'light') {
    window.addEventListener('DOMContentLoaded', () => {
        const icon = document.getElementById('theme-icon');
        if(icon) icon.className = 'fas fa-sun';
    });
}
</script>
@endpush
