// Función para obtener la URL base completa
function getBaseUrl() {
    const protocol = window.location.protocol;
    const host = window.location.host;
    const pathname = window.location.pathname;
    // Extraer la ruta base (hasta /public)
    let basePath = '/ProyectoMuncipalidad/municipalidad/public';
    if (pathname.includes('/public')) {
        basePath = pathname.substring(0, pathname.indexOf('/public') + 7);
    }
    return `${protocol}//${host}${basePath}`;
}

// Función para obtener la ruta base de la aplicación (con /public para Laravel)
function getAppBasePath() {
    const pathname = window.location.pathname;
    // Extraer la ruta base hasta /public (donde está index.php de Laravel)
    let basePath = '/ProyectoMuncipalidad/municipalidad/public';
    if (pathname.includes('/public')) {
        basePath = pathname.substring(0, pathname.indexOf('/public') + 7);
    } else if (pathname.includes('/municipalidad')) {
        // Si no hay /public en la ruta, asumir que estamos en /municipalidad/public
        basePath = pathname.substring(0, pathname.indexOf('/municipalidad') + 14) + '/public';
    }
    return basePath;
}

// Verificación inmediata del token antes de cargar cualquier contenido
(function verificarTokenInmediato() {
    // Ocultar el contenido mientras se verifica
    const style = document.createElement('style');
    style.setAttribute('data-token-check', 'true');
    style.textContent = 'body { display: none !important; }';
    document.head.appendChild(style);
    
    // Verificar token de forma síncrona primero
    const token = sessionStorage.getItem('token_sesion') || new URLSearchParams(window.location.search).get('token');
    const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
    
    // Si no hay token ni usuario, redirigir inmediatamente
    if (!token && !usuarioLogueado) {
        window.location.replace(getBaseUrl());
        return;
    }
    
    // Función para mostrar contenido
    const mostrarContenido = () => {
        const styleTag = document.querySelector('style[data-token-check]');
        if (styleTag) styleTag.remove();
    };
    
    // Si hay token pero no usuario, verificar de forma asíncrona
    if (token && !usuarioLogueado) {
        // Hacer verificación rápida
        fetch(getAppBasePath() + '/config/sesion.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'verificar',
                token: token
            })
        })
        .then(response => response.json())
        .then(result => {
            if (result.success && result.usuario) {
                // Guardar datos
                sessionStorage.setItem('usuario_logueado', JSON.stringify({
                    id_usuario: result.usuario.id_usuario,
                    nombres: result.usuario.nombres,
                    apellidos: result.usuario.apellidos,
                    usuario: result.usuario.usuario,
                    correo: result.usuario.correo,
                    cargo: result.usuario.cargo || '',
                    rol: result.roles && result.roles.length > 0 ? result.roles[0].nombre : 'Informática'
                }));
                sessionStorage.setItem('token_sesion', token);
                
                // Verificar rol
                const rol = result.roles && result.roles.length > 0 ? result.roles[0].nombre.toLowerCase() : '';
                if (rol !== 'informática' && rol !== 'informatica') {
                    window.location.replace(getBaseUrl());
                    return;
                }
                
                // Mostrar contenido
                mostrarContenido();
            } else {
                // Token inválido, redirigir
                window.location.replace(getBaseUrl());
            }
        })
        .catch(error => {
            console.error('Error al verificar token:', error);
            window.location.replace(getBaseUrl());
        });
    } else if (usuarioLogueado) {
        // Si ya hay usuario en sessionStorage, verificar rol rápidamente
        try {
            const usuario = JSON.parse(usuarioLogueado);
            const rol = usuario.rol ? usuario.rol.toLowerCase() : '';
            if (rol !== 'informática' && rol !== 'informatica') {
                window.location.replace(getBaseUrl());
                return;
            }
            // Mostrar contenido
            mostrarContenido();
        } catch (error) {
            window.location.replace(getBaseUrl());
        }
    }
})();

// Función para obtener y guardar datos del usuario desde el token
async function obtenerDatosUsuarioDesdeToken() {
    // Obtener token de la URL o sessionStorage
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token') || sessionStorage.getItem('token_sesion');
    
    if (!token) {
        return false;
    }
    
    // Si ya hay datos en sessionStorage, no hacer petición
    const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
    if (usuarioLogueado && sessionStorage.getItem('token_sesion') === token) {
        return true;
    }
    
    try {
        // Obtener datos del usuario desde el servidor
        const response = await fetch(getAppBasePath() + '/config/sesion.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'verificar',
                token: token
            })
        });
        
        const result = await response.json();
        
        if (result.success && result.usuario) {
            // Guardar datos del usuario en sessionStorage
            sessionStorage.setItem('usuario_logueado', JSON.stringify({
                id_usuario: result.usuario.id_usuario,
                nombres: result.usuario.nombres,
                apellidos: result.usuario.apellidos,
                usuario: result.usuario.usuario,
                correo: result.usuario.correo,
                cargo: result.usuario.cargo || '',
                rol: result.roles && result.roles.length > 0 ? result.roles[0].nombre : 'Informática'
            }));
            sessionStorage.setItem('token_sesion', token);
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.error('Error al obtener datos del usuario:', error);
        return false;
    }
}

// menu.js extraído de admin_box.js
// Función para inicializar el menú (con verificación de sesión)
async function inicializarMenu() {
    // Primero intentar obtener datos del usuario desde el token
    const datosObtenidos = await obtenerDatosUsuarioDesdeToken();
    
    if (!datosObtenidos) {
        // Redirigir al login si no se pudieron obtener los datos
        window.location.href = getBaseUrl();
        return;
    }
    
    // Verificar si hay usuario logueado
    const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
    const token = sessionStorage.getItem('token_sesion') || new URLSearchParams(window.location.search).get('token');
    
    if (!usuarioLogueado || !token) {
        // Redirigir al login si no hay sesión válida
        window.location.href = getBaseUrl();
        return;
    }
    
    try {
        const usuario = JSON.parse(usuarioLogueado);
        
        // Verificar que el usuario tenga rol de informática
        const rol = usuario.rol ? usuario.rol.toLowerCase() : '';
        if (rol !== 'informática' && rol !== 'informatica') {
            window.location.href = getBaseUrl();
            return;
        }
        
        // Configurar información de usuario real
        const nombreCompleto = `${usuario.nombres || usuario.nombre || ''} ${usuario.apellidos || usuario.apellido || ''}`;
        const iniciales = `${(usuario.nombres || usuario.nombre || '').charAt(0)}${(usuario.apellidos || usuario.apellido || '').charAt(0)}`;
        
        if (document.getElementById('userName')) {
            document.getElementById('userName').textContent = nombreCompleto.trim() || 'Usuario';
        }
        if (document.getElementById('userAvatar')) {
            document.getElementById('userAvatar').textContent = iniciales || 'U';
        }
        
        // Configurar información móvil
        if (document.getElementById('mobileUserName')) {
            document.getElementById('mobileUserName').textContent = nombreCompleto.trim() || 'Usuario';
        }
        if (document.getElementById('mobileUserAvatar')) {
            document.getElementById('mobileUserAvatar').textContent = iniciales || 'U';
        }
        
    } catch (error) {
        console.error('Error al cargar datos del usuario:', error);
        // Redirigir al login si hay error
        window.location.href = getBaseUrl();
    }
}

// Función de logout
async function logout() {
    // Mostrar card de confirmación
    mostrarCardLogout();
}

// Función para mostrar card de logout
function mostrarCardLogout() {
    // Eliminar overlay existente si hay uno
    let existingOverlay = document.getElementById('overlay-logout');
    if (existingOverlay) {
        existingOverlay.remove();
    }
    
    // Crear overlay difuminado
    let overlay = document.createElement('div');
    overlay.id = 'overlay-logout';
    overlay.className = 'overlay-blur';
    overlay.style.display = 'flex';
    document.body.appendChild(overlay);
    
    // Crear card
    let card = document.createElement('div');
    card.className = 'logout-card';

    // Icono
    let icon = document.createElement('div');
    icon.innerHTML = '<i class="fas fa-sign-out-alt logout-icon"></i>';
    card.appendChild(icon);

    // Mensaje
    let msg = document.createElement('div');
    msg.className = 'logout-text';
    msg.textContent = '¿Estás seguro de que quieres cerrar sesión?';
    card.appendChild(msg);

    // Botones
    let buttonContainer = document.createElement('div');
    buttonContainer.className = 'logout-actions';

    // Función para cerrar el overlay
    function cerrarOverlay() {
        overlay.remove();
    }

    // Botón Cancelar
    let cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancelar';
    cancelBtn.className = 'cancel-btn';
    cancelBtn.onclick = cerrarOverlay;
    buttonContainer.appendChild(cancelBtn);

    // Botón Confirmar
    let confirmBtn = document.createElement('button');
    confirmBtn.textContent = 'Cerrar Sesión';
    confirmBtn.className = 'btn-logout';
    confirmBtn.onclick = async function() {
        // Ejecutar logout real
        await ejecutarLogout();
        cerrarOverlay();
    };
    buttonContainer.appendChild(confirmBtn);

    card.appendChild(buttonContainer);
    overlay.appendChild(card);

    // Cerrar al hacer clic fuera de la card
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            cerrarOverlay();
        }
    });

    // Prevenir que el clic en la card cierre el overlay
    card.addEventListener('click', function(e) {
        e.stopPropagation();
    });
}

// Función para ejecutar el logout real
async function ejecutarLogout() {
    const token = sessionStorage.getItem('token_sesion');
    
    if (token) {
        try {
            // Cerrar sesión en el backend - usar la misma ruta que otras llamadas
            const response = await fetch(getAppBasePath() + '/config/sesion.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'cerrar',
                    token: token
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (!result.success) {
                console.error('Error al cerrar sesión en el servidor:', result.message);
            }
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    }
    
    // Limpiar datos de sesión
    sessionStorage.removeItem('usuario_logueado');
    sessionStorage.removeItem('tipo_usuario');
    sessionStorage.removeItem('token_sesion');
    
    // Mostrar mensaje de confirmación
    mostrarCardEmergente(true, 'Sesión cerrada correctamente');
    
    // Redirigir al login después de un breve delay
    setTimeout(() => {
        window.location.href = getBaseUrl();
    }, 1500);
}

// Función para mostrar card emergente (reutilizada del login)
function mostrarCardEmergente(success, message) {
    // Eliminar overlay existente si hay uno
    let existingOverlay = document.getElementById('overlay-msg');
    if (existingOverlay) {
        existingOverlay.remove();
    }
    
    // Crear overlay difuminado
    let overlay = document.createElement('div');
    overlay.id = 'overlay-msg';
    overlay.className = 'overlay-blur';
    overlay.style.display = 'flex';
    overlay.style.zIndex = '1000001'; // Mayor que los modales (1000000)
    document.body.appendChild(overlay);
    
    // Crear card
    let card = document.createElement('div');
    card.className = `msg-card ${success ? 'success' : 'error'}`;

    // Icono
    let icon = document.createElement('div');
    icon.innerHTML = success
        ? '<i class="fas fa-check-circle msg-icon"></i>'
        : '<i class="fas fa-times-circle msg-icon"></i>';
    card.appendChild(icon);

    // Mensaje
    let msg = document.createElement('div');
    msg.className = 'msg-text';
    msg.textContent = message;
    card.appendChild(msg);

    // Función para cerrar el overlay
    function cerrarOverlay() {
        overlay.remove();
    }

    // Botón de cerrar
    let closeBtn = document.createElement('button');
    closeBtn.textContent = 'Cerrar';
    closeBtn.className = success ? 'btn-msg-success' : 'btn-msg-error';
    closeBtn.onclick = cerrarOverlay;
    card.appendChild(closeBtn);

    overlay.appendChild(card);

    // Cerrar al hacer clic fuera de la card
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            cerrarOverlay();
        }
    });

    // Prevenir que el clic en la card cierre el overlay
    card.addEventListener('click', function(e) {
        e.stopPropagation();
    });

    // Auto-cerrar para mensajes de éxito después de 3 segundos
    if (success) {
        setTimeout(() => {
            if (overlay && overlay.parentNode) {
                cerrarOverlay();
            }
        }, 3000);
    }
}

// Función para alternar el sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const toggleBtnHeader = document.getElementById('sidebarToggle');
    const toggleBtnMenu = document.getElementById('sidebarToggleMenu');
    const iconHeader = toggleBtnHeader.querySelector('i');
    const iconMenu = toggleBtnMenu ? toggleBtnMenu.querySelector('i') : null;
    if (window.innerWidth <= 600) {
        // Móvil: alterna menú desplegable
        sidebar.classList.toggle('menu-open');
        return;
    }
    sidebar.classList.toggle('collapsed');
    mainContent.classList.toggle('collapsed');
    if (sidebar.classList.contains('collapsed')) {
        if(toggleBtnHeader) toggleBtnHeader.style.display = 'none';
        if(toggleBtnMenu) toggleBtnMenu.style.display = 'flex';
    } else {
        if(toggleBtnHeader) toggleBtnHeader.style.display = 'flex';
        if(toggleBtnMenu) toggleBtnMenu.style.display = 'none';
    }
    iconHeader.className = 'fas fa-bars';
    if(iconMenu) iconMenu.className = 'fas fa-bars';
}

// Función para cerrar el menú móvil
function closeMobileMenu() {
    const mobileMenu = document.getElementById('sidebarMenuMobile');
    if (window.innerWidth <= 600) {
        mobileMenu.classList.remove('open');
    }
}

// Función para establecer menú activo y cambiar contenido
function setActiveMenu(menuItem) {
    // Remover clase active de todos los menús
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Agregar clase active al menú seleccionado
    menuItem.classList.add('active');
    
    // Obtener el texto del menú seleccionado
    const menuText = menuItem.querySelector('span').textContent;
    
    // Cambiar el contenido según la opción seleccionada
    cambiarContenido(menuText);
    
    // En móviles, cerrar el sidebar después de seleccionar
    if (window.innerWidth <= 600) {
        closeMobileMenu();
    }
}

// Función para cambiar el contenido del panel principal
function cambiarContenido(opcion) {
    const container = document.querySelector('.container');
    
    switch(opcion) {
        case 'Inicio':
            container.innerHTML = `
                <div class="welcome-card">
                    <div class="geometric-line-1"></div>
                    <div class="geometric-dot-1"></div>
                    <div class="geometric-square-1"></div>
                    <div class="geometric-rect-1"></div>
                    <div class="geometric-triangle-1"></div>
                    <div class="geometric-line-2"></div>
                    <div class="geometric-dot-2"></div>
                    <div class="geometric-square-2"></div>
                    <div class="geometric-rect-2"></div>
                    <div class="geometric-triangle-2"></div>
                    <div class="geometric-line-3"></div>
                    <div class="geometric-dot-3"></div>
                    <div class="geometric-square-3"></div>
                    <div class="geometric-rect-3"></div>
                    <div class="geometric-triangle-3"></div>
                    <div class="geometric-line-4"></div>
                    <div class="geometric-dot-4"></div>
                    <div class="geometric-square-4"></div>
                    <div class="geometric-rect-4"></div>
                    <div class="geometric-triangle-4"></div>
                    <div class="geometric-line-5"></div>
                    <div class="geometric-dot-5"></div>
                    <div class="geometric-square-5"></div>
                    <div class="geometric-rect-5"></div>
                    <div class="geometric-triangle-5"></div>
                    <div class="geometric-line-6"></div>
                    <div class="geometric-dot-6"></div>
                    <div class="geometric-square-6"></div>
                    <div class="geometric-rect-6"></div>
                    <div class="geometric-triangle-6"></div>
                    <div class="geometric-line-7"></div>
                    <div class="geometric-dot-7"></div>
                    <div class="geometric-square-7"></div>
                    <div class="geometric-rect-7"></div>
                    <div class="geometric-triangle-7"></div>
                    <div class="geometric-line-8"></div>
                    <div class="geometric-dot-8"></div>
                    <div class="geometric-square-8"></div>
                    <div class="geometric-rect-8"></div>
                    <div class="geometric-triangle-8"></div>
                    <div class="geometric-line-9"></div>
                    <div class="geometric-dot-9"></div>
                    <div class="geometric-square-9"></div>
                    <div class="geometric-rect-9"></div>
                    <div class="geometric-triangle-9"></div>
                    <div class="geometric-line-10"></div>
                    <div class="geometric-dot-10"></div>
                    <div class="geometric-square-10"></div>
                    <div class="geometric-rect-10"></div>
                    <div class="geometric-triangle-10"></div>
                    <h2>Bienvenido al Panel de Informática</h2>
                    <p>Gestiona Equipamiento y Reportes del Sistema</p>
                </div>

                <div class="dashboard-cards-container">
                    <!-- Card: Equipamiento -->
                    <div class="dashboard-card">
                        <div class="dashboard-card-header">
                            <i class="fas fa-warehouse"></i>
                            <h3>Equipamiento</h3>
                                </div>
                        <div class="dashboard-card-body">
                            <div class="dashboard-stat">
                                <span class="stat-label">Total de Oficinas o Secciones</span>
                                <span class="stat-value" id="stat-oficinas-total">-</span>
                            </div>
                            <div class="dashboard-stat">
                                <span class="stat-label">Total de Items</span>
                                <span class="stat-value" id="stat-items-total">-</span>
                                </div>
                            </div>
                                </div>

                    <!-- Card: Movimientos -->
                    <div class="dashboard-card">
                        <div class="dashboard-card-header">
                            <i class="fas fa-exchange-alt"></i>
                            <h3>Movimientos</h3>
                            </div>
                        <div class="dashboard-card-body">
                            <div class="dashboard-stat">
                                <span class="stat-label">Total de Movimientos</span>
                                <span class="stat-value" id="stat-total-movimientos">-</span>
                                </div>
                            <div class="dashboard-stat">
                                <span class="stat-label">Movimientos Pendientes</span>
                                <span class="stat-value" id="stat-movimientos-pendientes">-</span>
                            </div>
                                </div>
                            </div>

                    <!-- Card: Reportes de Incidentes -->
                    <div class="dashboard-card">
                        <div class="dashboard-card-header">
                            <i class="fas fa-exclamation-triangle"></i>
                            <h3>Reportes de Incidentes</h3>
                                </div>
                        <div class="dashboard-card-body">
                            <div class="dashboard-stat">
                                <span class="stat-label">Total de Reportes</span>
                                <span class="stat-value" id="stat-reportes-total">-</span>
                            </div>
                            <div class="dashboard-stat">
                                <span class="stat-label">Total de Recibidos</span>
                                <span class="stat-value" id="stat-reportes-recibidos">-</span>
                            </div>
                            <div class="dashboard-stat">
                                <span class="stat-label">Total de Respondidos</span>
                                <span class="stat-value" id="stat-reportes-respondidos">-</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            setTimeout(() => {
                cargarEstadisticasDashboardInformatica();
            }, 100);
            break;
            
        case 'Mi Perfil':
            container.innerHTML = `
                <div class="welcome-card">
                    <div class="geometric-line-1"></div>
                    <div class="geometric-dot-1"></div>
                    <div class="geometric-square-1"></div>
                    <div class="geometric-rect-1"></div>
                    <div class="geometric-triangle-1"></div>
                    <div class="geometric-line-2"></div>
                    <div class="geometric-dot-2"></div>
                    <div class="geometric-square-2"></div>
                    <div class="geometric-rect-2"></div>
                    <div class="geometric-triangle-2"></div>
                    <div class="geometric-line-3"></div>
                    <div class="geometric-dot-3"></div>
                    <div class="geometric-square-3"></div>
                    <div class="geometric-rect-3"></div>
                    <div class="geometric-triangle-3"></div>
                    <div class="geometric-line-4"></div>
                    <div class="geometric-dot-4"></div>
                    <div class="geometric-square-4"></div>
                    <div class="geometric-rect-4"></div>
                    <div class="geometric-triangle-4"></div>
                    <div class="geometric-line-5"></div>
                    <div class="geometric-dot-5"></div>
                    <div class="geometric-square-5"></div>
                    <div class="geometric-rect-5"></div>
                    <div class="geometric-triangle-5"></div>
                    <div class="geometric-line-6"></div>
                    <div class="geometric-dot-6"></div>
                    <div class="geometric-square-6"></div>
                    <div class="geometric-rect-6"></div>
                    <div class="geometric-triangle-6"></div>
                    <div class="geometric-line-7"></div>
                    <div class="geometric-dot-7"></div>
                    <div class="geometric-square-7"></div>
                    <div class="geometric-rect-7"></div>
                    <div class="geometric-triangle-7"></div>
                    <div class="geometric-line-8"></div>
                    <div class="geometric-dot-8"></div>
                    <div class="geometric-square-8"></div>
                    <div class="geometric-rect-8"></div>
                    <div class="geometric-triangle-8"></div>
                    <div class="geometric-line-9"></div>
                    <div class="geometric-dot-9"></div>
                    <div class="geometric-square-9"></div>
                    <div class="geometric-rect-9"></div>
                    <div class="geometric-triangle-9"></div>
                    <div class="geometric-line-10"></div>
                    <div class="geometric-dot-10"></div>
                    <div class="geometric-square-10"></div>
                    <div class="geometric-rect-10"></div>
                    <div class="geometric-triangle-10"></div>
                    <h2>Mi Perfil de Admin Sistema</h2>
                    <p>Gestiona tu información personal y credenciales</p>
                </div>
                
                <div class="form-container">
                        <!-- Sección de Información Personal -->
                    <div class="form-section">
                        <div class="section-header">
                            <h3>
                                <i class="fas fa-user"></i>
                                Información Personal
                            </h3>
                                <button class="edit-profile-btn" id="editProfileBtn" onclick="toggleEditProfile()">
                                    <i class="fas fa-edit"></i> Editar Perfil
                                </button>
                            </div>
                        <div class="section-body">
                            <form id="formPerfil" class="register-space-form" onsubmit="actualizarPerfil(event)">
                                <div class="form-row">
                                <div class="form-group">
                                        <label for="profileRut">RUT</label>
                                        <input type="text" id="profileRut" placeholder="12345678-9" disabled>
                                </div>
                                <div class="form-group">
                                        <label for="profileNombreUsuario">Nombre de Usuario</label>
                                        <input type="text" id="profileNombreUsuario" placeholder="Tu nombre de usuario" disabled>
                                </div>
                                </div>
                                
                                <div class="form-row">
                                <div class="form-group">
                                        <label for="profileNombre">Nombre *</label>
                                        <input type="text" id="profileNombre" placeholder="Tu nombre" disabled required>
                                </div>
                                <div class="form-group">
                                        <label for="profileApellido">Apellido *</label>
                                        <input type="text" id="profileApellido" placeholder="Tu apellido" disabled required>
                                </div>
                                </div>
                                
                                <div class="form-row">
                                <div class="form-group">
                                        <label for="profileEmail">Email *</label>
                                        <input type="email" id="profileEmail" placeholder="tu@email.com" disabled required>
                                </div>
                                <div class="form-group">
                                        <label for="profileCargo">Cargo</label>
                                        <input type="text" id="profileCargo" placeholder="Tu cargo" disabled>
                                </div>
                                </div>
                                
                                <div class="form-actions" id="profileActions" style="display: none;">
                                    <button type="button" class="btn-cancel" onclick="cancelarEdicion()">
                                        <i class="fas fa-times"></i> Cancelar
                                    </button>
                                    <button type="submit" class="btn-submit">
                                        <i class="fas fa-save"></i> Guardar Cambios
                                    </button>
                                </div>
                            </form>
                            </div>
                        </div>

                        <!-- Sección de Cambio de Contraseña -->
                    <div class="form-section">
                        <div class="section-header">
                            <h3>
                                <i class="fas fa-lock"></i>
                                Cambiar Contraseña
                            </h3>
                            </div>
                        <div class="section-body">
                            <form id="formCambiarContrasena" class="register-space-form" onsubmit="cambiarContrasena(event)">
                                <div class="form-row" style="grid-template-columns: 1fr;">
                                <div class="form-group">
                                        <label for="contrasenaActual">Contraseña Actual *</label>
                                        <input type="password" id="contrasenaActual" placeholder="Ingresa tu contraseña actual" required>
                                </div>
                                </div>
                                
                                <div class="form-row">
                                <div class="form-group">
                                        <label for="nuevaContrasena">Nueva Contraseña *</label>
                                        <input type="password" id="nuevaContrasena" placeholder="Mínimo 8 caracteres" required minlength="8">
                                </div>
                                <div class="form-group">
                                        <label for="confirmarContrasena">Confirmar Nueva Contraseña *</label>
                                        <input type="password" id="confirmarContrasena" placeholder="Confirma tu nueva contraseña" required minlength="8">
                                </div>
                                </div>
                                
                                <div class="form-actions">
                                    <button type="submit" class="btn-submit">
                                    <i class="fas fa-key"></i> Actualizar Contraseña
                                </button>
                            </div>
                            </form>
                        </div>
                    </div>
                </div>
            `;
            cargarDatosPerfil();
            break;
            
            
        case 'Gestionar Equipamiento':
            container.innerHTML = `
                <div class="welcome-card">
                    <div class="geometric-line-1"></div>
                    <div class="geometric-dot-1"></div>
                    <div class="geometric-square-1"></div>
                    <div class="geometric-rect-1"></div>
                    <div class="geometric-triangle-1"></div>
                    <div class="geometric-line-2"></div>
                    <div class="geometric-dot-2"></div>
                    <div class="geometric-square-2"></div>
                    <div class="geometric-rect-2"></div>
                    <div class="geometric-triangle-2"></div>
                    <div class="geometric-line-3"></div>
                    <div class="geometric-dot-3"></div>
                    <div class="geometric-square-3"></div>
                    <div class="geometric-rect-3"></div>
                    <div class="geometric-triangle-3"></div>
                    <div class="geometric-line-4"></div>
                    <div class="geometric-dot-4"></div>
                    <div class="geometric-square-4"></div>
                    <div class="geometric-rect-4"></div>
                    <div class="geometric-triangle-4"></div>
                    <div class="geometric-line-5"></div>
                    <div class="geometric-dot-5"></div>
                    <div class="geometric-square-5"></div>
                    <div class="geometric-rect-5"></div>
                    <div class="geometric-triangle-5"></div>
                    <div class="geometric-line-6"></div>
                    <div class="geometric-dot-6"></div>
                    <div class="geometric-square-6"></div>
                    <div class="geometric-rect-6"></div>
                    <div class="geometric-triangle-6"></div>
                    <div class="geometric-line-7"></div>
                    <div class="geometric-dot-7"></div>
                    <div class="geometric-square-7"></div>
                    <div class="geometric-rect-7"></div>
                    <div class="geometric-triangle-7"></div>
                    <div class="geometric-line-8"></div>
                    <div class="geometric-dot-8"></div>
                    <div class="geometric-square-8"></div>
                    <div class="geometric-rect-8"></div>
                    <div class="geometric-triangle-8"></div>
                    <div class="geometric-line-9"></div>
                    <div class="geometric-dot-9"></div>
                    <div class="geometric-square-9"></div>
                    <div class="geometric-rect-9"></div>
                    <div class="geometric-triangle-9"></div>
                    <div class="geometric-line-10"></div>
                    <div class="geometric-dot-10"></div>
                    <div class="geometric-square-10"></div>
                    <div class="geometric-rect-10"></div>
                    <div class="geometric-triangle-10"></div>
                    <h2>Gestionar Equipamiento</h2>
                    <p>Administra todos los espacios del sistema</p>
                </div>
                
                <!-- Filtro de Búsqueda -->
                <div class="filtro-busqueda-container">
                    <div class="filtro-header">
                        <h4><i class="fas fa-filter"></i> Filtros de Búsqueda</h4>
                        <button class="btn-limpiar-filtros" onclick="limpiarFiltrosEquipamiento()">
                            <i class="fas fa-times"></i> Limpiar Filtros
                        </button>
                        </div>
                    <div class="filtro-body">
                        <div class="filtro-row">
                            <div class="filtro-group">
                                <label><i class="fas fa-directions"></i> Dirección</label>
                                <select id="filtro_direccion_equipamiento" onchange="aplicarFiltrosEquipamiento()">
                                    <option value="">Todas las direcciones</option>
                                </select>
                                </div>
                            <div class="filtro-group">
                                <label><i class="fas fa-sitemap"></i> Departamento</label>
                                <select id="filtro_departamento_equipamiento" onchange="aplicarFiltrosEquipamiento()">
                                    <option value="">Todos los departamentos</option>
                                </select>
                                </div>
                            <div class="filtro-group">
                                <label><i class="fas fa-folder"></i> Sección</label>
                                <select id="filtro_seccion_equipamiento" onchange="aplicarFiltrosEquipamiento()">
                                    <option value="">Todas las secciones</option>
                                </select>
                            </div>
                                </div>
                        <div class="filtro-row">
                            <div class="filtro-group">
                                <label><i class="fas fa-building"></i> Oficina</label>
                                <input type="text" id="filtro_oficina_equipamiento" placeholder="Buscar por nombre de oficina o seccion..." onkeyup="aplicarFiltrosEquipamiento()">
                                </div>
                            <div class="filtro-group">
                                <label><i class="fas fa-user"></i> Usuario Asignado</label>
                                <select id="filtro_usuario_equipamiento" onchange="aplicarFiltrosEquipamiento()">
                                    <option value="">Todos los usuarios</option>
                                    </select>
                                </div>
                            <div class="filtro-group">
                                <label><i class="fas fa-layer-group"></i> Piso</label>
                                <input type="text" id="filtro_piso_equipamiento" placeholder="Buscar por piso..." onkeyup="aplicarFiltrosEquipamiento()">
                                </div>
                            </div>
                        <div class="filtro-row">
                            <div class="filtro-group filtro-full">
                                <label><i class="fas fa-map-marker-alt"></i> Ubicación Física</label>
                                <input type="text" id="filtro_ubicacion_equipamiento" placeholder="Buscar por ubicación física..." onkeyup="aplicarFiltrosEquipamiento()">
                                </div>
                                </div>
                                </div>
                            </div>
                            
                <!-- Card de Gestión de Espacios -->
                <div class="manage-spaces-container">
                    <div class="spaces-card">
                        <div class="card-header">
                            <div class="header-content">
                                <h3><i class="fas fa-warehouse"></i> Espacios Registrados</h3>
                                <button class="btn-refresh" onclick="cargarEspaciosEquipamiento(paginaActualEquipamiento)" title="Actualizar lista">
                                    <i class="fas fa-sync-alt"></i>
                                </button>
                    </div>
                </div>

                        <div class="card-body">
                            <div id="espacios-loading-equipamiento" class="loading-state">
                                <i class="fas fa-spinner fa-spin"></i>
                                <p>Cargando espacios...</p>
                        </div>
                            
                            <div id="espacios-empty-equipamiento" class="empty-state" style="display: none;">
                                <i class="fas fa-inbox"></i>
                                <p>No hay espacios registrados</p>
                                    </div>
                                    
                            <div id="espacios-table-container-equipamiento" style="display: none;">
                                <table class="spaces-table">
                                    <thead>
                                        <tr>
                                            <th>Nombre</th>
                                            <th>Edificio</th>
                                            <th>Piso</th>
                                            <th>Dirección</th>
                                            <th>Departamento</th>
                                            <th>Sección</th>
                                            <th>Ubicación Física</th>
                                            <th>Usuario Asignado</th>
                                            <th>Items Inventario</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody id="espacios-tbody-equipamiento">
                                        <!-- Los espacios se cargarán aquí -->
                                    </tbody>
                                </table>
                                
                                <!-- Controles de paginación -->
                                <div id="espacios-paginacion-equipamiento" class="paginacion-container" style="display: none;">
                                    <div class="paginacion-info">
                                        <span id="paginacion-info-texto-equipamiento">Mostrando 0 de 0 espacios</span>
                                    </div>
                                    <div class="paginacion-controls">
                                        <button id="btn-pagina-anterior-equipamiento" class="btn-pagina" onclick="cambiarPaginaEquipamiento(-1)" disabled>
                                            <i class="fas fa-chevron-left"></i> Anterior
                                        </button>
                                        <div class="paginacion-numeros" id="paginacion-numeros-equipamiento">
                                            <!-- Los números de página se generarán aquí -->
                                </div>
                                        <button id="btn-pagina-siguiente-equipamiento" class="btn-pagina" onclick="cambiarPaginaEquipamiento(1)" disabled>
                                            Siguiente <i class="fas fa-chevron-right"></i>
                                        </button>
                                    </div>
                                    </div>
                                </div>
                                
                            <!-- Modal de Detalles del Espacio -->
                            <div id="modal-detalle-espacio-equipamiento" class="modal-detalle-overlay" style="display: none;">
                                <div class="modal-detalle-content">
                                    <div class="modal-detalle-header">
                                        <h3><i class="fas fa-info-circle"></i> Detalles del Espacio</h3>
                                        <button class="modal-detalle-close" onclick="cerrarModalDetalleEquipamiento()">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>
                                    <div class="modal-detalle-body" id="modal-detalle-body-equipamiento">
                                        <!-- Los detalles se cargarán aquí -->
                                    </div>
                                    <div class="modal-detalle-footer">
                                        <button class="btn-modal-close" onclick="cerrarModalDetalleEquipamiento()">Cerrar</button>
                                </div>
                                </div>
                                </div>
                                
                            <!-- Modal de Edición del Espacio -->
                            <div id="modal-editar-espacio-equipamiento" class="modal-detalle-overlay" style="display: none;">
                                <div class="modal-editar-content">
                                    <div class="modal-detalle-header">
                                        <h3><i class="fas fa-edit"></i> Editar Espacio</h3>
                                        <button class="modal-detalle-close" onclick="cerrarModalEditarEquipamiento()">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>
                                    <div class="modal-editar-body" id="modal-editar-body-equipamiento">
                                        <!-- El formulario de edición se cargará aquí -->
                                    </div>
                                </div>
                                </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Cargar espacios al mostrar la sección
            setTimeout(() => {
                cargarFiltrosEquipamiento();
                cargarEspaciosEquipamiento(1); // Empezar en la primera página
            }, 200);
            break;
            
        case 'Gestionar Médicos':
            container.innerHTML = `
                <div class="welcome-card">
                    <div class="geometric-line-1"></div>
                    <div class="geometric-dot-1"></div>
                    <div class="geometric-square-1"></div>
                    <div class="geometric-rect-1"></div>
                    <div class="geometric-triangle-1"></div>
                    <div class="geometric-line-2"></div>
                    <div class="geometric-dot-2"></div>
                    <div class="geometric-square-2"></div>
                    <div class="geometric-rect-2"></div>
                    <div class="geometric-triangle-2"></div>
                    <div class="geometric-line-3"></div>
                    <div class="geometric-dot-3"></div>
                    <div class="geometric-square-3"></div>
                    <div class="geometric-rect-3"></div>
                    <div class="geometric-triangle-3"></div>
                    <div class="geometric-line-4"></div>
                    <div class="geometric-dot-4"></div>
                    <div class="geometric-square-4"></div>
                    <div class="geometric-rect-4"></div>
                    <div class="geometric-triangle-4"></div>
                    <div class="geometric-line-5"></div>
                    <div class="geometric-dot-5"></div>
                    <div class="geometric-square-5"></div>
                    <div class="geometric-rect-5"></div>
                    <div class="geometric-triangle-5"></div>
                    <div class="geometric-line-6"></div>
                    <div class="geometric-dot-6"></div>
                    <div class="geometric-square-6"></div>
                    <div class="geometric-rect-6"></div>
                    <div class="geometric-triangle-6"></div>
                    <div class="geometric-line-7"></div>
                    <div class="geometric-dot-7"></div>
                    <div class="geometric-square-7"></div>
                    <div class="geometric-rect-7"></div>
                    <div class="geometric-triangle-7"></div>
                    <div class="geometric-line-8"></div>
                    <div class="geometric-dot-8"></div>
                    <div class="geometric-square-8"></div>
                    <div class="geometric-rect-8"></div>
                    <div class="geometric-triangle-8"></div>
                    <div class="geometric-line-9"></div>
                    <div class="geometric-dot-9"></div>
                    <div class="geometric-square-9"></div>
                    <div class="geometric-rect-9"></div>
                    <div class="geometric-triangle-9"></div>
                    <div class="geometric-line-10"></div>
                    <div class="geometric-dot-10"></div>
                    <div class="geometric-square-10"></div>
                    <div class="geometric-rect-10"></div>
                    <div class="geometric-triangle-10"></div>
                    <h2>Gestionar Médicos del Sistema</h2>
                    <p>Administra todos los médicos del sistema</p>
                </div>
                
                <div class="manage-section">
                    <div class="action-bar">
                        <button class="add-btn">
                            <i class="fas fa-plus"></i> Agregar Médico
                        </button>
                        <div class="search-box">
                            <input type="text" placeholder="Buscar médico...">
                            <i class="fas fa-search"></i>
                        </div>
                    </div>
                    
                    <div class="doctors-list">
                        <div class="doctor-item">
                            <div class="doctor-avatar">JD</div>
                            <div class="doctor-info">
                                <h4>Dr. Juan Pérez</h4>
                                <p>Cardiología</p>
                            </div>
                            <div class="doctor-actions">
                                <button class="edit-btn"><i class="fas fa-edit"></i></button>
                                <button class="delete-btn"><i class="fas fa-trash"></i></button>
                            </div>
                        </div>
                        
                        <div class="doctor-item">
                            <div class="doctor-avatar">ML</div>
                            <div class="doctor-info">
                                <h4>Dra. María López</h4>
                                <p>Pediatría</p>
                            </div>
                            <div class="doctor-actions">
                                <button class="edit-btn"><i class="fas fa-edit"></i></button>
                                <button class="delete-btn"><i class="fas fa-trash"></i></button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            break;
            
        case 'Cambios Realizados':
            container.innerHTML = `
                <div class="welcome-card">
                    <div class="geometric-line-1"></div>
                    <div class="geometric-dot-1"></div>
                    <div class="geometric-square-1"></div>
                    <div class="geometric-rect-1"></div>
                    <div class="geometric-triangle-1"></div>
                    <div class="geometric-line-2"></div>
                    <div class="geometric-dot-2"></div>
                    <div class="geometric-square-2"></div>
                    <div class="geometric-rect-2"></div>
                    <div class="geometric-triangle-2"></div>
                    <div class="geometric-line-3"></div>
                    <div class="geometric-dot-3"></div>
                    <div class="geometric-square-3"></div>
                    <div class="geometric-rect-3"></div>
                    <div class="geometric-triangle-3"></div>
                    <div class="geometric-line-4"></div>
                    <div class="geometric-dot-4"></div>
                    <div class="geometric-square-4"></div>
                    <div class="geometric-rect-4"></div>
                    <div class="geometric-triangle-4"></div>
                    <div class="geometric-line-5"></div>
                    <div class="geometric-dot-5"></div>
                    <div class="geometric-square-5"></div>
                    <div class="geometric-rect-5"></div>
                    <div class="geometric-triangle-5"></div>
                    <div class="geometric-line-6"></div>
                    <div class="geometric-dot-6"></div>
                    <div class="geometric-square-6"></div>
                    <div class="geometric-rect-6"></div>
                    <div class="geometric-triangle-6"></div>
                    <div class="geometric-line-7"></div>
                    <div class="geometric-dot-7"></div>
                    <div class="geometric-square-7"></div>
                    <div class="geometric-rect-7"></div>
                    <div class="geometric-triangle-7"></div>
                    <div class="geometric-line-8"></div>
                    <div class="geometric-dot-8"></div>
                    <div class="geometric-square-8"></div>
                    <div class="geometric-rect-8"></div>
                    <div class="geometric-triangle-8"></div>
                    <div class="geometric-line-9"></div>
                    <div class="geometric-dot-9"></div>
                    <div class="geometric-square-9"></div>
                    <div class="geometric-rect-9"></div>
                    <div class="geometric-triangle-9"></div>
                    <div class="geometric-line-10"></div>
                    <div class="geometric-dot-10"></div>
                    <div class="geometric-square-10"></div>
                    <div class="geometric-rect-10"></div>
                    <div class="geometric-triangle-10"></div>
                    <h2>Cambios Realizados</h2>
                    <p>Consulta el historial de cambios y movimientos del inventario</p>
                </div>
                
                <!-- Tabla de Cambios Realizados -->
                <div class="manage-spaces-container" style="margin-top: 2rem;">
                    <div class="spaces-card">
                        <div class="card-header">
                            <h4><i class="fas fa-history"></i> Movimientos Pendientes de Revisión</h4>
                            </div>
                        <div class="card-body">
                            <div id="movimientos-loading" class="loading-state">
                                <i class="fas fa-spinner fa-spin"></i>
                                <p>Cargando movimientos...</p>
                            </div>
                            
                            <div id="movimientos-empty" class="empty-state" style="display: none;">
                                <i class="fas fa-inbox"></i>
                                <p>No hay movimientos pendientes de revisión</p>
                        </div>
                            
                            <div id="movimientos-table-container" style="display: none;">
                                <table class="spaces-table">
                                    <thead>
                                        <tr>
                                            <th>Fecha</th>
                                            <th>Codigo Articulo</th>
                                            <th>Marca</th>
                                            <th>Modelo</th>
                                            <th>Serie</th>
                                            <th>Tipo de Movimiento</th>
                                            <th>Usuario Responsable</th>
                                            <th>Origen</th>
                                            <th>Destino</th>
                                            <th>Motivo</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody id="movimientos-tbody">
                                        <!-- Los movimientos se cargarán aquí -->
                                    </tbody>
                                </table>
                    </div>
                        </div>
                    </div>
                </div>
            `;
            // Cargar movimientos después de un pequeño delay
            setTimeout(() => {
                cargarMovimientos();
            }, 200);
            break;

        case 'Historial de Cambios':
            container.innerHTML = `
                <div class="welcome-card">
                    <div class="geometric-line-1"></div>
                    <div class="geometric-dot-1"></div>
                    <div class="geometric-square-1"></div>
                    <div class="geometric-rect-1"></div>
                    <div class="geometric-triangle-1"></div>
                    <div class="geometric-line-2"></div>
                    <div class="geometric-dot-2"></div>
                    <div class="geometric-square-2"></div>
                    <div class="geometric-rect-2"></div>
                    <div class="geometric-triangle-2"></div>
                    <div class="geometric-line-3"></div>
                    <div class="geometric-dot-3"></div>
                    <div class="geometric-square-3"></div>
                    <div class="geometric-rect-3"></div>
                    <div class="geometric-triangle-3"></div>
                    <div class="geometric-line-4"></div>
                    <div class="geometric-dot-4"></div>
                    <div class="geometric-square-4"></div>
                    <div class="geometric-rect-4"></div>
                    <div class="geometric-triangle-4"></div>
                    <div class="geometric-line-5"></div>
                    <div class="geometric-dot-5"></div>
                    <div class="geometric-square-5"></div>
                    <div class="geometric-rect-5"></div>
                    <div class="geometric-triangle-5"></div>
                    <div class="geometric-line-6"></div>
                    <div class="geometric-dot-6"></div>
                    <div class="geometric-square-6"></div>
                    <div class="geometric-rect-6"></div>
                    <div class="geometric-triangle-6"></div>
                    <h2>Historial de Cambios</h2>
                    <p>Consulta el historial completo de cambios y movimientos del inventario</p>
                </div>

                <!-- Filtros de Búsqueda -->
                <div class="filtro-busqueda-container" style="margin-top: 2rem;">
                    <div class="filtro-header">
                        <h4><i class="fas fa-filter"></i> Filtros de Búsqueda</h4>
                        <button class="btn-limpiar-filtros" onclick="limpiarFiltrosHistorial()">
                            <i class="fas fa-times"></i> Limpiar Filtros
                        </button>
                            </div>
                    <div class="filtro-body">
                        <div class="filtro-row">
                            <div class="filtro-group">
                                <label><i class="fas fa-barcode"></i> Codigo Articulo</label>
                                <input type="text" id="filtro_historial_codigo" placeholder="Buscar por código..." onkeyup="aplicarFiltrosHistorial()">
                            </div>
                            <div class="filtro-group">
                                <label><i class="fas fa-exchange-alt"></i> Tipo de Movimiento</label>
                                <select id="filtro_historial_tipo" onchange="aplicarFiltrosHistorial()">
                                    <option value="">Todos los tipos</option>
                                    <option value="ALTA">Alta</option>
                                    <option value="TRASLADO">Traslado</option>
                                    <option value="BAJA">Baja</option>
                                    <option value="REEMPLAZO">Reemplazo</option>
                                    <option value="REASIGNACION">Reasignación</option>
                                </select>
                            </div>
                            <div class="filtro-group">
                                <label><i class="fas fa-user"></i> Usuario Responsable</label>
                                <select id="filtro_historial_usuario" onchange="aplicarFiltrosHistorial()">
                                    <option value="">Todos los usuarios</option>
                                </select>
                            </div>
                            <div class="filtro-group">
                                <label><i class="fas fa-calendar"></i> Fecha</label>
                                <input type="date" id="filtro_historial_fecha" onchange="aplicarFiltrosHistorial()">
                        </div>
                    </div>
                        </div>
                        </div>

                <!-- Tabla de Historial de Cambios -->
                <div class="manage-spaces-container" style="margin-top: 2rem;">
                    <div class="spaces-card">
                        <div class="card-header">
                            <h4><i class="fas fa-clock"></i> Historial Completo de Movimientos</h4>
                    </div>
                        <div class="card-body">
                            <div id="historial-loading" class="loading-state">
                                <i class="fas fa-spinner fa-spin"></i>
                                <p>Cargando historial...</p>
                </div>
                            
                            <div id="historial-empty" class="empty-state" style="display: none;">
                                <i class="fas fa-inbox"></i>
                                <p>No hay movimientos registrados</p>
                            </div>
                            
                            <div id="historial-table-container" style="display: none;">
                                <table class="spaces-table">
                                    <thead>
                                        <tr>
                                            <th>Fecha</th>
                                            <th>Codigo Articulo</th>
                                            <th>Marca</th>
                                            <th>Modelo</th>
                                            <th>Serie</th>
                                            <th>Tipo de Movimiento</th>
                                            <th>Usuario Responsable</th>
                                            <th>Origen</th>
                                            <th>Destino</th>
                                            <th>Motivo</th>
                                        </tr>
                                    </thead>
                                    <tbody id="historial-tbody">
                                        <!-- El historial se cargará aquí -->
                                    </tbody>
                                </table>
                                
                                <!-- Controles de paginación -->
                                <div class="paginacion-container" id="historial-paginacion-container" style="display: none;">
                                    <div class="paginacion-info">
                                        <span id="historial-paginacion-info-texto">Página 1 de 1</span>
                                    </div>
                                    <div class="paginacion-controls">
                                        <button id="historial-btn-pagina-anterior" class="btn-pagina" onclick="cambiarPaginaHistorial(-1)" disabled>
                                            <i class="fas fa-chevron-left"></i> Anterior
                                        </button>
                                        <div class="paginacion-numeros" id="historial-paginacion-numeros">
                                            <!-- Los números de página se generarán aquí -->
                                        </div>
                                        <button id="historial-btn-pagina-siguiente" class="btn-pagina" onclick="cambiarPaginaHistorial(1)" disabled>
                                            Siguiente <i class="fas fa-chevron-right"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            // Cargar historial después de un pequeño delay
            setTimeout(() => {
                cargarUsuariosFiltroHistorial();
                cargarHistorialMovimientos(1);
            }, 200);
            break;
            
        case 'Espacios asignados':
            container.innerHTML = `
                <div class="welcome-card">
                    <div class="geometric-line-1"></div>
                    <div class="geometric-dot-1"></div>
                    <div class="geometric-square-1"></div>
                    <div class="geometric-rect-1"></div>
                    <div class="geometric-triangle-1"></div>
                    <div class="geometric-line-2"></div>
                    <div class="geometric-dot-2"></div>
                    <div class="geometric-square-2"></div>
                    <div class="geometric-rect-2"></div>
                    <div class="geometric-triangle-2"></div>
                    <div class="geometric-line-3"></div>
                    <div class="geometric-dot-3"></div>
                    <div class="geometric-square-3"></div>
                    <div class="geometric-rect-3"></div>
                    <div class="geometric-triangle-3"></div>
                    <div class="geometric-line-4"></div>
                    <div class="geometric-dot-4"></div>
                    <div class="geometric-square-4"></div>
                    <div class="geometric-rect-4"></div>
                    <div class="geometric-triangle-4"></div>
                    <div class="geometric-line-5"></div>
                    <div class="geometric-dot-5"></div>
                    <div class="geometric-square-5"></div>
                    <div class="geometric-rect-5"></div>
                    <div class="geometric-triangle-5"></div>
                    <div class="geometric-line-6"></div>
                    <div class="geometric-dot-6"></div>
                    <div class="geometric-square-6"></div>
                    <div class="geometric-rect-6"></div>
                    <div class="geometric-triangle-6"></div>
                    <div class="geometric-line-7"></div>
                    <div class="geometric-dot-7"></div>
                    <div class="geometric-square-7"></div>
                    <div class="geometric-rect-7"></div>
                    <div class="geometric-triangle-7"></div>
                    <div class="geometric-line-8"></div>
                    <div class="geometric-dot-8"></div>
                    <div class="geometric-square-8"></div>
                    <div class="geometric-rect-8"></div>
                    <div class="geometric-triangle-8"></div>
                    <div class="geometric-line-9"></div>
                    <div class="geometric-dot-9"></div>
                    <div class="geometric-square-9"></div>
                    <div class="geometric-rect-9"></div>
                    <div class="geometric-triangle-9"></div>
                    <div class="geometric-line-10"></div>
                    <div class="geometric-dot-10"></div>
                    <div class="geometric-square-10"></div>
                    <div class="geometric-rect-10"></div>
                    <div class="geometric-triangle-10"></div>
                    <h2>Espacios asignados</h2>
                    <p>Espacios y equipamiento asignados a tu usuario</p>
                </div>
                
                <div id="espacios-asignados-container" style="margin-top: 2rem;">
                    <div id="espacios-asignados-loading" class="loading-state" style="display: flex;">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>Cargando espacios asignados...</p>
                        </div>
                    <div id="espacios-asignados-empty" class="empty-state" style="display: none;">
                        <i class="fas fa-warehouse"></i>
                        <p>No tienes espacios asignados</p>
                                </div>
                    <div id="espacios-asignados-grid" style="display: none;"></div>
                </div>
            `;
            
            // Cargar espacios asignados
            setTimeout(() => { 
                try { 
                    cargarEspaciosAsignados(); 
                } catch(e) {
                    console.error('Error al cargar espacios asignados:', e);
                }
            }, 100);
            break;

        case 'Envió reportes':
            container.innerHTML = `
                <div class="welcome-card">
                    <div class="geometric-line-1"></div>
                    <div class="geometric-dot-1"></div>
                    <div class="geometric-square-1"></div>
                    <div class="geometric-rect-1"></div>
                    <div class="geometric-triangle-1"></div>
                    <div class="geometric-line-2"></div>
                    <div class="geometric-dot-2"></div>
                    <div class="geometric-square-2"></div>
                    <div class="geometric-rect-2"></div>
                    <div class="geometric-triangle-2"></div>
                    <div class="geometric-line-3"></div>
                    <div class="geometric-dot-3"></div>
                    <div class="geometric-square-3"></div>
                    <div class="geometric-rect-3"></div>
                    <div class="geometric-triangle-3"></div>
                    <div class="geometric-line-4"></div>
                    <div class="geometric-dot-4"></div>
                    <div class="geometric-square-4"></div>
                    <div class="geometric-rect-4"></div>
                    <div class="geometric-triangle-4"></div>
                    <div class="geometric-line-5"></div>
                    <div class="geometric-dot-5"></div>
                    <div class="geometric-square-5"></div>
                    <div class="geometric-rect-5"></div>
                    <div class="geometric-triangle-5"></div>
                    <div class="geometric-line-6"></div>
                    <div class="geometric-dot-6"></div>
                    <div class="geometric-square-6"></div>
                    <div class="geometric-rect-6"></div>
                    <div class="geometric-triangle-6"></div>
                    <div class="geometric-line-7"></div>
                    <div class="geometric-dot-7"></div>
                    <div class="geometric-square-7"></div>
                    <div class="geometric-rect-7"></div>
                    <div class="geometric-triangle-7"></div>
                    <div class="geometric-line-8"></div>
                    <div class="geometric-dot-8"></div>
                    <div class="geometric-square-8"></div>
                    <div class="geometric-rect-8"></div>
                    <div class="geometric-triangle-8"></div>
                    <div class="geometric-line-9"></div>
                    <div class="geometric-dot-9"></div>
                    <div class="geometric-square-9"></div>
                    <div class="geometric-rect-9"></div>
                    <div class="geometric-triangle-9"></div>
                    <div class="geometric-line-10"></div>
                    <div class="geometric-dot-10"></div>
                    <div class="geometric-square-10"></div>
                    <div class="geometric-rect-10"></div>
                    <div class="geometric-triangle-10"></div>
                    <h2>Envió reportes</h2>
                    <p>Reporta incidencias relacionadas con equipamiento o espacios asignados</p>
                </div>
                
                <!-- Formulario de Envío de Reportes -->
                <div class="form-container">
                    <form id="formEnviarReporte" class="register-space-form" onsubmit="enviarReporte(event)">
                        <!-- Card única con todas las secciones -->
                        <div class="form-section">
                            <div class="section-header">
                                <h3>
                                    <i class="fas fa-paper-plane"></i>
                                    Formulario de Reporte
                                </h3>
                            </div>
                            <div class="section-body">
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="reporte_oficina">Oficina *</label>
                                    <select id="reporte_oficina" name="id_oficina" required onchange="cargarItemsReporte(this.value)">
                                        <option value="">Seleccione una oficina o seccion...</option>
                                </select>
                            </div>
                                <div class="form-group">
                                    <label for="reporte_tipo">Tipo de Incidencia *</label>
                                    <select id="reporte_tipo" name="id_tipo" required>
                                        <option value="">Seleccione un tipo...</option>
                                    </select>
                            </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="reporte_item">Item de Inventario (Opcional)</label>
                                    <select id="reporte_item" name="id_inventario">
                                        <option value="">Seleccione un item (opcional)...</option>
                                    </select>
                                    <small class="form-help-text">Si el reporte es sobre un item específico, selecciónelo aquí</small>
                            </div>
                            </div>
                            
                            <div class="form-row" style="grid-template-columns: 1fr;">
                                <div class="form-group">
                                    <label for="reporte_descripcion">Descripción del Reporte *</label>
                                    <textarea id="reporte_descripcion" name="descripcion_reporte" rows="5" required placeholder="Describa detalladamente la incidencia o problema..."></textarea>
                        </div>
                    </div>
                            
                        </div>
                    </div>
                        
                        <!-- Botones de Acción -->
                        <div class="form-actions">
                            <button type="button" class="btn-cancel" onclick="limpiarFormularioReporte()">
                                <i class="fas fa-times"></i> Limpiar
                            </button>
                            <button type="submit" class="btn-submit">
                                <i class="fas fa-paper-plane"></i> Enviar Reporte
                            </button>
                        </div>
                    </form>
                </div>
            `;

            // Cargar datos iniciales
            setTimeout(() => {
                try {
                    cargarOficinasReporte();
                    cargarTiposIncidencia();
                } catch(e) {
                    console.error('Error al cargar datos iniciales:', e);
                }
            }, 100);
            break;
            
        case 'Respuestas de reportes':
            container.innerHTML = `
                <div class="welcome-card">
                    <div class="geometric-line-1"></div>
                    <div class="geometric-dot-1"></div>
                    <div class="geometric-square-1"></div>
                    <div class="geometric-rect-1"></div>
                    <div class="geometric-triangle-1"></div>
                    <div class="geometric-line-2"></div>
                    <div class="geometric-dot-2"></div>
                    <div class="geometric-square-2"></div>
                    <div class="geometric-rect-2"></div>
                    <div class="geometric-triangle-2"></div>
                    <div class="geometric-line-3"></div>
                    <div class="geometric-dot-3"></div>
                    <div class="geometric-square-3"></div>
                    <div class="geometric-rect-3"></div>
                    <div class="geometric-triangle-3"></div>
                    <div class="geometric-line-4"></div>
                    <div class="geometric-dot-4"></div>
                    <div class="geometric-square-4"></div>
                    <div class="geometric-rect-4"></div>
                    <div class="geometric-triangle-4"></div>
                    <div class="geometric-line-5"></div>
                    <div class="geometric-dot-5"></div>
                    <div class="geometric-square-5"></div>
                    <div class="geometric-rect-5"></div>
                    <div class="geometric-triangle-5"></div>
                    <div class="geometric-line-6"></div>
                    <div class="geometric-dot-6"></div>
                    <div class="geometric-square-6"></div>
                    <div class="geometric-rect-6"></div>
                    <div class="geometric-triangle-6"></div>
                    <div class="geometric-line-7"></div>
                    <div class="geometric-dot-7"></div>
                    <div class="geometric-square-7"></div>
                    <div class="geometric-rect-7"></div>
                    <div class="geometric-triangle-7"></div>
                    <div class="geometric-line-8"></div>
                    <div class="geometric-dot-8"></div>
                    <div class="geometric-square-8"></div>
                    <div class="geometric-rect-8"></div>
                    <div class="geometric-triangle-8"></div>
                    <div class="geometric-line-9"></div>
                    <div class="geometric-dot-9"></div>
                    <div class="geometric-square-9"></div>
                    <div class="geometric-rect-9"></div>
                    <div class="geometric-triangle-9"></div>
                    <div class="geometric-line-10"></div>
                    <div class="geometric-dot-10"></div>
                    <div class="geometric-square-10"></div>
                    <div class="geometric-rect-10"></div>
                    <div class="geometric-triangle-10"></div>
                    <h2>Respuestas de reportes</h2>
                    <p>Consulta el historial de tus reportes y sus respuestas</p>
                </div>
                
                <div id="reportes-container" style="margin-top: 2rem;">
                    <div id="reportes-loading" class="loading-state">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>Cargando reportes...</p>
                            </div>
                    
                    <div id="reportes-empty" class="empty-state" style="display: none;">
                        <i class="fas fa-inbox"></i>
                        <p>No has enviado ningún reporte aún</p>
                            </div>
                    
                    <div id="reportes-grid" style="display: none;">
                        <!-- Los reportes se cargarán aquí -->
                    </div>
                </div>
            `;
            
            // Cargar reportes después de un pequeño delay
            setTimeout(() => {
                cargarMisReportes();
            }, 200);
            break;

            
        case 'Reportes de incidentes':
            container.innerHTML = `
                <div class="welcome-card">
                    <div class="geometric-line-1"></div>
                    <div class="geometric-dot-1"></div>
                    <div class="geometric-square-1"></div>
                    <div class="geometric-rect-1"></div>
                    <div class="geometric-triangle-1"></div>
                    <div class="geometric-line-2"></div>
                    <div class="geometric-dot-2"></div>
                    <div class="geometric-square-2"></div>
                    <div class="geometric-rect-2"></div>
                    <div class="geometric-triangle-2"></div>
                    <div class="geometric-line-3"></div>
                    <div class="geometric-dot-3"></div>
                    <div class="geometric-square-3"></div>
                    <div class="geometric-rect-3"></div>
                    <div class="geometric-triangle-3"></div>
                    <div class="geometric-line-4"></div>
                    <div class="geometric-dot-4"></div>
                    <div class="geometric-square-4"></div>
                    <div class="geometric-rect-4"></div>
                    <div class="geometric-triangle-4"></div>
                    <div class="geometric-line-5"></div>
                    <div class="geometric-dot-5"></div>
                    <div class="geometric-square-5"></div>
                    <div class="geometric-rect-5"></div>
                    <div class="geometric-triangle-5"></div>
                    <div class="geometric-line-6"></div>
                    <div class="geometric-dot-6"></div>
                    <div class="geometric-square-6"></div>
                    <div class="geometric-rect-6"></div>
                    <div class="geometric-triangle-6"></div>
                    <div class="geometric-line-7"></div>
                    <div class="geometric-dot-7"></div>
                    <div class="geometric-square-7"></div>
                    <div class="geometric-rect-7"></div>
                    <div class="geometric-triangle-7"></div>
                    <div class="geometric-line-8"></div>
                    <div class="geometric-dot-8"></div>
                    <div class="geometric-square-8"></div>
                    <div class="geometric-rect-8"></div>
                    <div class="geometric-triangle-8"></div>
                    <div class="geometric-line-9"></div>
                    <div class="geometric-dot-9"></div>
                    <div class="geometric-square-9"></div>
                    <div class="geometric-rect-9"></div>
                    <div class="geometric-triangle-9"></div>
                    <div class="geometric-line-10"></div>
                    <div class="geometric-dot-10"></div>
                    <div class="geometric-square-10"></div>
                    <div class="geometric-rect-10"></div>
                    <div class="geometric-triangle-10"></div>
                    <h2>Reportes de incidentes</h2>
                    <p>Gestiona los reportes de incidentes recibidos y responde a ellos</p>
                </div>
                
                <div id="reportes-recibidos-container" style="margin-top: 2rem;">
                    <div id="reportes-recibidos-loading" class="loading-state">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>Cargando reportes...</p>
                            </div>
                    
                    <div id="reportes-recibidos-empty" class="empty-state" style="display: none;">
                        <i class="fas fa-inbox"></i>
                        <p>No hay reportes recibidos</p>
                            </div>
                    
                    <div id="reportes-recibidos-grid" style="display: none;">
                        <!-- Los reportes se cargarán aquí -->
                    </div>
                </div>
            `;
            
            // Cargar reportes recibidos después de un pequeño delay
            setTimeout(() => {
                cargarReportesRecibidos();
            }, 200);
            break;
            
        case 'Historial de reportes':
            container.innerHTML = `
                <div class="welcome-card">
                    <div class="geometric-line-1"></div>
                    <div class="geometric-dot-1"></div>
                    <div class="geometric-square-1"></div>
                    <div class="geometric-rect-1"></div>
                    <div class="geometric-triangle-1"></div>
                    <div class="geometric-line-2"></div>
                    <div class="geometric-dot-2"></div>
                    <div class="geometric-square-2"></div>
                    <div class="geometric-rect-2"></div>
                    <div class="geometric-triangle-2"></div>
                    <div class="geometric-line-3"></div>
                    <div class="geometric-dot-3"></div>
                    <div class="geometric-square-3"></div>
                    <div class="geometric-rect-3"></div>
                    <div class="geometric-triangle-3"></div>
                    <div class="geometric-line-4"></div>
                    <div class="geometric-dot-4"></div>
                    <div class="geometric-square-4"></div>
                    <div class="geometric-rect-4"></div>
                    <div class="geometric-triangle-4"></div>
                    <div class="geometric-line-5"></div>
                    <div class="geometric-dot-5"></div>
                    <div class="geometric-square-5"></div>
                    <div class="geometric-rect-5"></div>
                    <div class="geometric-triangle-5"></div>
                    <div class="geometric-line-6"></div>
                    <div class="geometric-dot-6"></div>
                    <div class="geometric-square-6"></div>
                    <div class="geometric-rect-6"></div>
                    <div class="geometric-triangle-6"></div>
                    <div class="geometric-line-7"></div>
                    <div class="geometric-dot-7"></div>
                    <div class="geometric-square-7"></div>
                    <div class="geometric-rect-7"></div>
                    <div class="geometric-triangle-7"></div>
                    <div class="geometric-line-8"></div>
                    <div class="geometric-dot-8"></div>
                    <div class="geometric-square-8"></div>
                    <div class="geometric-rect-8"></div>
                    <div class="geometric-triangle-8"></div>
                    <div class="geometric-line-9"></div>
                    <div class="geometric-dot-9"></div>
                    <div class="geometric-square-9"></div>
                    <div class="geometric-rect-9"></div>
                    <div class="geometric-triangle-9"></div>
                    <div class="geometric-line-10"></div>
                    <div class="geometric-dot-10"></div>
                    <div class="geometric-square-10"></div>
                    <div class="geometric-rect-10"></div>
                    <div class="geometric-triangle-10"></div>
                    <h2>Historial de reportes</h2>
                    <p>Consulta el historial de todos los reportes resueltos</p>
                </div>
                
                <!-- Filtros de Búsqueda -->
                <div class="filtro-busqueda-container" style="margin-top: 2rem;">
                    <div class="filtro-header">
                        <h4><i class="fas fa-filter"></i> Filtros de Búsqueda</h4>
                        <button class="btn-limpiar-filtros" onclick="limpiarFiltrosHistorialReportes()">
                            <i class="fas fa-times"></i> Limpiar Filtros
                        </button>
                        </div>
                    <div class="filtro-body">
                        <div class="filtro-row">
                            <div class="filtro-group">
                                <label><i class="fas fa-user"></i> Usuario que Reporta</label>
                                <input type="text" id="filtro_historial_reporte_usuario" placeholder="Buscar por usuario..." onkeyup="aplicarFiltrosHistorialReportes()">
                        </div>
                            <div class="filtro-group">
                                <label><i class="fas fa-calendar"></i> Fecha de Reporte</label>
                                <input type="date" id="filtro_historial_reporte_fecha" onchange="aplicarFiltrosHistorialReportes()">
                        </div>
                            <div class="filtro-group">
                                <label><i class="fas fa-building"></i> Oficina</label>
                                <input type="text" id="filtro_historial_reporte_oficina" placeholder="Buscar por oficina..." onkeyup="aplicarFiltrosHistorialReportes()">
                        </div>
                            <div class="filtro-group">
                                <label><i class="fas fa-calendar-check"></i> Fecha de Solución</label>
                                <input type="date" id="filtro_historial_reporte_fecha_solucion" onchange="aplicarFiltrosHistorialReportes()">
                        </div>
                    </div>
                    </div>
                </div>
                
                <div style="margin-top: 1.5rem; display: flex; justify-content: flex-end;">
                    <button class="btn-exportar-pdf" onclick="exportarHistorialReportesPDF()" style="background: linear-gradient(135deg, #e74c3c, #c0392b); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-size: 1rem; font-weight: 600; display: inline-flex; align-items: center; gap: 0.5rem; transition: all 0.3s ease; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
                        <i class="fas fa-file-pdf"></i> Exportar Historial a PDF
                    </button>
                </div>
                
                <div id="historial-reportes-container" style="margin-top: 2rem;">
                    <div id="historial-reportes-loading" class="loading-state">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>Cargando historial...</p>
                    </div>
                    
                    <div id="historial-reportes-empty" class="empty-state" style="display: none;">
                        <i class="fas fa-inbox"></i>
                        <p>No hay reportes resueltos</p>
                    </div>
                    
                    <div id="historial-reportes-grid" style="display: none;">
                        <!-- Los reportes se cargarán aquí -->
                    </div>
                    
                    <!-- Controles de paginación -->
                    <div class="paginacion-container" id="historial-reportes-paginacion-container" style="display: none;">
                        <div class="paginacion-info">
                            <span id="historial-reportes-paginacion-info-texto">Página 1 de 1</span>
                        </div>
                        <div class="paginacion-controls">
                            <button id="historial-reportes-btn-pagina-anterior" class="btn-pagina" onclick="cambiarPaginaHistorialReportes(-1)" disabled>
                                <i class="fas fa-chevron-left"></i> Anterior
                            </button>
                            <div class="paginacion-numeros" id="historial-reportes-paginacion-numeros">
                                <!-- Los números de página se generarán aquí -->
                            </div>
                            <button id="historial-reportes-btn-pagina-siguiente" class="btn-pagina" onclick="cambiarPaginaHistorialReportes(1)" disabled>
                                Siguiente <i class="fas fa-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            // Cargar historial de reportes después de un pequeño delay
            setTimeout(() => {
                cargarHistorialReportes(1);
            }, 200);
            break;
            
        
            
        
            
        default:
            // Mantener el contenido actual si no se reconoce la opción
            break;
    }
}



// Inicializar menú al cargar la página (solo si el token es válido)
document.addEventListener('DOMContentLoaded', function() {
    // Verificar que el contenido esté visible (significa que el token es válido)
    if (document.body && document.body.style.display !== 'none') {
        inicializarMenu();
    }
});

// Cargar contenido inicial al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    // Cargar el contenido de "Inicio" por defecto
    cambiarContenido('Inicio');
});

// Manejar responsive en móviles
window.addEventListener('resize', function() {
    const sidebar = document.getElementById('sidebar');
    if(window.innerWidth > 600) {
        sidebar.classList.remove('menu-open');
    }
});

function toggleMobileMenu() {
    const menu = document.getElementById('sidebarMenuMobile');
    const topbar = document.getElementById('topbarMobile');
    
    menu.classList.toggle('open');
    if(menu.classList.contains('open')) {
        // Calcular la altura del header y posicionar el menú justo debajo
        if (topbar) {
            const topbarHeight = topbar.offsetHeight;
            menu.style.top = topbarHeight + 'px';
            menu.style.height = `calc(100vh - ${topbarHeight}px)`;
        }
        
        // Actualizar con datos reales del usuario
        updateMobileUserBlock();
    }
}

// Función para actualizar información móvil
function updateMobileUserBlock() {
    const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
    
    if (usuarioLogueado) {
        try {
            const usuario = JSON.parse(usuarioLogueado);
            const nombres = usuario.nombres || usuario.nombre || '';
            const apellidos = usuario.apellidos || usuario.apellido || '';
            const nombreCompleto = `${nombres} ${apellidos}`.trim();
            const iniciales = nombres && apellidos 
                ? `${nombres.charAt(0).toUpperCase()}${apellidos.charAt(0).toUpperCase()}`
                : (nombres ? nombres.charAt(0).toUpperCase() : 'U');
            
            if (document.getElementById('mobileUserName')) {
                document.getElementById('mobileUserName').textContent = nombreCompleto || 'Usuario';
            }
            if (document.getElementById('mobileUserAvatar')) {
                document.getElementById('mobileUserAvatar').textContent = iniciales;
            }
        } catch (error) {
            console.error('Error al actualizar información móvil:', error);
        }
    }
}
document.addEventListener('DOMContentLoaded', updateMobileUserBlock);

// ============================================
// FUNCIONES PARA PERFIL DE USUARIO
// ============================================

// Cargar datos del perfil desde sessionStorage
// Cargar datos del perfil desde sessionStorage y backend
async function cargarDatosPerfil() {
    try {
        const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
        if (!usuarioLogueado) {
            console.error('No hay datos de usuario disponibles');
            return;
        }

        const usuario = JSON.parse(usuarioLogueado);
        
        // Llenar campos básicos desde sessionStorage
        const profileRut = document.getElementById('profileRut');
        const profileNombreUsuario = document.getElementById('profileNombreUsuario');
        const profileNombre = document.getElementById('profileNombre');
        const profileApellido = document.getElementById('profileApellido');
        const profileEmail = document.getElementById('profileEmail');
        const profileCargo = document.getElementById('profileCargo');
        
        if (profileNombreUsuario) {
            profileNombreUsuario.value = usuario.usuario || '';
        }
        if (profileNombre) {
            profileNombre.value = usuario.nombres || '';
        }
        if (profileApellido) {
            profileApellido.value = usuario.apellidos || '';
        }
        if (profileEmail) {
            profileEmail.value = usuario.correo || '';
        }
        if (profileCargo) {
            profileCargo.value = usuario.cargo || '';
        }
        
        // Cargar datos completos desde el backend
        try {
            if (!usuario.id_usuario) {
                console.error('No se encontró id_usuario en los datos del usuario');
                return;
            }
            
            const response = await fetch(getAppBasePath() + '/config/Usuario.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'obtener_perfil',
                    id_usuario: usuario.id_usuario
                })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error HTTP:', response.status, errorText);
                // No lanzar error, solo mostrar en consola para que la página siga funcionando
                return;
            }
            
            const result = await response.json();
            
            if (result.success && result.usuario) {
                const datosUsuario = result.usuario;
                
                if (profileRut) {
                    profileRut.value = datosUsuario.rut || '';
                }
                if (profileNombre) {
                    profileNombre.value = datosUsuario.nombres || '';
                }
                if (profileApellido) {
                    profileApellido.value = datosUsuario.apellidos || '';
                }
                if (profileEmail) {
                    profileEmail.value = datosUsuario.correo || '';
                }
                if (profileNombreUsuario) {
                    profileNombreUsuario.value = datosUsuario.usuario || '';
                }
                if (profileCargo) {
                    profileCargo.value = datosUsuario.cargo || '';
                }
            } else {
                console.error('Error al obtener perfil:', result.message || 'Error desconocido');
            }
        } catch (error) {
            console.error('Error al cargar datos completos del perfil:', error);
            // No mostrar error al usuario, solo en consola
        }
    } catch (error) {
        console.error('Error al cargar datos del perfil:', error);
    }
}

// Toggle para editar perfil
function toggleEditProfile() {
    const editBtn = document.getElementById('editProfileBtn');
    const profileActions = document.getElementById('profileActions');
    const formSection = document.querySelector('#formPerfil');
    if (!formSection) {
        console.error('Formulario de perfil no encontrado');
        return;
    }
    
    const inputs = formSection.querySelectorAll('input:not([type="hidden"]), select');
    if (inputs.length === 0) {
        console.error('No se encontraron inputs en el formulario');
        return;
    }
    
    // Verificar si está en modo edición (si el primer input editable está deshabilitado, estamos en modo visualización)
    const firstEditableInput = formSection.querySelector('input#profileNombre, input#profileApellido, input#profileEmail, input#profileCargo');
    if (!firstEditableInput) {
        console.error('No se encontró input editable');
        return;
    }
    
    // Si el input está deshabilitado, significa que estamos en modo visualización, así que queremos habilitarlo (entrar en modo edición)
    const isCurrentlyDisabled = firstEditableInput.disabled;
    
    // Habilitar o deshabilitar inputs editables
    inputs.forEach(input => {
        // No permitir editar RUT, nombre de usuario y cargo (son únicos o no editables)
        if (input.id !== 'profileRut' && input.id !== 'profileNombreUsuario' && input.id !== 'profileCargo') {
            input.disabled = !isCurrentlyDisabled; // Si estaba deshabilitado, habilitarlo. Si estaba habilitado, deshabilitarlo.
        }
    });
    
    // Mostrar/ocultar botones de acción
    if (profileActions) {
        profileActions.style.display = isCurrentlyDisabled ? 'flex' : 'none';
    }
    
    // Cambiar texto del botón
    if (editBtn) {
        editBtn.innerHTML = isCurrentlyDisabled 
            ? '<i class="fas fa-times"></i> Cancelar'
            : '<i class="fas fa-edit"></i> Editar Perfil';
    }
}

// Actualizar perfil
async function actualizarPerfil(event) {
    if (event) {
        event.preventDefault();
    }
    
    try {
        const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
        if (!usuarioLogueado) {
            mostrarCardEmergente(false, 'No hay datos de usuario disponibles');
            return;
        }

        const usuario = JSON.parse(usuarioLogueado);
        const profileNombre = document.getElementById('profileNombre')?.value.trim();
        const profileApellido = document.getElementById('profileApellido')?.value.trim();
        const profileEmail = document.getElementById('profileEmail')?.value.trim();

        // Validaciones básicas
        if (!profileNombre || !profileApellido || !profileEmail) {
            mostrarCardEmergente(false, 'Por favor, completa los campos obligatorios (Nombre, Apellido, Email)');
            return;
        }

        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(profileEmail)) {
            mostrarCardEmergente(false, 'Por favor, ingresa un email válido');
            return;
        }

        // Enviar datos al backend (no incluir cargo, ya que no es editable)
        const response = await fetch(getAppBasePath() + '/config/Usuario.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'actualizar_perfil',
                id_usuario: usuario.id_usuario,
                nombres: profileNombre,
                apellidos: profileApellido,
                correo: profileEmail
            })
        });

        const result = await response.json();

        if (result.success) {
            // Actualizar sessionStorage
            usuario.nombres = profileNombre;
            usuario.apellidos = profileApellido;
            usuario.correo = profileEmail;
            // No actualizar cargo ya que no es editable
            sessionStorage.setItem('usuario_logueado', JSON.stringify(usuario));
            
            // Actualizar nombre en el header si existe
            const profileName = document.getElementById('profileName');
            if (profileName) {
                profileName.textContent = `${profileNombre} ${profileApellido}`.trim();
            }
            
            // Actualizar nombre en sidebar si existe
            const userNameElements = document.querySelectorAll('#userName, #mobileUserName');
            userNameElements.forEach(el => {
                if (el) {
                    el.textContent = `${profileNombre} ${profileApellido}`.trim();
                }
            });
            
            // Deshabilitar edición
            toggleEditProfile();
            
            mostrarCardEmergente(true, result.message || 'Perfil actualizado correctamente');
        } else {
            mostrarCardEmergente(false, result.message || 'Error al actualizar el perfil');
        }
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        mostrarCardEmergente(false, 'Error al actualizar el perfil. Por favor, intente nuevamente.');
    }
}

// Cancelar edición
function cancelarEdicion() {
    // Recargar datos originales
    cargarDatosPerfil();
    // Deshabilitar edición
    toggleEditProfile();
}

// Cambiar contraseña
async function cambiarContrasena(event) {
    if (event) {
        event.preventDefault();
    }
    
    try {
        const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
        if (!usuarioLogueado) {
            mostrarCardEmergente(false, 'No hay datos de usuario disponibles');
            return;
        }

        const usuario = JSON.parse(usuarioLogueado);
        const contrasenaActual = document.getElementById('contrasenaActual')?.value;
        const nuevaContrasena = document.getElementById('nuevaContrasena')?.value;
        const confirmarContrasena = document.getElementById('confirmarContrasena')?.value;

        if (!contrasenaActual || !nuevaContrasena || !confirmarContrasena) {
            mostrarCardEmergente(false, 'Por favor, completa todos los campos');
            return;
        }

        if (nuevaContrasena !== confirmarContrasena) {
            mostrarCardEmergente(false, 'Las contraseñas no coinciden');
            return;
        }

        if (nuevaContrasena.length < 8) {
            mostrarCardEmergente(false, 'La nueva contraseña debe tener al menos 8 caracteres');
            return;
        }

        // Enviar datos al backend
        const response = await fetch(getAppBasePath() + '/config/Usuario.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'cambiar_contrasena',
                id_usuario: usuario.id_usuario,
                contrasena_actual: contrasenaActual,
                nueva_contrasena: nuevaContrasena
            })
        });

        const result = await response.json();

        if (result.success) {
            mostrarCardEmergente(true, result.message || 'Contraseña actualizada correctamente');
            
            // Limpiar campos
            document.getElementById('contrasenaActual').value = '';
            document.getElementById('nuevaContrasena').value = '';
            document.getElementById('confirmarContrasena').value = '';
        } else {
            mostrarCardEmergente(false, result.message || 'Error al cambiar la contraseña');
        }
    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        mostrarCardEmergente(false, 'Error al cambiar la contraseña. Por favor, intente nuevamente.');
    }
}

// ============================================
// FUNCIONES PARA GESTIÓN DE EQUIPAMIENTO (ESPACIOS)
// ============================================

// Variable global para la página actual de equipamiento
let paginaActualEquipamiento = 1;
let itemsAgregarEditarEquipamiento = [];
let itemsQuitarEditarEquipamiento = [];

// Cargar espacios
async function cargarEspaciosEquipamiento(pagina = 1) {
    paginaActualEquipamiento = pagina;
    
    const loadingState = document.getElementById('espacios-loading-equipamiento');
    const emptyState = document.getElementById('espacios-empty-equipamiento');
    const tableContainer = document.getElementById('espacios-table-container-equipamiento');
    const tbody = document.getElementById('espacios-tbody-equipamiento');
    const paginacionContainer = document.getElementById('espacios-paginacion-equipamiento');
    
    if (!loadingState || !emptyState || !tableContainer || !tbody) {
        console.error('Elementos del DOM no encontrados');
        return;
    }
    
    // Obtener valores de los filtros
    const filtros = {
        id_direccion: document.getElementById('filtro_direccion_equipamiento')?.value || null,
        id_departamento: document.getElementById('filtro_departamento_equipamiento')?.value || null,
        id_seccion: document.getElementById('filtro_seccion_equipamiento')?.value || null,
        nombre_oficina: document.getElementById('filtro_oficina_equipamiento')?.value || null,
        id_usuario: document.getElementById('filtro_usuario_equipamiento')?.value || null,
        piso: document.getElementById('filtro_piso_equipamiento')?.value || null,
        ubicacion_fisica: document.getElementById('filtro_ubicacion_equipamiento')?.value || null
    };
    
    // Mostrar loading
    loadingState.style.display = 'flex';
    emptyState.style.display = 'none';
    tableContainer.style.display = 'none';
    if (paginacionContainer) {
        paginacionContainer.style.display = 'none';
    }
    
    try {
        const response = await fetch(getAppBasePath() + '/config/Gestionespacios.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'listar_espacios',
                filtros: filtros,
                pagina: pagina,
                limite: 10
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        // Ocultar loading
        loadingState.style.display = 'none';
        
        if (result.success && result.data && result.data.length > 0) {
            // Mostrar tabla
            tableContainer.style.display = 'block';
            emptyState.style.display = 'none';
            
            // Limpiar tbody
            tbody.innerHTML = '';
            
            // Agregar filas
            result.data.forEach(espacio => {
                const row = document.createElement('tr');
                const nombreEscapado = espacio.nombre.replace(/'/g, "\\'");
                row.innerHTML = `
                    <td><strong>${espacio.nombre}</strong></td>
                    <td>${espacio.edificio}</td>
                    <td>${espacio.piso}</td>
                    <td>${espacio.direccion}</td>
                    <td>${espacio.departamento}</td>
                    <td>${espacio.seccion}</td>
                    <td>${espacio.ubicacion_fisica}</td>
                    <td>${espacio.usuario_asignado || 'Sin asignar'}</td>
                    <td>
                        <span class="badge-inventario">${espacio.total_inventario} items</span>
                    </td>
                    <td>
                        <div class="action-menu-container">
                            <button class="btn-menu-toggle" onclick="toggleActionMenuEquipamiento(${espacio.id_oficina}, event)" title="Opciones">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                            <div class="action-menu" id="action-menu-equipamiento-${espacio.id_oficina}" style="display: none;">
                                <button class="action-menu-item" onclick="verDetalleEspacioEquipamiento(${espacio.id_oficina}); closeAllActionMenusEquipamiento();">
                                    <i class="fas fa-eye"></i> Ver Detalles
                                </button>
                                <button class="action-menu-item" onclick="editarEspacioEquipamiento(${espacio.id_oficina}); closeAllActionMenusEquipamiento();">
                                    <i class="fas fa-edit"></i> Editar
                                </button>
                                <button class="action-menu-item" onclick="exportarEspacioPDFEquipamiento(${espacio.id_oficina}); closeAllActionMenusEquipamiento();">
                                    <i class="fas fa-file-pdf"></i> Exportar PDF
                                </button>
                            </div>
                        </div>
                    </td>
                `;
                tbody.appendChild(row);
            });
            
            // Mostrar y actualizar controles de paginación
            if (result.paginacion && paginacionContainer) {
                actualizarPaginacionEquipamiento(result.paginacion);
                paginacionContainer.style.display = 'flex';
            }
        } else {
            // Mostrar estado vacío
            emptyState.style.display = 'flex';
            tableContainer.style.display = 'none';
            if (paginacionContainer) {
                paginacionContainer.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error al cargar espacios:', error);
        loadingState.style.display = 'none';
        mostrarCardEmergente(false, 'Error al cargar los espacios. Por favor, intente nuevamente.');
    }
}

// Cambiar de página
function cambiarPaginaEquipamiento(direccion) {
    const nuevaPagina = paginaActualEquipamiento + direccion;
    if (nuevaPagina >= 1) {
        cargarEspaciosEquipamiento(nuevaPagina);
    }
}

// Ir a página específica
function irAPaginaEquipamiento(pagina) {
    if (pagina >= 1) {
        cargarEspaciosEquipamiento(pagina);
    }
}

// Actualizar controles de paginación
function actualizarPaginacionEquipamiento(paginacion) {
    const infoTexto = document.getElementById('paginacion-info-texto-equipamiento');
    const btnAnterior = document.getElementById('btn-pagina-anterior-equipamiento');
    const btnSiguiente = document.getElementById('btn-pagina-siguiente-equipamiento');
    const numerosContainer = document.getElementById('paginacion-numeros-equipamiento');
    
    if (!infoTexto || !btnAnterior || !btnSiguiente || !numerosContainer) {
        return;
    }
    
    // Actualizar información
    const inicio = ((paginacion.pagina_actual - 1) * paginacion.limite) + 1;
    const fin = Math.min(paginacion.pagina_actual * paginacion.limite, paginacion.total_registros);
    infoTexto.textContent = `Mostrando ${inicio}-${fin} de ${paginacion.total_registros} espacios`;
    
    // Actualizar botones
    btnAnterior.disabled = !paginacion.tiene_anterior;
    btnSiguiente.disabled = !paginacion.tiene_siguiente;
    
    // Generar números de página
    numerosContainer.innerHTML = '';
    const totalPaginas = paginacion.total_paginas;
    const paginaActual = paginacion.pagina_actual;
    
    // Mostrar máximo 5 números de página
    let inicioPagina = Math.max(1, paginaActual - 2);
    let finPagina = Math.min(totalPaginas, paginaActual + 2);
    
    // Ajustar si estamos cerca del inicio o final
    if (finPagina - inicioPagina < 4) {
        if (inicioPagina === 1) {
            finPagina = Math.min(5, totalPaginas);
        } else if (finPagina === totalPaginas) {
            inicioPagina = Math.max(1, totalPaginas - 4);
        }
    }
    
    // Primera página
    if (inicioPagina > 1) {
        const btn = document.createElement('button');
        btn.className = 'btn-pagina-numero';
        btn.textContent = '1';
        btn.onclick = () => irAPaginaEquipamiento(1);
        numerosContainer.appendChild(btn);
        
        if (inicioPagina > 2) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'paginacion-ellipsis';
            ellipsis.textContent = '...';
            numerosContainer.appendChild(ellipsis);
        }
    }
    
    // Números de página
    for (let i = inicioPagina; i <= finPagina; i++) {
        const btn = document.createElement('button');
        btn.className = 'btn-pagina-numero';
        if (i === paginaActual) {
            btn.classList.add('active');
        }
        btn.textContent = i;
        btn.onclick = () => irAPaginaEquipamiento(i);
        numerosContainer.appendChild(btn);
    }
    
    // Última página
    if (finPagina < totalPaginas) {
        if (finPagina < totalPaginas - 1) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'paginacion-ellipsis';
            ellipsis.textContent = '...';
            numerosContainer.appendChild(ellipsis);
        }
        
        const btn = document.createElement('button');
        btn.className = 'btn-pagina-numero';
        btn.textContent = totalPaginas;
        btn.onclick = () => irAPaginaEquipamiento(totalPaginas);
        numerosContainer.appendChild(btn);
    }
}

// Cargar opciones para los filtros
async function cargarFiltrosEquipamiento() {
    try {
        // Cargar direcciones
        const responseDirecciones = await fetch(getAppBasePath() + '/config/Registroespacios.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'obtener_direcciones'
            })
        });
        const resultDirecciones = await responseDirecciones.json();
        const selectDireccion = document.getElementById('filtro_direccion_equipamiento');
        if (selectDireccion && resultDirecciones.success && resultDirecciones.data) {
            selectDireccion.innerHTML = '<option value="">Todas las direcciones</option>';
            resultDirecciones.data.forEach(direccion => {
                const option = document.createElement('option');
                option.value = direccion.id_direccion;
                option.textContent = direccion.nombre;
                selectDireccion.appendChild(option);
            });
            // Agregar event listener si no existe
            selectDireccion.onchange = function() {
                cargarDepartamentosFiltroEquipamiento(this.value);
                aplicarFiltrosEquipamiento();
            };
        }
        
        // Cargar departamentos (sin filtro inicial)
        cargarDepartamentosFiltroEquipamiento(null);
        
        // Cargar usuarios
        const responseUsuarios = await fetch(getAppBasePath() + '/config/Registroespacios.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'obtener_usuarios'
            })
        });
        const resultUsuarios = await responseUsuarios.json();
        const selectUsuario = document.getElementById('filtro_usuario_equipamiento');
        if (selectUsuario && resultUsuarios.success && resultUsuarios.data) {
            selectUsuario.innerHTML = '<option value="">Todos los usuarios</option>';
            resultUsuarios.data.forEach(usuario => {
                const option = document.createElement('option');
                option.value = usuario.id_usuario;
                option.textContent = `${usuario.nombres} ${usuario.apellidos}${usuario.cargo ? ' (' + usuario.cargo + ')' : ''}`;
                selectUsuario.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error al cargar filtros:', error);
    }
}

// Cargar departamentos para el filtro
async function cargarDepartamentosFiltroEquipamiento(id_direccion) {
    try {
        const response = await fetch(getAppBasePath() + '/config/Registroespacios.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'obtener_departamentos',
                id_direccion: id_direccion
            })
        });
        const result = await response.json();
        const selectDepartamento = document.getElementById('filtro_departamento_equipamiento');
        if (selectDepartamento && result.success && result.data) {
            selectDepartamento.innerHTML = '<option value="">Todos los departamentos</option>';
            result.data.forEach(departamento => {
                const option = document.createElement('option');
                option.value = departamento.id_departamento;
                option.textContent = departamento.nombre;
                selectDepartamento.appendChild(option);
            });
            // Agregar event listener si no existe
            selectDepartamento.onchange = function() {
                cargarSeccionesFiltroEquipamiento(this.value);
                aplicarFiltrosEquipamiento();
            };
        }
    } catch (error) {
        console.error('Error al cargar departamentos:', error);
    }
}

// Cargar secciones para el filtro
async function cargarSeccionesFiltroEquipamiento(id_departamento) {
    try {
        const response = await fetch(getAppBasePath() + '/config/Registroespacios.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'obtener_secciones',
                id_departamento: id_departamento
            })
        });
        const result = await response.json();
        const selectSeccion = document.getElementById('filtro_seccion_equipamiento');
        if (selectSeccion && result.success && result.data) {
            selectSeccion.innerHTML = '<option value="">Todas las secciones</option>';
            result.data.forEach(seccion => {
                const option = document.createElement('option');
                option.value = seccion.id_seccion;
                option.textContent = seccion.nombre;
                selectSeccion.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error al cargar secciones:', error);
    }
}

// Aplicar filtros
function aplicarFiltrosEquipamiento() {
    cargarEspaciosEquipamiento(1); // Resetear a la primera página al aplicar filtros
}

// Limpiar filtros
function limpiarFiltrosEquipamiento() {
    document.getElementById('filtro_direccion_equipamiento').value = '';
    document.getElementById('filtro_departamento_equipamiento').value = '';
    document.getElementById('filtro_seccion_equipamiento').value = '';
    document.getElementById('filtro_oficina_equipamiento').value = '';
    document.getElementById('filtro_usuario_equipamiento').value = '';
    document.getElementById('filtro_piso_equipamiento').value = '';
    document.getElementById('filtro_ubicacion_equipamiento').value = '';
    
    // Recargar departamentos y secciones sin filtros
    cargarDepartamentosFiltroEquipamiento(null);
    cargarSeccionesFiltroEquipamiento(null);
    
    // Recargar espacios sin filtros (ir a la primera página)
    cargarEspaciosEquipamiento(1);
}

// Funciones auxiliares para menús de acción
function toggleActionMenuEquipamiento(id, event) {
    event.stopPropagation();
    closeAllActionMenusEquipamiento();
    const menu = document.getElementById(`action-menu-equipamiento-${id}`);
    if (menu) {
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    }
}

function closeAllActionMenusEquipamiento() {
    document.querySelectorAll('[id^="action-menu-equipamiento-"]').forEach(menu => {
        menu.style.display = 'none';
    });
}

// Cerrar menús al hacer clic fuera
document.addEventListener('click', function(event) {
    if (!event.target.closest('.action-menu-container')) {
        closeAllActionMenusEquipamiento();
    }
});

// Ver detalle de espacio
async function verDetalleEspacioEquipamiento(id_oficina) {
    try {
        const response = await fetch(getAppBasePath() + '/config/Gestionespacios.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'obtener_espacio',
                id_oficina: id_oficina
            })
        });

        const result = await response.json();
        
        if (result.success) {
            const espacio = result.data;
            const modalBody = document.getElementById('modal-detalle-body-equipamiento');
            const modal = document.getElementById('modal-detalle-espacio-equipamiento');
            
            if (modalBody && modal) {
                modalBody.innerHTML = `
                    <div class="detalle-item">
                        <div class="detalle-label">
                            <i class="fas fa-tag"></i> Nombre
                        </div>
                        <div class="detalle-value">${espacio.nombre || 'N/A'}</div>
                    </div>
                    <div class="detalle-item">
                        <div class="detalle-label">
                            <i class="fas fa-building"></i> Edificio
                        </div>
                        <div class="detalle-value">${espacio.edificio || 'N/A'}</div>
                    </div>
                    <div class="detalle-item">
                        <div class="detalle-label">
                            <i class="fas fa-layer-group"></i> Piso
                        </div>
                        <div class="detalle-value">${espacio.piso || 'N/A'}</div>
                    </div>
                    <div class="detalle-item">
                        <div class="detalle-label">
                            <i class="fas fa-map-marker-alt"></i> Ubicación Física
                        </div>
                        <div class="detalle-value">${espacio.ubicacion_fisica || 'N/A'}</div>
                    </div>
                    <div class="detalle-item">
                        <div class="detalle-label">
                            <i class="fas fa-directions"></i> Dirección
                        </div>
                        <div class="detalle-value">${espacio.nombre_direccion || 'N/A'}</div>
                    </div>
                    <div class="detalle-item">
                        <div class="detalle-label">
                            <i class="fas fa-sitemap"></i> Departamento
                        </div>
                        <div class="detalle-value">${espacio.nombre_departamento || 'N/A'}</div>
                    </div>
                    <div class="detalle-item">
                        <div class="detalle-label">
                            <i class="fas fa-folder"></i> Sección
                        </div>
                        <div class="detalle-value">${espacio.nombre_seccion || 'N/A'}</div>
                    </div>
                    <div class="detalle-item">
                        <div class="detalle-label">
                            <i class="fas fa-user"></i> Usuario Asignado
                        </div>
                        <div class="detalle-value">${espacio.usuario_asignado || 'Sin asignar'}</div>
                    </div>
                    <div class="detalle-item">
                        <div class="detalle-label">
                            <i class="fas fa-boxes"></i> Items Inventario
                        </div>
                        <div class="detalle-value">
                            <span class="badge-inventario-modal">${espacio.total_inventario || 0} items</span>
                            ${espacio.items && espacio.items.length > 0 ? `
                                <div class="items-list-container">
                                    ${espacio.items.map(item => `
                                        <div class="item-inventario-detalle">
                                            <div class="item-header-detalle">
                                                <strong>${item.codigo_patrimonial || 'Sin código'}</strong>
                                                <span class="item-estado ${item.estado ? item.estado.toLowerCase().replace(/\s+/g, '-') : ''}">${item.estado || 'N/A'}</span>
                                            </div>
                                            <div class="item-details-detalle">
                                                ${item.tipo_bien ? `<div class="item-detail-row"><span class="item-detail-label">Tipo:</span> ${item.tipo_bien}</div>` : ''}
                                                ${item.descripcion ? `<div class="item-detail-row"><span class="item-detail-label">Descripción:</span> ${item.descripcion}</div>` : ''}
                                                ${item.marca ? `<div class="item-detail-row"><span class="item-detail-label">Marca:</span> ${item.marca}</div>` : ''}
                                                ${item.modelo ? `<div class="item-detail-row"><span class="item-detail-label">Modelo:</span> ${item.modelo}</div>` : ''}
                                                ${item.serie ? `<div class="item-detail-row"><span class="item-detail-label">Serie:</span> ${item.serie}</div>` : ''}
                                                ${item.fecha_ingreso ? `<div class="item-detail-row"><span class="item-detail-label">Fecha Ingreso:</span> ${new Date(item.fecha_ingreso).toLocaleDateString('es-ES')}</div>` : ''}
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : '<p style="margin-top: 0.5rem; color: #999; font-style: italic;">No hay items registrados</p>'}
                        </div>
                    </div>
                `;
                
                modal.style.display = 'flex';
            }
        } else {
            mostrarCardEmergente(false, result.message || 'Error al obtener los detalles del espacio');
        }
    } catch (error) {
        console.error('Error al obtener detalle de espacio:', error);
        mostrarCardEmergente(false, 'Error al obtener los detalles del espacio');
    }
}

// Editar espacio
async function editarEspacioEquipamiento(id_oficina) {
    try {
        const response = await fetch(getAppBasePath() + '/config/Gestionespacios.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'obtener_espacio',
                id_oficina: id_oficina
            })
        });

        const result = await response.json();
        
        if (result.success) {
            const espacio = result.data;
            const modalBody = document.getElementById('modal-editar-body-equipamiento');
            const modal = document.getElementById('modal-editar-espacio-equipamiento');
            
            if (!modalBody || !modal) {
                mostrarCardEmergente(false, 'Error: No se pudo encontrar el modal de edición');
                return;
            }
            
            modalBody.innerHTML = `
                <form id="form-editar-espacio-equipamiento" onsubmit="guardarEdicionEspacioEquipamiento(event, ${id_oficina})">
                    <input type="hidden" id="editar_id_oficina_equipamiento" value="${id_oficina}">
                    
                    <div class="form-section-editar">
                        <h4><i class="fas fa-building"></i> Información de la Oficina o Seccion</h4>
                        <div class="form-row-editar">
                            <div class="form-group-editar">
                                <label>Nombre *</label>
                                <input type="text" id="editar_nombre_equipamiento" value="${espacio.nombre || ''}" required>
                            </div>
                            <div class="form-group-editar">
                                <label>Edificio</label>
                                <input type="text" id="editar_edificio_equipamiento" value="${espacio.edificio || ''}">
                            </div>
                        </div>
                        <div class="form-row-editar">
                            <div class="form-group-editar">
                                <label>Piso</label>
                                <input type="text" id="editar_piso_equipamiento" value="${espacio.piso || ''}">
                            </div>
                            <div class="form-group-editar">
                                <label>Ubicación Física</label>
                                <input type="text" id="editar_ubicacion_fisica_equipamiento" value="${espacio.ubicacion_fisica || ''}">
                            </div>
                        </div>
                        <div class="form-row-editar">
                            <div class="form-group-editar">
                                <label>Dirección</label>
                                <select id="editar_id_direccion_equipamiento">
                                    <option value="">Ninguna</option>
                                </select>
                            </div>
                            <div class="form-group-editar">
                                <label>Departamento</label>
                                <select id="editar_id_departamento_equipamiento">
                                    <option value="">Ninguno</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row-editar">
                            <div class="form-group-editar">
                                <label>Sección</label>
                                <select id="editar_id_seccion_equipamiento">
                                    <option value="">Ninguna</option>
                                </select>
                            </div>
                            <div class="form-group-editar">
                                <label>Usuario Asignado</label>
                                <select id="editar_id_usuario_asignacion_equipamiento">
                                    <option value="">Cargando usuarios...</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-section-editar">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                            <h4><i class="fas fa-boxes"></i> Items de Inventario</h4>
                            <button type="button" class="btn-add-item-editar" onclick="agregarItemInventarioEditarEquipamiento()">
                                <i class="fas fa-plus"></i> Agregar Item
                            </button>
                        </div>
                        <div id="items-inventario-editar-container-equipamiento">
                            ${espacio.items && espacio.items.length > 0 ? (() => {
                                // Filtrar solo items activos
                                const itemsActivos = espacio.items.filter(item => {
                                    const esActivo = item.activo === 1 || item.activo === '1' || item.activo === true || parseInt(item.activo) === 1;
                                    return esActivo;
                                });
                                return itemsActivos.length > 0 ? itemsActivos.map((item, index) => `
                                <div class="item-inventario-editar" data-item-id="${item.id_inventario}">
                                    <div class="item-header-editar">
                                        <strong>Item ${index + 1}: ${item.codigo_patrimonial || 'Sin código'}</strong>
                                        <div>
                                            <button type="button" class="btn-mover-item" onclick="moverItemInventarioEquipamiento(${item.id_inventario}, ${id_oficina})" title="Mover a otra área">
                                                <i class="fas fa-exchange-alt"></i> Mover
                                            </button>
                                            <button type="button" class="btn-baja-item" onclick="darBajaItemInventarioEquipamiento(${item.id_inventario}, ${id_oficina})" title="Dar de baja">
                                                <i class="fas fa-ban"></i> Baja
                                            </button>
                                            <button type="button" class="btn-remove-item-editar" onclick="quitarItemInventarioEditarEquipamiento(${item.id_inventario})" title="Quitar de esta oficina o seccion">
                                                <i class="fas fa-times"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div class="form-row-editar">
                                        <div class="form-group-editar">
                                            <label>Codigo Articulo</label>
                                            <input type="text" value="${item.codigo_patrimonial || ''}" disabled>
                                        </div>
                                        <div class="form-group-editar">
                                            <label>Tipo de Bien</label>
                                            <input type="text" value="${item.tipo_bien || 'N/A'}" disabled>
                                        </div>
                                    </div>
                                    <div class="form-row-editar">
                                        <div class="form-group-editar">
                                            <label>Marca</label>
                                            <input type="text" value="${item.marca || ''}" disabled>
                                        </div>
                                        <div class="form-group-editar">
                                            <label>Modelo</label>
                                            <input type="text" value="${item.modelo || ''}" disabled>
                                        </div>
                                    </div>
                                    <div class="form-row-editar">
                                        <div class="form-group-editar">
                                            <label>Serie</label>
                                            <input type="text" value="${item.serie || ''}" disabled>
                                        </div>
                                        <div class="form-group-editar">
                                            <label>Descripción</label>
                                            <input type="text" value="${item.descripcion || ''}" disabled>
                                        </div>
                                    </div>
                                    <div class="form-row-editar">
                                        <div class="form-group-editar">
                                            <label>Estado</label>
                                            <span class="item-estado ${item.estado ? item.estado.toLowerCase().replace(/\s+/g, '-') : ''}">${item.estado || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            `).join('') : '<p style="color: #999; font-style: italic;">No hay items activos registrados</p>';
                            })() : '<p style="color: #999; font-style: italic;">No hay items registrados</p>'}
                        </div>
                    </div>
                    
                    <div class="modal-editar-footer">
                        <button type="button" class="btn-modal-cancel" onclick="cerrarModalEditarEquipamiento()">Cancelar</button>
                        <button type="submit" class="btn-modal-save">Guardar Cambios</button>
                    </div>
                </form>
            `;
            
            // Resetear arrays de items
            itemsAgregarEditarEquipamiento = [];
            itemsQuitarEditarEquipamiento = [];
            
            // Cargar datos para los selects
            await cargarDatosParaEditarEquipamiento(espacio);
            await cargarTiposBienParaEditarEquipamiento();
            
            modal.style.display = 'flex';
        } else {
            mostrarCardEmergente(false, result.message || 'Error al obtener los datos del espacio');
        }
    } catch (error) {
        console.error('Error al obtener datos del espacio:', error);
        mostrarCardEmergente(false, 'Error al obtener los datos del espacio');
    }
}

// Función auxiliar para cargar datos en el modal de edición
async function cargarDatosParaEditarEquipamiento(espacio) {
    try {
        // Cargar direcciones
        const responseDirecciones = await fetch(getAppBasePath() + '/config/Registroespacios.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'obtener_direcciones'
            })
        });
        const resultDirecciones = await responseDirecciones.json();
        const selectDireccion = document.getElementById('editar_id_direccion_equipamiento');
        if (selectDireccion && resultDirecciones.success && resultDirecciones.data) {
            selectDireccion.innerHTML = '<option value="">Ninguna</option>';
            resultDirecciones.data.forEach(direccion => {
                const option = document.createElement('option');
                option.value = direccion.id_direccion;
                option.textContent = direccion.nombre;
                if (espacio.id_direccion && direccion.id_direccion == espacio.id_direccion) {
                    option.selected = true;
                }
                selectDireccion.appendChild(option);
            });
        }
        
        // Cargar departamentos
        if (espacio.id_direccion) {
            const responseDepartamentos = await fetch(getAppBasePath() + '/config/Registroespacios.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'obtener_departamentos',
                    id_direccion: espacio.id_direccion
                })
            });
            const resultDepartamentos = await responseDepartamentos.json();
            const selectDepartamento = document.getElementById('editar_id_departamento_equipamiento');
            if (selectDepartamento && resultDepartamentos.success && resultDepartamentos.data) {
                selectDepartamento.innerHTML = '<option value="">Ninguno</option>';
                resultDepartamentos.data.forEach(departamento => {
                    const option = document.createElement('option');
                    option.value = departamento.id_departamento;
                    option.textContent = departamento.nombre;
                    if (espacio.id_departamento && departamento.id_departamento == espacio.id_departamento) {
                        option.selected = true;
                    }
                    selectDepartamento.appendChild(option);
                });
            }
        }
        
        // Cargar secciones
        if (espacio.id_departamento) {
            const responseSecciones = await fetch(getAppBasePath() + '/config/Registroespacios.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'obtener_secciones',
                    id_departamento: espacio.id_departamento
                })
            });
            const resultSecciones = await responseSecciones.json();
            const selectSeccion = document.getElementById('editar_id_seccion_equipamiento');
            if (selectSeccion && resultSecciones.success && resultSecciones.data) {
                selectSeccion.innerHTML = '<option value="">Ninguna</option>';
                resultSecciones.data.forEach(seccion => {
                    const option = document.createElement('option');
                    option.value = seccion.id_seccion;
                    option.textContent = seccion.nombre;
                    if (espacio.id_seccion && seccion.id_seccion == espacio.id_seccion) {
                        option.selected = true;
                    }
                    selectSeccion.appendChild(option);
                });
            }
        }
        
        // Cargar usuarios
        const responseUsuarios = await fetch(getAppBasePath() + '/config/Registroespacios.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'obtener_usuarios'
            })
        });
        const resultUsuarios = await responseUsuarios.json();
        const selectUsuario = document.getElementById('editar_id_usuario_asignacion_equipamiento');
        if (selectUsuario && resultUsuarios.success && resultUsuarios.data) {
            selectUsuario.innerHTML = '<option value="">Sin asignar</option>';
            resultUsuarios.data.forEach(usuario => {
                const option = document.createElement('option');
                option.value = usuario.id_usuario;
                option.textContent = `${usuario.nombres} ${usuario.apellidos}${usuario.cargo ? ' (' + usuario.cargo + ')' : ''}`;
                if (espacio.id_usuario_asignacion && usuario.id_usuario == espacio.id_usuario_asignacion) {
                    option.selected = true;
                }
                selectUsuario.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error al cargar datos para edición:', error);
    }
}

// Guardar edición de espacio
async function guardarEdicionEspacioEquipamiento(event, id_oficina) {
    event.preventDefault();
    
    // Obtener usuario logueado para id_usuario_responsable
    const usuarioLogueado = JSON.parse(sessionStorage.getItem('usuario_logueado') || '{}');
    const id_usuario_responsable = usuarioLogueado.id_usuario || null;
    
    const formData = {
        action: 'actualizar_espacio',
        id_oficina: id_oficina,
        nombre: document.getElementById('editar_nombre_equipamiento')?.value || '',
        edificio: document.getElementById('editar_edificio_equipamiento')?.value || null,
        piso: document.getElementById('editar_piso_equipamiento')?.value || null,
        ubicacion_fisica: document.getElementById('editar_ubicacion_fisica_equipamiento')?.value || null,
        id_direccion: document.getElementById('editar_id_direccion_equipamiento')?.value || null,
        id_departamento: document.getElementById('editar_id_departamento_equipamiento')?.value || null,
        id_seccion: document.getElementById('editar_id_seccion_equipamiento')?.value || null,
        id_usuario_asignacion: (() => {
            const selectUsuario = document.getElementById('editar_id_usuario_asignacion_equipamiento');
            const valor = selectUsuario?.value;
            return (valor && valor !== '' && valor !== '0') ? parseInt(valor) : null;
        })(),
        id_usuario_responsable: id_usuario_responsable,
        items_quitar: itemsQuitarEditarEquipamiento,
        items_agregar: {}
    };
    
    // Recopilar items nuevos
    const form = document.getElementById('form-editar-espacio-equipamiento');
    const formDataObj = new FormData(form);
    const itemsNuevos = {};
    
    for (const [key, value] of formDataObj.entries()) {
        if (key.startsWith('items_nuevos[')) {
            const match = key.match(/items_nuevos\[([^\]]+)\]\[([^\]]+)\]/);
            if (match) {
                const itemId = match[1];
                const campo = match[2];
                if (!itemsNuevos[itemId]) {
                    itemsNuevos[itemId] = {};
                }
                itemsNuevos[itemId][campo] = value;
            }
        }
    }
    
    formData.items_agregar = itemsNuevos;
    
    try {
        const response = await fetch(getAppBasePath() + '/config/Gestionespacios.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            mostrarCardEmergente(true, 'Espacio actualizado correctamente');
            cerrarModalEditarEquipamiento();
            cargarEspaciosEquipamiento(paginaActualEquipamiento);
        } else {
            mostrarCardEmergente(false, result.message || 'Error al actualizar el espacio');
        }
    } catch (error) {
        console.error('Error al guardar edición:', error);
        mostrarCardEmergente(false, 'Error al guardar los cambios');
    }
}

// Exportar espacio a PDF
async function exportarEspacioPDFEquipamiento(id_oficina) {
    try {
        // Obtener datos completos del espacio
        const response = await fetch(getAppBasePath() + '/config/Gestionespacios.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'obtener_espacio',
                id_oficina: id_oficina
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (!result.success || !result.data) {
            throw new Error('No se pudieron obtener los datos del espacio');
        }
        
        const espacio = result.data;
        
        // Obtener datos del usuario
        const usuarioLogueado = JSON.parse(sessionStorage.getItem('usuario_logueado') || '{}');
        const nombreUsuario = usuarioLogueado.nombres && usuarioLogueado.apellidos 
            ? `${usuarioLogueado.nombres} ${usuarioLogueado.apellidos}` 
            : 'Usuario';
        const rutUsuario = usuarioLogueado.rut || usuarioLogueado.rut_numero || 'N/A';
        const cargoUsuario = usuarioLogueado.cargo || 'N/A';
        
        // Crear PDF usando jsPDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('landscape', 'mm', 'a4');
        
        // Configuración de colores
        const colorAzul = [25, 118, 210];
        const colorGris = [128, 128, 128];
        
        // Agregar logo en la esquina superior derecha
        const logoPath = getAppBasePath() + '/images/muni.png';
        try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = logoPath;
            
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = () => resolve();
                setTimeout(resolve, 1000);
            });
            
            if (img.complete && img.naturalWidth > 0) {
                const logoWidth = 30;
                const logoHeight = (img.naturalHeight / img.naturalWidth) * logoWidth;
                doc.addImage(img, 'PNG', doc.internal.pageSize.getWidth() - 40, 10, logoWidth, logoHeight);
            }
        } catch (e) {
            console.warn('No se pudo cargar el logo:', e);
        }
        
        // Título del documento
        doc.setFontSize(18);
        doc.setTextColor(...colorAzul);
        doc.setFont('helvetica', 'bold');
        doc.text('INFORMACIÓN DEL ESPACIO', 20, 20);
        
        // Texto descriptivo
        doc.setFontSize(12);
        doc.setTextColor(...colorGris);
        doc.setFont('helvetica', 'normal');
        const textoDescripcion = 'Este es un documento de información del espacio de la Municipalidad de Tomé';
        doc.text(textoDescripcion, 20, 30);
        
        // Fecha
        const fecha = new Date();
        const fechaFormateada = fecha.toLocaleDateString('es-ES', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        doc.text(`Fecha de generación: ${fechaFormateada}`, 20, 37);
        
        // Información del espacio
        let yPos = 50;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colorAzul);
        doc.text('INFORMACIÓN DEL ESPACIO', 20, yPos);
        
        yPos += 8;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        
        // Dirección
        if (espacio.nombre_direccion) {
            doc.text(`Dirección: ${espacio.nombre_direccion}`, 20, yPos);
            yPos += 6;
        }
        
        // Departamento
        if (espacio.nombre_departamento) {
            doc.text(`Departamento: ${espacio.nombre_departamento}`, 20, yPos);
            yPos += 6;
        }
        
        // Sección
        if (espacio.nombre_seccion) {
            doc.text(`Sección: ${espacio.nombre_seccion}`, 20, yPos);
            yPos += 6;
        }
        
        // Oficina
        if (espacio.nombre) {
            doc.text(`Oficina: ${espacio.nombre}`, 20, yPos);
            yPos += 6;
        }
        
        // Usuario asignado
        if (espacio.usuario_asignado && espacio.usuario_asignado !== 'Sin asignar') {
            doc.text(`Usuario Asignado: ${espacio.usuario_asignado}`, 20, yPos);
            yPos += 6;
        }
        
        // Datos de la oficina
        yPos += 3;
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colorAzul);
        doc.text('DATOS DE LA OFICINA', 20, yPos);
        
        yPos += 8;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        
        if (espacio.edificio) {
            doc.text(`Edificio: ${espacio.edificio}`, 20, yPos);
            yPos += 6;
        }
        
        if (espacio.piso) {
            doc.text(`Piso: ${espacio.piso}`, 20, yPos);
            yPos += 6;
        }
        
        if (espacio.ubicacion_fisica) {
            doc.text(`Ubicación Física: ${espacio.ubicacion_fisica}`, 20, yPos);
            yPos += 6;
        }
        
        // Filtrar solo items activos
        const itemsActivos = espacio.items ? espacio.items.filter(item => {
            const esActivo = item.activo === 1 || item.activo === '1' || item.activo === true || parseInt(item.activo) === 1;
            return esActivo;
        }) : [];
        
        // Validar que haya items activos
        if (itemsActivos.length === 0) {
            mostrarCardEmergente(false, 'Este espacio no tiene items activos asignados. No se puede generar el PDF.');
            return;
        }
        
        // Preparar datos para la tabla de items (solo activos)
        const tableData = [];
        itemsActivos.forEach(item => {
            tableData.push([
                item.codigo_patrimonial || 'N/A',
                item.marca || 'N/A',
                item.modelo || 'N/A',
                item.serie || 'N/A',
                item.descripcion || 'N/A',
                'Activo'
            ]);
        });
        
        // Agregar tabla de items
        if (tableData.length > 0) {
            yPos += 5;
            doc.autoTable({
                startY: yPos,
                head: [['Codigo Articulo', 'Marca', 'Modelo', 'Serie', 'Descripción', 'Estado']],
                body: tableData,
                theme: 'striped',
                headStyles: {
                    fillColor: colorAzul,
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    fontSize: 9
                },
                bodyStyles: {
                    fontSize: 8,
                    textColor: [0, 0, 0]
                },
                alternateRowStyles: {
                    fillColor: [245, 245, 245]
                },
                margin: { top: yPos, left: 20, right: 20 },
                styles: {
                    cellPadding: 2,
                    overflow: 'linebreak',
                    cellWidth: 'wrap'
                },
                columnStyles: {
                    0: { cellWidth: 35 },
                    1: { cellWidth: 30 },
                    2: { cellWidth: 30 },
                    3: { cellWidth: 30 },
                    4: { cellWidth: 60 },
                    5: { cellWidth: 25 }
                }
            });
        }
        
        // Pie de página con firma
        const pageHeight = doc.internal.pageSize.getHeight();
        const pageWidth = doc.internal.pageSize.getWidth();
        
        // Agregar línea de firma
        const firmaY = pageHeight - 40;
        doc.setDrawColor(...colorGris);
        doc.line(20, firmaY, pageWidth - 20, firmaY);
        
        // Texto de firma (alineado a la derecha)
        doc.setFontSize(10);
        doc.setTextColor(...colorGris);
        doc.setFont('helvetica', 'normal');
        
        // Calcular posición para alinear a la derecha
        const textoNombre = nombreUsuario;
        const textoRUT = `RUT: ${rutUsuario}`;
        const textoCargo = cargoUsuario;
        
        // Calcular el ancho máximo para alinear nombre y cargo a la derecha
        const anchoMax = Math.max(
            doc.getTextWidth(textoNombre),
            doc.getTextWidth(textoCargo)
        );
        const xPos = pageWidth - 20 - anchoMax;
        
        // Calcular posición del nombre (5px más a la derecha = aproximadamente 1.75mm)
        const xPosNombre = xPos + 5.75;
        
        // Calcular posición del RUT (10px más a la derecha = aproximadamente 3.5mm)
        const xPosRUT = xPos + 3.5;
        
        // Escribir texto de firma
        doc.setFont('helvetica', 'bold');
        doc.text(textoNombre, xPosNombre, firmaY + 8);
        doc.setFont('helvetica', 'normal');
        doc.text(textoRUT, xPosRUT, firmaY + 15);
        doc.text(textoCargo, xPos, firmaY + 22);
        
        // Guardar PDF
        const nombreEspacio = espacio.nombre ? espacio.nombre.replace(/[^a-z0-9]/gi, '_') : 'Espacio';
        const nombreArchivo = `Espacio_${nombreEspacio}_${fecha.getFullYear()}${String(fecha.getMonth() + 1).padStart(2, '0')}${String(fecha.getDate()).padStart(2, '0')}.pdf`;
        doc.save(nombreArchivo);
    } catch (error) {
        console.error('Error al exportar PDF del espacio:', error);
        mostrarCardEmergente(false, 'Error al generar el PDF. Por favor, intente nuevamente.');
    }
}

// ============================================
// FUNCIONES PARA GESTIÓN DE ITEMS EN EDICIÓN
// ============================================

// Agregar item de inventario en edición
function agregarItemInventarioEditarEquipamiento() {
    const container = document.getElementById('items-inventario-editar-container-equipamiento');
    if (!container) return;
    
    const itemId = 'nuevo_' + Date.now();
    itemsAgregarEditarEquipamiento.push(itemId);
    
    const itemDiv = document.createElement('div');
    itemDiv.className = 'item-inventario-editar nuevo-item';
    itemDiv.id = `item-editar-equipamiento-${itemId}`;
    itemDiv.setAttribute('data-item-id', itemId);
    
    itemDiv.innerHTML = `
        <div class="item-header-editar">
            <strong>Nuevo Item</strong>
            <button type="button" class="btn-remove-item-editar" onclick="eliminarItemNuevoEditarEquipamiento('${itemId}')">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="form-row-editar">
            <div class="form-group-editar">
                <label>Codigo Articulo *</label>
                <input type="text" name="items_nuevos[${itemId}][codigo_patrimonial]" required placeholder="Ej: PAT-001">
            </div>
            <div class="form-group-editar">
                <label>Tipo de Bien *</label>
                <select name="items_nuevos[${itemId}][id_tipo_bien]" required>
                    <option value="">Seleccione un tipo</option>
                </select>
                <input type="text" name="items_nuevos[${itemId}][nuevo_tipo_bien]" placeholder="Nombre del nuevo tipo de bien" style="display: none; margin-top: 8px;" class="nuevo-campo-input">
            </div>
        </div>
        <div class="form-row-editar">
            <div class="form-group-editar">
                <label>Descripción</label>
                <input type="text" name="items_nuevos[${itemId}][descripcion]" placeholder="Ej: Escritorio ejecutivo">
            </div>
            <div class="form-group-editar">
                <label>Marca</label>
                <input type="text" name="items_nuevos[${itemId}][marca]" placeholder="Ej: HP">
            </div>
        </div>
        <div class="form-row-editar">
            <div class="form-group-editar">
                <label>Modelo</label>
                <input type="text" name="items_nuevos[${itemId}][modelo]" placeholder="Ej: EliteBook 840">
            </div>
            <div class="form-group-editar">
                <label>Serie</label>
                <input type="text" name="items_nuevos[${itemId}][serie]" placeholder="Ej: SN123456">
            </div>
        </div>
        <div class="form-row-editar">
            <div class="form-group-editar">
                <label>Estado</label>
                <select name="items_nuevos[${itemId}][estado]">
                    <option value="Bueno">Bueno</option>
                    <option value="Regular">Regular</option>
                    <option value="Malo">Malo</option>
                    <option value="En Reparación">En Reparación</option>
                </select>
            </div>
            <div class="form-group-editar">
                <label>Fecha de Ingreso</label>
                <input type="date" name="items_nuevos[${itemId}][fecha_ingreso]">
            </div>
        </div>
    `;
    
    container.appendChild(itemDiv);
    
    // Llenar el select de tipos de bien
    const selectTipoBien = itemDiv.querySelector('select[name*="[id_tipo_bien]"]');
    const inputNuevoTipoBien = itemDiv.querySelector('input[name*="[nuevo_tipo_bien]"]');
    
    if (selectTipoBien && window.tiposBienEquipamiento) {
        window.tiposBienEquipamiento.forEach(tipo => {
            const option = document.createElement('option');
            option.value = tipo.id_tipo_bien;
            option.textContent = tipo.nombre;
            selectTipoBien.appendChild(option);
        });
        
        // Agregar opción de crear nuevo al final
        const crearOption = document.createElement('option');
        crearOption.value = '__crear_nuevo__';
        crearOption.textContent = '➕ Crear Nuevo Tipo de Bien';
        selectTipoBien.appendChild(crearOption);
    }
    
    // Agregar event listener para mostrar/ocultar input de nuevo tipo de bien
    if (selectTipoBien && inputNuevoTipoBien) {
        selectTipoBien.addEventListener('change', function() {
            if (this.value === '__crear_nuevo__') {
                inputNuevoTipoBien.style.display = 'block';
                inputNuevoTipoBien.required = true;
            } else {
                inputNuevoTipoBien.style.display = 'none';
                inputNuevoTipoBien.required = false;
                inputNuevoTipoBien.value = '';
            }
        });
    }
    
    // Hacer scroll hacia el nuevo item después de un pequeño delay para que se renderice
    setTimeout(() => {
        itemDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Enfocar el primer campo (Codigo Articulo)
        const primerInput = itemDiv.querySelector('input[name*="[codigo_patrimonial]"]');
        if (primerInput) {
            primerInput.focus();
        }
    }, 100);
}

// Eliminar item nuevo en edición
function eliminarItemNuevoEditarEquipamiento(itemId) {
    const item = document.getElementById(`item-editar-equipamiento-${itemId}`);
    if (item) {
        item.remove();
        itemsAgregarEditarEquipamiento = itemsAgregarEditarEquipamiento.filter(id => id !== itemId);
    }
}

// Quitar item de inventario de la oficina
async function quitarItemInventarioEditarEquipamiento(id_inventario) {
    // Obtener información del item para mostrar en la confirmación
    const itemElement = document.querySelector(`.item-inventario-editar[data-item-id="${id_inventario}"]`);
    if (!itemElement) return;
    
    // Buscar el codigo articulo en el HTML del item
    let codigoPatrimonial = 'N/A';
    const strongElement = itemElement.querySelector('.item-header-editar strong');
    if (strongElement) {
        const texto = strongElement.textContent;
        // El formato es "Item X: CODIGO_PATRIMONIAL"
        const match = texto.match(/Item \d+:\s*(.+)/);
        if (match) {
            codigoPatrimonial = match[1].trim();
        }
    }
    
    // Mostrar card de confirmación
    mostrarCardConfirmacionEquipamiento(
        '¿Quitar Item de esta Oficina o Seccion?',
        `¿Está seguro de que desea quitar el item <strong>${escapeHtml(codigoPatrimonial)}</strong> de esta oficina o seccion?<br><br>El item quedará sin oficina o seccion asignada y deberá ser reasignado manualmente.`,
        async () => {
            // Confirmar: quitar el item inmediatamente de la BD
            await confirmarQuitarItemEditarEquipamiento(id_inventario);
        },
        () => {
            // Cancelar: no hacer nada
        }
    );
}

// Confirmar y quitar item de la oficina o seccion (actualizar BD inmediatamente)
async function confirmarQuitarItemEditarEquipamiento(id_inventario) {
    try {
        // Obtener id_oficina del modal
        const id_oficina = document.getElementById('editar_id_oficina_equipamiento')?.value;
        if (!id_oficina) {
            mostrarCardEmergente(false, 'No se pudo identificar la oficina');
            return;
        }

        // Obtener usuario responsable
        const usuarioLogueado = JSON.parse(sessionStorage.getItem('usuario_logueado') || '{}');
        const id_usuario_responsable = usuarioLogueado.id_usuario;
        
        if (!id_usuario_responsable) {
            mostrarCardEmergente(false, 'No se pudo identificar al usuario responsable');
            return;
        }

        // Obtener datos del item para registrar el movimiento
        const responseItem = await fetch(getAppBasePath() + '/config/Gestionespacios.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'obtener_item_inventario',
                id_inventario: id_inventario
            })
        });

        if (!responseItem.ok) {
            throw new Error(`HTTP error! status: ${responseItem.status}`);
        }

        const resultItem = await responseItem.json();
        if (!resultItem.success || !resultItem.data) {
            throw new Error('Error al obtener datos del item');
        }

        const item = resultItem.data;

        // Llamar al backend para quitar el item de la oficina
        const response = await fetch(getAppBasePath() + '/config/Gestionespacios.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'eliminar_asignacion_item',
                id_inventario: id_inventario,
                origen_oficina: parseInt(id_oficina),
                origen_seccion: item.id_seccion || null,
                origen_departamento: item.id_departamento || null,
                origen_direccion: item.id_direccion || null,
                motivo: 'Item quitado de la oficina o seccion desde el modal de edición',
                id_usuario_responsable: id_usuario_responsable
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
            // Remover el item del DOM
            const itemElement = document.querySelector(`.item-inventario-editar[data-item-id="${id_inventario}"]`);
            if (itemElement) {
                itemElement.remove();
            }
            
            // Agregar a la lista de items quitados
            if (!itemsQuitarEditarEquipamiento.includes(id_inventario)) {
                itemsQuitarEditarEquipamiento.push(id_inventario);
            }
            
            // Recargar la tabla de espacios para actualizar el número de items
            cargarEspaciosEquipamiento(paginaActualEquipamiento);
            
            mostrarCardEmergente(true, 'Item quitado de la oficina o seccion correctamente');
        } else {
            mostrarCardEmergente(false, result.message || 'Error al quitar el item de la oficina o seccion');
        }
    } catch (error) {
        console.error('Error al quitar item:', error);
        mostrarCardEmergente(false, 'Error al quitar el item. Por favor, intente nuevamente.');
    }
}

// Mostrar card de confirmación personalizada
function mostrarCardConfirmacionEquipamiento(titulo, mensaje, onConfirm, onCancel) {
    // Eliminar overlay existente si hay uno
    let existingOverlay = document.getElementById('overlay-confirmacion-equipamiento');
    if (existingOverlay) {
        existingOverlay.remove();
    }
    
    // Crear overlay difuminado
    let overlay = document.createElement('div');
    overlay.id = 'overlay-confirmacion-equipamiento';
    overlay.className = 'overlay-blur';
    overlay.style.display = 'flex';
    document.body.appendChild(overlay);
    
    // Crear card
    let card = document.createElement('div');
    card.className = 'msg-card confirmacion-card';
    card.style.maxWidth = '500px';
    card.style.width = '90%';

    // Título
    let tituloElement = document.createElement('div');
    tituloElement.className = 'msg-title';
    tituloElement.style.fontSize = '1.25rem';
    tituloElement.style.fontWeight = '600';
    tituloElement.style.marginBottom = '1rem';
    tituloElement.style.color = '#2c3e50';
    tituloElement.innerHTML = `<i class="fas fa-question-circle" style="color: #f39c12; margin-right: 0.5rem;"></i>${titulo}`;
    card.appendChild(tituloElement);

    // Mensaje
    let msg = document.createElement('div');
    msg.className = 'msg-text';
    msg.style.marginBottom = '1.5rem';
    msg.style.textAlign = 'left';
    msg.innerHTML = mensaje;
    card.appendChild(msg);

    // Botones
    let botonesContainer = document.createElement('div');
    botonesContainer.style.display = 'flex';
    botonesContainer.style.gap = '1rem';
    botonesContainer.style.justifyContent = 'flex-end';

    // Botón Cancelar
    let btnCancelar = document.createElement('button');
    btnCancelar.className = 'btn-modal-cancel';
    btnCancelar.textContent = 'Cancelar';
    btnCancelar.style.margin = '0';
    btnCancelar.onclick = () => {
        overlay.remove();
        if (onCancel) onCancel();
    };
    botonesContainer.appendChild(btnCancelar);

    // Botón Confirmar
    let btnConfirmar = document.createElement('button');
    btnConfirmar.className = 'btn-modal-save';
    btnConfirmar.textContent = 'Confirmar';
    btnConfirmar.style.margin = '0';
    btnConfirmar.onclick = () => {
        overlay.remove();
        if (onConfirm) onConfirm();
    };
    botonesContainer.appendChild(btnConfirmar);

    card.appendChild(botonesContainer);
    overlay.appendChild(card);
    
    // Cerrar al hacer clic fuera de la card
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            overlay.remove();
            if (onCancel) onCancel();
        }
    });

    // Prevenir que el clic en la card cierre el overlay
    card.addEventListener('click', function(e) {
        e.stopPropagation();
    });
}

// Función para mostrar card de confirmación (general)
function mostrarCardConfirmacion(titulo, mensaje, onConfirm, onCancel) {
    // Eliminar overlay existente si hay uno
    let existingOverlay = document.getElementById('overlay-confirmacion');
    if (existingOverlay) {
        existingOverlay.remove();
    }
    
    // Crear overlay difuminado
    let overlay = document.createElement('div');
    overlay.id = 'overlay-confirmacion';
    overlay.className = 'overlay-blur';
    overlay.style.display = 'flex';
    overlay.style.zIndex = '10000001'; // Asegurar que esté por encima del modal de editar (z-index: 1000000)
    document.body.appendChild(overlay);
    
    // Crear card
    let card = document.createElement('div');
    card.className = 'msg-card confirmacion-card';
    card.style.maxWidth = '500px';
    card.style.width = '90%';

    // Título
    let tituloElement = document.createElement('div');
    tituloElement.className = 'msg-title';
    tituloElement.style.fontSize = '1.25rem';
    tituloElement.style.fontWeight = '600';
    tituloElement.style.marginBottom = '1rem';
    tituloElement.style.color = '#2c3e50';
    tituloElement.innerHTML = `<i class="fas fa-question-circle" style="color: #f39c12; margin-right: 0.5rem;"></i>${titulo}`;
    card.appendChild(tituloElement);

    // Mensaje
    let msg = document.createElement('div');
    msg.className = 'msg-text';
    msg.style.marginBottom = '1.5rem';
    msg.style.textAlign = 'left';
    msg.innerHTML = mensaje;
    card.appendChild(msg);

    // Botones
    let botonesContainer = document.createElement('div');
    botonesContainer.style.display = 'flex';
    botonesContainer.style.gap = '1rem';
    botonesContainer.style.justifyContent = 'flex-end';

    // Botón Cancelar
    let btnCancelar = document.createElement('button');
    btnCancelar.className = 'btn-modal-cancel';
    btnCancelar.textContent = 'Cancelar';
    btnCancelar.style.margin = '0';
    btnCancelar.onclick = () => {
        overlay.remove();
        if (onCancel) onCancel();
    };
    botonesContainer.appendChild(btnCancelar);

    // Botón Confirmar
    let btnConfirmar = document.createElement('button');
    btnConfirmar.className = 'btn-modal-save';
    btnConfirmar.textContent = 'Confirmar';
    btnConfirmar.style.margin = '0';
    btnConfirmar.onclick = () => {
        overlay.remove();
        if (onConfirm) onConfirm();
    };
    botonesContainer.appendChild(btnConfirmar);

    card.appendChild(botonesContainer);
    overlay.appendChild(card);
    
    // Cerrar al hacer clic fuera de la card
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            overlay.remove();
            if (onCancel) onCancel();
        }
    });

    // Prevenir que el clic en la card cierre el overlay
    card.addEventListener('click', function(e) {
        e.stopPropagation();
    });
}

// Función para escapar HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Dar de baja item de inventario (desde modal editar espacio)
async function darBajaItemInventarioEquipamiento(id_inventario, id_oficina) {
    // Obtener datos del item actual
    const response = await fetch(getAppBasePath() + '/config/Gestionespacios.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            action: 'obtener_item_inventario',
            id_inventario: id_inventario
        })
    });
    
    const result = await response.json();
    
    if (result.success) {
        const item = result.data;
        mostrarModalBajaItemEquipamiento(id_inventario, item, id_oficina);
    } else {
        mostrarCardEmergente(false, 'Error al obtener datos del item');
    }
}

// Mostrar modal para dar de baja item
function mostrarModalBajaItemEquipamiento(id_inventario, item, id_oficina = null) {
    // Crear modal temporal para dar de baja
    const idOficinaParam = id_oficina !== null ? id_oficina : 'null';
    const modalHTML = `
        <div id="modal-baja-item-equipamiento" class="modal-detalle-overlay" style="display: flex;">
            <div class="modal-detalle-content" style="max-width: 500px;">
                <div class="modal-detalle-header">
                    <h3><i class="fas fa-ban"></i> Dar de Baja Item</h3>
                    <button class="modal-detalle-close" onclick="cerrarModalBajaItemEquipamiento()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-detalle-body">
                    <p><strong>Item:</strong> ${item.codigo_patrimonial || 'Sin código'}</p>
                    <p><strong>Descripción:</strong> ${item.descripcion || 'N/A'}</p>
                    <p style="color: #e74c3c; font-weight: 600; margin-top: 1rem;">
                        <i class="fas fa-exclamation-triangle"></i> ¿Está seguro de que desea dar de baja este item?
                    </p>
                    
                    <div class="form-group-editar" style="margin-top: 1rem;">
                        <label>Motivo de la Baja *</label>
                        <textarea id="baja_motivo_equipamiento" rows="4" placeholder="Ingrese el motivo de la baja..." required></textarea>
                    </div>
                </div>
                <div class="modal-detalle-footer">
                    <button type="button" class="btn-modal-cancel" onclick="cerrarModalBajaItemEquipamiento()">Cancelar</button>
                    <button type="button" class="btn-modal-save" style="background: #e74c3c;" onclick="confirmarBajaItemEquipamiento(${id_inventario}, ${idOficinaParam})">Dar de Baja</button>
                </div>
            </div>
        </div>
    `;
    
    // Remover modal anterior si existe
    const modalAnterior = document.getElementById('modal-baja-item-equipamiento');
    if (modalAnterior) {
        modalAnterior.remove();
    }
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Cerrar modal dar de baja
function cerrarModalBajaItemEquipamiento() {
    const modal = document.getElementById('modal-baja-item-equipamiento');
    if (modal) {
        modal.remove();
    }
}

// Confirmar dar de baja item
async function confirmarBajaItemEquipamiento(id_inventario, id_oficina = null) {
    const motivo = document.getElementById('baja_motivo_equipamiento')?.value || '';
    
    if (!motivo.trim()) {
        mostrarCardEmergente(false, 'Debe ingresar un motivo para la baja');
        return;
    }
    
    try {
        const usuarioLogueado = JSON.parse(sessionStorage.getItem('usuario_logueado') || '{}');
        const id_usuario_responsable = usuarioLogueado.id_usuario;
        
        if (!id_usuario_responsable) {
            mostrarCardEmergente(false, 'No se pudo identificar al usuario responsable');
            return;
        }
        
        const bodyData = {
            action: 'dar_baja_item',
            id_inventario: id_inventario,
            motivo: motivo.trim(),
            id_usuario_responsable: id_usuario_responsable
        };
        
        // Solo agregar id_oficina si existe (cuando viene del modal de editar)
        if (id_oficina !== null && id_oficina !== 'null') {
            bodyData.id_oficina = id_oficina;
        }
        
        const response = await fetch(getAppBasePath() + '/config/Gestionespacios.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bodyData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            mostrarCardEmergente(true, 'Item dado de baja correctamente');
            cerrarModalBajaItemEquipamiento();
            
            // Recargar el modal de edición si está abierto
            const id_oficina_input = document.getElementById('editar_id_oficina_equipamiento');
            if (id_oficina_input) {
                editarEspacioEquipamiento(parseInt(id_oficina_input.value));
            }
            
            // Actualizar la tabla de espacios (mantener página actual)
            cargarEspaciosEquipamiento(paginaActualEquipamiento);
        } else {
            mostrarCardEmergente(false, result.message || 'Error al dar de baja el item');
        }
    } catch (error) {
        console.error('Error al dar de baja item:', error);
        mostrarCardEmergente(false, 'Error al dar de baja el item');
    }
}

// Mover item de inventario
async function moverItemInventarioEquipamiento(id_inventario, id_oficina_actual) {
    // Obtener datos del item actual
    const response = await fetch(getAppBasePath() + '/config/Gestionespacios.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            action: 'obtener_item_inventario',
            id_inventario: id_inventario
        })
    });
    
    const result = await response.json();
    
    if (result.success) {
        const item = result.data;
        mostrarModalMoverItemEquipamiento(id_inventario, item, id_oficina_actual);
    } else {
        mostrarCardEmergente(false, 'Error al obtener datos del item');
    }
}

// Mostrar modal para mover item
function mostrarModalMoverItemEquipamiento(id_inventario, item, id_oficina_actual) {
    // Crear modal temporal para mover item
    const modalHTML = `
        <div id="modal-mover-item-equipamiento" class="modal-detalle-overlay" style="display: flex;">
            <div class="modal-detalle-content" style="max-width: 500px;">
                <div class="modal-detalle-header">
                    <h3><i class="fas fa-exchange-alt"></i> Mover Item</h3>
                    <button class="modal-detalle-close" onclick="cerrarModalMoverItemEquipamiento()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-detalle-body">
                    <p><strong>Item:</strong> ${item.codigo_patrimonial || 'Sin código'}</p>
                    <p><strong>Descripción:</strong> ${item.descripcion || 'N/A'}</p>
                    <p><strong>Ubicación Actual:</strong> ${item.ubicacion || 'Sin asignar'}</p>
                    
                    <div class="form-group-editar" style="margin-top: 1rem;">
                        <label><i class="fas fa-building"></i> Seleccionar Oficina o Seccion Destino</label>
                        <select id="mover_oficina_general_equipamiento" onchange="seleccionarOficinaGeneralEquipamiento(this.value)">
                            <option value="">Seleccione una oficina o seccion...</option>
                        </select>
                    </div>
                    
                    <div class="form-group-editar">
                        <label>Motivo del Movimiento</label>
                        <textarea id="mover_motivo_equipamiento" rows="3" placeholder="Ingrese el motivo del movimiento"></textarea>
                    </div>
                </div>
                <div class="modal-detalle-footer">
                    <button type="button" class="btn-modal-cancel" onclick="cerrarModalMoverItemEquipamiento()">Cancelar</button>
                    <button type="button" class="btn-modal-save" onclick="confirmarMoverItemEquipamiento(${id_inventario}, ${id_oficina_actual})">Mover Item</button>
                </div>
            </div>
        </div>
    `;
    
    // Remover modal anterior si existe
    const modalAnterior = document.getElementById('modal-mover-item-equipamiento');
    if (modalAnterior) {
        modalAnterior.remove();
    }
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Guardar id_oficina_actual en el select para usarlo al cargar oficinas
    const select = document.getElementById('mover_oficina_general_equipamiento');
    if (select) {
        select.setAttribute('data-oficina-actual', id_oficina_actual || '');
    }
    
    // Cargar opciones
    cargarOficinasGeneralesEquipamiento();
}

// Seleccionar oficina general
async function seleccionarOficinaGeneralEquipamiento(id_oficina) {
    // Esta función ya no necesita hacer nada especial
    // Solo se usa el select general para seleccionar la oficina
    // Los datos se obtendrán en confirmarMoverItemEquipamiento
}

// Cargar todas las oficinas para el select general
async function cargarOficinasGeneralesEquipamiento() {
    try {
        const response = await fetch(getAppBasePath() + '/config/Gestionespacios.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'listar_espacios'
            })
        });
        
        const result = await response.json();
        const select = document.getElementById('mover_oficina_general_equipamiento');
        
        if (select && result.success && result.data) {
            // Obtener id_oficina_actual del atributo data
            const id_oficina_actual = select.getAttribute('data-oficina-actual');
            
            select.innerHTML = '<option value="">Seleccione una oficina o seccion...</option>';
            result.data.forEach(espacio => {
                // Excluir la oficina o seccion actual
                if (id_oficina_actual && espacio.id_oficina == id_oficina_actual) {
                    return; // Saltar esta oficina o seccion
                }
                
                const option = document.createElement('option');
                option.value = espacio.id_oficina;
                option.textContent = `${espacio.nombre}${espacio.edificio ? ' - ' + espacio.edificio : ''}${espacio.piso ? ' - Piso ' + espacio.piso : ''}`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error al cargar oficinas generales:', error);
    }
}

// Cerrar modal mover item
function cerrarModalMoverItemEquipamiento() {
    const modal = document.getElementById('modal-mover-item-equipamiento');
    if (modal) {
        modal.remove();
    }
}

// Confirmar mover item
async function confirmarMoverItemEquipamiento(id_inventario, id_oficina_actual) {
    // Primero verificar si se seleccionó una oficina general
    const oficina_general = document.getElementById('mover_oficina_general_equipamiento')?.value || null;
    
    let destino_direccion = null;
    let destino_departamento = null;
    let destino_seccion = null;
    let destino_oficina = null;
    
    // Si se seleccionó una oficina general, usar esa oficina
    if (oficina_general) {
        destino_oficina = parseInt(oficina_general);
        // Obtener los datos de la oficina para incluir dirección, departamento y sección
        try {
            const response = await fetch(getAppBasePath() + '/config/Gestionespacios.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'obtener_espacio',
                    id_oficina: oficina_general
                })
            });
            
            const result = await response.json();
            if (result.success && result.data) {
                const oficina = result.data;
                destino_direccion = oficina.id_direccion ? parseInt(oficina.id_direccion) : null;
                destino_departamento = oficina.id_departamento ? parseInt(oficina.id_departamento) : null;
                destino_seccion = oficina.id_seccion ? parseInt(oficina.id_seccion) : null;
            } else {
                console.error('Error al obtener datos de la oficina o seccion:', result.message);
                mostrarCardEmergente(false, 'Error al obtener datos de la oficina o seccion seleccionada');
                return;
            }
        } catch (error) {
            console.error('Error al obtener datos de la oficina o seccion:', error);
            mostrarCardEmergente(false, 'Error al obtener datos de la oficina o seccion seleccionada');
            return;
        }
    } else {
        // Si no se seleccionó oficina o seccion general, no hay destino
        mostrarCardEmergente(false, 'Debe seleccionar una oficina o seccion destino');
        return;
    }
    
    const motivo = document.getElementById('mover_motivo_equipamiento')?.value || '';
    
    // Validar que se haya obtenido correctamente la oficina
    if (!destino_oficina) {
        mostrarCardEmergente(false, 'Error al obtener datos de la oficina o seccion seleccionada');
        return;
    }
    
    try {
        const usuarioLogueado = JSON.parse(sessionStorage.getItem('usuario_logueado') || '{}');
        const id_usuario_responsable = usuarioLogueado.id_usuario;
        
        if (!id_usuario_responsable) {
            mostrarCardEmergente(false, 'No se pudo identificar al usuario responsable');
            return;
        }
        
        const response = await fetch(getAppBasePath() + '/config/Gestionespacios.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'mover_item',
                id_inventario: id_inventario,
                id_oficina_actual: id_oficina_actual,
                destino_direccion: destino_direccion || null,
                destino_departamento: destino_departamento || null,
                destino_seccion: destino_seccion || null,
                destino_oficina: destino_oficina || null,
                motivo: motivo.trim(),
                id_usuario_responsable: id_usuario_responsable
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            mostrarCardEmergente(true, 'Item movido correctamente');
            cerrarModalMoverItemEquipamiento();
            
            // Recargar el modal de edición si está abierto
            const id_oficina_input = document.getElementById('editar_id_oficina_equipamiento');
            if (id_oficina_input) {
                editarEspacioEquipamiento(parseInt(id_oficina_input.value));
            }
            
            // Actualizar la tabla de espacios (mantener página actual)
            cargarEspaciosEquipamiento(paginaActualEquipamiento);
        } else {
            mostrarCardEmergente(false, result.message || 'Error al mover el item');
        }
    } catch (error) {
        console.error('Error al mover item:', error);
        mostrarCardEmergente(false, 'Error al mover el item');
    }
}

// Cargar tipos de bien para edición
async function cargarTiposBienParaEditarEquipamiento() {
    try {
        const response = await fetch(getAppBasePath() + '/config/Registroespacios.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'obtener_tipos_bien'
            })
        });
        
        const result = await response.json();
        
        if (result.success && result.data) {
            window.tiposBienEquipamiento = result.data;
        }
    } catch (error) {
        console.error('Error al cargar tipos de bien:', error);
    }
}

// ============================================
// FUNCIONES PARA CAMBIOS REALIZADOS
// ============================================

// Cargar movimientos pendientes de revisión
async function cargarMovimientos() {
    const loadingState = document.getElementById('movimientos-loading');
    const emptyState = document.getElementById('movimientos-empty');
    const tableContainer = document.getElementById('movimientos-table-container');
    const tbody = document.getElementById('movimientos-tbody');

    if (!loadingState || !emptyState || !tableContainer || !tbody) {
        return;
    }

    try {
        loadingState.style.display = 'flex';
        emptyState.style.display = 'none';
        tableContainer.style.display = 'none';

        const response = await fetch(getAppBasePath() + '/config/Movimientos.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'listar_movimientos_informatica'
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        loadingState.style.display = 'none';

        if (result.success && result.data && result.data.length > 0) {
            tbody.innerHTML = '';
            
            result.data.forEach((movimiento) => {
                const fecha = new Date(movimiento.fecha_movimiento);
                const fechaFormateada = fecha.toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                });

                const tipoMovimientoBadge = getTipoMovimientoBadge(movimiento.tipo_movimiento);
                const codigoEscapado = escapeHtml(movimiento.codigo_patrimonial || 'N/A');

                const marca = escapeHtml(movimiento.marca || 'N/A');
                const modelo = escapeHtml(movimiento.modelo || 'N/A');
                const serie = escapeHtml(movimiento.serie || 'N/A');
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${fechaFormateada}</td>
                    <td><strong>${codigoEscapado}</strong></td>
                    <td>${marca}</td>
                    <td>${modelo}</td>
                    <td>${serie}</td>
                    <td>${tipoMovimientoBadge}</td>
                    <td>${escapeHtml(movimiento.usuario_responsable)}</td>
                    <td>${escapeHtml(movimiento.origen)}</td>
                    <td>${escapeHtml(movimiento.destino)}</td>
                    <td>${escapeHtml(movimiento.motivo || 'Sin motivo')}</td>
                    <td>
                        <button class="btn-accion btn-accion-warning" onclick="deshacerMovimiento(${movimiento.id_movimiento})" title="Deshacer esta acción">
                            <i class="fas fa-undo"></i> Deshacer
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });

            tableContainer.style.display = 'block';
        } else {
            emptyState.style.display = 'flex';
        }
    } catch (error) {
        console.error('Error al cargar movimientos:', error);
        loadingState.style.display = 'none';
        mostrarCardEmergente(false, 'Error al cargar los movimientos. Por favor, intente nuevamente.');
    }
}

// Obtener badge para tipo de movimiento
function getTipoMovimientoBadge(tipo) {
    const tipos = {
        'ALTA': { class: 'badge-success', icon: 'fa-plus-circle', text: 'Alta' },
        'TRASLADO': { class: 'badge-info', icon: 'fa-exchange-alt', text: 'Traslado' },
        'BAJA': { class: 'badge-danger', icon: 'fa-ban', text: 'Baja' },
        'REEMPLAZO': { class: 'badge-warning', icon: 'fa-sync-alt', text: 'Reemplazo' },
        'REASIGNACION': { class: 'badge-primary', icon: 'fa-user-check', text: 'Reasignación' },
        'DESASIGNACION': { class: 'badge-secondary', icon: 'fa-unlink', text: 'Desasignado' }
    };

    const tipoInfo = tipos[tipo] || { class: 'badge-secondary', icon: 'fa-question', text: tipo };
    
    return `<span class="badge ${tipoInfo.class}"><i class="fas ${tipoInfo.icon}"></i> ${tipoInfo.text}</span>`;
}

// ============================================
// FUNCIONES PARA HISTORIAL DE CAMBIOS
// ============================================

// Variable para controlar la paginación del historial
let paginaActualHistorial = 1;

// Cargar historial completo de movimientos
async function cargarHistorialMovimientos(pagina = 1) {
    paginaActualHistorial = pagina;
    
    const loadingState = document.getElementById('historial-loading');
    const emptyState = document.getElementById('historial-empty');
    const tableContainer = document.getElementById('historial-table-container');
    const tbody = document.getElementById('historial-tbody');
    const paginacionContainer = document.getElementById('historial-paginacion-container');

    if (!loadingState || !emptyState || !tableContainer || !tbody) {
        return;
    }

    try {
        loadingState.style.display = 'flex';
        emptyState.style.display = 'none';
        tableContainer.style.display = 'none';
        if (paginacionContainer) paginacionContainer.style.display = 'none';

        const limite = 10;
        const offset = (pagina - 1) * limite;

        // Recopilar filtros
        const filtros = {
            codigo_patrimonial: document.getElementById('filtro_historial_codigo')?.value.trim() || '',
            tipo_movimiento: document.getElementById('filtro_historial_tipo')?.value || '',
            id_usuario: document.getElementById('filtro_historial_usuario')?.value || '',
            fecha: document.getElementById('filtro_historial_fecha')?.value || ''
        };

        const response = await fetch(getAppBasePath() + '/config/Movimientos.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'listar_historial_informatica',
                pagina: pagina,
                limite: limite,
                filtros: filtros
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        loadingState.style.display = 'none';

        if (result.success && result.data && result.data.length > 0) {
            tbody.innerHTML = '';
            
            result.data.forEach((movimiento) => {
                const fecha = new Date(movimiento.fecha_movimiento);
                const fechaFormateada = fecha.toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                });

                const tipoMovimientoBadge = getTipoMovimientoBadge(movimiento.tipo_movimiento);
                const codigoEscapado = escapeHtml(movimiento.codigo_patrimonial || 'N/A');

                const marca = escapeHtml(movimiento.marca || 'N/A');
                const modelo = escapeHtml(movimiento.modelo || 'N/A');
                const serie = escapeHtml(movimiento.serie || 'N/A');
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${fechaFormateada}</td>
                    <td><strong>${codigoEscapado}</strong></td>
                    <td>${marca}</td>
                    <td>${modelo}</td>
                    <td>${serie}</td>
                    <td>${tipoMovimientoBadge}</td>
                    <td>${escapeHtml(movimiento.usuario_responsable)}</td>
                    <td>${escapeHtml(movimiento.origen)}</td>
                    <td>${escapeHtml(movimiento.destino)}</td>
                    <td>${escapeHtml(movimiento.motivo || 'Sin motivo')}</td>
                `;
                tbody.appendChild(row);
            });

            tableContainer.style.display = 'block';
            
            // Actualizar paginación si existe
            if (result.paginacion && paginacionContainer) {
                actualizarPaginacionHistorial(result.paginacion);
                paginacionContainer.style.display = 'flex';
            }
        } else {
            emptyState.style.display = 'flex';
        }
    } catch (error) {
        console.error('Error al cargar historial:', error);
        loadingState.style.display = 'none';
        mostrarCardEmergente(false, 'Error al cargar el historial. Por favor, intente nuevamente.');
    }
}

// Cambiar página del historial
function cambiarPaginaHistorial(direccion) {
    const nuevaPagina = paginaActualHistorial + direccion;
    if (nuevaPagina >= 1) {
        cargarHistorialMovimientos(nuevaPagina);
    }
}

// Ir a página específica del historial
function irAPaginaHistorial(pagina) {
    if (pagina >= 1) {
        cargarHistorialMovimientos(pagina);
    }
}

// Actualizar controles de paginación del historial
function actualizarPaginacionHistorial(paginacion) {
    const infoTexto = document.getElementById('historial-paginacion-info-texto');
    const btnAnterior = document.getElementById('historial-btn-pagina-anterior');
    const btnSiguiente = document.getElementById('historial-btn-pagina-siguiente');
    const numerosContainer = document.getElementById('historial-paginacion-numeros');
    
    if (!infoTexto || !btnAnterior || !btnSiguiente || !numerosContainer) {
        return;
    }
    
    // Actualizar texto de información
    infoTexto.textContent = `Página ${paginacion.pagina_actual} de ${paginacion.total_paginas}`;
    
    // Habilitar/deshabilitar botones
    btnAnterior.disabled = !paginacion.tiene_anterior;
    btnSiguiente.disabled = !paginacion.tiene_siguiente;
    
    // Generar números de página
    numerosContainer.innerHTML = '';
    const totalPaginas = paginacion.total_paginas;
    const paginaActual = paginacion.pagina_actual;
    
    // Mostrar máximo 5 números de página alrededor de la actual
    let inicio = Math.max(1, paginaActual - 2);
    let fin = Math.min(totalPaginas, paginaActual + 2);
    
    // Ajustar si estamos cerca del inicio o del final
    if (fin - inicio < 4) {
        if (inicio === 1) {
            fin = Math.min(totalPaginas, inicio + 4);
        } else if (fin === totalPaginas) {
            inicio = Math.max(1, fin - 4);
        }
    }
    
    for (let i = inicio; i <= fin; i++) {
        const btn = document.createElement('button');
        btn.className = 'btn-pagina-numero';
        if (i === paginaActual) {
            btn.classList.add('active');
        }
        btn.textContent = i;
        btn.onclick = () => irAPaginaHistorial(i);
        numerosContainer.appendChild(btn);
    }
}

// Cargar usuarios para el filtro de historial (solo los que tienen movimientos)
async function cargarUsuariosFiltroHistorial() {
    const selectUsuario = document.getElementById('filtro_historial_usuario');
    if (!selectUsuario) return;

    try {
        const response = await fetch(getAppBasePath() + '/config/Movimientos.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'obtener_usuarios_responsables_informatica'
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success && result.data) {
            selectUsuario.innerHTML = '<option value="">Todos los usuarios</option>';
            result.data.forEach(usuario => {
                const option = document.createElement('option');
                option.value = usuario.id_usuario;
                option.textContent = `${usuario.nombres} ${usuario.apellidos}${usuario.cargo ? ' (' + usuario.cargo + ')' : ''}`;
                selectUsuario.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error al cargar usuarios para filtro:', error);
    }
}

// Aplicar filtros de historial
function aplicarFiltrosHistorial() {
    cargarHistorialMovimientos(1);
}

// Limpiar filtros de historial
// Cargar reportes recibidos
async function cargarReportesRecibidos() {
    const loadingState = document.getElementById('reportes-recibidos-loading');
    const emptyState = document.getElementById('reportes-recibidos-empty');
    const gridContainer = document.getElementById('reportes-recibidos-grid');
    
    if (!loadingState || !emptyState || !gridContainer) return;
    
    loadingState.style.display = 'flex';
    emptyState.style.display = 'none';
    gridContainer.style.display = 'none';
    
    try {
        const response = await fetch(getAppBasePath() + '/config/Reportes.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'listar_reportes_recibidos',
                tipo_incidencia: 'Informática',
                filtro_estado: 'pendiente'
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        loadingState.style.display = 'none';
        
        if (result.success && result.data && result.data.length > 0) {
            gridContainer.innerHTML = '';
            
            result.data.forEach((reporte) => {
                const fechaReporte = new Date(reporte.fecha_reporte);
                const fechaReporteFormateada = fechaReporte.toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
                const fechaSolucionFormateada = reporte.fecha_solucion 
                    ? new Date(reporte.fecha_solucion).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                    })
                    : null;
                
                const estadoBadge = reporte.resuelto 
                    ? '<span class="estado-badge estado-resuelto"><i class="fas fa-check-circle"></i> Resuelto</span>'
                    : '<span class="estado-badge estado-pendiente"><i class="fas fa-clock"></i> Pendiente</span>';
                
                const ubicacion = [
                    reporte.direccion_nombre,
                    reporte.departamento_nombre,
                    reporte.seccion_nombre,
                    reporte.oficina_nombre
                ].filter(Boolean).join(' / ') || 'No especificada';
                
                const ubicacionCompleta = [
                    ubicacion,
                    reporte.oficina_piso ? `Piso ${reporte.oficina_piso}` : null,
                    reporte.oficina_ubicacion_interna || null
                ].filter(Boolean).join(' - ') || ubicacion;
                
                const itemInfo = reporte.codigo_patrimonial 
                    ? `${reporte.codigo_patrimonial} - ${reporte.item_descripcion || 'N/A'}`
                    : 'No especificado';
                
                const usuarioReporta = reporte.usuario_reporta_nombres && reporte.usuario_reporta_apellidos
                    ? `${reporte.usuario_reporta_nombres} ${reporte.usuario_reporta_apellidos}${reporte.usuario_reporta_cargo ? ' - ' + reporte.usuario_reporta_cargo : ''}`
                    : 'Usuario desconocido';
                
                const tecnicoInfo = reporte.tecnico_nombres && reporte.tecnico_apellidos
                    ? `${reporte.tecnico_nombres} ${reporte.tecnico_apellidos}${reporte.tecnico_cargo ? ' - ' + reporte.tecnico_cargo : ''}`
                    : 'No asignado';
                
                const card = document.createElement('div');
                card.className = 'reporte-card';
                card.innerHTML = `
                    <div class="reporte-header">
                        <div class="reporte-header-left">
                            <h3>
                                <i class="fas fa-file-alt"></i>
                                Reporte #${reporte.id_incidencia}
                            </h3>
                            ${estadoBadge}
                        </div>
                        <div class="reporte-header-right">
                            <div class="reporte-fecha">
                                <i class="fas fa-calendar"></i>
                                ${fechaReporteFormateada}
                            </div>
                        </div>
                    </div>
                    
                    <div class="reporte-body">
                        <div class="reporte-info-row">
                            <div class="reporte-info-item">
                                <i class="fas fa-user"></i>
                                <strong>Reportado por:</strong> ${escapeHtml(usuarioReporta)}
                            </div>
                            <div class="reporte-info-item">
                                <i class="fas fa-map-marker-alt"></i>
                                <strong>Ubicación:</strong> ${escapeHtml(ubicacionCompleta)}
                            </div>
                        </div>
                        
                        <div class="reporte-info-row">
                            <div class="reporte-info-item">
                                <i class="fas fa-box"></i>
                                <strong>Item:</strong> ${escapeHtml(itemInfo)}
                            </div>
                        </div>
                        
                        <div class="reporte-descripcion">
                            <strong><i class="fas fa-comment"></i> Descripción del Reporte:</strong>
                            <p>${escapeHtml(reporte.descripcion_reporte)}</p>
                        </div>
                        
                        ${reporte.resuelto && reporte.descripcion_solucion ? `
                            <div class="reporte-respuesta">
                                <div class="reporte-respuesta-header">
                                    <strong><i class="fas fa-reply"></i> Respuesta:</strong>
                                    ${fechaSolucionFormateada ? `<span class="reporte-respuesta-fecha"><i class="fas fa-calendar"></i> ${fechaSolucionFormateada}</span>` : ''}
                                </div>
                                <div class="reporte-respuesta-body">
                                    <p>${escapeHtml(reporte.descripcion_solucion)}</p>
                                    ${reporte.resultado ? `<div class="reporte-resultado"><strong>Resultado:</strong> ${escapeHtml(reporte.resultado)}</div>` : ''}
                                    ${(reporte.oficina_piso || reporte.oficina_ubicacion_interna) ? `
                                        <div class="reporte-ubicacion-detalle">
                                            <i class="fas fa-building"></i>
                                            <strong>Oficina:</strong>
                                            ${reporte.oficina_piso ? `<span>Piso ${escapeHtml(reporte.oficina_piso)}</span>` : ''}
                                            ${reporte.oficina_piso && reporte.oficina_ubicacion_interna ? ' - ' : ''}
                                            ${reporte.oficina_ubicacion_interna ? `<span>${escapeHtml(reporte.oficina_ubicacion_interna)}</span>` : ''}
                                        </div>
                                    ` : ''}
                                    <div class="reporte-tecnico">
                                        <i class="fas fa-user-cog"></i>
                                        <strong>Técnico:</strong> ${escapeHtml(tecnicoInfo)}
                                    </div>
                                </div>
                            </div>
                        ` : `
                            <div class="reporte-acciones">
                                <button class="btn-responder-reporte" onclick="abrirModalResponderReporte(${reporte.id_incidencia})">
                                    <i class="fas fa-reply"></i> Responder Reporte
                                </button>
                            </div>
                        `}
                    </div>
                `;
                
                gridContainer.appendChild(card);
            });
            
            gridContainer.style.display = 'grid';
        } else {
            emptyState.style.display = 'flex';
        }
    } catch (error) {
        console.error('Error al cargar reportes recibidos:', error);
        loadingState.style.display = 'none';
        emptyState.style.display = 'flex';
        emptyState.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <p>Error al cargar los reportes. Por favor, recarga la página.</p>
            <small style="margin-top: 0.5rem; color: #999;">${error.message}</small>
        `;
    }
}

// Abrir modal para responder reporte
async function abrirModalResponderReporte(idIncidencia, esActualizacion = false) {
    // Obtener ID del usuario actual
    let idUsuario = null;
    try {
        const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
        if (usuarioLogueado) {
            const usuario = JSON.parse(usuarioLogueado);
            idUsuario = usuario.id_usuario;
        }
    } catch (e) {
        console.error('Error al obtener usuario:', e);
        mostrarCardEmergente(false, 'Error al obtener datos del usuario');
        return;
    }
    
    if (!idUsuario) {
        mostrarCardEmergente(false, 'No se pudo obtener el usuario');
        return;
    }
    
    // Obtener datos del reporte si es actualización
    let descripcionSolucionActual = '';
    let resultadoActual = '';
    
    if (esActualizacion) {
        try {
            const response = await fetch(getAppBasePath() + '/config/Reportes.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'obtener_reporte',
                    id_incidencia: idIncidencia
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data) {
                    descripcionSolucionActual = result.data.descripcion_solucion || '';
                    resultadoActual = result.data.resultado || '';
                }
            }
        } catch (error) {
            console.error('Error al obtener datos del reporte:', error);
        }
    }
    
    // Crear modal
    let existingModal = document.getElementById('modal-responder-reporte');
    if (existingModal) {
        existingModal.remove();
    }
    
    let overlay = document.createElement('div');
    overlay.id = 'modal-responder-reporte';
    overlay.className = 'overlay-blur';
    overlay.style.display = 'flex';
    document.body.appendChild(overlay);
    
    let modal = document.createElement('div');
    modal.className = 'modal-content';
    modal.style.maxWidth = '700px';
    modal.style.width = '90%';
    
    modal.innerHTML = `
        <div class="modal-header">
            <h3><i class="fas fa-reply"></i> ${esActualizacion ? 'Actualizar Respuesta' : 'Responder Reporte'}</h3>
            <button class="close-modal" onclick="cerrarModalResponderReporte()">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="modal-body">
            <form id="formResponderReporte" onsubmit="responderReporte(event, ${idIncidencia}, ${idUsuario}, ${esActualizacion})">
                <div class="form-group">
                    <label for="descripcion_solucion">Descripción de la Solución *</label>
                    <textarea id="descripcion_solucion" name="descripcion_solucion" rows="6" required placeholder="Describe detalladamente la solución aplicada...">${escapeHtml(descripcionSolucionActual)}</textarea>
                </div>
                <div class="form-group">
                    <label for="resultado">Resultado (Opcional)</label>
                    <input type="text" id="resultado" name="resultado" placeholder="Ej: Solucionado, En proceso, Requiere seguimiento..." value="${escapeHtml(resultadoActual)}">
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn-modal-cancel" onclick="cerrarModalResponderReporte()">
                        <i class="fas fa-times"></i> Cancelar
                    </button>
                    <button type="submit" class="btn-modal-save">
                        <i class="fas fa-paper-plane"></i> ${esActualizacion ? 'Actualizar Respuesta' : 'Enviar Respuesta'}
                    </button>
                </div>
            </form>
        </div>
    `;
    
    overlay.appendChild(modal);
    
    // Cerrar al hacer clic fuera del modal
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            cerrarModalResponderReporte();
        }
    });
    
    // Prevenir que el clic en el modal lo cierre
    modal.addEventListener('click', function(e) {
        e.stopPropagation();
    });
}

// Cerrar modal de responder reporte
function cerrarModalResponderReporte() {
    const modal = document.getElementById('modal-responder-reporte');
    if (modal) {
        modal.remove();
    }
}

// Responder reporte
async function responderReporte(event, idIncidencia, idUsuario, esActualizacion = false) {
    event.preventDefault();
    
    const form = document.getElementById('formResponderReporte');
    const formData = new FormData(form);
    
    const data = {
        action: 'responder_reporte',
        id_incidencia: idIncidencia,
        id_usuario_tecnico: idUsuario,
        descripcion_solucion: formData.get('descripcion_solucion'),
        resultado: formData.get('resultado') || null
    };
    
    try {
        const response = await fetch(getAppBasePath() + '/config/Reportes.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            mostrarCardEmergente(true, esActualizacion ? 'Respuesta actualizada correctamente' : 'Reporte respondido correctamente');
            cerrarModalResponderReporte();
            // Recargar la lista de reportes según desde dónde se llamó
            const container = document.querySelector('.container');
            if (container) {
                const contenido = container.innerHTML;
                if (contenido.includes('historial-reportes-container')) {
                    cargarHistorialReportes();
                } else {
                    cargarReportesRecibidos();
                }
            }
        } else {
            mostrarCardEmergente(false, result.message || 'Error al responder el reporte');
        }
    } catch (error) {
        console.error('Error al responder reporte:', error);
        mostrarCardEmergente(false, 'Error al responder el reporte. Por favor, intente nuevamente.');
    }
}

// Cargar historial de reportes (solo resueltos)
// Variable para controlar la paginación del historial de reportes
let paginaActualHistorialReportes = 1;

async function cargarHistorialReportes(pagina = 1) {
    paginaActualHistorialReportes = pagina;
    
    const loadingState = document.getElementById('historial-reportes-loading');
    const emptyState = document.getElementById('historial-reportes-empty');
    const gridContainer = document.getElementById('historial-reportes-grid');
    const paginacionContainer = document.getElementById('historial-reportes-paginacion-container');
    
    if (!loadingState || !emptyState || !gridContainer) return;
    
    // Obtener valores de los filtros
    const filtros = {
        usuario: document.getElementById('filtro_historial_reporte_usuario')?.value || '',
        oficina: document.getElementById('filtro_historial_reporte_oficina')?.value || '',
        fecha_reporte: document.getElementById('filtro_historial_reporte_fecha')?.value || '',
        fecha_solucion: document.getElementById('filtro_historial_reporte_fecha_solucion')?.value || ''
    };
    
    loadingState.style.display = 'flex';
    emptyState.style.display = 'none';
    gridContainer.style.display = 'none';
    if (paginacionContainer) paginacionContainer.style.display = 'none';
    
    const limite = 3; // Mostrar 3 reportes por página
    
    try {
        const response = await fetch(getAppBasePath() + '/config/Reportes.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'listar_reportes_recibidos',
                tipo_incidencia: 'Informática',
                filtro_estado: 'resuelto',
                filtros: filtros,
                pagina: pagina,
                limite: limite
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        loadingState.style.display = 'none';
        
        if (result.success && result.data && result.data.length > 0) {
            gridContainer.innerHTML = '';
            
            result.data.forEach((reporte) => {
                const fechaReporte = new Date(reporte.fecha_reporte);
                const fechaReporteFormateada = fechaReporte.toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
                const fechaSolucionFormateada = reporte.fecha_solucion 
                    ? new Date(reporte.fecha_solucion).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                    })
                    : null;
                
                const estadoBadge = '<span class="estado-badge estado-resuelto"><i class="fas fa-check-circle"></i> Resuelto</span>';
                
                const ubicacion = [
                    reporte.direccion_nombre,
                    reporte.departamento_nombre,
                    reporte.seccion_nombre,
                    reporte.oficina_nombre
                ].filter(Boolean).join(' / ') || 'No especificada';
                
                const ubicacionCompleta = [
                    ubicacion,
                    reporte.oficina_piso ? `Piso ${reporte.oficina_piso}` : null,
                    reporte.oficina_ubicacion_interna || null
                ].filter(Boolean).join(' - ') || ubicacion;
                
                const itemInfo = reporte.codigo_patrimonial 
                    ? `${reporte.codigo_patrimonial} - ${reporte.item_descripcion || 'N/A'}`
                    : 'No especificado';
                
                const usuarioReporta = reporte.usuario_reporta_nombres && reporte.usuario_reporta_apellidos
                    ? `${reporte.usuario_reporta_nombres} ${reporte.usuario_reporta_apellidos}${reporte.usuario_reporta_cargo ? ' - ' + reporte.usuario_reporta_cargo : ''}`
                    : 'Usuario desconocido';
                
                const tecnicoInfo = reporte.tecnico_nombres && reporte.tecnico_apellidos
                    ? `${reporte.tecnico_nombres} ${reporte.tecnico_apellidos}${reporte.tecnico_cargo ? ' - ' + reporte.tecnico_cargo : ''}`
                    : 'No asignado';
                
                const card = document.createElement('div');
                card.className = 'reporte-card';
                card.innerHTML = `
                    <div class="reporte-header">
                        <div class="reporte-header-left">
                            <h3>
                                <i class="fas fa-file-alt"></i>
                                Reporte #${reporte.id_incidencia}
                            </h3>
                            ${estadoBadge}
                        </div>
                        <div class="reporte-header-right">
                            <div class="reporte-fecha">
                                <i class="fas fa-calendar"></i>
                                ${fechaReporteFormateada}
                            </div>
                        </div>
                    </div>
                    
                    <div class="reporte-body">
                        <div class="reporte-info-row">
                            <div class="reporte-info-item">
                                <i class="fas fa-user"></i>
                                <strong>Reportado por:</strong> ${escapeHtml(usuarioReporta)}
                            </div>
                            <div class="reporte-info-item">
                                <i class="fas fa-map-marker-alt"></i>
                                <strong>Ubicación:</strong> ${escapeHtml(ubicacionCompleta)}
                            </div>
                        </div>
                        
                        <div class="reporte-info-row">
                            <div class="reporte-info-item">
                                <i class="fas fa-box"></i>
                                <strong>Item:</strong> ${escapeHtml(itemInfo)}
                            </div>
                        </div>
                        
                        <div class="reporte-descripcion">
                            <strong><i class="fas fa-comment"></i> Descripción del Reporte:</strong>
                            <p>${escapeHtml(reporte.descripcion_reporte)}</p>
                        </div>
                        
                        <div class="reporte-respuesta">
                            <div class="reporte-respuesta-header">
                                <strong><i class="fas fa-reply"></i> Respuesta:</strong>
                                ${fechaSolucionFormateada ? `<span class="reporte-respuesta-fecha"><i class="fas fa-calendar"></i> ${fechaSolucionFormateada}</span>` : ''}
                            </div>
                            <div class="reporte-respuesta-body">
                                <p>${escapeHtml(reporte.descripcion_solucion)}</p>
                                ${reporte.resultado ? `<div class="reporte-resultado"><strong>Resultado:</strong> ${escapeHtml(reporte.resultado)}</div>` : ''}
                                ${(reporte.oficina_piso || reporte.oficina_ubicacion_interna) ? `
                                    <div class="reporte-ubicacion-detalle">
                                        <i class="fas fa-building"></i>
                                        <strong>Oficina:</strong>
                                        ${reporte.oficina_piso ? `<span>Piso ${escapeHtml(reporte.oficina_piso)}</span>` : ''}
                                        ${reporte.oficina_piso && reporte.oficina_ubicacion_interna ? ' - ' : ''}
                                        ${reporte.oficina_ubicacion_interna ? `<span>${escapeHtml(reporte.oficina_ubicacion_interna)}</span>` : ''}
                                    </div>
                                ` : ''}
                                <div class="reporte-tecnico">
                                    <i class="fas fa-user-cog"></i>
                                    <strong>Técnico:</strong> ${escapeHtml(tecnicoInfo)}
                                </div>
                            </div>
                        </div>
                        
                        <div class="reporte-acciones">
                            <button class="btn-responder-reporte" onclick="abrirModalResponderReporte(${reporte.id_incidencia}, true)">
                                <i class="fas fa-edit"></i> ${reporte.resuelto ? 'Actualizar Respuesta' : 'Responder Reporte'}
                            </button>
                        </div>
                    </div>
                `;
                
                gridContainer.appendChild(card);
            });
            
            gridContainer.style.display = 'grid';
            
            // Actualizar paginación si existe
            if (result.paginacion && paginacionContainer) {
                actualizarPaginacionHistorialReportes(result.paginacion);
                paginacionContainer.style.display = 'flex';
            }
        } else {
            emptyState.style.display = 'flex';
        }
    } catch (error) {
        console.error('Error al cargar historial de reportes:', error);
        loadingState.style.display = 'none';
        emptyState.style.display = 'flex';
        emptyState.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <p>Error al cargar el historial. Por favor, recarga la página.</p>
            <small style="margin-top: 0.5rem; color: #999;">${error.message}</small>
        `;
    }
}

// Cambiar página del historial de reportes
function cambiarPaginaHistorialReportes(direccion) {
    const nuevaPagina = paginaActualHistorialReportes + direccion;
    if (nuevaPagina >= 1) {
        cargarHistorialReportes(nuevaPagina);
    }
}

// Ir a página específica del historial de reportes
function irAPaginaHistorialReportes(pagina) {
    if (pagina >= 1) {
        cargarHistorialReportes(pagina);
    }
}

// Actualizar controles de paginación del historial de reportes
function actualizarPaginacionHistorialReportes(paginacion) {
    const infoTexto = document.getElementById('historial-reportes-paginacion-info-texto');
    const btnAnterior = document.getElementById('historial-reportes-btn-pagina-anterior');
    const btnSiguiente = document.getElementById('historial-reportes-btn-pagina-siguiente');
    const numerosContainer = document.getElementById('historial-reportes-paginacion-numeros');
    
    if (!infoTexto || !btnAnterior || !btnSiguiente || !numerosContainer) {
        return;
    }
    
    // Actualizar texto de información
    infoTexto.textContent = `Página ${paginacion.pagina_actual} de ${paginacion.total_paginas}`;
    
    // Habilitar/deshabilitar botones
    btnAnterior.disabled = !paginacion.tiene_anterior;
    btnSiguiente.disabled = !paginacion.tiene_siguiente;
    
    // Generar números de página
    numerosContainer.innerHTML = '';
    const totalPaginas = paginacion.total_paginas;
    const paginaActual = paginacion.pagina_actual;
    
    // Mostrar máximo 5 números de página alrededor de la actual
    let inicio = Math.max(1, paginaActual - 2);
    let fin = Math.min(totalPaginas, paginaActual + 2);
    
    // Ajustar si estamos cerca del inicio o final
    if (fin - inicio < 4) {
        if (inicio === 1) {
            fin = Math.min(5, totalPaginas);
        } else if (fin === totalPaginas) {
            inicio = Math.max(1, totalPaginas - 4);
        }
    }
    
    // Primera página
    if (inicio > 1) {
        const btn = document.createElement('button');
        btn.className = 'btn-pagina-numero';
        btn.textContent = '1';
        btn.onclick = () => irAPaginaHistorialReportes(1);
        numerosContainer.appendChild(btn);
        
        if (inicio > 2) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'paginacion-ellipsis';
            ellipsis.textContent = '...';
            numerosContainer.appendChild(ellipsis);
        }
    }
    
    // Números de página
    for (let i = inicio; i <= fin; i++) {
        const btn = document.createElement('button');
        btn.className = 'btn-pagina-numero';
        if (i === paginaActual) {
            btn.classList.add('active');
        }
        btn.textContent = i;
        btn.onclick = () => irAPaginaHistorialReportes(i);
        numerosContainer.appendChild(btn);
    }
    
    // Última página
    if (fin < totalPaginas) {
        if (fin < totalPaginas - 1) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'paginacion-ellipsis';
            ellipsis.textContent = '...';
            numerosContainer.appendChild(ellipsis);
        }
        
        const btn = document.createElement('button');
        btn.className = 'btn-pagina-numero';
        btn.textContent = totalPaginas;
        btn.onclick = () => irAPaginaHistorialReportes(totalPaginas);
        numerosContainer.appendChild(btn);
    }
}

// Aplicar filtros de historial de reportes
function aplicarFiltrosHistorialReportes() {
    cargarHistorialReportes(1);
}

// Exportar historial de reportes a PDF
async function exportarHistorialReportesPDF() {
    try {
        // Recopilar filtros actuales
        const filtros = {
            usuario: document.getElementById('filtro_historial_reporte_usuario')?.value || '',
            oficina: document.getElementById('filtro_historial_reporte_oficina')?.value || '',
            fecha_reporte: document.getElementById('filtro_historial_reporte_fecha')?.value || '',
            fecha_solucion: document.getElementById('filtro_historial_reporte_fecha_solucion')?.value || ''
        };

        // Obtener todos los reportes sin paginación (respetando los filtros aplicados)
        const response = await fetch(getAppBasePath() + '/config/Reportes.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'listar_reportes_recibidos',
                tipo_incidencia: 'Informática',
                filtro_estado: 'resuelto',
                filtros: filtros,
                pagina: 1,
                limite: 10000 // Número muy alto para obtener todos
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (!result.success || !result.data || result.data.length === 0) {
            mostrarCardEmergente(false, 'No hay reportes para exportar');
            return;
        }
        
        // Crear PDF usando jsPDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('portrait', 'mm', 'a4');
        
        // Configuración de colores
        const colorAzul = [25, 118, 210];
        const colorGris = [128, 128, 128];
        
        // Agregar logo en la esquina superior derecha
        const logoPath = getAppBasePath() + '/images/muni.png';
        try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = logoPath;
            
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = () => resolve();
                setTimeout(resolve, 1000);
            });
            
            if (img.complete && img.naturalWidth > 0) {
                const logoWidth = 30;
                const logoHeight = (img.naturalHeight / img.naturalWidth) * logoWidth;
                doc.addImage(img, 'PNG', doc.internal.pageSize.getWidth() - 40, 10, logoWidth, logoHeight);
            }
        } catch (e) {
            console.warn('No se pudo cargar el logo:', e);
        }
        
        // Título del documento
        doc.setFontSize(18);
        doc.setTextColor(...colorAzul);
        doc.setFont('helvetica', 'bold');
        doc.text('HISTORIAL DE REPORTES', 20, 20);
        
        // Fecha
        const fecha = new Date();
        const fechaFormateada = fecha.toLocaleDateString('es-ES', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        doc.setFontSize(10);
        doc.setTextColor(...colorGris);
        doc.setFont('helvetica', 'normal');
        doc.text(`Fecha de generación: ${fechaFormateada}`, 20, 30);
        
        // Total de reportes
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colorAzul);
        doc.text(`Total de reportes: ${result.data.length}`, 20, 37);
        
        let yPos = 50;
        const pageHeight = doc.internal.pageSize.getHeight();
        const marginBottom = 20;
        const maxY = pageHeight - marginBottom;
        
        // Función auxiliar para verificar y agregar nueva página si es necesario
        const checkPageBreak = (requiredSpace) => {
            if (yPos + requiredSpace > maxY) {
                doc.addPage();
                yPos = 20;
                return true;
            }
            return false;
        };
        
        // Procesar cada reporte
        result.data.forEach((reporte, index) => {
            // Tipo de reporte
            const tipoIncidencia = reporte.tipo_incidencia || reporte.tipo_nombre || 'No especificado';
            
            // Usuario que envió el reporte
            const usuarioReporta = reporte.usuario_reporta_nombres && reporte.usuario_reporta_apellidos
                ? `${reporte.usuario_reporta_nombres} ${reporte.usuario_reporta_apellidos}${reporte.usuario_reporta_cargo ? ' - ' + reporte.usuario_reporta_cargo : ''}`
                : 'Usuario desconocido';
            
            // Usuario que respondió el reporte
            const tecnicoInfo = reporte.tecnico_nombres && reporte.tecnico_apellidos
                ? `${reporte.tecnico_nombres} ${reporte.tecnico_apellidos}${reporte.tecnico_cargo ? ' - ' + reporte.tecnico_cargo : ''}`
                : 'No asignado';
            
            // Fechas
            const fechaReporte = new Date(reporte.fecha_reporte);
            const fechaReporteFormateada = fechaReporte.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            const fechaSolucionFormateada = reporte.fecha_solucion 
                ? new Date(reporte.fecha_solucion).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                })
                : 'No especificada';
            
            // Descripción y respuesta
            const descripcion = reporte.descripcion_reporte || 'Sin descripción';
            const respuesta = reporte.descripcion_solucion || 'Sin respuesta';
            
            // Verificar espacio para el título del reporte
            checkPageBreak(10);
            
            // Título del reporte
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...colorAzul);
            doc.text(`Reporte #${reporte.id_incidencia}`, 20, yPos);
            yPos += 7;
            
            // Tipo de reporte
            checkPageBreak(10);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text('Tipo de reporte:', 20, yPos);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...colorGris);
            const tipoLines = doc.splitTextToSize(tipoIncidencia, 160);
            tipoLines.forEach(line => {
                if (yPos > maxY) {
                    doc.addPage();
                    yPos = 20;
                }
                doc.text(line, 60, yPos);
                yPos += 5;
            });
            yPos += 2;
            
            // Usuario que envió
            checkPageBreak(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text('Usuario que envió:', 20, yPos);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...colorGris);
            const usuarioReportaLines = doc.splitTextToSize(usuarioReporta, 160);
            usuarioReportaLines.forEach(line => {
                if (yPos > maxY) {
                    doc.addPage();
                    yPos = 20;
                }
                doc.text(line, 65, yPos);
                yPos += 5;
            });
            yPos += 2;
            
            // Usuario que respondió
            checkPageBreak(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text('Usuario que respondió:', 20, yPos);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...colorGris);
            const tecnicoLines = doc.splitTextToSize(tecnicoInfo, 160);
            tecnicoLines.forEach(line => {
                if (yPos > maxY) {
                    doc.addPage();
                    yPos = 20;
                }
                doc.text(line, 75, yPos);
                yPos += 5;
            });
            yPos += 2;
            
            // Fecha de reporte
            checkPageBreak(7);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text('Fecha de reporte:', 20, yPos);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...colorGris);
            doc.text(fechaReporteFormateada, 70, yPos);
            yPos += 6;
            
            // Fecha de solución
            checkPageBreak(7);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text('Fecha de solución:', 20, yPos);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...colorGris);
            doc.text(fechaSolucionFormateada, 70, yPos);
            yPos += 6;
            
            // Descripción del reporte
            checkPageBreak(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text('Descripción del reporte:', 20, yPos);
            yPos += 5;
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...colorGris);
            const descripcionLines = doc.splitTextToSize(descripcion, 170);
            descripcionLines.forEach(line => {
                if (yPos > maxY) {
                    doc.addPage();
                    yPos = 20;
                }
                doc.text(line, 20, yPos);
                yPos += 5;
            });
            yPos += 3;
            
            // Respuesta
            checkPageBreak(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text('Respuesta:', 20, yPos);
            yPos += 5;
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...colorGris);
            const respuestaLines = doc.splitTextToSize(respuesta, 170);
            respuestaLines.forEach(line => {
                if (yPos > maxY) {
                    doc.addPage();
                    yPos = 20;
                }
                doc.text(line, 20, yPos);
                yPos += 5;
            });
            yPos += 5;
            
            // Línea separadora
            if (index < result.data.length - 1) {
                checkPageBreak(5);
                doc.setDrawColor(200, 200, 200);
                doc.line(20, yPos, 190, yPos);
                yPos += 5;
            }
        });
        
        // Guardar PDF
        doc.save(`Historial_Reportes_${fecha.toISOString().split('T')[0]}.pdf`);
    } catch (error) {
        console.error('Error al exportar historial de reportes:', error);
        mostrarCardEmergente(false, 'Error al exportar el historial. Por favor, intente nuevamente.');
    }
}

// Limpiar filtros de historial de reportes
function limpiarFiltrosHistorialReportes() {
    const filtroUsuario = document.getElementById('filtro_historial_reporte_usuario');
    const filtroOficina = document.getElementById('filtro_historial_reporte_oficina');
    const filtroFecha = document.getElementById('filtro_historial_reporte_fecha');
    const filtroFechaSolucion = document.getElementById('filtro_historial_reporte_fecha_solucion');
    
    if (filtroUsuario) filtroUsuario.value = '';
    if (filtroOficina) filtroOficina.value = '';
    if (filtroFecha) filtroFecha.value = '';
    if (filtroFechaSolucion) filtroFechaSolucion.value = '';
    
    cargarHistorialReportes();
}

function limpiarFiltrosHistorial() {
    const codigoInput = document.getElementById('filtro_historial_codigo');
    const tipoSelect = document.getElementById('filtro_historial_tipo');
    const usuarioSelect = document.getElementById('filtro_historial_usuario');
    const fechaInput = document.getElementById('filtro_historial_fecha');

    if (codigoInput) codigoInput.value = '';
    if (tipoSelect) tipoSelect.value = '';
    if (usuarioSelect) usuarioSelect.value = '';
    if (fechaInput) fechaInput.value = '';

    cargarHistorialMovimientos(1);
}

// Deshacer movimiento
async function deshacerMovimiento(id_movimiento) {
    mostrarCardConfirmacionEquipamiento(
        '¿Deshacer Movimiento?',
        '¿Está seguro de que desea deshacer esta acción?<br><br>El item volverá a su ubicación original.',
        async () => {
            try {
                const usuarioLogueado = JSON.parse(sessionStorage.getItem('usuario_logueado') || '{}');
                const id_usuario_responsable = usuarioLogueado.id_usuario;
                
                if (!id_usuario_responsable) {
                    mostrarCardEmergente(false, 'No se pudo identificar al usuario responsable');
                    return;
                }

                const response = await fetch(getAppBasePath() + '/config/Movimientos.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        action: 'deshacer_movimiento',
                        id_movimiento: id_movimiento,
                        id_usuario_responsable: id_usuario_responsable
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();

                if (result.success) {
                    mostrarCardEmergente(true, result.message || 'Movimiento deshecho correctamente. El item ha vuelto a su ubicación original.');
                    cargarMovimientos(); // Recargar la tabla
                } else {
                    mostrarCardEmergente(false, result.message || 'Error al deshacer el movimiento');
                }
            } catch (error) {
                console.error('Error al deshacer movimiento:', error);
                mostrarCardEmergente(false, 'Error al deshacer el movimiento. Por favor, intente nuevamente.');
            }
        },
        () => {
            // Cancelar - no hacer nada
        }
    );
}

function cerrarModalDetalleEquipamiento() {
    const modal = document.getElementById('modal-detalle-espacio-equipamiento');
    if (modal) {
        modal.style.display = 'none';
    }
}

function cerrarModalEditarEquipamiento() {
    const modal = document.getElementById('modal-editar-espacio-equipamiento');
    if (modal) {
        modal.style.display = 'none';
    }
}

// ============================================
// FUNCIONES PARA DASHBOARD
// ============================================

// Cargar estadísticas del dashboard
async function cargarEstadisticasDashboardInformatica() {
    try {
        // Obtener el rol del usuario desde sessionStorage
        const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
        let tipoIncidencia = 'Informática'; // Por defecto para informática
        let idUsuario = null;
        
        if (usuarioLogueado) {
            try {
                const usuario = JSON.parse(usuarioLogueado);
                const rol = usuario.rol || 'Informática';
                tipoIncidencia = rol; // El rol coincide con el tipo de incidencia
                idUsuario = usuario.id_usuario;
            } catch (e) {
                // Si hay error, usar el valor por defecto
            }
        }
        
        const response = await fetch(getAppBasePath() + '/config/Usuario.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'obtener_estadisticas_dashboard',
                tipo_incidencia: tipoIncidencia,
                id_usuario: idUsuario
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.data) {
            const stats = result.data;
            
            // Equipamiento
            document.getElementById('stat-oficinas-total').textContent = stats.oficinas_total || 0;
            document.getElementById('stat-items-total').textContent = stats.items_total || 0;
            
            // Movimientos
            document.getElementById('stat-total-movimientos').textContent = stats.total_movimientos || 0;
            document.getElementById('stat-movimientos-pendientes').textContent = stats.movimientos_pendientes || 0;
            
            // Reportes
            document.getElementById('stat-reportes-total').textContent = stats.reportes_recibidos || 0;
            document.getElementById('stat-reportes-recibidos').textContent = stats.reportes_recibidos || 0;
            document.getElementById('stat-reportes-respondidos').textContent = stats.reportes_respondidos || 0;
        }
    } catch (error) {
        console.error('Error al cargar estadísticas del dashboard:', error);
        // Mostrar valores por defecto en caso de error
        document.getElementById('stat-oficinas-total').textContent = '-';
        document.getElementById('stat-items-total').textContent = '-';
        document.getElementById('stat-total-movimientos').textContent = '-';
        document.getElementById('stat-movimientos-pendientes').textContent = '-';
        document.getElementById('stat-reportes-total').textContent = '-';
        document.getElementById('stat-reportes-recibidos').textContent = '-';
        document.getElementById('stat-reportes-respondidos').textContent = '-';
    }
}

// Cerrar modales al hacer clic fuera
document.addEventListener('click', function(event) {
    const modalDetalle = document.getElementById('modal-detalle-espacio-equipamiento');
    const modalEditar = document.getElementById('modal-editar-espacio-equipamiento');
    
    if (modalDetalle && event.target === modalDetalle) {
        cerrarModalDetalleEquipamiento();
    }
    
    if (modalEditar && event.target === modalEditar) {
        cerrarModalEditarEquipamiento();
    }
});

// Cerrar modales con tecla ESC
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        cerrarModalDetalleEquipamiento();
        cerrarModalEditarEquipamiento();
        cerrarModalBajaItemEquipamiento();
        cerrarModalMoverItemEquipamiento();
    }
});

// Cerrar modales al hacer clic fuera (para modales de baja y mover)
document.addEventListener('click', function(event) {
    const modalBaja = document.getElementById('modal-baja-item-equipamiento');
    const modalMover = document.getElementById('modal-mover-item-equipamiento');
    
    if (modalBaja && event.target === modalBaja) {
        cerrarModalBajaItemEquipamiento();
    }
    
    if (modalMover && event.target === modalMover) {
        cerrarModalMoverItemEquipamiento();
    }
});

// ============================================
// FUNCIONES PARA ESPACIOS ASIGNADOS
// ============================================

// Cargar espacios asignados al usuario actual
async function cargarEspaciosAsignados() {
    const loadingState = document.getElementById('espacios-asignados-loading');
    const emptyState = document.getElementById('espacios-asignados-empty');
    const gridContainer = document.getElementById('espacios-asignados-grid');
    
    if (!loadingState || !emptyState || !gridContainer) {
        console.error('Elementos del DOM no encontrados');
        return;
    }
    
    // Obtener ID del usuario actual
    let idUsuario = null;
    try {
        const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
        if (usuarioLogueado) {
            const usuario = JSON.parse(usuarioLogueado);
            idUsuario = usuario.id_usuario;
        }
    } catch (e) {
        console.error('Error al obtener usuario:', e);
    }
    
    if (!idUsuario) {
        loadingState.style.display = 'none';
        emptyState.style.display = 'flex';
        return;
    }
    
    // Mostrar loading
    loadingState.style.display = 'flex';
    emptyState.style.display = 'none';
    gridContainer.style.display = 'none';
    
    try {
        // Obtener espacios asignados al usuario
        const response = await fetch(getAppBasePath() + '/config/Gestionespacios.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'listar_espacios',
                pagina: 1,
                limite: 1000,
                filtros: {
                    id_usuario: idUsuario
                }
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        loadingState.style.display = 'none';
        
        if (result.success && result.data && result.data.length > 0) {
            gridContainer.innerHTML = '';
            
            // Para cada espacio, obtener sus items
            for (const espacio of result.data) {
                await cargarItemsEspacio(espacio, gridContainer);
            }
            
            gridContainer.style.display = 'grid';
        } else {
            emptyState.style.display = 'flex';
        }
    } catch (error) {
        console.error('Error al cargar espacios asignados:', error);
        loadingState.style.display = 'none';
        emptyState.style.display = 'flex';
    }
}

// Cargar items de un espacio específico
async function cargarItemsEspacio(espacio, gridContainer) {
    try {
        const response = await fetch(getAppBasePath() + '/config/Gestionespacios.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'obtener_espacio',
                id_oficina: espacio.id_oficina
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.data) {
            const espacioCompleto = result.data;
            const items = espacioCompleto.items || [];
            
            // Crear card del espacio
            const card = document.createElement('div');
            card.className = 'espacio-asignado-card';
            card.style.cssText = 'background: white; border-radius: 8px; padding: 1.5rem; margin-bottom: 2rem; box-shadow: 0 2px 10px rgba(0,0,0,0.1);';
            
            // Información del espacio
            const nombreOficina = espacioCompleto.nombre || 'Sin nombre';
            const direccion = espacioCompleto.direccion || espacioCompleto.nombre_direccion || null;
            const departamento = espacioCompleto.departamento || espacioCompleto.nombre_departamento || null;
            const seccion = espacioCompleto.seccion || espacioCompleto.nombre_seccion || null;
            const edificio = espacioCompleto.edificio || null;
            const piso = espacioCompleto.piso || null;
            const ubicacionFisica = espacioCompleto.ubicacion_fisica || null;
            
            card.innerHTML = `
                <!-- Información de la Oficina o Seccion -->
                <div class="espacio-info-section">
                    <div class="espacio-header">
                        <h3 class="espacio-title">
                            <i class="fas fa-warehouse"></i>
                            ${escapeHtml(nombreOficina)}
                        </h3>
                    </div>
                    <div class="espacio-details-grid">
                        ${direccion ? `
                            <div class="espacio-detail-item">
                                <div class="espacio-detail-icon">
                                    <i class="fas fa-directions"></i>
                                </div>
                                <div class="espacio-detail-content">
                                    <div class="espacio-detail-label">Dirección</div>
                                    <div class="espacio-detail-value">${escapeHtml(direccion)}</div>
                                </div>
                            </div>
                        ` : ''}
                        ${departamento ? `
                            <div class="espacio-detail-item">
                                <div class="espacio-detail-icon">
                                    <i class="fas fa-sitemap"></i>
                                </div>
                                <div class="espacio-detail-content">
                                    <div class="espacio-detail-label">Departamento</div>
                                    <div class="espacio-detail-value">${escapeHtml(departamento)}</div>
                                </div>
                            </div>
                        ` : ''}
                        ${seccion ? `
                            <div class="espacio-detail-item">
                                <div class="espacio-detail-icon">
                                    <i class="fas fa-folder"></i>
                                </div>
                                <div class="espacio-detail-content">
                                    <div class="espacio-detail-label">Sección</div>
                                    <div class="espacio-detail-value">${escapeHtml(seccion)}</div>
                                </div>
                            </div>
                        ` : ''}
                        ${edificio ? `
                            <div class="espacio-detail-item">
                                <div class="espacio-detail-icon">
                                    <i class="fas fa-building"></i>
                                </div>
                                <div class="espacio-detail-content">
                                    <div class="espacio-detail-label">Edificio</div>
                                    <div class="espacio-detail-value">${escapeHtml(edificio)}</div>
                                </div>
                            </div>
                        ` : ''}
                        ${piso ? `
                            <div class="espacio-detail-item">
                                <div class="espacio-detail-icon">
                                    <i class="fas fa-layer-group"></i>
                                </div>
                                <div class="espacio-detail-content">
                                    <div class="espacio-detail-label">Piso</div>
                                    <div class="espacio-detail-value">${escapeHtml(piso)}</div>
                                </div>
                            </div>
                        ` : ''}
                        ${ubicacionFisica ? `
                            <div class="espacio-detail-item">
                                <div class="espacio-detail-icon">
                                    <i class="fas fa-map-marker-alt"></i>
                                </div>
                                <div class="espacio-detail-content">
                                    <div class="espacio-detail-label">Ubicación Física</div>
                                    <div class="espacio-detail-value">${escapeHtml(ubicacionFisica)}</div>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <!-- Items de Inventario -->
                <div class="espacio-items-section">
                    <div class="espacio-items-header">
                        <h4 class="espacio-items-title">
                            <i class="fas fa-boxes"></i>
                            Items de Inventario
                            <span class="espacio-items-count">(${items.length})</span>
                        </h4>
                    </div>
                    ${items.length > 0 ? `
                        <div class="espacio-items-table-container">
                            <table class="espacio-items-table">
                                <thead>
                                    <tr>
                                        <th>Codigo Articulo</th>
                                        <th>Descripción</th>
                                        <th>Marca</th>
                                        <th>Modelo</th>
                                        <th>Serie</th>
                                        <th>Tipo</th>
                                        <th>Estado</th>
                                        <th class="text-center">Activo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${items.map(item => `
                                        <tr>
                                            <td><strong>${escapeHtml(item.codigo_patrimonial || 'N/A')}</strong></td>
                                            <td>${escapeHtml(item.descripcion || 'N/A')}</td>
                                            <td>${escapeHtml(item.marca || 'N/A')}</td>
                                            <td>${escapeHtml(item.modelo || 'N/A')}</td>
                                            <td>${escapeHtml(item.serie || 'N/A')}</td>
                                            <td>${escapeHtml(item.tipo_bien || 'N/A')}</td>
                                            <td>${escapeHtml(item.estado || 'N/A')}</td>
                                            <td class="text-center">
                                                ${item.activo == 1 || item.activo === '1' || item.activo === true ? 
                                                    '<span class="badge-activo">✓ Activo</span>' : 
                                                    '<span class="badge-baja">✗ De Baja</span>'}
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    ` : `
                        <div class="espacio-items-empty">
                            <i class="fas fa-inbox"></i>
                            <p>No hay items asignados a este espacio</p>
                        </div>
                    `}
                </div>
            `;
            
            gridContainer.appendChild(card);
        }
    } catch (error) {
        console.error('Error al cargar items del espacio:', error);
    }
}

// Función auxiliar para escapar HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// FUNCIONES PARA ENVÍO DE REPORTES
// ============================================

// Cargar oficinas asignadas al usuario para el formulario de reportes
async function cargarOficinasReporte() {
    const selectOficina = document.getElementById('reporte_oficina');
    if (!selectOficina) return;
    
    // Obtener ID del usuario actual
    let idUsuario = null;
    try {
        const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
        if (usuarioLogueado) {
            const usuario = JSON.parse(usuarioLogueado);
            idUsuario = usuario.id_usuario;
        }
    } catch (e) {
        console.error('Error al obtener usuario:', e);
    }
    
    if (!idUsuario) {
        selectOficina.innerHTML = '<option value="">No se pudo obtener el usuario</option>';
        return;
    }
    
    try {
        const response = await fetch(getAppBasePath() + '/config/Gestionespacios.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'listar_espacios',
                pagina: 1,
                limite: 1000,
                filtros: {
                    id_usuario: idUsuario
                }
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.data && result.data.length > 0) {
            selectOficina.innerHTML = '<option value="">Seleccione una oficina o seccion...</option>';
            result.data.forEach(espacio => {
                const option = document.createElement('option');
                option.value = espacio.id_oficina;
                option.textContent = espacio.nombre;
                option.setAttribute('data-direccion', espacio.direccion || '');
                option.setAttribute('data-departamento', espacio.departamento || '');
                option.setAttribute('data-seccion', espacio.seccion || '');
                selectOficina.appendChild(option);
            });
        } else {
            selectOficina.innerHTML = '<option value="">No tiene oficinas asignadas</option>';
        }
    } catch (error) {
        console.error('Error al cargar oficinas:', error);
        selectOficina.innerHTML = '<option value="">Error al cargar oficinas</option>';
    }
}

// Cargar items de inventario de una oficina específica
async function cargarItemsReporte(id_oficina) {
    const selectItem = document.getElementById('reporte_item');
    if (!selectItem) return;
    
    if (!id_oficina) {
        selectItem.innerHTML = '<option value="">Seleccione un item (opcional)...</option>';
        selectItem.disabled = true;
        return;
    }
    
    selectItem.innerHTML = '<option value="">Cargando items...</option>';
    selectItem.disabled = true;
    
    try {
        const response = await fetch(getAppBasePath() + '/config/Gestionespacios.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'obtener_espacio',
                id_oficina: id_oficina
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.data && result.data.items) {
            const items = result.data.items;
            selectItem.innerHTML = '<option value="">Seleccione un item (opcional)...</option>';
            
            if (items.length > 0) {
                items.forEach(item => {
                    const option = document.createElement('option');
                    option.value = item.id_inventario;
                    const codigo = item.codigo_patrimonial || 'N/A';
                    const descripcion = item.descripcion || 'Sin descripción';
                    option.textContent = `${codigo} - ${descripcion}`;
                    selectItem.appendChild(option);
                });
            } else {
                selectItem.innerHTML = '<option value="">No hay items en esta oficina o seccion</option>';
            }
            
            selectItem.disabled = false;
        } else {
            selectItem.innerHTML = '<option value="">No se encontraron items</option>';
            selectItem.disabled = false;
        }
    } catch (error) {
        console.error('Error al cargar items:', error);
        selectItem.innerHTML = '<option value="">Error al cargar items</option>';
        selectItem.disabled = false;
    }
}

// Cargar tipos de incidencia
async function cargarTiposIncidencia() {
    const selectTipo = document.getElementById('reporte_tipo');
    if (!selectTipo) return;
    
    try {
        const response = await fetch(getAppBasePath() + '/config/Reportes.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'obtener_tipos_incidencia'
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.data && result.data.length > 0) {
            selectTipo.innerHTML = '<option value="">Seleccione un tipo...</option>';
            result.data.forEach(tipo => {
                const option = document.createElement('option');
                option.value = tipo.id_tipo;
                option.textContent = tipo.nombre;
                selectTipo.appendChild(option);
            });
        } else {
            selectTipo.innerHTML = '<option value="">No hay tipos disponibles</option>';
        }
    } catch (error) {
        console.error('Error al cargar tipos de incidencia:', error);
        selectTipo.innerHTML = '<option value="">Error al cargar tipos</option>';
    }
}

// Enviar reporte
async function enviarReporte(event) {
    event.preventDefault();
    
    // Obtener ID del usuario actual
    let idUsuario = null;
    try {
        const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
        if (usuarioLogueado) {
            const usuario = JSON.parse(usuarioLogueado);
            idUsuario = usuario.id_usuario;
        }
    } catch (e) {
        console.error('Error al obtener usuario:', e);
        mostrarCardEmergente(false, 'Error al obtener datos del usuario');
        return;
    }
    
    if (!idUsuario) {
        mostrarCardEmergente(false, 'No se pudo obtener el usuario');
        return;
    }
    
    // Obtener datos del formulario
    const form = document.getElementById('formEnviarReporte');
    const formData = new FormData(form);
    
    // Obtener datos de la oficina o seccion seleccionada
    const selectOficina = document.getElementById('reporte_oficina');
    const optionOficina = selectOficina.options[selectOficina.selectedIndex];
    
    const idOficina = formData.get('id_oficina');
    const idInventario = formData.get('id_inventario');
    
    const data = {
        action: 'crear_incidencia',
        id_usuario_reporta: idUsuario,
        id_inventario: idInventario && idInventario !== '' ? idInventario : null,
        id_tipo: formData.get('id_tipo'),
        descripcion_reporte: formData.get('descripcion_reporte'),
        id_oficina: idOficina && idOficina !== '' ? idOficina : null,
        id_direccion: optionOficina.getAttribute('data-id-direccion') && optionOficina.getAttribute('data-id-direccion') !== '' ? optionOficina.getAttribute('data-id-direccion') : null,
        id_departamento: optionOficina.getAttribute('data-id-departamento') && optionOficina.getAttribute('data-id-departamento') !== '' ? optionOficina.getAttribute('data-id-departamento') : null,
        id_seccion: optionOficina.getAttribute('data-id-seccion') && optionOficina.getAttribute('data-id-seccion') !== '' ? optionOficina.getAttribute('data-id-seccion') : null
    };
    
    // Validar campos requeridos
    if (!data.id_tipo || !data.descripcion_reporte || !data.id_oficina) {
        mostrarCardEmergente(false, 'Por favor complete todos los campos requeridos');
        return;
    }
    
    try {
        const response = await fetch(getAppBasePath() + '/config/Reportes.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            mostrarCardEmergente(true, 'Reporte enviado correctamente');
            limpiarFormularioReporte();
        } else {
            mostrarCardEmergente(false, result.message || 'Error al enviar el reporte');
        }
    } catch (error) {
        console.error('Error al enviar reporte:', error);
        mostrarCardEmergente(false, 'Error al enviar el reporte. Por favor, intente nuevamente.');
    }
}

// Limpiar formulario de reporte
function limpiarFormularioReporte() {
    const form = document.getElementById('formEnviarReporte');
    if (form) {
        form.reset();
        const selectItem = document.getElementById('reporte_item');
        if (selectItem) {
            selectItem.innerHTML = '<option value="">Seleccione un item (opcional)...</option>';
            selectItem.disabled = true;
        }
    }
}

// Cargar mis reportes (Respuestas de reportes)
async function cargarMisReportes() {
    const loadingState = document.getElementById('reportes-loading');
    const emptyState = document.getElementById('reportes-empty');
    const gridContainer = document.getElementById('reportes-grid');
    
    if (!loadingState || !emptyState || !gridContainer) return;
    
    // Obtener ID del usuario actual
    let idUsuario = null;
    try {
        const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
        if (usuarioLogueado) {
            const usuario = JSON.parse(usuarioLogueado);
            idUsuario = usuario.id_usuario;
        }
    } catch (e) {
        console.error('Error al obtener usuario:', e);
        loadingState.style.display = 'none';
        emptyState.style.display = 'flex';
        return;
    }
    
    if (!idUsuario) {
        loadingState.style.display = 'none';
        emptyState.style.display = 'flex';
        return;
    }
    
    loadingState.style.display = 'flex';
    emptyState.style.display = 'none';
    gridContainer.style.display = 'none';
    
    try {
        const response = await fetch(getAppBasePath() + '/config/Reportes.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'listar_mis_reportes',
                id_usuario: idUsuario
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        loadingState.style.display = 'none';
        
        if (result.success && result.data && result.data.length > 0) {
            gridContainer.innerHTML = '';
            
            // Guardar idUsuario en una constante para usarla en el forEach
            const usuarioId = idUsuario;
            
            result.data.forEach((reporte) => {
                const fechaReporte = new Date(reporte.fecha_reporte);
                const fechaReporteFormateada = fechaReporte.toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
                const fechaSolucionFormateada = reporte.fecha_solucion 
                    ? new Date(reporte.fecha_solucion).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                    })
                    : null;
                
                const estadoBadge = reporte.resuelto 
                    ? '<span class="estado-badge estado-resuelto"><i class="fas fa-check-circle"></i> Resuelto</span>'
                    : '<span class="estado-badge estado-pendiente"><i class="fas fa-clock"></i> Pendiente</span>';
                
                const ubicacion = [
                    reporte.direccion_nombre,
                    reporte.departamento_nombre,
                    reporte.seccion_nombre,
                    reporte.oficina_nombre
                ].filter(Boolean).join(' / ') || 'No especificada';
                
                const ubicacionCompleta = [
                    ubicacion,
                    reporte.oficina_piso ? `Piso ${reporte.oficina_piso}` : null,
                    reporte.oficina_ubicacion_interna || null
                ].filter(Boolean).join(' - ') || ubicacion;
                
                const itemInfo = reporte.codigo_patrimonial 
                    ? `${reporte.codigo_patrimonial} - ${reporte.item_descripcion || 'N/A'}`
                    : 'No especificado';
                
                const tecnicoInfo = reporte.tecnico_nombres && reporte.tecnico_apellidos
                    ? `${reporte.tecnico_nombres} ${reporte.tecnico_apellidos}${reporte.tecnico_cargo ? ' - ' + reporte.tecnico_cargo : ''}`
                    : 'No asignado';
                
                const card = document.createElement('div');
                card.className = 'reporte-card';
                card.innerHTML = `
                    <div class="reporte-header">
                        <div class="reporte-header-left">
                            <h3>
                                <i class="fas fa-file-alt"></i>
                                Reporte #${reporte.id_incidencia}
                            </h3>
                            ${estadoBadge}
                        </div>
                        <div class="reporte-header-right">
                            <div class="reporte-fecha">
                                <i class="fas fa-calendar"></i>
                                ${fechaReporteFormateada}
                            </div>
                            ${!reporte.resuelto ? `
                                <button class="btn-eliminar-reporte" onclick="eliminarReporte(${reporte.id_incidencia}, ${usuarioId})" title="Eliminar reporte">
                                    <i class="fas fa-trash"></i>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div class="reporte-body">
                        <div class="reporte-info-row">
                            <div class="reporte-info-item">
                                <i class="fas fa-tag"></i>
                                <strong>Tipo:</strong> ${escapeHtml(reporte.tipo_nombre || 'N/A')}
                            </div>
                            <div class="reporte-info-item">
                                <i class="fas fa-map-marker-alt"></i>
                                <strong>Ubicación:</strong> ${escapeHtml(ubicacionCompleta)}
                            </div>
                        </div>
                        
                        <div class="reporte-info-row">
                            <div class="reporte-info-item">
                                <i class="fas fa-box"></i>
                                <strong>Item:</strong> ${escapeHtml(itemInfo)}
                            </div>
                        </div>
                        
                        <div class="reporte-descripcion">
                            <strong><i class="fas fa-comment"></i> Descripción del Reporte:</strong>
                            <p>${escapeHtml(reporte.descripcion_reporte)}</p>
                        </div>
                        
                        ${reporte.resuelto && reporte.descripcion_solucion ? `
                            <div class="reporte-respuesta">
                                <div class="reporte-respuesta-header">
                                    <strong><i class="fas fa-reply"></i> Respuesta:</strong>
                                    ${fechaSolucionFormateada ? `<span class="reporte-respuesta-fecha"><i class="fas fa-calendar"></i> ${fechaSolucionFormateada}</span>` : ''}
                                </div>
                                <div class="reporte-respuesta-body">
                                    <p>${escapeHtml(reporte.descripcion_solucion)}</p>
                                    ${reporte.resultado ? `<div class="reporte-resultado"><strong>Resultado:</strong> ${escapeHtml(reporte.resultado)}</div>` : ''}
                                    ${(reporte.oficina_piso || reporte.oficina_ubicacion_interna) ? `
                                        <div class="reporte-ubicacion-detalle">
                                            <i class="fas fa-building"></i>
                                            <strong>Oficina:</strong>
                                            ${reporte.oficina_piso ? `<span>Piso ${escapeHtml(reporte.oficina_piso)}</span>` : ''}
                                            ${reporte.oficina_piso && reporte.oficina_ubicacion_interna ? ' - ' : ''}
                                            ${reporte.oficina_ubicacion_interna ? `<span>${escapeHtml(reporte.oficina_ubicacion_interna)}</span>` : ''}
                                        </div>
                                    ` : ''}
                                    <div class="reporte-tecnico">
                                        <i class="fas fa-user-cog"></i>
                                        <strong>Técnico:</strong> ${escapeHtml(tecnicoInfo)}
                                    </div>
                                </div>
                            </div>
                        ` : `
                            <div class="reporte-sin-respuesta">
                                <i class="fas fa-hourglass-half"></i>
                                <p>Este reporte aún no tiene respuesta. Se te notificará cuando haya una actualización.</p>
                            </div>
                        `}
                    </div>
                `;
                
                gridContainer.appendChild(card);
            });
            
            gridContainer.style.display = 'grid';
        } else {
            emptyState.style.display = 'flex';
        }
    } catch (error) {
        console.error('Error al cargar reportes:', error);
        loadingState.style.display = 'none';
        emptyState.style.display = 'flex';
        emptyState.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <p>Error al cargar los reportes. Por favor, recarga la página.</p>
            <small style="margin-top: 0.5rem; color: #999;">${error.message}</small>
        `;
    }
}

// Eliminar reporte
async function eliminarReporte(idIncidencia, idUsuario) {
    mostrarCardConfirmacion(
        'Confirmar eliminación',
        '¿Estás seguro de que deseas eliminar este reporte? Esta acción no se puede deshacer.',
        async () => {
            // Función de confirmación
            try {
        const response = await fetch(getAppBasePath() + '/config/Reportes.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'eliminar_reporte',
                id_incidencia: idIncidencia,
                id_usuario: idUsuario
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            mostrarCardEmergente(true, 'Reporte eliminado correctamente');
            // Recargar la lista de reportes
            cargarMisReportes();
            } else {
                mostrarCardEmergente(false, result.message || 'Error al eliminar el reporte');
            }
        } catch (error) {
            console.error('Error al eliminar reporte:', error);
            mostrarCardEmergente(false, 'Error al eliminar el reporte. Por favor, intente nuevamente.');
        }
        },
        () => {
            // Función de cancelación (no hacer nada)
        }
    );
}

