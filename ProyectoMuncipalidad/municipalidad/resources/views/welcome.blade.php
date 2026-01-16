<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Login - Municipalidad</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #0066CC 0%, #ffffff 100%);
            padding: 20px;
        }

        .login-container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            width: 100%;
            max-width: 450px;
            padding: 20px 30px;
            animation: fadeIn 0.5s ease-in;
        }

        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .logo-header {
            text-align: center;
            margin-bottom: 15px;
        }

        .logo-header img {
            max-width: 150px;
            height: auto;
            margin-bottom: 8px;
        }

        .login-title {
            color: #0066CC;
            font-size: 22px;
            font-weight: 600;
            margin-bottom: 4px;
            text-align: center;
        }

        .login-subtitle {
            color: #666;
            font-size: 12px;
            text-align: center;
            margin-bottom: 15px;
        }

        .form-group {
            margin-bottom: 15px;
            position: relative;
        }

        .form-group label {
            display: block;
            color: #333;
            font-size: 15px;
            font-weight: 500;
            margin-bottom: 6px;
        }

        .form-group .input-wrapper {
            position: relative;
        }

        .form-group input {
            width: 100%;
            padding: 10px 15px 10px 40px;
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            font-size: 14px;
            transition: all 0.3s ease;
            outline: none;
        }

        .form-group:has(#password) input {
            padding-right: 45px;
            padding-left: 40px;
        }

        .form-group input:focus {
            border-color: #0066CC;
            box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
        }

        .form-group .input-icon {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            color: #999;
            font-size: 18px;
        }

        .form-group .input-icon.fa-user {
            left: 12px;
        }

        .form-group .lock-icon {
            left: 12px;
        }

        .form-group .toggle-password {
            cursor: pointer;
            right: 15px;
            transition: color 0.3s ease;
        }

        .form-group .toggle-password:hover {
            color: #0066CC;
        }

        .remember-forgot {
            display: flex;
            justify-content: flex-start;
            align-items: center;
            margin-bottom: 15px;
            font-size: 13px;
        }

        .remember-me {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .remember-me input[type="checkbox"] {
            width: 18px;
            height: 18px;
            cursor: pointer;
        }

        .remember-me label {
            color: #666;
            cursor: pointer;
        }


        .login-btn {
            width: 100%;
            padding: 12px;
            background: linear-gradient(135deg, #0066CC 0%, #0052A3 100%);
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(0, 102, 204, 0.4);
        }

        .login-btn:hover {
            transform: translateY(-2px);
            background: linear-gradient(135deg, #0052A3 0%, #0066CC 100%);
            box-shadow: 0 6px 20px rgba(0, 102, 204, 0.5);
        }

        .login-btn:active {
            transform: translateY(0);
        }

        .login-btn i {
            margin-right: 8px;
        }

        .divider {
            text-align: center;
            margin: 15px 0;
            position: relative;
            color: #999;
            font-size: 13px;
        }

        .divider::before,
        .divider::after {
            content: '';
            position: absolute;
            top: 50%;
            width: 40%;
            height: 1px;
            background: #e0e0e0;
        }

        .divider::before {
            left: 0;
        }

        .divider::after {
            right: 0;
        }

        .register-link {
            text-align: center;
            margin-top: 12px;
            color: #666;
            font-size: 13px;
        }

        .register-link a {
            color: #0066CC;
            text-decoration: none;
            font-weight: 600;
        }

        .register-link a:hover {
            color: #FFD700;
            text-decoration: underline;
        }

        .error-message {
            background: #fee;
            color: #c33;
            padding: 10px;
            border-radius: 8px;
            margin-bottom: 15px;
            font-size: 13px;
            display: none;
        }

        .error-message.show {
            display: block;
        }

        .success-message {
            background: #efe;
            color: #3c3;
            padding: 10px;
            border-radius: 8px;
            margin-bottom: 15px;
            font-size: 13px;
            display: none;
            border: 1px solid #cfc;
        }

        .success-message.show {
            display: block;
        }

        @media (max-width: 480px) {
            .login-container {
                padding: 18px 20px;
            }

            .logo-header img {
                max-width: 120px;
                margin-bottom: 6px;
            }

            .login-title {
                font-size: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="logo-header">
            <img src="{{ asset('images/muni.png') }}" alt="Municipalidad Logo">
            <h1 class="login-title">Bienvenido</h1>
            <p class="login-subtitle">Inicia sesión para continuar</p>
        </div>

        @if(session('error'))
            <div class="error-message show">{{ session('error') }}</div>
        @endif
        
        @if(session('message'))
            <div class="success-message show">{{ session('message') }}</div>
        @endif

        <div class="error-message" id="errorMessage"></div>

        <form id="loginForm" action="{{ url('/login') }}" method="POST">
            @csrf
            <div class="form-group">
                <label for="username">Usuario</label>
                <div class="input-wrapper">
                    <input type="text" id="username" name="username" placeholder="Ingresa tu usuario" required>
                    <i class="fas fa-user input-icon"></i>
                </div>
            </div>

            <div class="form-group">
                <label for="password">Contraseña</label>
                <div class="input-wrapper">
                    <input type="password" id="password" name="password" placeholder="••••••••" required>
                    <i class="fas fa-lock input-icon lock-icon"></i>
                    <i class="fas fa-eye input-icon toggle-password" id="togglePassword" onclick="togglePasswordVisibility()"></i>
                </div>
            </div>

            <div class="remember-forgot">
                <div class="remember-me">
                    <input type="checkbox" id="remember" name="remember">
                    <label for="remember">Recordarme</label>
                </div>
            </div>

            <button type="submit" class="login-btn">
                <i class="fas fa-sign-in-alt"></i>
                Iniciar Sesión
            </button>
        </form>
    </div>

    <script>
        document.getElementById('loginForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const errorMessage = document.getElementById('errorMessage');
            const loginBtn = document.querySelector('.login-btn');

            // Validación básica en el cliente
            if (!username || !password) {
                errorMessage.textContent = 'Por favor, completa todos los campos';
                errorMessage.classList.add('show');
                return false;
            }

            // Deshabilitar botón y mostrar carga
            loginBtn.disabled = true;
            loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando sesión...';

            try {
                // Obtener token CSRF del formulario o meta tag
                const csrfToken = document.querySelector('input[name="_token"]')?.value || 
                                 document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
                
                // Enviar petición a login
                const formData = new FormData();
                formData.append('identificador', username);
                formData.append('password', password);
                if (csrfToken) {
                    formData.append('_token', csrfToken);
                }

                const response = await fetch('{{ url("/login") }}', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN': csrfToken || ''
                    }
                });

                const result = await response.json();

                if (result.success) {
                    // Guardar token y datos de usuario en sessionStorage ANTES de redirigir
                    if (result.token_sesion) {
                        sessionStorage.setItem('token_sesion', result.token_sesion);
                    }
                    if (result.usuario) {
                        sessionStorage.setItem('usuario_logueado', JSON.stringify(result.usuario));
                        sessionStorage.setItem('tipo_usuario', result.usuario.rol ? result.usuario.rol.toLowerCase() : '');
                    }

                    // Redirigir según la URL proporcionada (sin token en la URL)
                    if (result.redirect_url) {
                        // Remover el token de la URL si está presente
                        let redirectUrl = result.redirect_url;
                        if (redirectUrl.includes('?token=')) {
                            redirectUrl = redirectUrl.split('?')[0];
                        }
                        window.location.href = redirectUrl;
                    } else {
                        window.location.href = '/';
                    }
                } else {
                    errorMessage.textContent = result.message || 'Error al iniciar sesión';
                    errorMessage.classList.add('show');
                    loginBtn.disabled = false;
                    loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Iniciar Sesión';
                }
            } catch (error) {
                console.error('Error:', error);
                errorMessage.textContent = 'Error de conexión. Por favor, intenta nuevamente.';
                errorMessage.classList.add('show');
                loginBtn.disabled = false;
                loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Iniciar Sesión';
            }
        });

        // Limpiar mensaje de error al escribir
        document.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', function() {
                document.getElementById('errorMessage').classList.remove('show');
            });
        });

        // Función para mostrar/ocultar contraseña
        function togglePasswordVisibility() {
            const passwordInput = document.getElementById('password');
            const toggleIcon = document.getElementById('togglePassword');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                toggleIcon.classList.remove('fa-eye');
                toggleIcon.classList.add('fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                toggleIcon.classList.remove('fa-eye-slash');
                toggleIcon.classList.add('fa-eye');
            }
        }
    </script>
</body>
</html>
