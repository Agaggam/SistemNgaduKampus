@extends('dashboards.layout')

@section('sidebar-menu')
    <a href="#" class="nav-item active" onclick="navigate('dash-petugas'); return false;">
      <i class="fas fa-tasks"></i>
      <span>Tugas Masuk</span>
    </a>
    <a href="#" class="nav-item" onclick="navigate('lostfound'); return false;">
      <i class="fas fa-box-open"></i>
      <span>Kelola Lost & Found</span>
    </a>
    <a href="#" class="nav-item" onclick="navigate('settings'); return false;">
      <i class="fas fa-cog"></i>
      <span>Pengaturan</span>
    </a>
@endsection

@section('breadcrumb')
    <i class="fas fa-user-shield"></i> Dashboard Petugas Keamanan
@endsection

@section('main-view')
    <div id="petugas-dashboard-content">
        <!-- Content handled by JS -->
    </div>
@endsection

@push('scripts')
<script>
    document.addEventListener('DOMContentLoaded', () => {
        const lastView = localStorage.getItem('last_view');
        if(typeof navigate === 'function') {
            navigate(lastView || 'dash-petugas');
        }

    });
</script>
@endpush
