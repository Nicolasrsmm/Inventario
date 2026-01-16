<?php

namespace App\Http\Controllers;

use App\Services\DatabaseService;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ReportesController extends Controller
{
    /**
     * Manejar las acciones de reportes e incidencias
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
                case 'obtener_tipos_incidencia':
                    return $this->obtenerTiposIncidencia($conn);
                    
                case 'crear_incidencia':
                    return $this->crearIncidencia($conn, $data);
                    
                case 'listar_mis_reportes':
                    return $this->listarMisReportes($conn, $data);
                    
                case 'eliminar_reporte':
                    return $this->eliminarReporte($conn, $data);
                    
                case 'listar_reportes_recibidos':
                    return $this->listarReportesRecibidos($conn, $data);
                    
                case 'responder_reporte':
                    return $this->responderReporte($conn, $data);
                    
                case 'obtener_reporte':
                    return $this->obtenerReporte($conn, $data);
                    
                default:
                    return response()->json([
                        'success' => false,
                        'message' => 'Acción no reconocida'
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
     * Obtener tipos de incidencia
     * 
     * @param \mysqli $conn
     * @return JsonResponse
     */
    private function obtenerTiposIncidencia(\mysqli $conn): JsonResponse
    {
        // Primero verificar si la tabla existe
        $checkTable = $conn->query("SHOW TABLES LIKE 'tipos_incidencia'");
        if ($checkTable->num_rows == 0) {
            // La tabla no existe, crearla
            $this->crearTablaTiposIncidencia($conn);
        }

        // Query simple: solo id_tipo y nombre (sin descripcion, activo, etc.)
        $query = "
            SELECT id_tipo, nombre
            FROM tipos_incidencia
            ORDER BY nombre ASC
        ";

        $result = $conn->query($query);
        
        if (!$result) {
            return response()->json([
                'success' => false,
                'message' => 'Error al ejecutar consulta: ' . $conn->error
            ], 500);
        }

        $tipos = [];
        while ($row = $result->fetch_assoc()) {
            $tipos[] = [
                'id_tipo' => $row['id_tipo'],
                'nombre' => $row['nombre']
            ];
        }

        // Si no hay tipos, crear algunos por defecto
        if (empty($tipos)) {
            $this->crearTiposIncidenciaPorDefecto($conn);
            // Volver a consultar
            $result = $conn->query($query);
            if ($result) {
                while ($row = $result->fetch_assoc()) {
                    $tipos[] = [
                        'id_tipo' => $row['id_tipo'],
                        'nombre' => $row['nombre']
                    ];
                }
            }
        }

        return response()->json([
            'success' => true,
            'data' => $tipos
        ]);
    }

    /**
     * Crear tabla tipos_incidencia si no existe
     * 
     * @param \mysqli $conn
     * @return void
     */
    private function crearTablaTiposIncidencia(\mysqli $conn): void
    {
        $query = "
            CREATE TABLE IF NOT EXISTS tipos_incidencia (
                id_tipo INT PRIMARY KEY AUTO_INCREMENT,
                nombre VARCHAR(100) NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ";

        $conn->query($query);
    }

    /**
     * Crear tipos de incidencia por defecto
     * 
     * @param \mysqli $conn
     * @return void
     */
    private function crearTiposIncidenciaPorDefecto(\mysqli $conn): void
    {
        $tipos = [
            'Informática',
            'Electricidad',
            'Técnico General',
            'Administrador'
        ];

        $stmt = $conn->prepare("
            INSERT INTO tipos_incidencia (nombre)
            VALUES (?)
        ");

        foreach ($tipos as $tipo) {
            $stmt->bind_param('s', $tipo);
            $stmt->execute();
        }

        $stmt->close();
    }

    /**
     * Crear una nueva incidencia
     * 
     * @param \mysqli $conn
     * @param array $data
     * @return JsonResponse
     */
    private function crearIncidencia(\mysqli $conn, array $data): JsonResponse
    {
        // Validar campos requeridos
        if (empty($data['id_usuario_reporta']) || empty($data['id_tipo']) || empty($data['descripcion_reporte'])) {
            return response()->json([
                'success' => false,
                'message' => 'Faltan campos requeridos'
            ], 400);
        }

        // Obtener datos de la oficina si se proporciona
        $id_oficina = isset($data['id_oficina']) && !empty($data['id_oficina']) ? intval($data['id_oficina']) : null;
        $id_direccion = isset($data['id_direccion']) && !empty($data['id_direccion']) ? intval($data['id_direccion']) : null;
        $id_departamento = isset($data['id_departamento']) && !empty($data['id_departamento']) ? intval($data['id_departamento']) : null;
        $id_seccion = isset($data['id_seccion']) && !empty($data['id_seccion']) ? intval($data['id_seccion']) : null;
        
        // Si se proporciona id_oficina, obtener los datos de ubicación desde la oficina
        if ($id_oficina && (!$id_direccion || !$id_departamento || !$id_seccion)) {
            $query_oficina = "
                SELECT id_direccion, id_departamento, id_seccion
                FROM oficinas
                WHERE id_oficina = ?
            ";
            
            $stmt_oficina = $conn->prepare($query_oficina);
            if ($stmt_oficina) {
                $stmt_oficina->bind_param('i', $id_oficina);
                $stmt_oficina->execute();
                $result_oficina = $stmt_oficina->get_result();
                
                if ($row_oficina = $result_oficina->fetch_assoc()) {
                    $id_direccion = $id_direccion ?? $row_oficina['id_direccion'];
                    $id_departamento = $id_departamento ?? $row_oficina['id_departamento'];
                    $id_seccion = $id_seccion ?? $row_oficina['id_seccion'];
                }
                
                $stmt_oficina->close();
            }
        }

        // Preparar datos
        $id_usuario_reporta = intval($data['id_usuario_reporta']);
        $id_inventario = isset($data['id_inventario']) && !empty($data['id_inventario']) ? intval($data['id_inventario']) : null;
        $id_tipo = intval($data['id_tipo']);
        $descripcion_reporte = trim($data['descripcion_reporte']);
        
        // Usar zona horaria de Chile
        date_default_timezone_set('America/Santiago');
        $fecha_reporte = date('Y-m-d H:i:s');
        
        $estado = 'Reportada';

        // Construir query dinámicamente para manejar NULLs correctamente
        $fields = ['id_usuario_reporta', 'id_tipo', 'descripcion_reporte', 'fecha_reporte', 'estado'];
        $placeholders = ['?', '?', '?', '?', '?'];
        $params = [$id_usuario_reporta, $id_tipo, $descripcion_reporte, $fecha_reporte, $estado];
        $types = 'iisss';

        // Agregar campos opcionales
        if ($id_inventario !== null) {
            $fields[] = 'id_inventario';
            $placeholders[] = '?';
            $params[] = $id_inventario;
            $types .= 'i';
        } else {
            $fields[] = 'id_inventario';
            $placeholders[] = 'NULL';
        }

        if ($id_direccion !== null) {
            $fields[] = 'id_direccion';
            $placeholders[] = '?';
            $params[] = $id_direccion;
            $types .= 'i';
        } else {
            $fields[] = 'id_direccion';
            $placeholders[] = 'NULL';
        }

        if ($id_departamento !== null) {
            $fields[] = 'id_departamento';
            $placeholders[] = '?';
            $params[] = $id_departamento;
            $types .= 'i';
        } else {
            $fields[] = 'id_departamento';
            $placeholders[] = 'NULL';
        }

        if ($id_seccion !== null) {
            $fields[] = 'id_seccion';
            $placeholders[] = '?';
            $params[] = $id_seccion;
            $types .= 'i';
        } else {
            $fields[] = 'id_seccion';
            $placeholders[] = 'NULL';
        }

        if ($id_oficina !== null) {
            $fields[] = 'id_oficina';
            $placeholders[] = '?';
            $params[] = $id_oficina;
            $types .= 'i';
        } else {
            $fields[] = 'id_oficina';
            $placeholders[] = 'NULL';
        }

        $query = "
            INSERT INTO incidencias (" . implode(', ', $fields) . ")
            VALUES (" . implode(', ', $placeholders) . ")
        ";

        $stmt = $conn->prepare($query);
        if (!$stmt) {
            return response()->json([
                'success' => false,
                'message' => 'Error al preparar consulta: ' . $conn->error
            ], 500);
        }

        // Solo bindear parámetros que no son NULL
        if (!empty($params)) {
            $stmt->bind_param($types, ...$params);
        }

        if ($stmt->execute()) {
            $id_incidencia = $conn->insert_id;
            $stmt->close();
            
            return response()->json([
                'success' => true,
                'message' => 'Reporte creado correctamente',
                'data' => [
                    'id_incidencia' => $id_incidencia
                ]
            ]);
        } else {
            $error = $conn->error;
            $stmt->close();
            return response()->json([
                'success' => false,
                'message' => 'Error al crear el reporte: ' . $error
            ], 500);
        }
    }

    /**
     * Listar reportes del usuario actual
     * 
     * @param \mysqli $conn
     * @param array $data
     * @return JsonResponse
     */
    private function listarMisReportes(\mysqli $conn, array $data): JsonResponse
    {
        if (empty($data['id_usuario'])) {
            return response()->json([
                'success' => false,
                'message' => 'ID de usuario no proporcionado'
            ], 400);
        }

        $id_usuario = intval($data['id_usuario']);
        
        // Verificar si solo se deben mostrar reportes resueltos
        $solo_resueltos = isset($data['solo_resueltos']) && $data['solo_resueltos'] === true;
        
        // Obtener parámetros de paginación
        $pagina = isset($data['pagina']) ? max(1, intval($data['pagina'])) : 1;
        $limite = isset($data['limite']) ? max(1, intval($data['limite'])) : 10;
        $offset = ($pagina - 1) * $limite;
        
        // Obtener filtros adicionales
        $filtros = isset($data['filtros']) ? $data['filtros'] : [];
        $filtro_usuario = isset($filtros['usuario']) ? trim($filtros['usuario']) : '';
        $filtro_oficina = isset($filtros['oficina']) ? trim($filtros['oficina']) : '';
        $filtro_fecha_reporte = isset($filtros['fecha_reporte']) ? trim($filtros['fecha_reporte']) : '';
        $filtro_fecha_solucion = isset($filtros['fecha_solucion']) ? trim($filtros['fecha_solucion']) : '';

        $query = "
            SELECT 
                i.id_incidencia,
                i.id_usuario_reporta,
                i.id_inventario,
                i.id_tipo,
                i.descripcion_reporte,
                i.fecha_reporte,
                i.estado,
                i.id_usuario_tecnico,
                i.descripcion_solucion,
                i.fecha_solucion,
                i.resultado,
                i.id_direccion,
                i.id_departamento,
                i.id_seccion,
                i.id_oficina,
                -- Tipo de incidencia
                ti.nombre AS tipo_nombre,
                -- Oficina
                o.nombre AS oficina_nombre,
                o.piso AS oficina_piso,
                o.ubicacion_fisica AS oficina_ubicacion_interna,
                -- Dirección, Departamento, Sección
                d.nombre AS direccion_nombre,
                dep.nombre AS departamento_nombre,
                s.nombre AS seccion_nombre,
                -- Item de inventario
                inv.codigo_patrimonial,
                inv.descripcion AS item_descripcion,
                -- Usuario técnico
                ut.nombres AS tecnico_nombres,
                ut.apellidos AS tecnico_apellidos,
                ut.cargo AS tecnico_cargo,
                -- Usuario que reporta
                ur.nombres AS usuario_reporta_nombres,
                ur.apellidos AS usuario_reporta_apellidos,
                ur.cargo AS usuario_reporta_cargo
            FROM incidencias i
            LEFT JOIN tipos_incidencia ti ON i.id_tipo = ti.id_tipo
            LEFT JOIN oficinas o ON i.id_oficina = o.id_oficina
            LEFT JOIN direcciones d ON i.id_direccion = d.id_direccion
            LEFT JOIN departamentos dep ON i.id_departamento = dep.id_departamento
            LEFT JOIN secciones s ON i.id_seccion = s.id_seccion
            LEFT JOIN inventario inv ON i.id_inventario = inv.id_inventario
            LEFT JOIN usuarios ut ON i.id_usuario_tecnico = ut.id_usuario
            LEFT JOIN usuarios ur ON i.id_usuario_reporta = ur.id_usuario
            WHERE i.id_usuario_reporta = ?
        ";
        
        $params = [$id_usuario];
        $types = 'i';
        
        // Filtrar solo resueltos si se solicita
        if ($solo_resueltos) {
            $query .= " AND i.descripcion_solucion IS NOT NULL AND i.descripcion_solucion != ''";
        }
        
        // Agregar filtros adicionales
        if (!empty($filtro_usuario)) {
            $query .= " AND (CONCAT(ur.nombres, ' ', ur.apellidos) LIKE ? OR ur.cargo LIKE ?)";
            $params[] = '%' . $filtro_usuario . '%';
            $params[] = '%' . $filtro_usuario . '%';
            $types .= 'ss';
        }
        
        if (!empty($filtro_oficina)) {
            $query .= " AND o.nombre LIKE ?";
            $params[] = '%' . $filtro_oficina . '%';
            $types .= 's';
        }
        
        if (!empty($filtro_fecha_reporte)) {
            $query .= " AND DATE(i.fecha_reporte) = ?";
            $params[] = $filtro_fecha_reporte;
            $types .= 's';
        }
        
        if (!empty($filtro_fecha_solucion)) {
            $query .= " AND DATE(i.fecha_solucion) = ?";
            $params[] = $filtro_fecha_solucion;
            $types .= 's';
        }
        
        // Contar total de registros (antes de agregar ORDER BY y LIMIT)
        $count_query = "SELECT COUNT(*) as total FROM (" . $query . ") as subquery";
        $stmt_count = $conn->prepare($count_query);
        $total_registros = 0;
        
        if ($stmt_count) {
            if (count($params) > 0) {
                $stmt_count->bind_param($types, ...$params);
            }
            if ($stmt_count->execute()) {
                $result_count = $stmt_count->get_result();
                if ($row_count = $result_count->fetch_assoc()) {
                    $total_registros = intval($row_count['total']);
                }
            }
            $stmt_count->close();
        }
        
        // Calcular paginación
        $total_paginas = $total_registros > 0 ? ceil($total_registros / $limite) : 1;
        $tiene_anterior = $pagina > 1;
        $tiene_siguiente = $pagina < $total_paginas;
        
        $query .= " ORDER BY i.fecha_reporte DESC";
        
        // Agregar LIMIT y OFFSET
        $query .= " LIMIT ? OFFSET ?";
        $params[] = $limite;
        $params[] = $offset;
        $types .= 'ii';

        $stmt = $conn->prepare($query);
        if (!$stmt) {
            return response()->json([
                'success' => false,
                'message' => 'Error al preparar consulta: ' . $conn->error
            ], 500);
        }

        if (count($params) > 1) {
            $stmt->bind_param($types, ...$params);
        } else {
            $stmt->bind_param($types, $id_usuario);
        }
        $stmt->execute();
        $result = $stmt->get_result();

        $reportes = [];
        while ($row = $result->fetch_assoc()) {
            $reportes[] = [
                'id_incidencia' => $row['id_incidencia'],
                'id_usuario_reporta' => $row['id_usuario_reporta'],
                'id_inventario' => $row['id_inventario'],
                'id_tipo' => $row['id_tipo'],
                'tipo_nombre' => $row['tipo_nombre'],
                'descripcion_reporte' => $row['descripcion_reporte'],
                'fecha_reporte' => $row['fecha_reporte'],
                'estado' => $row['estado'],
                'id_usuario_tecnico' => $row['id_usuario_tecnico'],
                'descripcion_solucion' => $row['descripcion_solucion'],
                'fecha_solucion' => $row['fecha_solucion'],
                'resultado' => $row['resultado'],
                'oficina_nombre' => $row['oficina_nombre'],
                'oficina_piso' => $row['oficina_piso'],
                'oficina_ubicacion_interna' => $row['oficina_ubicacion_interna'],
                'direccion_nombre' => $row['direccion_nombre'],
                'departamento_nombre' => $row['departamento_nombre'],
                'seccion_nombre' => $row['seccion_nombre'],
                'codigo_patrimonial' => $row['codigo_patrimonial'],
                'item_descripcion' => $row['item_descripcion'],
                'tecnico_nombres' => $row['tecnico_nombres'],
                'tecnico_apellidos' => $row['tecnico_apellidos'],
                'tecnico_cargo' => $row['tecnico_cargo'],
                'usuario_reporta_nombres' => $row['usuario_reporta_nombres'] ?? null,
                'usuario_reporta_apellidos' => $row['usuario_reporta_apellidos'] ?? null,
                'usuario_reporta_cargo' => $row['usuario_reporta_cargo'] ?? null,
                'resuelto' => !empty($row['descripcion_solucion']) && !empty($row['fecha_solucion'])
            ];
        }

        $stmt->close();

        return response()->json([
            'success' => true,
            'data' => $reportes,
            'paginacion' => [
                'pagina_actual' => $pagina,
                'total_registros' => $total_registros,
                'total_paginas' => $total_paginas,
                'limite' => $limite,
                'tiene_anterior' => $tiene_anterior,
                'tiene_siguiente' => $tiene_siguiente
            ]
        ]);
    }

    /**
     * Eliminar un reporte (solo si está pendiente)
     * 
     * @param \mysqli $conn
     * @param array $data
     * @return JsonResponse
     */
    private function eliminarReporte(\mysqli $conn, array $data): JsonResponse
    {
        if (empty($data['id_incidencia']) || empty($data['id_usuario'])) {
            return response()->json([
                'success' => false,
                'message' => 'Faltan datos requeridos'
            ], 400);
        }

        $id_incidencia = intval($data['id_incidencia']);
        $id_usuario = intval($data['id_usuario']);

        // Verificar que el reporte existe, pertenece al usuario y está pendiente
        $query_check = "
            SELECT id_incidencia, id_usuario_reporta, descripcion_solucion, fecha_solucion
            FROM incidencias
            WHERE id_incidencia = ? AND id_usuario_reporta = ?
        ";

        $stmt_check = $conn->prepare($query_check);
        if (!$stmt_check) {
            return response()->json([
                'success' => false,
                'message' => 'Error al preparar consulta: ' . $conn->error
            ], 500);
        }

        $stmt_check->bind_param('ii', $id_incidencia, $id_usuario);
        $stmt_check->execute();
        $result_check = $stmt_check->get_result();
        $reporte = $result_check->fetch_assoc();
        $stmt_check->close();

        if (!$reporte) {
            return response()->json([
                'success' => false,
                'message' => 'Reporte no encontrado o no tienes permiso para eliminarlo'
            ], 404);
        }

        // Verificar que el reporte esté pendiente (sin solución)
        if (!empty($reporte['descripcion_solucion']) || !empty($reporte['fecha_solucion'])) {
            return response()->json([
                'success' => false,
                'message' => 'No se puede eliminar un reporte que ya tiene respuesta'
            ], 400);
        }

        // Eliminar el reporte
        $query_delete = "DELETE FROM incidencias WHERE id_incidencia = ? AND id_usuario_reporta = ?";
        $stmt_delete = $conn->prepare($query_delete);
        
        if (!$stmt_delete) {
            return response()->json([
                'success' => false,
                'message' => 'Error al preparar consulta: ' . $conn->error
            ], 500);
        }

        $stmt_delete->bind_param('ii', $id_incidencia, $id_usuario);
        
        if ($stmt_delete->execute()) {
            $stmt_delete->close();
            return response()->json([
                'success' => true,
                'message' => 'Reporte eliminado correctamente'
            ]);
        } else {
            $error = $conn->error;
            $stmt_delete->close();
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar el reporte: ' . $error
            ], 500);
        }
    }

    /**
     * Listar reportes recibidos por tipo de incidencia (para informática, electricidad, etc.)
     * 
     * @param \mysqli $conn
     * @param array $data
     * @return JsonResponse
     */
    private function listarReportesRecibidos(\mysqli $conn, array $data): JsonResponse
    {
        if (empty($data['tipo_incidencia'])) {
            return response()->json([
                'success' => false,
                'message' => 'Tipo de incidencia no especificado'
            ], 400);
        }

        $tipo_incidencia = trim($data['tipo_incidencia']);
        $mostrarTodos = strtolower($tipo_incidencia) === 'todos';
        
        // Filtrar por estado: 'pendiente' o 'resuelto'
        $filtro_estado = isset($data['filtro_estado']) ? trim($data['filtro_estado']) : 'todos';
        
        // Obtener parámetros de paginación
        $pagina = isset($data['pagina']) ? max(1, intval($data['pagina'])) : 1;
        $limite = isset($data['limite']) ? max(1, intval($data['limite'])) : 10;
        $offset = ($pagina - 1) * $limite;
        
        // Obtener filtros adicionales
        $filtros = isset($data['filtros']) ? $data['filtros'] : [];
        $filtro_usuario = isset($filtros['usuario']) ? trim($filtros['usuario']) : '';
        $filtro_oficina = isset($filtros['oficina']) ? trim($filtros['oficina']) : '';
        $filtro_fecha_reporte = isset($filtros['fecha_reporte']) ? trim($filtros['fecha_reporte']) : '';
        $filtro_fecha_solucion = isset($filtros['fecha_solucion']) ? trim($filtros['fecha_solucion']) : '';

        $query = "
            SELECT 
                i.id_incidencia,
                i.id_usuario_reporta,
                i.id_inventario,
                i.id_tipo,
                i.descripcion_reporte,
                i.fecha_reporte,
                i.estado,
                i.id_usuario_tecnico,
                i.descripcion_solucion,
                i.fecha_solucion,
                i.resultado,
                i.id_direccion,
                i.id_departamento,
                i.id_seccion,
                i.id_oficina,
                -- Tipo de incidencia
                ti.nombre AS tipo_nombre,
                -- Oficina
                o.nombre AS oficina_nombre,
                o.piso AS oficina_piso,
                o.ubicacion_fisica AS oficina_ubicacion_interna,
                -- Dirección, Departamento, Sección
                d.nombre AS direccion_nombre,
                dep.nombre AS departamento_nombre,
                s.nombre AS seccion_nombre,
                -- Item de inventario
                inv.codigo_patrimonial,
                inv.descripcion AS item_descripcion,
                -- Usuario que reporta
                ur.nombres AS usuario_reporta_nombres,
                ur.apellidos AS usuario_reporta_apellidos,
                ur.cargo AS usuario_reporta_cargo,
                -- Usuario técnico
                ut.nombres AS tecnico_nombres,
                ut.apellidos AS tecnico_apellidos,
                ut.cargo AS tecnico_cargo
            FROM incidencias i
            INNER JOIN tipos_incidencia ti ON i.id_tipo = ti.id_tipo
            LEFT JOIN oficinas o ON i.id_oficina = o.id_oficina
            LEFT JOIN direcciones d ON i.id_direccion = d.id_direccion
            LEFT JOIN departamentos dep ON i.id_departamento = dep.id_departamento
            LEFT JOIN secciones s ON i.id_seccion = s.id_seccion
            LEFT JOIN inventario inv ON i.id_inventario = inv.id_inventario
            LEFT JOIN usuarios ur ON i.id_usuario_reporta = ur.id_usuario
            LEFT JOIN usuarios ut ON i.id_usuario_tecnico = ut.id_usuario
            WHERE 1=1
        ";
        
        $params = [];
        $types = '';
        
        // Solo agregar filtro por tipo si no es "todos"
        if (!$mostrarTodos) {
            $query .= " AND ti.nombre = ?";
            $params[] = $tipo_incidencia;
            $types .= 's';
        }
        
        // Agregar filtro de estado
        if ($filtro_estado === 'pendiente') {
            $query .= " AND (i.descripcion_solucion IS NULL OR i.descripcion_solucion = '')";
        } elseif ($filtro_estado === 'resuelto') {
            $query .= " AND i.descripcion_solucion IS NOT NULL AND i.descripcion_solucion != ''";
        }
        
        // Agregar filtros adicionales
        if (!empty($filtro_usuario)) {
            $query .= " AND (CONCAT(ur.nombres, ' ', ur.apellidos) LIKE ? OR ur.cargo LIKE ?)";
            $params[] = '%' . $filtro_usuario . '%';
            $params[] = '%' . $filtro_usuario . '%';
            $types .= 'ss';
        }
        
        if (!empty($filtro_oficina)) {
            $query .= " AND o.nombre LIKE ?";
            $params[] = '%' . $filtro_oficina . '%';
            $types .= 's';
        }
        
        if (!empty($filtro_fecha_reporte)) {
            $query .= " AND DATE(i.fecha_reporte) = ?";
            $params[] = $filtro_fecha_reporte;
            $types .= 's';
        }
        
        if (!empty($filtro_fecha_solucion)) {
            $query .= " AND DATE(i.fecha_solucion) = ?";
            $params[] = $filtro_fecha_solucion;
            $types .= 's';
        }
        
        // Contar total de registros (antes de agregar ORDER BY y LIMIT)
        $query_count = "SELECT COUNT(*) as total FROM (" . $query . ") as subquery";
        $stmt_count = $conn->prepare($query_count);
        $total_registros = 0;
        
        if ($stmt_count) {
            if (count($params) > 0) {
                $stmt_count->bind_param($types, ...$params);
            }
            if ($stmt_count->execute()) {
                $result_count = $stmt_count->get_result();
                if ($row_count = $result_count->fetch_assoc()) {
                    $total_registros = intval($row_count['total']);
                }
            }
            $stmt_count->close();
        }
        
        // Calcular paginación
        $total_paginas = $total_registros > 0 ? ceil($total_registros / $limite) : 1;
        $tiene_anterior = $pagina > 1;
        $tiene_siguiente = $pagina < $total_paginas;
        
        // Agregar ORDER BY y LIMIT a la query principal
        if ($filtro_estado === 'resuelto') {
            $query .= " ORDER BY i.fecha_solucion DESC";
        } else {
            $query .= " ORDER BY i.fecha_reporte DESC";
        }
        
        $query .= " LIMIT ? OFFSET ?";
        $params[] = $limite;
        $params[] = $offset;
        $types .= 'ii';

        $stmt = $conn->prepare($query);
        if (!$stmt) {
            return response()->json([
                'success' => false,
                'message' => 'Error al preparar consulta: ' . $conn->error
            ], 500);
        }

        if (count($params) > 0) {
            $stmt->bind_param($types, ...$params);
        }
        $stmt->execute();
        $result = $stmt->get_result();

        $reportes = [];
        while ($row = $result->fetch_assoc()) {
            $reportes[] = [
                'id_incidencia' => $row['id_incidencia'],
                'id_usuario_reporta' => $row['id_usuario_reporta'],
                'id_inventario' => $row['id_inventario'],
                'id_tipo' => $row['id_tipo'],
                'tipo_nombre' => $row['tipo_nombre'],
                'descripcion_reporte' => $row['descripcion_reporte'],
                'fecha_reporte' => $row['fecha_reporte'],
                'estado' => $row['estado'],
                'id_usuario_tecnico' => $row['id_usuario_tecnico'],
                'descripcion_solucion' => $row['descripcion_solucion'],
                'fecha_solucion' => $row['fecha_solucion'],
                'resultado' => $row['resultado'],
                'oficina_nombre' => $row['oficina_nombre'],
                'oficina_piso' => $row['oficina_piso'],
                'oficina_ubicacion_interna' => $row['oficina_ubicacion_interna'],
                'direccion_nombre' => $row['direccion_nombre'],
                'departamento_nombre' => $row['departamento_nombre'],
                'seccion_nombre' => $row['seccion_nombre'],
                'codigo_patrimonial' => $row['codigo_patrimonial'],
                'item_descripcion' => $row['item_descripcion'],
                'usuario_reporta_nombres' => $row['usuario_reporta_nombres'],
                'usuario_reporta_apellidos' => $row['usuario_reporta_apellidos'],
                'usuario_reporta_cargo' => $row['usuario_reporta_cargo'],
                'tecnico_nombres' => $row['tecnico_nombres'],
                'tecnico_apellidos' => $row['tecnico_apellidos'],
                'tecnico_cargo' => $row['tecnico_cargo'],
                'tipo_incidencia' => $row['tipo_nombre'],
                'resuelto' => !empty($row['descripcion_solucion']) && !empty($row['fecha_solucion'])
            ];
        }

        $stmt->close();

        return response()->json([
            'success' => true,
            'data' => $reportes,
            'paginacion' => [
                'pagina_actual' => $pagina,
                'total_registros' => $total_registros,
                'total_paginas' => $total_paginas,
                'limite' => $limite,
                'tiene_anterior' => $tiene_anterior,
                'tiene_siguiente' => $tiene_siguiente
            ]
        ]);
    }

    /**
     * Responder un reporte
     * 
     * @param \mysqli $conn
     * @param array $data
     * @return JsonResponse
     */
    private function responderReporte(\mysqli $conn, array $data): JsonResponse
    {
        if (empty($data['id_incidencia']) || empty($data['id_usuario_tecnico']) || empty($data['descripcion_solucion'])) {
            return response()->json([
                'success' => false,
                'message' => 'Faltan campos requeridos'
            ], 400);
        }

        $id_incidencia = intval($data['id_incidencia']);
        $id_usuario_tecnico = intval($data['id_usuario_tecnico']);
        $descripcion_solucion = trim($data['descripcion_solucion']);
        $resultado = isset($data['resultado']) && !empty($data['resultado']) ? trim($data['resultado']) : null;
        
        // Usar zona horaria de Chile
        date_default_timezone_set('America/Santiago');
        $fecha_solucion = date('Y-m-d H:i:s');
        
        $estado = 'Resuelta';

        $query = "
            UPDATE incidencias 
            SET id_usuario_tecnico = ?,
                descripcion_solucion = ?,
                fecha_solucion = ?,
                estado = ?,
                resultado = ?
            WHERE id_incidencia = ?
        ";

        $stmt = $conn->prepare($query);
        if (!$stmt) {
            return response()->json([
                'success' => false,
                'message' => 'Error al preparar consulta: ' . $conn->error
            ], 500);
        }

        $stmt->bind_param('issssi', $id_usuario_tecnico, $descripcion_solucion, $fecha_solucion, $estado, $resultado, $id_incidencia);
        
        if ($stmt->execute()) {
            $stmt->close();
            return response()->json([
                'success' => true,
                'message' => 'Reporte respondido correctamente'
            ]);
        } else {
            $error = $conn->error;
            $stmt->close();
            return response()->json([
                'success' => false,
                'message' => 'Error al responder el reporte: ' . $error
            ], 500);
        }
    }

    /**
     * Obtener un reporte específico por ID
     * 
     * @param \mysqli $conn
     * @param array $data
     * @return JsonResponse
     */
    private function obtenerReporte(\mysqli $conn, array $data): JsonResponse
    {
        if (empty($data['id_incidencia'])) {
            return response()->json([
                'success' => false,
                'message' => 'ID de incidencia no especificado'
            ], 400);
        }

        $id_incidencia = intval($data['id_incidencia']);

        $query = "
            SELECT 
                i.id_incidencia,
                i.descripcion_solucion,
                i.resultado
            FROM incidencias i
            WHERE i.id_incidencia = ?
        ";

        $stmt = $conn->prepare($query);
        if (!$stmt) {
            return response()->json([
                'success' => false,
                'message' => 'Error al preparar consulta: ' . $conn->error
            ], 500);
        }

        $stmt->bind_param('i', $id_incidencia);
        $stmt->execute();
        $result = $stmt->get_result();
        $reporte = $result->fetch_assoc();
        $stmt->close();

        if (!$reporte) {
            return response()->json([
                'success' => false,
                'message' => 'Reporte no encontrado'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id_incidencia' => $reporte['id_incidencia'],
                'descripcion_solucion' => $reporte['descripcion_solucion'],
                'resultado' => $reporte['resultado']
            ]
        ]);
    }
}

