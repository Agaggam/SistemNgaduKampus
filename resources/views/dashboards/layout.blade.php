@extends('layouts.app')

@section('content')
  <div class="dashboard-wrapper">
    <!-- Sidebar -->
    <aside class="sidebar" id="sidebar">
      <div class="sb-header">
        <div class="sb-logo">
          <div class="sb-icon"><i class="fas fa-shield-halved"></i></div>
          <div class="sb-brand">
            <div class="sb-name">NgaduKampus</div>
            <div class="sb-sub">UMM</div>
          </div>
        </div>
        <button class="sb-toggle" onclick="toggleSidebar()"><i class="fas fa-chevron-left"></i></button>
      </div>

      <div class="sb-user">
        <div class="sb-avatar-box">
            <div class="sb-avatar">{{ substr(Auth::user()->name, 0, 1) }}</div>
        </div>
        <div class="sb-info">
          <div class="sb-user-name">{{ Auth::user()->name }}</div>
          <div class="sb-user-role">{{ strtoupper(Auth::user()->role) }}</div>
        </div>
      </div>

      <nav class="sb-nav" id="sb-nav">
          @yield('sidebar-menu')
      </nav>

      <div class="sb-footer">
        <a href="{{ route('logout') }}" class="nav-item logout-btn" onclick="event.preventDefault(); localStorage.clear(); document.getElementById('logout-form').submit();">
          <i class="fas fa-sign-out-alt"></i>
          <span>Keluar</span>
        </a>
        <form id="logout-form" action="{{ route('logout') }}" method="POST" class="hidden">@csrf</form>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
      <header class="topbar">
        <div class="tb-left">
          <div class="tb-breadcrumb" id="tb-breadcrumb">
             @yield('breadcrumb')
          </div>
        </div>
        <div class="tb-right">
          <div class="tb-time" id="tb-clock">--:--</div>
          <div class="tb-notif">
            <button class="notif-btn" onclick="showNotifications()"><i class="fas fa-bell"></i></button>
            <span class="notif-dot" id="notif-dot">0</span>
          </div>
          <div class="tb-role-badge">{{ strtoupper(Auth::user()->role) }}</div>
          <div class="tb-avatar">{{ substr(Auth::user()->name, 0, 1) }}</div>
        </div>
      </header>

      <div class="view-box" id="view-box">
          @yield('main-view')
      </div>
    </main>
  </div>
@endsection

@push('scripts')
<script>
    // Global State for JS
    window.APP_STATE = {
        user: {
            id: "{{ Auth::id() }}",
            name: "{{ Auth::user()->name }}",
            role: "{{ Auth::user()->role }}",
            email: "{{ Auth::user()->email }}"
        },
        csrf: "{{ csrf_token() }}"
    };

    function toggleSidebar() {
        document.getElementById('sidebar').classList.toggle('collapsed');
    }

    function updateClock() {
        const now = new Date();
        document.getElementById('tb-clock').textContent = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    }
    updateClock();
    setInterval(updateClock, 1000);
</script>
@endpush
