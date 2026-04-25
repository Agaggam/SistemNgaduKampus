<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>NgaduKampus UMM — Sistem Pengaduan Digital Kampus</title>
  <meta name="csrf-token" content="{{ csrf_token() }}">
  <meta name="description" content="Sistem Informasi Pengaduan Digital Universitas Muhammadiyah Malang — Laporkan, Lacak, dan Pantau Pengaduan secara Real-Time." />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <link rel="stylesheet" href="{{ asset('css/main.css') }}" />
  <link rel="stylesheet" href="{{ asset('css/views.css') }}" />
</head>
<body>

<div id="app">
    @yield('content')
</div>

<!-- Toast -->
<div id="toasts"></div>
<!-- Modal -->
<div id="modal-overlay" class="modal-overlay" onclick="closeModal()"></div>
<div id="modal-box" class="modal-box hidden"></div>

<script>
function toggleTheme() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    const icon = document.getElementById('theme-icon-global');
    if(icon) icon.className = newTheme === 'light' ? 'fas fa-sun' : 'fas fa-moon';
}

(function() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.body.setAttribute('data-theme', savedTheme);
    window.addEventListener('DOMContentLoaded', () => {
        const icon = document.getElementById('theme-icon-global');
        if(icon) icon.className = savedTheme === 'light' ? 'fas fa-sun' : 'fas fa-moon';
    });
})();
</script>

<script src="{{ asset('js/app.js') }}"></script>
@stack('scripts')
</body>
</html>
