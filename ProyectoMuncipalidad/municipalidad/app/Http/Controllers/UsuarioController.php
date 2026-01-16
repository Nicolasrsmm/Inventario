<?php

namespace App\Http\Controllers;

use App\Services\DatabaseService;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class UsuarioController extends Controller
{
    /**
     * Manejar las acciones de usuario (perfil, contraseña)
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function handle(Request $request): JsonResponse
    {
        $conn = null;
        try {
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
            
            try {
                $conn = DatabaseService::getConnection();
                if (!$conn) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Error: No se pudo establecer conexión con la base de datos'
                    ], 500);
                }
            } catch (\Exception $dbException) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error al conectar con la base de datos: ' . $dbException->getMessage()
                ], 500);
            }

            switch ($action) {
                case 'obtener_perfil':
                    return $this->obtenerPerfil($conn, $data);
                    
                case 'actualizar_perfil':
                    return $this->actualizarPerfil($conn, $data);
                    
                case 'cambiar_contrasena':
                    return $this->cambiarContrasena($conn, $data);
                    
                case 'obtener_roles':
                    return $this->obtenerRoles($conn);
                    
                case 'registrar_usuario':
                    return $this->registrarUsuario($conn, $data);
                    
                case 'listar_usuarios':
                    return $this->listarUsuarios($conn, $data);
                    
                case 'obtener_usuario_completo':
                    return $this->obtenerUsuarioCompleto($conn, $data);
                    
                case 'actualizar_usuario_admin':
                    return $this->actualizarUsuarioAdmin($conn, $data);
                    
                case 'cambiar_estado_usuario':
                    return $this->cambiarEstadoUsuario($conn, $data);
                    
                case 'obtener_estadisticas_dashboard':
                    return $this->obtenerEstadisticasDashboard($conn, $data);
                    
                default:
                    return response()->json([
                        'success' => false,
                        'message' => 'Acción no reconocida'
                    ], 400);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ], 500);
        } finally {
            if ($conn && $conn instanceof \mysqli) {
                $conn->close();
            }
        }
    }

    /**
     * Obtener perfil completo del usuario
     * 
     * @param \mysqli $conn
     * @param array $data
     * @return JsonResponse
     */
    private function obtenerPerfil(\mysqli $conn, array $data): JsonResponse
    {
        if (empty($data['id_usuario'])) {
            return response()->json([
                'success' => false,
                'message' => 'ID de usuario no especificado'
            ], 400);
        }

        $idUsuario = intval($data['id_usuario']);

        if ($idUsuario <= 0) {
            return response()->json([
                'success' => false,
                'message' => 'ID de usuario inválido'
            ], 400);
        }

        // Consulta básica con los campos que sabemos que existen
        $query = "
            SELECT 
                u.id_usuario,
                u.rut,
                u.nombres,
                u.apellidos,
                u.correo,
                u.cargo
            FROM usuarios u
            WHERE u.id_usuario = ?
        ";

        $stmt = $conn->prepare($query);
        if (!$stmt) {
            return response()->json([
                'success' => false,
                'message' => 'Error al preparar la consulta: ' . $conn->error
            ], 500);
        }

        $stmt->bind_param('i', $idUsuario);
        
        if (!$stmt->execute()) {
            $error = $stmt->error;
            $stmt->close();
            return response()->json([
                'success' => false,
                'message' => 'Error al ejecutar la consulta: ' . $error
            ], 500);
        }
        
        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            $stmt->close();
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado'
            ], 404);
        }

        $usuario = $result->fetch_assoc();
        $stmt->close();

        // Intentar obtener el nombre de usuario (no crítico si falla)
        $nombreUsuario = null;
        
        // Primero intentar desde la columna 'usuario' de la tabla usuarios si existe
        try {
            $queryUsuario = "SELECT usuario FROM usuarios WHERE id_usuario = ?";
            $stmtUsuario = $conn->prepare($queryUsuario);
            if ($stmtUsuario) {
                $stmtUsuario->bind_param('i', $idUsuario);
                if ($stmtUsuario->execute()) {
                    $resultUsuario = $stmtUsuario->get_result();
                    if ($resultUsuario && $resultUsuario->num_rows > 0) {
                        $rowUsuario = $resultUsuario->fetch_assoc();
                        $nombreUsuario = $rowUsuario['usuario'] ?? null;
                    }
                }
                $stmtUsuario->close();
            }
        } catch (\Exception $e) {
            // Si la columna no existe, continuar - no es crítico
        }
        
        // Si no se obtuvo de usuarios.usuario, intentar desde credenciales
        if (empty($nombreUsuario)) {
            try {
                // Verificar si la tabla credenciales existe antes de consultarla
                $checkTable = $conn->query("SHOW TABLES LIKE 'credenciales'");
                if ($checkTable && $checkTable->num_rows > 0) {
                    $queryCred = "SELECT nombre_usuario FROM credenciales WHERE id_usuario = ? ORDER BY fecha_creacion DESC LIMIT 1";
                    $stmtCred = $conn->prepare($queryCred);
                    if ($stmtCred) {
                        $stmtCred->bind_param('i', $idUsuario);
                        if ($stmtCred->execute()) {
                            $resultCred = $stmtCred->get_result();
                            if ($resultCred && $resultCred->num_rows > 0) {
                                $rowCred = $resultCred->fetch_assoc();
                                $nombreUsuario = $rowCred['nombre_usuario'] ?? null;
                            }
                        }
                        $stmtCred->close();
                    }
                }
            } catch (\Exception $e) {
                // Si la tabla no existe o hay error, dejar como null - no es crítico
                // No lanzar excepción, solo continuar
            }
        }
        
        // Asegurar que todos los campos estén presentes
        $usuario = array_merge([
            'id_usuario' => null,
            'rut' => null,
            'usuario' => $nombreUsuario,
            'nombres' => null,
            'apellidos' => null,
            'correo' => null,
            'cargo' => null
        ], $usuario);

        return response()->json([
            'success' => true,
            'usuario' => $usuario
        ]);
    }

    /**
     * Actualizar perfil del usuario
     * 
     * @param \mysqli $conn
     * @param array $data
     * @return JsonResponse
     */
    private function actualizarPerfil(\mysqli $conn, array $data): JsonResponse
    {
        if (empty($data['id_usuario'])) {
            return response()->json([
                'success' => false,
                'message' => 'ID de usuario no especificado'
            ], 400);
        }

        $idUsuario = intval($data['id_usuario']);
        $nombres = $data['nombres'] ?? null;
        $apellidos = $data['apellidos'] ?? null;
        $correo = $data['correo'] ?? null;
        $cargo = $data['cargo'] ?? null;

        // Validaciones
        if (empty($nombres) || empty($apellidos) || empty($correo)) {
            return response()->json([
                'success' => false,
                'message' => 'Los campos Nombre, Apellido y Email son obligatorios'
            ], 400);
        }

        // Validar email
        if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
            return response()->json([
                'success' => false,
                'message' => 'El email no es válido'
            ], 400);
        }

        // Verificar que el usuario existe
        $checkQuery = "SELECT id_usuario FROM usuarios WHERE id_usuario = ?";
        $checkStmt = $conn->prepare($checkQuery);
        $checkStmt->bind_param('i', $idUsuario);
        $checkStmt->execute();
        $checkResult = $checkStmt->get_result();
        
        if ($checkResult->num_rows === 0) {
            $checkStmt->close();
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado'
            ], 404);
        }
        $checkStmt->close();

        // Verificar que el email no esté en uso por otro usuario
        $emailQuery = "SELECT id_usuario FROM usuarios WHERE correo = ? AND id_usuario != ?";
        $emailStmt = $conn->prepare($emailQuery);
        $emailStmt->bind_param('si', $correo, $idUsuario);
        $emailStmt->execute();
        $emailResult = $emailStmt->get_result();
        
        if ($emailResult->num_rows > 0) {
            $emailStmt->close();
            return response()->json([
                'success' => false,
                'message' => 'El email ya está en uso por otro usuario'
            ], 400);
        }
        $emailStmt->close();

        // Construir query de actualización dinámicamente
        $updateFields = [];
        $updateValues = [];
        $types = '';

        if ($nombres !== null) {
            $updateFields[] = "nombres = ?";
            $updateValues[] = $nombres;
            $types .= 's';
        }
        if ($apellidos !== null) {
            $updateFields[] = "apellidos = ?";
            $updateValues[] = $apellidos;
            $types .= 's';
        }
        if ($correo !== null) {
            $updateFields[] = "correo = ?";
            $updateValues[] = $correo;
            $types .= 's';
        }
        if ($cargo !== null) {
            $updateFields[] = "cargo = ?";
            $updateValues[] = $cargo;
            $types .= 's';
        }

        if (empty($updateFields)) {
            return response()->json([
                'success' => false,
                'message' => 'No hay campos para actualizar'
            ], 400);
        }

        $updateQuery = "UPDATE usuarios SET " . implode(', ', $updateFields) . " WHERE id_usuario = ?";
        $types .= 'i';
        $updateValues[] = $idUsuario;

        $updateStmt = $conn->prepare($updateQuery);
        if (!$updateStmt) {
            return response()->json([
                'success' => false,
                'message' => 'Error al preparar la consulta de actualización'
            ], 500);
        }

        $updateStmt->bind_param($types, ...$updateValues);
        
        if ($updateStmt->execute()) {
            $updateStmt->close();
            return response()->json([
                'success' => true,
                'message' => 'Perfil actualizado correctamente'
            ]);
        } else {
            $error = $updateStmt->error;
            $updateStmt->close();
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar el perfil: ' . $error
            ], 500);
        }
    }

    /**
     * Cambiar contraseña del usuario
     * 
     * @param \mysqli $conn
     * @param array $data
     * @return JsonResponse
     */
    private function cambiarContrasena(\mysqli $conn, array $data): JsonResponse
    {
        if (empty($data['id_usuario'])) {
            return response()->json([
                'success' => false,
                'message' => 'ID de usuario no especificado'
            ], 400);
        }

        if (empty($data['contrasena_actual'])) {
            return response()->json([
                'success' => false,
                'message' => 'La contraseña actual es requerida'
            ], 400);
        }

        if (empty($data['nueva_contrasena'])) {
            return response()->json([
                'success' => false,
                'message' => 'La nueva contraseña es requerida'
            ], 400);
        }

        $idUsuario = intval($data['id_usuario']);
        $contrasenaActual = $data['contrasena_actual'];
        $nuevaContrasena = $data['nueva_contrasena'];

        // Validar longitud mínima
        if (strlen($nuevaContrasena) < 8) {
            return response()->json([
                'success' => false,
                'message' => 'La nueva contraseña debe tener al menos 8 caracteres'
            ], 400);
        }

        // Verificar contraseña actual desde la tabla credenciales
        $query = "SELECT contrasena_hash FROM credenciales WHERE id_usuario = ? ORDER BY fecha_creacion DESC LIMIT 1";
        $stmt = $conn->prepare($query);
        if (!$stmt) {
            return response()->json([
                'success' => false,
                'message' => 'Error al preparar la consulta: ' . $conn->error
            ], 500);
        }

        $stmt->bind_param('i', $idUsuario);
        if (!$stmt->execute()) {
            $error = $stmt->error;
            $stmt->close();
            return response()->json([
                'success' => false,
                'message' => 'Error al ejecutar la consulta: ' . $error
            ], 500);
        }
        
        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            $stmt->close();
            return response()->json([
                'success' => false,
                'message' => 'No se encontraron credenciales para este usuario'
            ], 404);
        }

        $credencial = $result->fetch_assoc();
        $stmt->close();

        // Verificar contraseña actual (asumiendo que está hasheada con password_hash)
        if (!password_verify($contrasenaActual, $credencial['contrasena_hash'])) {
            return response()->json([
                'success' => false,
                'message' => 'La contraseña actual es incorrecta'
            ], 400);
        }

        // Hashear nueva contraseña
        $nuevaContrasenaHash = password_hash($nuevaContrasena, PASSWORD_DEFAULT);

        // Actualizar contraseña en credenciales
        $updateQuery = "UPDATE credenciales SET contrasena_hash = ? WHERE id_usuario = ?";
        $updateStmt = $conn->prepare($updateQuery);
        if (!$updateStmt) {
            return response()->json([
                'success' => false,
                'message' => 'Error al preparar la consulta de actualización: ' . $conn->error
            ], 500);
        }

        $updateStmt->bind_param('si', $nuevaContrasenaHash, $idUsuario);
        
        if ($updateStmt->execute()) {
            $updateStmt->close();
            return response()->json([
                'success' => true,
                'message' => 'Contraseña actualizada correctamente'
            ]);
        } else {
            $error = $updateStmt->error;
            $updateStmt->close();
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar la contraseña: ' . $error
            ], 500);
        }
    }

    /**
     * Obtener roles disponibles
     * 
     * @param \mysqli $conn
     * @return JsonResponse
     */
    private function obtenerRoles(\mysqli $conn): JsonResponse
    {
        try {
            $query = "SELECT id_rol, nombre, descripcion FROM roles WHERE activo = 1 ORDER BY nombre";
            $result = $conn->query($query);
            
            if (!$result) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error al ejecutar la consulta: ' . $conn->error
                ], 500);
            }
            
            $roles = [];
            while ($row = $result->fetch_assoc()) {
                $roles[] = [
                    'id_rol' => $row['id_rol'],
                    'nombre' => $row['nombre'],
                    'descripcion' => $row['descripcion'] ?? ''
                ];
            }
            
            return response()->json([
                'success' => true,
                'roles' => $roles
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener roles: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Registrar nuevo usuario
     * 
     * @param \mysqli $conn
     * @param array $data
     * @return JsonResponse
     */
    private function registrarUsuario(\mysqli $conn, array $data): JsonResponse
    {
        // Validaciones
        if (empty($data['rut'])) {
            return response()->json([
                'success' => false,
                'message' => 'RUT es requerido'
            ], 400);
        }

        if (empty($data['nombres']) || empty($data['apellidos'])) {
            return response()->json([
                'success' => false,
                'message' => 'Nombres y apellidos son requeridos'
            ], 400);
        }

        if (empty($data['correo'])) {
            return response()->json([
                'success' => false,
                'message' => 'Correo es requerido'
            ], 400);
        }

        if (!filter_var($data['correo'], FILTER_VALIDATE_EMAIL)) {
            return response()->json([
                'success' => false,
                'message' => 'El correo no es válido'
            ], 400);
        }

        if (empty($data['nombre_usuario'])) {
            return response()->json([
                'success' => false,
                'message' => 'Nombre de usuario es requerido'
            ], 400);
        }

        if (empty($data['correo_electronico'])) {
            return response()->json([
                'success' => false,
                'message' => 'Correo electrónico (credenciales) es requerido'
            ], 400);
        }

        if (!filter_var($data['correo_electronico'], FILTER_VALIDATE_EMAIL)) {
            return response()->json([
                'success' => false,
                'message' => 'El correo electrónico no es válido'
            ], 400);
        }

        if (empty($data['contrasena'])) {
            return response()->json([
                'success' => false,
                'message' => 'Contraseña es requerida'
            ], 400);
        }

        if (strlen($data['contrasena']) < 8) {
            return response()->json([
                'success' => false,
                'message' => 'La contraseña debe tener al menos 8 caracteres'
            ], 400);
        }

        if (empty($data['id_rol'])) {
            return response()->json([
                'success' => false,
                'message' => 'Tipo de usuario (rol) es requerido'
            ], 400);
        }

        $rut = $data['rut'];
        $nombres = $data['nombres'];
        $apellidos = $data['apellidos'];
        $correo = $data['correo'];
        $cargo = $data['cargo'] ?? null;
        $nombreUsuario = $data['nombre_usuario'];
        $correoElectronico = $data['correo_electronico'];
        $contrasena = $data['contrasena'];
        $idRol = intval($data['id_rol']);

        // Verificar que el RUT no esté en uso
        $checkRut = $conn->prepare("SELECT id_usuario FROM usuarios WHERE rut = ?");
        $checkRut->bind_param('s', $rut);
        $checkRut->execute();
        $resultRut = $checkRut->get_result();
        if ($resultRut->num_rows > 0) {
            $checkRut->close();
            return response()->json([
                'success' => false,
                'message' => 'El RUT ya está registrado'
            ], 400);
        }
        $checkRut->close();

        // Verificar que el correo no esté en uso
        $checkCorreo = $conn->prepare("SELECT id_usuario FROM usuarios WHERE correo = ?");
        $checkCorreo->bind_param('s', $correo);
        $checkCorreo->execute();
        $resultCorreo = $checkCorreo->get_result();
        if ($resultCorreo->num_rows > 0) {
            $checkCorreo->close();
            return response()->json([
                'success' => false,
                'message' => 'El correo ya está registrado'
            ], 400);
        }
        $checkCorreo->close();

        // Verificar que el nombre de usuario no esté en uso
        $checkUsuario = $conn->prepare("SELECT id_credencial FROM credenciales WHERE nombre_usuario = ?");
        $checkUsuario->bind_param('s', $nombreUsuario);
        $checkUsuario->execute();
        $resultUsuario = $checkUsuario->get_result();
        if ($resultUsuario->num_rows > 0) {
            $checkUsuario->close();
            return response()->json([
                'success' => false,
                'message' => 'El nombre de usuario ya está en uso'
            ], 400);
        }
        $checkUsuario->close();

        // Verificar que el rol existe
        $checkRol = $conn->prepare("SELECT id_rol FROM roles WHERE id_rol = ? AND activo = 1");
        $checkRol->bind_param('i', $idRol);
        $checkRol->execute();
        $resultRol = $checkRol->get_result();
        if ($resultRol->num_rows === 0) {
            $checkRol->close();
            return response()->json([
                'success' => false,
                'message' => 'El rol seleccionado no existe o no está activo'
            ], 400);
        }
        $checkRol->close();

        // Iniciar transacción
        $conn->begin_transaction();

        try {
            // Insertar en tabla usuarios
            $insertUsuario = $conn->prepare("INSERT INTO usuarios (rut, nombres, apellidos, correo, cargo, activo) VALUES (?, ?, ?, ?, ?, 1)");
            if (!$insertUsuario) {
                throw new \Exception('Error al preparar inserción de usuario: ' . $conn->error);
            }
            $insertUsuario->bind_param('sssss', $rut, $nombres, $apellidos, $correo, $cargo);
            
            if (!$insertUsuario->execute()) {
                throw new \Exception('Error al insertar usuario: ' . $insertUsuario->error);
            }
            
            $idUsuario = $conn->insert_id;
            $insertUsuario->close();

            // Hashear contraseña
            $contrasenaHash = password_hash($contrasena, PASSWORD_DEFAULT);

            // Insertar en tabla credenciales
            $insertCredencial = $conn->prepare("INSERT INTO credenciales (id_usuario, nombre_usuario, correo_electronico, contrasena_hash) VALUES (?, ?, ?, ?)");
            if (!$insertCredencial) {
                throw new \Exception('Error al preparar inserción de credenciales: ' . $conn->error);
            }
            $insertCredencial->bind_param('isss', $idUsuario, $nombreUsuario, $correoElectronico, $contrasenaHash);
            
            if (!$insertCredencial->execute()) {
                throw new \Exception('Error al insertar credenciales: ' . $insertCredencial->error);
            }
            $insertCredencial->close();

            // Insertar en tabla usuario_roles
            $insertRol = $conn->prepare("INSERT INTO usuario_roles (id_usuario, id_rol, activo) VALUES (?, ?, 1)");
            if (!$insertRol) {
                throw new \Exception('Error al preparar inserción de rol: ' . $conn->error);
            }
            $insertRol->bind_param('ii', $idUsuario, $idRol);
            
            if (!$insertRol->execute()) {
                throw new \Exception('Error al insertar rol de usuario: ' . $insertRol->error);
            }
            $insertRol->close();

            // Confirmar transacción
            $conn->commit();

            return response()->json([
                'success' => true,
                'message' => 'Usuario registrado correctamente',
                'id_usuario' => $idUsuario
            ]);

        } catch (\Exception $e) {
            // Revertir transacción en caso de error
            $conn->rollback();
            return response()->json([
                'success' => false,
                'message' => 'Error al registrar usuario: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Listar todos los usuarios del sistema con sus roles
     * 
     * @param \mysqli $conn
     * @param array $data
     * @return JsonResponse
     */
    private function listarUsuarios(\mysqli $conn, array $data): JsonResponse
    {
        try {
            $busqueda = isset($data['busqueda']) ? trim($data['busqueda']) : '';
            $pagina = isset($data['pagina']) ? max(1, intval($data['pagina'])) : 1;
            $limite = isset($data['limite']) ? max(1, intval($data['limite'])) : 10;
            $offset = ($pagina - 1) * $limite;
            
            // Primero contar el total de registros
            $countQuery = "
                SELECT COUNT(DISTINCT u.id_usuario) as total
                FROM usuarios u
            ";
            
            $whereConditions = [];
            $params = [];
            $types = '';
            
            if (!empty($busqueda)) {
                $busquedaLike = '%' . $busqueda . '%';
                $whereConditions[] = "(
                    u.rut LIKE ? OR 
                    u.nombres LIKE ? OR 
                    u.apellidos LIKE ? OR 
                    COALESCE(u.cargo, '') LIKE ? OR 
                    EXISTS (
                        SELECT 1 FROM credenciales c 
                        WHERE c.id_usuario = u.id_usuario 
                        AND c.nombre_usuario LIKE ?
                    ) OR
                    EXISTS (
                        SELECT 1 FROM usuario_roles ur 
                        INNER JOIN roles r ON ur.id_rol = r.id_rol 
                        WHERE ur.id_usuario = u.id_usuario 
                        AND ur.activo = 1 
                        AND r.activo = 1 
                        AND r.nombre LIKE ?
                    )
                )";
                $types .= 'ssssss';
                $params[] = $busquedaLike;
                $params[] = $busquedaLike;
                $params[] = $busquedaLike;
                $params[] = $busquedaLike;
                $params[] = $busquedaLike;
                $params[] = $busquedaLike;
            }
            
            if (!empty($whereConditions)) {
                $countQuery .= " WHERE " . implode(' AND ', $whereConditions);
            }
            
            // Contar total
            $totalRegistros = 0;
            if (!empty($params)) {
                $countStmt = $conn->prepare($countQuery);
                if ($countStmt) {
                    $countStmt->bind_param($types, ...$params);
                    if ($countStmt->execute()) {
                        $countResult = $countStmt->get_result();
                        if ($countRow = $countResult->fetch_assoc()) {
                            $totalRegistros = intval($countRow['total']);
                        }
                    }
                    $countStmt->close();
                }
            } else {
                $countResult = $conn->query($countQuery);
                if ($countResult && $countRow = $countResult->fetch_assoc()) {
                    $totalRegistros = intval($countRow['total']);
                }
            }
            
            // Calcular paginación
            $totalPaginas = ceil($totalRegistros / $limite);
            $paginaActual = min($pagina, max(1, $totalPaginas));
            $offset = ($paginaActual - 1) * $limite;
            
            // Query principal con paginación
            $query = "
                SELECT 
                    u.id_usuario,
                    u.rut,
                    u.nombres,
                    u.apellidos,
                    u.correo,
                    u.cargo,
                    u.activo,
                    (SELECT c.nombre_usuario FROM credenciales c WHERE c.id_usuario = u.id_usuario ORDER BY c.fecha_creacion DESC LIMIT 1) as nombre_usuario,
                    (SELECT c.correo_electronico FROM credenciales c WHERE c.id_usuario = u.id_usuario ORDER BY c.fecha_creacion DESC LIMIT 1) as correo_electronico,
                    (SELECT r.id_rol FROM usuario_roles ur INNER JOIN roles r ON ur.id_rol = r.id_rol WHERE ur.id_usuario = u.id_usuario AND ur.activo = 1 AND r.activo = 1 LIMIT 1) as id_rol,
                    (SELECT r.nombre FROM usuario_roles ur INNER JOIN roles r ON ur.id_rol = r.id_rol WHERE ur.id_usuario = u.id_usuario AND ur.activo = 1 AND r.activo = 1 LIMIT 1) as rol_nombre
                FROM usuarios u
            ";
            
            if (!empty($whereConditions)) {
                $query .= " WHERE " . implode(' AND ', $whereConditions);
            }
            
            $query .= " ORDER BY u.nombres, u.apellidos LIMIT ? OFFSET ?";
            
            // Agregar límite y offset a los parámetros
            $queryParams = $params;
            $queryTypes = $types . 'ii';
            $queryParams[] = $limite;
            $queryParams[] = $offset;

            if (!empty($queryParams)) {
                $stmt = $conn->prepare($query);
                if (!$stmt) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Error al preparar la consulta: ' . $conn->error
                    ], 500);
                }
                
                $stmt->bind_param($queryTypes, ...$queryParams);
                
                if (!$stmt->execute()) {
                    $error = $stmt->error;
                    $stmt->close();
                    return response()->json([
                        'success' => false,
                        'message' => 'Error al ejecutar la consulta: ' . $error
                    ], 500);
                }
                
                $result = $stmt->get_result();
                $stmt->close();
            } else {
                $query .= " LIMIT ? OFFSET ?";
                $stmt = $conn->prepare($query);
                if ($stmt) {
                    $stmt->bind_param('ii', $limite, $offset);
                    if (!$stmt->execute()) {
                        $error = $stmt->error;
                        $stmt->close();
                        return response()->json([
                            'success' => false,
                            'message' => 'Error al ejecutar la consulta: ' . $error
                        ], 500);
                    }
                    $result = $stmt->get_result();
                    $stmt->close();
                } else {
                    $result = $conn->query($query);
                }
            }
            
            if (!$result) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error al ejecutar la consulta: ' . $conn->error
                ], 500);
            }
            
            $usuarios = [];
            while ($row = $result->fetch_assoc()) {
                $usuarios[] = [
                    'id_usuario' => $row['id_usuario'],
                    'rut' => $row['rut'],
                    'nombres' => $row['nombres'],
                    'apellidos' => $row['apellidos'],
                    'correo' => $row['correo'],
                    'cargo' => $row['cargo'],
                    'activo' => (bool)$row['activo'],
                    'nombre_usuario' => $row['nombre_usuario'],
                    'correo_electronico' => $row['correo_electronico'],
                    'id_rol' => $row['id_rol'],
                    'rol_nombre' => $row['rol_nombre']
                ];
            }
            
            return response()->json([
                'success' => true,
                'usuarios' => $usuarios,
                'paginacion' => [
                    'pagina_actual' => $paginaActual,
                    'limite' => $limite,
                    'total_registros' => $totalRegistros,
                    'total_paginas' => $totalPaginas,
                    'tiene_anterior' => $paginaActual > 1,
                    'tiene_siguiente' => $paginaActual < $totalPaginas
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al listar usuarios: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener usuario completo con credenciales y rol
     * 
     * @param \mysqli $conn
     * @param array $data
     * @return JsonResponse
     */
    private function obtenerUsuarioCompleto(\mysqli $conn, array $data): JsonResponse
    {
        if (empty($data['id_usuario'])) {
            return response()->json([
                'success' => false,
                'message' => 'ID de usuario no especificado'
            ], 400);
        }

        $idUsuario = intval($data['id_usuario']);

        if ($idUsuario <= 0) {
            return response()->json([
                'success' => false,
                'message' => 'ID de usuario inválido'
            ], 400);
        }

        try {
            $query = "
                SELECT 
                    u.id_usuario,
                    u.rut,
                    u.nombres,
                    u.apellidos,
                    u.correo,
                    u.cargo,
                    u.activo,
                    c.nombre_usuario,
                    c.correo_electronico,
                    r.id_rol,
                    r.nombre as rol_nombre
                FROM usuarios u
                LEFT JOIN credenciales c ON u.id_usuario = c.id_usuario
                LEFT JOIN usuario_roles ur ON u.id_usuario = ur.id_usuario AND ur.activo = 1
                LEFT JOIN roles r ON ur.id_rol = r.id_rol AND r.activo = 1
                WHERE u.id_usuario = ?
                LIMIT 1
            ";

            $stmt = $conn->prepare($query);
            if (!$stmt) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error al preparar la consulta: ' . $conn->error
                ], 500);
            }

            $stmt->bind_param('i', $idUsuario);
            
            if (!$stmt->execute()) {
                $error = $stmt->error;
                $stmt->close();
                return response()->json([
                    'success' => false,
                    'message' => 'Error al ejecutar la consulta: ' . $error
                ], 500);
            }
            
            $result = $stmt->get_result();

            if ($result->num_rows === 0) {
                $stmt->close();
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no encontrado'
                ], 404);
            }

            $usuario = $result->fetch_assoc();
            $stmt->close();

            return response()->json([
                'success' => true,
                'usuario' => [
                    'id_usuario' => $usuario['id_usuario'],
                    'rut' => $usuario['rut'],
                    'nombres' => $usuario['nombres'],
                    'apellidos' => $usuario['apellidos'],
                    'correo' => $usuario['correo'],
                    'cargo' => $usuario['cargo'],
                    'activo' => (bool)$usuario['activo'],
                    'nombre_usuario' => $usuario['nombre_usuario'],
                    'correo_electronico' => $usuario['correo_electronico'],
                    'id_rol' => $usuario['id_rol'],
                    'rol_nombre' => $usuario['rol_nombre']
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener usuario: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar usuario desde el administrador
     * 
     * @param \mysqli $conn
     * @param array $data
     * @return JsonResponse
     */
    private function actualizarUsuarioAdmin(\mysqli $conn, array $data): JsonResponse
    {
        if (empty($data['id_usuario'])) {
            return response()->json([
                'success' => false,
                'message' => 'ID de usuario no especificado'
            ], 400);
        }

        $idUsuario = intval($data['id_usuario']);
        $nombres = $data['nombres'] ?? null;
        $apellidos = $data['apellidos'] ?? null;
        $correo = $data['correo'] ?? null;
        $cargo = $data['cargo'] ?? null;
        $nombreUsuario = $data['nombre_usuario'] ?? null;
        $correoElectronico = $data['correo_electronico'] ?? null;
        $nuevaContrasena = $data['nueva_contrasena'] ?? null;
        $idRol = isset($data['id_rol']) ? intval($data['id_rol']) : null;

        // Validaciones
        if (empty($nombres) || empty($apellidos) || empty($correo) || empty($nombreUsuario) || empty($correoElectronico) || empty($idRol)) {
            return response()->json([
                'success' => false,
                'message' => 'Los campos obligatorios son: Nombres, Apellidos, Correo, Nombre de Usuario, Correo Electrónico y Tipo de Usuario'
            ], 400);
        }

        // Validar email
        if (!filter_var($correo, FILTER_VALIDATE_EMAIL) || !filter_var($correoElectronico, FILTER_VALIDATE_EMAIL)) {
            return response()->json([
                'success' => false,
                'message' => 'Los emails no son válidos'
            ], 400);
        }

        // Validar contraseña si se proporciona
        if (!empty($nuevaContrasena) && strlen($nuevaContrasena) < 8) {
            return response()->json([
                'success' => false,
                'message' => 'La contraseña debe tener al menos 8 caracteres'
            ], 400);
        }

        // Verificar que el usuario existe
        $checkQuery = "SELECT id_usuario FROM usuarios WHERE id_usuario = ?";
        $checkStmt = $conn->prepare($checkQuery);
        $checkStmt->bind_param('i', $idUsuario);
        $checkStmt->execute();
        $checkResult = $checkStmt->get_result();
        
        if ($checkResult->num_rows === 0) {
            $checkStmt->close();
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado'
            ], 404);
        }
        $checkStmt->close();

        // Verificar que el correo no esté en uso por otro usuario
        $emailQuery = "SELECT id_usuario FROM usuarios WHERE correo = ? AND id_usuario != ?";
        $emailStmt = $conn->prepare($emailQuery);
        $emailStmt->bind_param('si', $correo, $idUsuario);
        $emailStmt->execute();
        $emailResult = $emailStmt->get_result();
        
        if ($emailResult->num_rows > 0) {
            $emailStmt->close();
            return response()->json([
                'success' => false,
                'message' => 'El correo ya está en uso por otro usuario'
            ], 400);
        }
        $emailStmt->close();

        // Verificar que el nombre de usuario no esté en uso por otro usuario
        $usuarioQuery = "SELECT id_credencial FROM credenciales WHERE nombre_usuario = ? AND id_usuario != ?";
        $usuarioStmt = $conn->prepare($usuarioQuery);
        $usuarioStmt->bind_param('si', $nombreUsuario, $idUsuario);
        $usuarioStmt->execute();
        $usuarioResult = $usuarioStmt->get_result();
        
        if ($usuarioResult->num_rows > 0) {
            $usuarioStmt->close();
            return response()->json([
                'success' => false,
                'message' => 'El nombre de usuario ya está en uso'
            ], 400);
        }
        $usuarioStmt->close();

        // Verificar que el rol existe
        $rolQuery = "SELECT id_rol FROM roles WHERE id_rol = ? AND activo = 1";
        $rolStmt = $conn->prepare($rolQuery);
        $rolStmt->bind_param('i', $idRol);
        $rolStmt->execute();
        $rolResult = $rolStmt->get_result();
        
        if ($rolResult->num_rows === 0) {
            $rolStmt->close();
            return response()->json([
                'success' => false,
                'message' => 'El rol seleccionado no existe o no está activo'
            ], 400);
        }
        $rolStmt->close();

        // Iniciar transacción
        $conn->begin_transaction();

        try {
            // Actualizar tabla usuarios
            $updateFields = [];
            $updateValues = [];
            $types = '';

            if ($nombres !== null) {
                $updateFields[] = "nombres = ?";
                $updateValues[] = $nombres;
                $types .= 's';
            }
            if ($apellidos !== null) {
                $updateFields[] = "apellidos = ?";
                $updateValues[] = $apellidos;
                $types .= 's';
            }
            if ($correo !== null) {
                $updateFields[] = "correo = ?";
                $updateValues[] = $correo;
                $types .= 's';
            }
            if ($cargo !== null) {
                $updateFields[] = "cargo = ?";
                $updateValues[] = $cargo;
                $types .= 's';
            }

            if (!empty($updateFields)) {
                $updateQuery = "UPDATE usuarios SET " . implode(', ', $updateFields) . " WHERE id_usuario = ?";
                $types .= 'i';
                $updateValues[] = $idUsuario;

                $updateStmt = $conn->prepare($updateQuery);
                if (!$updateStmt) {
                    throw new \Exception('Error al preparar actualización de usuario: ' . $conn->error);
                }

                $updateStmt->bind_param($types, ...$updateValues);
                
                if (!$updateStmt->execute()) {
                    throw new \Exception('Error al actualizar usuario: ' . $updateStmt->error);
                }
                $updateStmt->close();
            }

            // Actualizar o insertar credenciales
            $checkCred = $conn->prepare("SELECT id_credencial FROM credenciales WHERE id_usuario = ? LIMIT 1");
            $checkCred->bind_param('i', $idUsuario);
            $checkCred->execute();
            $resultCred = $checkCred->get_result();
            $checkCred->close();

            if ($resultCred->num_rows > 0) {
                // Actualizar credenciales existentes
                $updateCredFields = [];
                $updateCredValues = [];
                $credTypes = '';

                if ($nombreUsuario !== null) {
                    $updateCredFields[] = "nombre_usuario = ?";
                    $updateCredValues[] = $nombreUsuario;
                    $credTypes .= 's';
                }
                if ($correoElectronico !== null) {
                    $updateCredFields[] = "correo_electronico = ?";
                    $updateCredValues[] = $correoElectronico;
                    $credTypes .= 's';
                }
                if ($nuevaContrasena !== null) {
                    $contrasenaHash = password_hash($nuevaContrasena, PASSWORD_DEFAULT);
                    $updateCredFields[] = "contrasena_hash = ?";
                    $updateCredValues[] = $contrasenaHash;
                    $credTypes .= 's';
                }

                if (!empty($updateCredFields)) {
                    $updateCredQuery = "UPDATE credenciales SET " . implode(', ', $updateCredFields) . " WHERE id_usuario = ?";
                    $credTypes .= 'i';
                    $updateCredValues[] = $idUsuario;

                    $updateCredStmt = $conn->prepare($updateCredQuery);
                    if (!$updateCredStmt) {
                        throw new \Exception('Error al preparar actualización de credenciales: ' . $conn->error);
                    }

                    $updateCredStmt->bind_param($credTypes, ...$updateCredValues);
                    
                    if (!$updateCredStmt->execute()) {
                        throw new \Exception('Error al actualizar credenciales: ' . $updateCredStmt->error);
                    }
                    $updateCredStmt->close();
                }
            } else {
                // Insertar nuevas credenciales
                $contrasenaHash = $nuevaContrasena ? password_hash($nuevaContrasena, PASSWORD_DEFAULT) : password_hash('temp123', PASSWORD_DEFAULT);
                $insertCred = $conn->prepare("INSERT INTO credenciales (id_usuario, nombre_usuario, correo_electronico, contrasena_hash) VALUES (?, ?, ?, ?)");
                if (!$insertCred) {
                    throw new \Exception('Error al preparar inserción de credenciales: ' . $conn->error);
                }
                $insertCred->bind_param('isss', $idUsuario, $nombreUsuario, $correoElectronico, $contrasenaHash);
                
                if (!$insertCred->execute()) {
                    throw new \Exception('Error al insertar credenciales: ' . $insertCred->error);
                }
                $insertCred->close();
            }

            // Actualizar rol del usuario
            // Primero desactivar todos los roles actuales
            $deactivateRol = $conn->prepare("UPDATE usuario_roles SET activo = 0 WHERE id_usuario = ?");
            $deactivateRol->bind_param('i', $idUsuario);
            $deactivateRol->execute();
            $deactivateRol->close();

            // Verificar si ya existe el rol para este usuario
            $checkRol = $conn->prepare("SELECT id FROM usuario_roles WHERE id_usuario = ? AND id_rol = ?");
            $checkRol->bind_param('ii', $idUsuario, $idRol);
            $checkRol->execute();
            $resultRol = $checkRol->get_result();
            $checkRol->close();

            if ($resultRol->num_rows > 0) {
                // Reactivar el rol existente
                $reactivateRol = $conn->prepare("UPDATE usuario_roles SET activo = 1 WHERE id_usuario = ? AND id_rol = ?");
                $reactivateRol->bind_param('ii', $idUsuario, $idRol);
                $reactivateRol->execute();
                $reactivateRol->close();
            } else {
                // Insertar nuevo rol
                $insertRol = $conn->prepare("INSERT INTO usuario_roles (id_usuario, id_rol, activo) VALUES (?, ?, 1)");
                if (!$insertRol) {
                    throw new \Exception('Error al preparar inserción de rol: ' . $conn->error);
                }
                $insertRol->bind_param('ii', $idUsuario, $idRol);
                
                if (!$insertRol->execute()) {
                    throw new \Exception('Error al insertar rol: ' . $insertRol->error);
                }
                $insertRol->close();
            }

            // Confirmar transacción
            $conn->commit();

            return response()->json([
                'success' => true,
                'message' => 'Usuario actualizado correctamente'
            ]);

        } catch (\Exception $e) {
            // Revertir transacción en caso de error
            $conn->rollback();
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar usuario: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cambiar estado del usuario (habilitar/deshabilitar)
     * 
     * @param \mysqli $conn
     * @param array $data
     * @return JsonResponse
     */
    private function cambiarEstadoUsuario(\mysqli $conn, array $data): JsonResponse
    {
        if (empty($data['id_usuario'])) {
            return response()->json([
                'success' => false,
                'message' => 'ID de usuario no especificado'
            ], 400);
        }

        $idUsuario = intval($data['id_usuario']);
        $activo = isset($data['activo']) ? (intval($data['activo']) === 1) : false;

        // Verificar que el usuario existe
        $checkQuery = "SELECT id_usuario FROM usuarios WHERE id_usuario = ?";
        $checkStmt = $conn->prepare($checkQuery);
        $checkStmt->bind_param('i', $idUsuario);
        $checkStmt->execute();
        $checkResult = $checkStmt->get_result();
        
        if ($checkResult->num_rows === 0) {
            $checkStmt->close();
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado'
            ], 404);
        }
        $checkStmt->close();

        // Actualizar estado
        $updateQuery = "UPDATE usuarios SET activo = ? WHERE id_usuario = ?";
        $updateStmt = $conn->prepare($updateQuery);
        if (!$updateStmt) {
            return response()->json([
                'success' => false,
                'message' => 'Error al preparar la consulta: ' . $conn->error
            ], 500);
        }

        $activoInt = $activo ? 1 : 0;
        $updateStmt->bind_param('ii', $activoInt, $idUsuario);
        
        if ($updateStmt->execute()) {
            $updateStmt->close();
            return response()->json([
                'success' => true,
                'message' => $activo ? 'Usuario habilitado correctamente' : 'Usuario deshabilitado correctamente'
            ]);
        } else {
            $error = $updateStmt->error;
            $updateStmt->close();
            return response()->json([
                'success' => false,
                'message' => 'Error al cambiar el estado del usuario: ' . $error
            ], 500);
        }
    }

    /**
     * Obtener estadísticas del dashboard para administrador
     * 
     * @param \mysqli $conn
     * @param array $data
     * @return JsonResponse
     */
    private function obtenerEstadisticasDashboard(\mysqli $conn, array $data): JsonResponse
    {
        try {
            $estadisticas = [];
            
            // Obtener el tipo de incidencia del usuario (si se proporciona)
            $tipo_incidencia = isset($data['tipo_incidencia']) ? trim($data['tipo_incidencia']) : null;

            // Función auxiliar para ejecutar consultas de conteo de forma segura
            $getCount = function($query, $default = 0) use ($conn) {
                try {
                    $result = $conn->query($query);
                    if ($result && $row = $result->fetch_assoc()) {
                        return intval($row['total']);
                    }
                    return $default;
                } catch (\Exception $e) {
                    return $default;
                }
            };

            // 1. Cantidad total de usuarios
            $estadisticas['usuarios_total'] = $getCount("SELECT COUNT(*) as total FROM usuarios", 0);

            // 2. Cantidad de usuarios por rol
            $usuarios_por_rol = [];
            try {
                $query = "
                    SELECT r.nombre as rol, COUNT(DISTINCT ur.id_usuario) as cantidad
                    FROM roles r
                    LEFT JOIN usuario_roles ur ON r.id_rol = ur.id_rol AND ur.activo = 1
                    WHERE r.activo = 1
                    GROUP BY r.id_rol, r.nombre
                    ORDER BY r.nombre
                ";
                $result = $conn->query($query);
                if ($result) {
                    while ($row = $result->fetch_assoc()) {
                        $usuarios_por_rol[] = [
                            'rol' => $row['rol'],
                            'cantidad' => intval($row['cantidad'])
                        ];
                    }
                }
            } catch (\Exception $e) {
                // Si falla, dejar array vacío
            }
            $estadisticas['usuarios_por_rol'] = $usuarios_por_rol;

            // 3. Cantidad de direcciones
            $estadisticas['direcciones_total'] = $getCount("SELECT COUNT(*) as total FROM direcciones", 0);

            // 4. Cantidad de departamentos
            $estadisticas['departamentos_total'] = $getCount("SELECT COUNT(*) as total FROM departamentos", 0);

            // 5. Cantidad de secciones
            $estadisticas['secciones_total'] = $getCount("SELECT COUNT(*) as total FROM secciones", 0);

            // 6. Cantidad de oficinas
            $estadisticas['oficinas_total'] = $getCount("SELECT COUNT(*) as total FROM oficinas", 0);

            // 7. Cantidad total de inventario
            $estadisticas['inventario_total'] = $getCount("SELECT COUNT(*) as total FROM inventario WHERE activo = 1", 0);

            // 8. Cantidad de inventario por tipo
            $inventario_por_tipo = [];
            try {
                // Verificar si existe la tabla tipos_bien
                $checkTable = $conn->query("SHOW TABLES LIKE 'tipos_bien'");
                if ($checkTable && $checkTable->num_rows > 0) {
                    // Primero verificar si la tabla tiene el campo activo
                    $checkActivo = $conn->query("SHOW COLUMNS FROM tipos_bien LIKE 'activo'");
                    $hasActivo = $checkActivo && $checkActivo->num_rows > 0;
                    
                    $whereClause = $hasActivo ? "WHERE tb.activo = 1" : "";
                    
                    $query = "
                        SELECT tb.nombre as tipo, COUNT(i.id_inventario) as cantidad
                        FROM tipos_bien tb
                        LEFT JOIN inventario i ON tb.id_tipo_bien = i.id_tipo_bien AND i.activo = 1
                        $whereClause
                        GROUP BY tb.id_tipo_bien, tb.nombre
                        HAVING COUNT(i.id_inventario) > 0
                        ORDER BY tb.nombre
                    ";
                    $result = $conn->query($query);
                    if ($result) {
                        while ($row = $result->fetch_assoc()) {
                            $inventario_por_tipo[] = [
                                'tipo' => $row['tipo'],
                                'cantidad' => intval($row['cantidad'])
                            ];
                        }
                    }
                }
            } catch (\Exception $e) {
                // Si falla, dejar array vacío
                error_log("Error al obtener inventario por tipo: " . $e->getMessage());
            }
            $estadisticas['inventario_por_tipo'] = $inventario_por_tipo;

            // 9. Cantidad de reportes recibidos (filtrados por tipo de incidencia si se proporciona)
            // Verificar si existe la tabla incidencias
            $reportes_recibidos = 0;
            $reportes_sin_responder = 0;
            $reportes_respondidos = 0;
            $reportes_enviados = 0;
            try {
                $checkTable = $conn->query("SHOW TABLES LIKE 'incidencias'");
                if ($checkTable && $checkTable->num_rows > 0) {
                    // Construir las consultas con filtro por tipo de incidencia si se proporciona
                    $whereTipo = "";
                    $id_tipo = null;
                    if ($tipo_incidencia && !empty($tipo_incidencia)) {
                        // Obtener el ID del tipo de incidencia
                        $tipoQuery = "SELECT id_tipo FROM tipos_incidencia WHERE nombre = ? LIMIT 1";
                        $tipoStmt = $conn->prepare($tipoQuery);
                        if ($tipoStmt) {
                            $tipoStmt->bind_param('s', $tipo_incidencia);
                            $tipoStmt->execute();
                            $tipoResult = $tipoStmt->get_result();
                            if ($tipoResult && $tipoRow = $tipoResult->fetch_assoc()) {
                                $id_tipo = intval($tipoRow['id_tipo']);
                                $whereTipo = " AND i.id_tipo = $id_tipo";
                            }
                            $tipoStmt->close();
                        }
                    }
                    
                    // Obtener ID del usuario si se proporciona (para reportes enviados)
                    $id_usuario = isset($data['id_usuario']) ? intval($data['id_usuario']) : null;
                    
                    // Los reportes se filtran por descripcion_solucion, no por estado
                    // Pendientes: descripcion_solucion IS NULL OR descripcion_solucion = ''
                    // Resueltos: descripcion_solucion IS NOT NULL AND descripcion_solucion != ''
                    $reportes_recibidos = $getCount("SELECT COUNT(*) as total FROM incidencias i WHERE 1=1" . $whereTipo, 0);
                    $reportes_sin_responder = $getCount("SELECT COUNT(*) as total FROM incidencias i WHERE (i.descripcion_solucion IS NULL OR i.descripcion_solucion = '')" . $whereTipo, 0);
                    $reportes_respondidos = $getCount("SELECT COUNT(*) as total FROM incidencias i WHERE i.descripcion_solucion IS NOT NULL AND i.descripcion_solucion != ''" . $whereTipo, 0);
                    
                    // Reportes enviados por el usuario (si se proporciona id_usuario)
                    $reportes_enviados = 0;
                    $reportes_respondidos_usuario = 0;
                    $reportes_sin_responder_usuario = 0;
                    if ($id_usuario) {
                        $whereEnviados = " WHERE i.id_usuario_reporta = $id_usuario";
                        if ($id_tipo) {
                            $whereEnviados .= " AND i.id_tipo = $id_tipo";
                        }
                        $reportes_enviados = $getCount("SELECT COUNT(*) as total FROM incidencias i" . $whereEnviados, 0);
                        
                        // Reportes respondidos del usuario (con descripcion_solucion)
                        $reportes_respondidos_usuario = $getCount("SELECT COUNT(*) as total FROM incidencias i" . $whereEnviados . " AND i.descripcion_solucion IS NOT NULL AND i.descripcion_solucion != ''", 0);
                        
                        // Reportes sin responder del usuario (sin descripcion_solucion)
                        $reportes_sin_responder_usuario = $getCount("SELECT COUNT(*) as total FROM incidencias i" . $whereEnviados . " AND (i.descripcion_solucion IS NULL OR i.descripcion_solucion = '')", 0);
                    }
                }
            } catch (\Exception $e) {
                // Si falla, dejar en 0
                error_log("Error al obtener estadísticas de reportes: " . $e->getMessage());
            }
            $estadisticas['reportes_recibidos'] = $reportes_recibidos;
            $estadisticas['reportes_sin_responder'] = $reportes_sin_responder;
            $estadisticas['reportes_respondidos'] = $reportes_respondidos;
            if (isset($data['id_usuario']) && $data['id_usuario']) {
                $estadisticas['reportes_enviados'] = $reportes_enviados;
                $estadisticas['reportes_respondidos_usuario'] = $reportes_respondidos_usuario;
                $estadisticas['reportes_sin_responder_usuario'] = $reportes_sin_responder_usuario;
            }

            // 10. Estadísticas adicionales para Informática (oficinas, items, movimientos pendientes)
            if ($tipo_incidencia && (strtolower($tipo_incidencia) === 'informática' || strtolower($tipo_incidencia) === 'informatica')) {
                // Total de oficinas
                $estadisticas['oficinas_total'] = $getCount("SELECT COUNT(*) as total FROM oficinas", 0);
                
                // Total de items de inventario activos
                $estadisticas['items_total'] = $getCount("SELECT COUNT(*) as total FROM inventario WHERE activo = 1", 0);
                
                // Movimientos pendientes de revisión (solo los realizados por usuarios con rol Informática)
                $movimientos_pendientes = 0;
                try {
                    $movQuery = "
                        SELECT COUNT(*) as total
                        FROM movimientos_inventario m
                        INNER JOIN usuarios u ON m.id_usuario_responsable = u.id_usuario
                        INNER JOIN usuario_roles ur ON u.id_usuario = ur.id_usuario
                        INNER JOIN roles r ON ur.id_rol = r.id_rol
                        WHERE LOWER(r.nombre) IN ('informática', 'informatica')
                        AND ur.activo = 1
                        AND r.activo = 1
                        AND (m.revisado = 0 OR m.revisado IS NULL)
                    ";
                    $movResult = $conn->query($movQuery);
                    if ($movResult && $movRow = $movResult->fetch_assoc()) {
                        $movimientos_pendientes = intval($movRow['total']);
                    }
                } catch (\Exception $e) {
                    error_log("Error al obtener movimientos pendientes: " . $e->getMessage());
                }
                $estadisticas['movimientos_pendientes'] = $movimientos_pendientes;
                
                // Total de movimientos realizados por usuarios con rol Informática
                $total_movimientos = 0;
                try {
                    $totalMovQuery = "
                        SELECT COUNT(*) as total
                        FROM movimientos_inventario m
                        INNER JOIN usuarios u ON m.id_usuario_responsable = u.id_usuario
                        INNER JOIN usuario_roles ur ON u.id_usuario = ur.id_usuario
                        INNER JOIN roles r ON ur.id_rol = r.id_rol
                        WHERE LOWER(r.nombre) IN ('informática', 'informatica')
                        AND ur.activo = 1
                        AND r.activo = 1
                    ";
                    $totalMovResult = $conn->query($totalMovQuery);
                    if ($totalMovResult && $totalMovRow = $totalMovResult->fetch_assoc()) {
                        $total_movimientos = intval($totalMovRow['total']);
                    }
                } catch (\Exception $e) {
                    error_log("Error al obtener total de movimientos: " . $e->getMessage());
                }
                $estadisticas['total_movimientos'] = $total_movimientos;
            }
            
            // 11. Estadísticas adicionales para Inventario (oficinas, items activos/baja, movimientos pendientes)
            if ($tipo_incidencia && strtolower($tipo_incidencia) === 'inventario') {
                // Total de oficinas
                $estadisticas['oficinas_total'] = $getCount("SELECT COUNT(*) as total FROM oficinas", 0);
                
                // Total de items de inventario
                $estadisticas['items_total'] = $getCount("SELECT COUNT(*) as total FROM inventario", 0);
                
                // Items activos
                $estadisticas['items_activos'] = $getCount("SELECT COUNT(*) as total FROM inventario WHERE activo = 1", 0);
                
                // Items de baja
                $estadisticas['items_baja'] = $getCount("SELECT COUNT(*) as total FROM inventario WHERE activo = 0", 0);
                
                // Movimientos pendientes de revisión (todos los que no están revisados, sin filtrar por usuario)
                $movimientos_pendientes = 0;
                try {
                    $movQuery = "
                        SELECT COUNT(*) as total
                        FROM movimientos_inventario m
                        WHERE (m.revisado = 0 OR m.revisado IS NULL)
                    ";
                    $movResult = $conn->query($movQuery);
                    if ($movResult && $movRow = $movResult->fetch_assoc()) {
                        $movimientos_pendientes = intval($movRow['total']);
                    }
                } catch (\Exception $e) {
                    error_log("Error al obtener movimientos pendientes: " . $e->getMessage());
                }
                $estadisticas['movimientos_pendientes'] = $movimientos_pendientes;
                
                // Total de cambios realizados (todos los movimientos)
                $total_cambios = 0;
                try {
                    $totalCambiosQuery = "SELECT COUNT(*) as total FROM movimientos_inventario";
                    $totalCambiosResult = $conn->query($totalCambiosQuery);
                    if ($totalCambiosResult && $totalCambiosRow = $totalCambiosResult->fetch_assoc()) {
                        $total_cambios = intval($totalCambiosRow['total']);
                    }
                } catch (\Exception $e) {
                    error_log("Error al obtener total de cambios: " . $e->getMessage());
                }
                $estadisticas['total_cambios'] = $total_cambios;
            }

            return response()->json([
                'success' => true,
                'data' => $estadisticas
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener estadísticas: ' . $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ], 500);
        }
    }
}

