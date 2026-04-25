@extends('dashboards.layout')

@section('sidebar-menu')
    <a href="#" class="nav-item active" onclick="navigate('dashboard'); return false;">
      <i class="fas fa-home"></i>
      <span>Dashboard</span>
    </a>
    <a href="#" class="nav-item" onclick="navigate('buat-laporan'); return false;">
      <i class="fas fa-plus-circle"></i>
      <span>Buat Laporan</span>
    </a>
    <a href="#" class="nav-item" onclick="navigate('tracking'); return false;">
      <i class="fas fa-route"></i>
      <span>Lacak Laporan</span>
    </a>
    <a href="#" class="nav-item" onclick="navigate('trending'); return false;">
      <i class="fas fa-fire"></i>
      <span>Trending & Upvote</span>
    </a>
    <a href="#" class="nav-item" onclick="navigate('lostfound'); return false;">
      <i class="fas fa-box-open"></i>
      <span>Lost & Found</span>
    </a>
    <a href="#" class="nav-item" onclick="navigate('kpi'); return false;">
      <i class="fas fa-star"></i>
      <span>Beri Rating</span>
    </a>
    <a href="#" class="nav-item" onclick="navigate('settings'); return false;">
      <i class="fas fa-cog"></i>
      <span>Pengaturan</span>
    </a>

@endsection

@section('breadcrumb')
    <i class="fas fa-home"></i> Dashboard Mahasiswa
@endsection

@section('main-view')
    <!-- This will be filled by app.js for now, but eventually we can move more to Blade -->
    <div id="mahasiswa-dashboard-content">
        <!-- Content handled by JS for SPA feel -->
    </div>
@endsection

@push('scripts')
<script>
    document.addEventListener('DOMContentLoaded', () => {
        // Force navigate to dashboard view on load
        const lastView = localStorage.getItem('last_view');
        if(typeof navigate === 'function') {
            navigate(lastView || 'dashboard');
        }

    });
</script>
@endpush
