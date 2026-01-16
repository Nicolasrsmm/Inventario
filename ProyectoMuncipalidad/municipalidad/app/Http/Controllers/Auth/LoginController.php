<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\DatabaseService;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class LoginController extends Controller
{
    /**
     * Manejar el proceso de login
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function login(Request $request): JsonResponse
    {
        $data = $request->all();

        if (empty($data['identificador']) || empty($data['password'])) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario y contraseña son requeridos'
            ], 400);
        }

        try {
            $identificador = trim($data['identificador']);
            $password = $data['password'];
            $conn = DatabaseService::getConnection();

            // Buscar usuario por nombre de usuario o correo (puede estar en usuarios o credenciales)
            // Nota: La contraseña está en credenciales.contrasena_hash, no en usuarios.password
            $stmt = $conn->prepare("
                SELECT 
                    u.id_usuario,
                    u.rut,
                    u.nombres,
                    u.apellidos,
                    u.correo,
                    u.cargo,
                    c.nombre_usuario,
                    c.correo_electronico,
                    c.contrasena_hash,
                    r.id_rol,
                    r.nombre as nombre_rol
                FROM usuarios u
                LEFT JOIN credenciales c ON u.id_usuario = c.id_usuario
                JOIN usuario_roles ur ON u.id_usuario = ur.id_usuario
                JOIN roles r ON ur.id_rol = r.id_rol
                WHERE (u.correo = ? OR c.nombre_usuario = ? OR c.correo_electronico = ?)
                AND u.activo = 1 
                AND ur.activo = 1
                AND r.activo = 1
            ");
            $stmt->bind_param('sss', $identificador, $identificador, $identificador);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($result->num_rows > 0) {
                $usuarios = $result->fetch_all(MYSQLI_ASSOC);
                
                // Verificar contraseña - está en credenciales.contrasena_hash
                $usuario = $usuarios[0];
                $password_valid = false;
                
                // Verificar con contrasena_hash de credenciales
                if (!empty($usuario['contrasena_hash']) && password_verify($password, $usuario['contrasena_hash'])) {
                    $password_valid = true;
                }
                
                if ($password_valid) {
                    // Obtener roles únicos del usuario
                    $roles = array_unique(array_column($usuarios, 'nombre_rol'));
                    
                    // Si tiene múltiples roles, devolver información para selección
                    if (count($roles) > 1) {
                        $stmt->close();
                        $conn->close();
                        
                        return response()->json([
                            'success' => true,
                            'message' => 'Usuario con múltiples roles detectado',
                            'multiple_roles' => true,
                            'roles' => $roles,
                            'usuario' => [
                                'id_usuario' => $usuario['id_usuario'],
                                'usuario' => $usuario['nombre_usuario'] ?? null,
                                'nombres' => $usuario['nombres'],
                                'apellidos' => $usuario['apellidos'],
                                'rut' => $usuario['rut'],
                                'correo' => $usuario['correo'] ?? $usuario['correo_electronico'],
                                'cargo' => $usuario['cargo']
                            ]
                        ]);
                    } else {
                        // Usuario con un solo rol - proceder normalmente
                        $rol = $roles[0];
                        
                        // Crear sesión directamente
                        $token = bin2hex(random_bytes(32)); // Token de 64 caracteres
                        $ip = $request->ip();
                        $user_agent = $request->userAgent();
                        $expiracion = date('Y-m-d H:i:s', strtotime('+24 hours'));
                        
                        $stmt_sesion = $conn->prepare("
                            INSERT INTO sesiones (id_usuario, token, inicio, ultimo_acceso, expiracion, ip, user_agent, activo)
                            VALUES (?, ?, NOW(), NOW(), ?, ?, ?, 1)
                        ");
                        $stmt_sesion->bind_param('issss', $usuario['id_usuario'], $token, $expiracion, $ip, $user_agent);
                        
                        if ($stmt_sesion->execute()) {
                            $id_sesion = $conn->insert_id;
                            
                            // Registrar acción en registro_acciones
                            $stmt_accion = $conn->prepare("
                                INSERT INTO registro_acciones (id_usuario, accion, descripcion, tabla_afectada, id_registro_afectado, ip, user_agent)
                                VALUES (?, 'LOGIN', 'Usuario inició sesión', 'sesiones', ?, ?, ?)
                            ");
                            $stmt_accion->bind_param('iiss', $usuario['id_usuario'], $id_sesion, $ip, $user_agent);
                            $stmt_accion->execute();
                            $stmt_accion->close();
                        } else {
                            $token = null;
                        }
                        $stmt_sesion->close();
                        
                        // Determinar URL de redirección según el rol
                        // Obtener el base path desde la request
                        $request_uri = $request->server('REQUEST_URI', '');
                        if (strpos($request_uri, '/login') !== false) {
                            $base_path = substr($request_uri, 0, strpos($request_uri, '/login'));
                        } else {
                            $base_path = $request->getBasePath() ?: '/ProyectoMuncipalidad/municipalidad/public';
                        }
                        
                        $redirect_url = '';
                        switch (strtolower($rol)) {
                            case 'administrador':
                                $redirect_url = $base_path . '/administrador';
                                break;
                            case 'inventario':
                                $redirect_url = $base_path . '/inventario';
                                break;
                            case 'informática':
                            case 'informatica':
                                $redirect_url = $base_path . '/informatica';
                                break;
                            case 'usuario municipal':
                            case 'usuariomunicipal':
                                $redirect_url = $base_path . '/municipal';
                                break;
                            case 'electricidad':
                                $redirect_url = $base_path . '/electricidad';
                                break;
                            case 'técnico general':
                            case 'tecnicogeneral':
                            case 'tecnico general':
                                $redirect_url = $base_path . '/tecgeneral';
                                break;
                            default:
                                $redirect_url = $base_path . '/?error=Rol no válido';
                        }
                        
                        $stmt->close();
                        $conn->close();
                        
                        return response()->json([
                            'success' => true,
                            'message' => 'Login exitoso',
                            'redirect_url' => $redirect_url,
                            'token_sesion' => $token,
                            'usuario' => [
                                'id_usuario' => $usuario['id_usuario'],
                                'usuario' => $usuario['nombre_usuario'] ?? null,
                                'nombres' => $usuario['nombres'],
                                'apellidos' => $usuario['apellidos'],
                                'rut' => $usuario['rut'],
                                'correo' => $usuario['correo'] ?? $usuario['correo_electronico'],
                                'cargo' => $usuario['cargo'],
                                'rol' => $rol
                            ]
                        ]);
                    }
                }
            }
            
            $stmt->close();
            $conn->close();
            
            return response()->json([
                'success' => false,
                'message' => 'Usuario o contraseña incorrectos'
            ], 401);
            
        } catch (Exception $e) {
            if (isset($conn)) {
                if (isset($stmt) && $stmt) {
                    $stmt->close();
                }
                $conn->close();
            }
            return response()->json([
                'success' => false,
                'message' => 'Error del servidor: ' . $e->getMessage()
            ], 500);
        } catch (\Error $e) {
            if (isset($conn)) {
                if (isset($stmt) && $stmt) {
                    $stmt->close();
                }
                $conn->close();
            }
            return response()->json([
                'success' => false,
                'message' => 'Error del servidor: ' . $e->getMessage()
            ], 500);
        }
    }
}

