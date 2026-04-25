@extends('layouts.app')

@section('content')
  <!-- ===== MAIN APP ===== -->
  <div id="main-app">
    <!-- Sidebar -->
    <aside class="sidebar" id="sidebar">
      <div class="sb-header">
        <div class="sb-logo">
          <div class="sb-logo-icon"><i class="fas fa-shield-halved"></i></div>
          <div class="sb-logo-txt">
            <span class="sb-name">NgaduKampus</span>
            <span class="sb-uni">UMM</span>
          </div>
        </div>
        <button class="sb-toggle" onclick="toggleSidebar()"><i class="fas fa-chevron-left" id="sb-chevron"></i></button>
      </div>

      <div class="sb-user" id="sb-user">
        <div class="sb-avatar" id="sb-avatar">{{ substr(Auth::user()->name, 0, 1) }}</div>
        <div class="sb-uinfo">
          <div class="sb-uname" id="sb-uname">{{ Auth::user()->name }}</div>
          <div class="sb-urole" id="sb-urole">{{ strtoupper(Auth::user()->role) }}</div>
        </div>
        <button class="theme-toggle" onclick="toggleTheme()" title="Ganti Tema">
            <i class="fas fa-moon" id="theme-icon"></i>
        </button>
      </div>

      <nav class="sb-nav" id="sb-nav">
          <!-- Navigation will be rendered by JS -->
      </nav>

      <div class="sb-footer">
        <form action="{{ route('logout') }}" method="POST">
            @csrf
            <button type="submit" class="btn-logout">
              <i class="fas fa-sign-out-alt"></i><span>Keluar</span>
            </button>
        </form>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="main-cnt" id="main-cnt">
      <header class="topbar">
        <div class="tb-left">
          <button class="mob-menu" onclick="toggleSidebar()"><i class="fas fa-bars"></i></button>
          <div class="breadcrumb" id="breadcrumb"><i class="fas fa-home"></i> Dashboard</div>
        </div>
        <div class="tb-right">
          <div class="tb-clock" id="tb-clock">--:--</div>
          <div class="notif-wrap">
            <button class="notif-btn"><i class="fas fa-bell"></i></button>
            <span class="notif-dot" id="notif-dot">0</span>
          </div>
          <div class="tb-role-badge" id="tb-role-badge">{{ strtoupper(Auth::user()->role) }}</div>
          <div class="tb-avatar" id="tb-avatar">{{ substr(Auth::user()->name, 0, 1) }}</div>

        </div>
      </header>
      <div class="view-box" id="view-box">
          <!-- View content will be rendered by JS -->
      </div>
    </main>
  </div>
@endsection

@push('scripts')
<script>
    // Global State for JS
    window.APP_STATE = {
        user: {
            id: {{ Auth::id() }},
            name: "{{ Auth::user()->name }}",
            role: "{{ Auth::user()->role }}",
            email: "{{ Auth::user()->email }}"
        },
        csrf: "{{ csrf_token() }}"
    };
</script>
@endpush


