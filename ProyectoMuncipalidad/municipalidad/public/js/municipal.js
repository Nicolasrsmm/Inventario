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
                    rol: result.roles && result.roles.length > 0 ? result.roles[0].nombre : 'Usuario Municipal'
                }));
                sessionStorage.setItem('token_sesion', token);
                
                // Verificar rol
                const rol = result.roles && result.roles.length > 0 ? result.roles[0].nombre.toLowerCase() : '';
                if (rol !== 'usuario municipal' && rol !== 'usuariomunicipal') {
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
            if (rol !== 'usuario municipal' && rol !== 'usuariomunicipal') {
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
                rol: result.roles && result.roles.length > 0 ? result.roles[0].nombre : 'Usuario Municipal'
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
        
        // Verificar que el usuario tenga rol de usuario municipal
        const rol = usuario.rol ? usuario.rol.toLowerCase() : '';
        if (rol !== 'usuario municipal' && rol !== 'usuariomunicipal') {
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
                    <h2>Bienvenido al Panel Municipal</h2>
                    <p>Gestiona tus Reportes y Espacios</p>
                </div>

                <div class="dashboard-cards-container">
                    <!-- Card: Reportes de Incidentes -->
                    <div class="dashboard-card">
                        <div class="dashboard-card-header">
                            <i class="fas fa-exclamation-triangle"></i>
                            <h3>Mis Reportes</h3>
                                </div>
                        <div class="dashboard-card-body">
                            <div class="dashboard-stat">
                                <span class="stat-label">Reportes Enviados</span>
                                <span class="stat-value" id="stat-reportes-enviados">-</span>
                            </div>
                            <div class="dashboard-stat">
                                <span class="stat-label">Reportes Respondidos</span>
                                <span class="stat-value" id="stat-reportes-respondidos">-</span>
                                </div>
                            <div class="dashboard-stat">
                                <span class="stat-label">Reportes Sin Responder</span>
                                <span class="stat-value" id="stat-reportes-sin-responder">-</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            setTimeout(() => {
                cargarEstadisticasDashboardMunicipal();
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
                    <p>Consulta el historial completo de todos tus reportes con filtros de búsqueda</p>
                </div>
                
                <!-- Filtros de Búsqueda -->
                <div class="filtro-busqueda-container" style="margin-top: 2rem;">
                    <div class="filtro-header">
                        <h4><i class="fas fa-filter"></i> Filtros de Búsqueda</h4>
                        <button class="btn-limpiar-filtros" onclick="limpiarFiltrosHistorialReportesMunicipal()">
                            <i class="fas fa-times"></i> Limpiar Filtros
                        </button>
                        </div>
                    <div class="filtro-body">
                        <div class="filtro-row">
                            <div class="filtro-group">
                                <label><i class="fas fa-user"></i> Usuario que Reporta</label>
                                <input type="text" id="filtro_historial_reporte_usuario_municipal" placeholder="Buscar por usuario..." onkeyup="aplicarFiltrosHistorialReportesMunicipal()">
                        </div>
                            <div class="filtro-group">
                                <label><i class="fas fa-calendar"></i> Fecha de Reporte</label>
                                <input type="date" id="filtro_historial_reporte_fecha_municipal" onchange="aplicarFiltrosHistorialReportesMunicipal()">
                        </div>
                            <div class="filtro-group">
                                <label><i class="fas fa-building"></i> Oficina</label>
                                <input type="text" id="filtro_historial_reporte_oficina_municipal" placeholder="Buscar por oficina..." onkeyup="aplicarFiltrosHistorialReportesMunicipal()">
                        </div>
                            <div class="filtro-group">
                                <label><i class="fas fa-calendar-check"></i> Fecha de Solución</label>
                                <input type="date" id="filtro_historial_reporte_fecha_solucion_municipal" onchange="aplicarFiltrosHistorialReportesMunicipal()">
                        </div>
                    </div>
                    </div>
                </div>
                
                <div style="margin-top: 1.5rem; display: flex; justify-content: flex-end;">
                    <button class="btn-exportar-pdf" onclick="exportarHistorialReportesMunicipalPDF()" style="background: linear-gradient(135deg, #e74c3c, #c0392b); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-size: 1rem; font-weight: 600; display: inline-flex; align-items: center; gap: 0.5rem; transition: all 0.3s ease; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
                        <i class="fas fa-file-pdf"></i> Exportar Historial a PDF
                    </button>
                </div>
                
                <div id="historial-reportes-container-municipal" style="margin-top: 2rem;">
                    <div id="historial-reportes-loading-municipal" class="loading-state">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>Cargando historial...</p>
                    </div>
                    
                    <div id="historial-reportes-empty-municipal" class="empty-state" style="display: none;">
                        <i class="fas fa-inbox"></i>
                        <p>No hay reportes en el historial</p>
                    </div>
                    
                    <div id="historial-reportes-grid-municipal" style="display: none;">
                        <!-- Los reportes se cargarán aquí -->
                    </div>
                    
                    <!-- Controles de paginación -->
                    <div class="paginacion-container" id="historial-reportes-paginacion-container-municipal" style="display: none;">
                        <div class="paginacion-info">
                            <span id="historial-reportes-paginacion-info-texto-municipal">Página 1 de 1</span>
                        </div>
                        <div class="paginacion-controls">
                            <button id="historial-reportes-btn-pagina-anterior-municipal" class="btn-pagina" onclick="cambiarPaginaHistorialReportesMunicipal(-1)" disabled>
                                <i class="fas fa-chevron-left"></i> Anterior
                            </button>
                            <div class="paginacion-numeros" id="historial-reportes-paginacion-numeros-municipal">
                                <!-- Los números de página se generarán aquí -->
                            </div>
                            <button id="historial-reportes-btn-pagina-siguiente-municipal" class="btn-pagina" onclick="cambiarPaginaHistorialReportesMunicipal(1)" disabled>
                                Siguiente <i class="fas fa-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            // Cargar historial de reportes después de un pequeño delay
            setTimeout(() => {
                cargarHistorialReportesMunicipal(1);
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
// FUNCIONES PARA DASHBOARD
// ============================================

// Cargar estadísticas del dashboard
async function cargarEstadisticasDashboardMunicipal() {
    try {
        // Obtener el ID del usuario desde sessionStorage
        const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
        let idUsuario = null;
        
        if (usuarioLogueado) {
            try {
                const usuario = JSON.parse(usuarioLogueado);
                idUsuario = usuario.id_usuario;
            } catch (e) {
                // Si hay error, usar el valor por defecto
            }
        }
        
        if (!idUsuario) {
            console.error('No se pudo obtener el ID del usuario');
            return;
        }
        
        const response = await fetch(getAppBasePath() + '/config/Usuario.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'obtener_estadisticas_dashboard',
                id_usuario: idUsuario
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.data) {
            const stats = result.data;
            
            // Reportes del usuario
            document.getElementById('stat-reportes-enviados').textContent = stats.reportes_enviados || 0;
            document.getElementById('stat-reportes-respondidos').textContent = stats.reportes_respondidos_usuario || 0;
            document.getElementById('stat-reportes-sin-responder').textContent = stats.reportes_sin_responder_usuario || 0;
        }
    } catch (error) {
        console.error('Error al cargar estadísticas del dashboard:', error);
        // Mostrar valores por defecto en caso de error
        document.getElementById('stat-reportes-enviados').textContent = '-';
        document.getElementById('stat-reportes-respondidos').textContent = '-';
        document.getElementById('stat-reportes-sin-responder').textContent = '-';
    }
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

// Cargar mis reportes
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

// Variable para controlar la paginación del historial de reportes
let paginaActualHistorialReportesMunicipal = 1;

// Cargar historial de reportes con filtros (municipal)
async function cargarHistorialReportesMunicipal(pagina = 1) {
    paginaActualHistorialReportesMunicipal = pagina;
    
    const loadingState = document.getElementById('historial-reportes-loading-municipal');
    const emptyState = document.getElementById('historial-reportes-empty-municipal');
    const gridContainer = document.getElementById('historial-reportes-grid-municipal');
    const paginacionContainer = document.getElementById('historial-reportes-paginacion-container-municipal');
    
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
    
    // Obtener valores de los filtros
    const filtros = {
        usuario: document.getElementById('filtro_historial_reporte_usuario_municipal')?.value || '',
        oficina: document.getElementById('filtro_historial_reporte_oficina_municipal')?.value || '',
        fecha_reporte: document.getElementById('filtro_historial_reporte_fecha_municipal')?.value || '',
        fecha_solucion: document.getElementById('filtro_historial_reporte_fecha_solucion_municipal')?.value || ''
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
                action: 'listar_mis_reportes',
                id_usuario: idUsuario,
                filtros: filtros,
                solo_resueltos: true,
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
                            <div class="reporte-sin-respuesta">
                                <i class="fas fa-hourglass-half"></i>
                                <p>Este reporte aún no tiene respuesta. Se te notificará cuando haya una actualización.</p>
                            </div>
                        `}
                        
                        ${!reporte.resuelto ? `
                            <div class="reporte-acciones">
                                <button class="btn-eliminar-reporte" onclick="eliminarReporte(${reporte.id_incidencia})">
                                    <i class="fas fa-trash"></i> Eliminar Reporte
                                </button>
                            </div>
                        ` : ''}
                    </div>
                `;
                
                gridContainer.appendChild(card);
            });
            
            gridContainer.style.display = 'grid';
            
            // Actualizar paginación si existe
            if (result.paginacion && paginacionContainer) {
                actualizarPaginacionHistorialReportesMunicipal(result.paginacion);
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
function cambiarPaginaHistorialReportesMunicipal(direccion) {
    const nuevaPagina = paginaActualHistorialReportesMunicipal + direccion;
    if (nuevaPagina >= 1) {
        cargarHistorialReportesMunicipal(nuevaPagina);
    }
}

// Ir a página específica del historial de reportes
function irAPaginaHistorialReportesMunicipal(pagina) {
    if (pagina >= 1) {
        cargarHistorialReportesMunicipal(pagina);
    }
}

// Actualizar controles de paginación del historial de reportes
function actualizarPaginacionHistorialReportesMunicipal(paginacion) {
    const infoTexto = document.getElementById('historial-reportes-paginacion-info-texto-municipal');
    const btnAnterior = document.getElementById('historial-reportes-btn-pagina-anterior-municipal');
    const btnSiguiente = document.getElementById('historial-reportes-btn-pagina-siguiente-municipal');
    const numerosContainer = document.getElementById('historial-reportes-paginacion-numeros-municipal');
    
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
        btn.onclick = () => irAPaginaHistorialReportesMunicipal(1);
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
        btn.onclick = () => irAPaginaHistorialReportesMunicipal(i);
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
        btn.onclick = () => irAPaginaHistorialReportesMunicipal(totalPaginas);
        numerosContainer.appendChild(btn);
    }
}

// Exportar historial de reportes a PDF (municipal)
async function exportarHistorialReportesMunicipalPDF() {
    try {
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
            mostrarCardEmergente(false, 'Error al obtener información del usuario');
            return;
        }
        
        if (!idUsuario) {
            mostrarCardEmergente(false, 'No se pudo obtener el ID del usuario');
            return;
        }
        
        // Recopilar filtros actuales
        const filtros = {
            usuario: document.getElementById('filtro_historial_reporte_usuario_municipal')?.value || '',
            oficina: document.getElementById('filtro_historial_reporte_oficina_municipal')?.value || '',
            fecha_reporte: document.getElementById('filtro_historial_reporte_fecha_municipal')?.value || '',
            fecha_solucion: document.getElementById('filtro_historial_reporte_fecha_solucion_municipal')?.value || ''
        };

        // Obtener todos los reportes sin paginación (respetando los filtros aplicados)
        const response = await fetch(getAppBasePath() + '/config/Reportes.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'listar_mis_reportes',
                id_usuario: idUsuario,
                filtros: filtros,
                solo_resueltos: true,
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

// Aplicar filtros de historial de reportes (municipal)
function aplicarFiltrosHistorialReportesMunicipal() {
    cargarHistorialReportesMunicipal(1);
}

// Limpiar filtros de historial de reportes (municipal)
function limpiarFiltrosHistorialReportesMunicipal() {
    const filtroUsuario = document.getElementById('filtro_historial_reporte_usuario_municipal');
    const filtroOficina = document.getElementById('filtro_historial_reporte_oficina_municipal');
    const filtroFecha = document.getElementById('filtro_historial_reporte_fecha_municipal');
    const filtroFechaSolucion = document.getElementById('filtro_historial_reporte_fecha_solucion_municipal');
    
    if (filtroUsuario) filtroUsuario.value = '';
    if (filtroOficina) filtroOficina.value = '';
    if (filtroFecha) filtroFecha.value = '';
    if (filtroFechaSolucion) filtroFechaSolucion.value = '';
    
    cargarHistorialReportesMunicipal(1);
}

// Mostrar card de confirmación personalizada
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




