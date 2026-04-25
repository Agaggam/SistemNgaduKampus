@extends('dashboards.layout')

@section('sidebar-menu')
    <a href="#" class="nav-item active" onclick="navigate('dash-manajemen'); return false;">
      <i class="fas fa-chart-pie"></i>
      <span>Analitik KPI</span>
    </a>
    <a href="#" class="nav-item" onclick="navigate('kelola-akun'); return false;">
      <i class="fas fa-users-cog"></i>
      <span>Kelola Akun</span>
    </a>
    <a href="#" class="nav-item" onclick="navigate('settings'); return false;">
      <i class="fas fa-cog"></i>
      <span>Pengaturan</span>
    </a>
@endsection

@section('breadcrumb')
    <i class="fas fa-user-tie"></i> Dashboard Manajemen & Analitik
@endsection

@section('main-view')
    <div id="manajemen-dashboard-content">
        <!-- Content handled by JS -->
    </div>
@endsection

@push('scripts')
<script>
    document.addEventListener('DOMContentLoaded', () => {
        const lastView = localStorage.getItem('last_view');
        if(typeof navigate === 'function') {
            navigate(lastView || 'dash-manajemen');
        }

    });
</script>
@endpush
