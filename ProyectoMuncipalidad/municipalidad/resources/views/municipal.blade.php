<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/png" sizes="512x512" href="images/NextFlow_Logo_blanco.png">
    <title>Usuario Municipal - Municipalidad</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="{{ asset('css/municipal.css?22.5') }}">
</head>
<body>
    <!-- BARRA SUPERIOR MÓVIL -->
    <div class="topbar-mobile" id="topbarMobile">
            <img src="{{ asset('images/municipalidad.png') }}" class="logo-mobile-big" alt="Logo Municipalidad" />
        <button class="hamburger-mobile" id="hamburgerMobile" onclick="toggleMobileMenu()">
            <i class="fas fa-bars"></i>
        </button>
        <div class="mobile-user-block">
            <div class="user-avatar" id="mobileUserAvatar">NS</div>
            <div class="user-name" id="mobileUserName">Nombre Apellido</div>
        </div>
    </div>
    <div class="sidebar-menu-mobile" id="sidebarMenuMobile">
        <a href="#" class="menu-item active" onclick="setActiveMenu(this)"><i class="fas fa-home"></i> <span>Inicio</span></a>
        <a href="#" class="menu-item" onclick="setActiveMenu(this)"><i class="fas fa-user"></i> <span>Mi Perfil</span></a>
        <a href="#" class="menu-item" onclick="setActiveMenu(this)"><i class="fas fa-warehouse"></i> <span>Espacios asignados</span></a>
        <a href="#" class="menu-item" onclick="setActiveMenu(this)"><i class="fas fa-exclamation-triangle"></i> <span>Envió reportes</span></a>
        <a href="#" class="menu-item" onclick="setActiveMenu(this)"><i class="fas fa-comments"></i> <span>Respuestas de reportes</span></a>
        <a href="#" class="menu-item" onclick="setActiveMenu(this)"><i class="fas fa-history"></i> <span>Historial de reportes</span></a>
        
        
        <a href="#" class="menu-item logout-mobile" onclick="logout()"><i class="fas fa-sign-out-alt"></i> <span>Cerrar Sesión</span></a>
    </div>

    <!-- Sidebar -->
    <div class="sidebar" id="sidebar">
        <div class="sidebar-header">
            <img src="{{ asset('images/municipalidad.png') }}" alt="Logo Municipalidad">
            <button class="sidebar-toggle" id="sidebarToggle" onclick="toggleSidebar()">
                <i class="fas fa-bars"></i>
            </button>
        </div>
        <div class="sidebar-menu">
            <button class="sidebar-toggle menu-toggle" id="sidebarToggleMenu" onclick="toggleSidebar()" style="display:none">
                <i class="fas fa-bars"></i>
            </button>
            <a href="#" class="menu-item active" onclick="setActiveMenu(this)">
                <i class="fas fa-home"></i>
                <span>Inicio</span>
            </a>
            <a href="#" class="menu-item" onclick="setActiveMenu(this)">
                <i class="fas fa-user"></i>
                <span>Mi Perfil</span>
            </a>
            <a href="#" class="menu-item" onclick="setActiveMenu(this)">
                <i class="fas fa-warehouse"></i>
                <span>Espacios asignados</span>
            </a>
            <a href="#" class="menu-item" onclick="setActiveMenu(this)">
                <i class="fas fa-exclamation-triangle"></i>
                <span>Envió reportes</span>
            </a>
            <a href="#" class="menu-item" onclick="setActiveMenu(this)">
                <i class="fas fa-comments"></i>
                <span>Respuestas de reportes</span>
            </a>
            <a href="#" class="menu-item" onclick="setActiveMenu(this)">
                <i class="fas fa-history"></i>
                <span>Historial de reportes</span>
            </a>
            
            
        </div>
        
        <div class="sidebar-footer">
            <div class="user-info">
                <div class="user-avatar" id="userAvatar">
                    A
                </div>
                <div class="user-details">
                    <div class="user-name" id="userName">Cargando...</div>
                    <div class="user-role">Usuario Municipal</div>
                </div>
            </div>
            <button class="logout-btn" onclick="logout()">
                <i class="fas fa-sign-out-alt"></i>
                Cerrar Sesión
            </button>
        </div>
    </div>

    <!-- Main Content -->
    <div class="main-content" id="mainContent">
        <div class="container">
            <!-- El contenido se carga dinámicamente desde admin.js -->
        </div>
    </div>

    <script>
        // Los datos del usuario se obtendrán desde el token en los archivos JS
        // No es necesario guardarlos aquí ya que se obtienen desde el servidor
    </script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js"></script>
    <script src="{{ asset('js/municipal.js?22.5') }}"></script>
    
</body>
</html> 