<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\DatabaseService;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SessionController extends Controller
{
    /**
     * Manejar las acciones de sesión (crear, verificar, cerrar)
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function handle(Request $request): JsonResponse
    {
        $data = $request->all();
        
        // Si viene como JSON, parsearlo
        if ($request->isJson()) {
            $data = array_merge($data, $request->json()->all());
        }

        if (empty($data['action'])) {
            return response()->json([
                'success' => false,
                'message' => 'Acción no especificada'
            ], 400);
        }

        $action = $data['action'];
        $conn = DatabaseService::getConnection();

        try {
            switch ($action) {
                case 'crear':
                    return $this->crear($conn, $data, $request);
                    
                case 'verificar':
                    return $this->verificar($conn, $data);
                    
                case 'cerrar':
                    return $this->cerrar($conn, $data, $request);
                    
                default:
                    return response()->json([
                        'success' => false,
                        'message' => 'Acción no válida'
                    ], 400);
            }
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ], 500);
        } finally {
            if (isset($conn)) {
                $conn->close();
            }
        }
    }

    /**
     * Crear nueva sesión
     * 
     * @param \mysqli $conn
     * @param array $data
     * @param Request $request
     * @return JsonResponse
     */
    private function crear(\mysqli $conn, array $data, Request $request): JsonResponse
    {
        if (empty($data['id_usuario'])) {
            return response()->json([
                'success' => false,
                'message' => 'ID de usuario requerido'
            ], 400);
        }
        
        $id_usuario = intval($data['id_usuario']);
        $token = bin2hex(random_bytes(32)); // Token de 64 caracteres
        $ip = $request->ip();
        $user_agent = $request->userAgent();
        
        // Calcular expiración (24 horas desde ahora)
        $expiracion = date('Y-m-d H:i:s', strtotime('+24 hours'));
        
        $stmt = $conn->prepare("
            INSERT INTO sesiones (id_usuario, token, inicio, ultimo_acceso, expiracion, ip, user_agent, activo)
            VALUES (?, ?, NOW(), NOW(), ?, ?, ?, 1)
        ");
        $stmt->bind_param('issss', $id_usuario, $token, $expiracion, $ip, $user_agent);
        
        if ($stmt->execute()) {
            $id_sesion = $conn->insert_id;
            
            // Registrar acción en registro_acciones
            $stmt_accion = $conn->prepare("
                INSERT INTO registro_acciones (id_usuario, accion, descripcion, tabla_afectada, id_registro_afectado, ip, user_agent)
                VALUES (?, 'LOGIN', 'Usuario inició sesión', 'sesiones', ?, ?, ?)
            ");
            $stmt_accion->bind_param('iiss', $id_usuario, $id_sesion, $ip, $user_agent);
            $stmt_accion->execute();
            $stmt_accion->close();
            
            $stmt->close();
            
            return response()->json([
                'success' => true,
                'token' => $token,
                'id_sesion' => $id_sesion,
                'expiracion' => $expiracion
            ]);
        } else {
            $error = $conn->error;
            $stmt->close();
            return response()->json([
                'success' => false,
                'message' => 'Error al crear sesión: ' . $error
            ], 500);
        }
    }

    /**
     * Verificar si un token es válido
     * 
     * @param \mysqli $conn
     * @param array $data
     * @return JsonResponse
     */
    private function verificar(\mysqli $conn, array $data): JsonResponse
    {
        if (empty($data['token'])) {
            return response()->json([
                'success' => false,
                'message' => 'Token requerido'
            ], 400);
        }
        
        $token = $data['token'];
        $stmt = $conn->prepare("
            SELECT s.*, u.nombres, u.apellidos, (SELECT nombre_usuario FROM credenciales WHERE id_usuario = u.id_usuario LIMIT 1) as usuario, u.correo, u.cargo
            FROM sesiones s
            JOIN usuarios u ON s.id_usuario = u.id_usuario
            WHERE s.token = ? 
            AND s.activo = 1 
            AND s.expiracion > NOW()
            AND u.activo = 1
        ");
        $stmt->bind_param('s', $token);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            $sesion = $result->fetch_assoc();
            
            // Actualizar último acceso
            $stmt_update = $conn->prepare("UPDATE sesiones SET ultimo_acceso = NOW() WHERE id = ?");
            $stmt_update->bind_param('i', $sesion['id']);
            $stmt_update->execute();
            $stmt_update->close();
            
            // Obtener roles del usuario
            $stmt_roles = $conn->prepare("
                SELECT r.id_rol, r.nombre, r.descripcion
                FROM usuario_roles ur
                JOIN roles r ON ur.id_rol = r.id_rol
                WHERE ur.id_usuario = ? AND ur.activo = 1 AND r.activo = 1
            ");
            $stmt_roles->bind_param('i', $sesion['id_usuario']);
            $stmt_roles->execute();
            $roles_result = $stmt_roles->get_result();
            
            $roles = [];
            while ($row = $roles_result->fetch_assoc()) {
                $roles[] = $row;
            }
            $stmt_roles->close();
            $stmt->close();
            
            return response()->json([
                'success' => true,
                'sesion' => $sesion,
                'usuario' => [
                    'id_usuario' => $sesion['id_usuario'],
                    'nombres' => $sesion['nombres'],
                    'apellidos' => $sesion['apellidos'],
                    'usuario' => $sesion['usuario'],
                    'correo' => $sesion['correo'],
                    'cargo' => $sesion['cargo']
                ],
                'roles' => $roles
            ]);
        } else {
            $stmt->close();
            return response()->json([
                'success' => false,
                'message' => 'Token inválido o expirado'
            ], 401);
        }
    }

    /**
     * Cerrar sesión
     * 
     * @param \mysqli $conn
     * @param array $data
     * @param Request $request
     * @return JsonResponse
     */
    private function cerrar(\mysqli $conn, array $data, Request $request): JsonResponse
    {
        if (empty($data['token'])) {
            return response()->json([
                'success' => false,
                'message' => 'Token requerido'
            ], 400);
        }
        
        $token = $data['token'];
        $ip = $request->ip();
        $user_agent = $request->userAgent();
        
        // Obtener información de la sesión antes de cerrarla
        $stmt = $conn->prepare("
            SELECT id, id_usuario FROM sesiones WHERE token = ? AND activo = 1
        ");
        $stmt->bind_param('s', $token);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            $sesion = $result->fetch_assoc();
            $id_sesion = $sesion['id'];
            $id_usuario = $sesion['id_usuario'];
            $stmt->close();
            
            // Desactivar sesión - verificar que se actualice correctamente
            $stmt_close = $conn->prepare("UPDATE sesiones SET activo = 0, ultimo_acceso = NOW() WHERE id = ? AND activo = 1");
            $stmt_close->bind_param('i', $id_sesion);
            
            if ($stmt_close->execute()) {
                $affected_rows = $stmt_close->affected_rows;
                $stmt_close->close();
                
                if ($affected_rows > 0) {
                    // Registrar acción
                    $stmt_accion = $conn->prepare("
                        INSERT INTO registro_acciones (id_usuario, accion, descripcion, tabla_afectada, id_registro_afectado, ip, user_agent)
                        VALUES (?, 'LOGOUT', 'Usuario cerró sesión', 'sesiones', ?, ?, ?)
                    ");
                    $stmt_accion->bind_param('iiss', $id_usuario, $id_sesion, $ip, $user_agent);
                    $stmt_accion->execute();
                    $stmt_accion->close();
                    
                    return response()->json([
                        'success' => true,
                        'message' => 'Sesión cerrada correctamente'
                    ]);
                } else {
                    return response()->json([
                        'success' => false,
                        'message' => 'No se pudo actualizar la sesión. La sesión puede haber sido cerrada previamente.'
                    ], 400);
                }
            } else {
                $error = $conn->error;
                $stmt_close->close();
                return response()->json([
                    'success' => false,
                    'message' => 'Error al cerrar sesión: ' . $error
                ], 500);
            }
        } else {
            $stmt->close();
            return response()->json([
                'success' => false,
                'message' => 'Sesión no encontrada o ya cerrada'
            ], 404);
        }
    }
}

