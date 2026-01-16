<?php

namespace App\Http\Controllers;

use App\Services\DatabaseService;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class EspaciosController extends Controller
{
    /**
     * Manejar las acciones de gestión de espacios
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
                case 'listar_espacios':
                    return $this->listarEspacios($conn, $data);
                    
                case 'obtener_espacio':
                    return $this->obtenerEspacio($conn, $data);
                    
                case 'eliminar_espacio':
                    return $this->eliminarEspacio($conn, $data);
                    
                case 'actualizar_espacio':
                    return $this->actualizarEspacio($conn, $data);
                    
                case 'obtener_item_inventario':
                    return $this->obtenerItemInventario($conn, $data);
                    
                case 'dar_baja_item':
                    return $this->darBajaItem($conn, $data);
                    
                case 'mover_item':
                    return $this->moverItem($conn, $data);
                    
                case 'obtener_oficinas':
                    return $this->obtenerOficinas($conn, $data);
                    
                case 'listar_items_inventario':
                    return $this->listarItemsInventario($conn, $data);
                    
                case 'eliminar_item_inventario':
                    return $this->eliminarItemInventario($conn, $data);
                    
                case 'eliminar_asignacion_item':
                    return $this->eliminarAsignacionItem($conn, $data);
                    
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
     * Listar todos los espacios
     * 
     * @param \mysqli $conn
     * @return JsonResponse
     */
    private function listarEspacios(\mysqli $conn, array $data = []): JsonResponse
    {
        $filtros = $data['filtros'] ?? [];
        $pagina = isset($data['pagina']) ? max(1, intval($data['pagina'])) : 1;
        $limite = isset($data['limite']) ? max(1, intval($data['limite'])) : 10;
        $offset = ($pagina - 1) * $limite;
        
        $query = "
            SELECT 
                o.id_oficina,
                o.nombre,
                o.edificio,
                o.piso,
                o.ubicacion_fisica,
                o.id_direccion,
                o.id_departamento,
                o.id_seccion,
                d.nombre AS nombre_direccion,
                dep.nombre AS nombre_departamento,
                s.nombre AS nombre_seccion,
                COUNT(DISTINCT i.id_inventario) AS total_inventario
            FROM oficinas o
            LEFT JOIN direcciones d ON o.id_direccion = d.id_direccion
            LEFT JOIN departamentos dep ON o.id_departamento = dep.id_departamento
            LEFT JOIN secciones s ON o.id_seccion = s.id_seccion
            LEFT JOIN inventario i ON o.id_oficina = i.id_oficina AND i.activo = 1
            WHERE 1=1
        ";
        
        $params = [];
        $types = '';
        
        // Aplicar filtros
        if (!empty($filtros['id_direccion'])) {
            $query .= " AND o.id_direccion = ?";
            $params[] = intval($filtros['id_direccion']);
            $types .= 'i';
        }
        
        if (!empty($filtros['id_departamento'])) {
            $query .= " AND o.id_departamento = ?";
            $params[] = intval($filtros['id_departamento']);
            $types .= 'i';
        }
        
        if (!empty($filtros['id_seccion'])) {
            $query .= " AND o.id_seccion = ?";
            $params[] = intval($filtros['id_seccion']);
            $types .= 'i';
        }
        
        if (!empty($filtros['nombre_oficina'])) {
            $query .= " AND o.nombre LIKE ?";
            $params[] = '%' . trim($filtros['nombre_oficina']) . '%';
            $types .= 's';
        }
        
        if (!empty($filtros['piso'])) {
            $query .= " AND o.piso LIKE ?";
            $params[] = '%' . trim($filtros['piso']) . '%';
            $types .= 's';
        }
        
        if (!empty($filtros['ubicacion_fisica'])) {
            $query .= " AND o.ubicacion_fisica LIKE ?";
            $params[] = '%' . trim($filtros['ubicacion_fisica']) . '%';
            $types .= 's';
        }
        
        // Filtro por usuario asignado
        // Mostrar espacios con asignación directa por oficina O indirecta (sección/departamento/dirección)
        // Prioridad: asignación directa > indirecta
        // Solo muestra espacios donde el usuario específico tiene asignación activa
        if (!empty($filtros['id_usuario'])) {
            $query .= " AND EXISTS (
                SELECT 1 FROM usuario_asignacion ua
                WHERE ua.activo = 1 
                AND ua.id_usuario = ?
                AND (
                    -- Asignación directa por oficina (prioridad máxima)
                    (ua.id_oficina = o.id_oficina AND ua.id_oficina IS NOT NULL) OR
                    -- Asignación indirecta por sección (solo si no hay asignación directa a esta oficina)
                    (ua.id_seccion = o.id_seccion 
                     AND o.id_seccion IS NOT NULL 
                     AND ua.id_seccion IS NOT NULL 
                     AND ua.id_oficina IS NULL
                     AND NOT EXISTS (
                         SELECT 1 FROM usuario_asignacion ua_directa 
                         WHERE ua_directa.activo = 1 
                         AND ua_directa.id_oficina = o.id_oficina
                         AND ua_directa.id_oficina IS NOT NULL
                     )) OR
                    -- Asignación indirecta por departamento (solo si no hay asignación directa a esta oficina)
                    (ua.id_departamento = o.id_departamento 
                     AND o.id_departamento IS NOT NULL 
                     AND o.id_seccion IS NULL 
                     AND ua.id_departamento IS NOT NULL 
                     AND ua.id_seccion IS NULL 
                     AND ua.id_oficina IS NULL
                     AND NOT EXISTS (
                         SELECT 1 FROM usuario_asignacion ua_directa 
                         WHERE ua_directa.activo = 1 
                         AND ua_directa.id_oficina = o.id_oficina
                         AND ua_directa.id_oficina IS NOT NULL
                     )) OR
                    -- Asignación indirecta por dirección (solo si no hay asignación directa a esta oficina)
                    (ua.id_direccion = o.id_direccion 
                     AND o.id_direccion IS NOT NULL 
                     AND o.id_departamento IS NULL 
                     AND o.id_seccion IS NULL 
                     AND ua.id_direccion IS NOT NULL 
                     AND ua.id_departamento IS NULL 
                     AND ua.id_seccion IS NULL 
                     AND ua.id_oficina IS NULL
                     AND NOT EXISTS (
                         SELECT 1 FROM usuario_asignacion ua_directa 
                         WHERE ua_directa.activo = 1 
                         AND ua_directa.id_oficina = o.id_oficina
                         AND ua_directa.id_oficina IS NOT NULL
                     ))
                )
            )";
            $params[] = intval($filtros['id_usuario']);
            $types .= 'i';
        }
        
        // Primero obtener el total de registros (sin LIMIT/OFFSET)
        $query_count = "
            SELECT COUNT(DISTINCT o.id_oficina) AS total
            FROM oficinas o
            LEFT JOIN direcciones d ON o.id_direccion = d.id_direccion
            LEFT JOIN departamentos dep ON o.id_departamento = dep.id_departamento
            LEFT JOIN secciones s ON o.id_seccion = s.id_seccion
            LEFT JOIN inventario i ON o.id_oficina = i.id_oficina AND i.activo = 1
            WHERE 1=1
        ";
        
        // Aplicar los mismos filtros a la consulta de conteo
        if (!empty($filtros['id_direccion'])) {
            $query_count .= " AND o.id_direccion = ?";
        }
        if (!empty($filtros['id_departamento'])) {
            $query_count .= " AND o.id_departamento = ?";
        }
        if (!empty($filtros['id_seccion'])) {
            $query_count .= " AND o.id_seccion = ?";
        }
        if (!empty($filtros['nombre_oficina'])) {
            $query_count .= " AND o.nombre LIKE ?";
        }
        if (!empty($filtros['piso'])) {
            $query_count .= " AND o.piso LIKE ?";
        }
        if (!empty($filtros['ubicacion_fisica'])) {
            $query_count .= " AND o.ubicacion_fisica LIKE ?";
        }
        if (!empty($filtros['id_usuario'])) {
            $query_count .= " AND EXISTS (
                SELECT 1 FROM usuario_asignacion ua
                WHERE ua.activo = 1 
                AND ua.id_usuario = ?
                AND (
                    -- Asignación directa por oficina (prioridad máxima)
                    (ua.id_oficina = o.id_oficina AND ua.id_oficina IS NOT NULL) OR
                    -- Asignación indirecta por sección (solo si no hay asignación directa a esta oficina)
                    (ua.id_seccion = o.id_seccion 
                     AND o.id_seccion IS NOT NULL 
                     AND ua.id_seccion IS NOT NULL 
                     AND ua.id_oficina IS NULL
                     AND NOT EXISTS (
                         SELECT 1 FROM usuario_asignacion ua_directa 
                         WHERE ua_directa.activo = 1 
                         AND ua_directa.id_oficina = o.id_oficina
                         AND ua_directa.id_oficina IS NOT NULL
                     )) OR
                    -- Asignación indirecta por departamento (solo si no hay asignación directa a esta oficina)
                    (ua.id_departamento = o.id_departamento 
                     AND o.id_departamento IS NOT NULL 
                     AND o.id_seccion IS NULL 
                     AND ua.id_departamento IS NOT NULL 
                     AND ua.id_seccion IS NULL 
                     AND ua.id_oficina IS NULL
                     AND NOT EXISTS (
                         SELECT 1 FROM usuario_asignacion ua_directa 
                         WHERE ua_directa.activo = 1 
                         AND ua_directa.id_oficina = o.id_oficina
                         AND ua_directa.id_oficina IS NOT NULL
                     )) OR
                    -- Asignación indirecta por dirección (solo si no hay asignación directa a esta oficina)
                    (ua.id_direccion = o.id_direccion 
                     AND o.id_direccion IS NOT NULL 
                     AND o.id_departamento IS NULL 
                     AND o.id_seccion IS NULL 
                     AND ua.id_direccion IS NOT NULL 
                     AND ua.id_departamento IS NULL 
                     AND ua.id_seccion IS NULL 
                     AND ua.id_oficina IS NULL
                     AND NOT EXISTS (
                         SELECT 1 FROM usuario_asignacion ua_directa 
                         WHERE ua_directa.activo = 1 
                         AND ua_directa.id_oficina = o.id_oficina
                         AND ua_directa.id_oficina IS NOT NULL
                     ))
                )
            )";
        }
        
        // Contar total de registros
        $stmt_count = $conn->prepare($query_count);
        if (!$stmt_count) {
            return response()->json([
                'success' => false,
                'message' => 'Error al preparar consulta de conteo: ' . $conn->error
            ], 500);
        }
        
        if (!empty($params)) {
            $stmt_count->bind_param($types, ...$params);
        }
        $stmt_count->execute();
        $result_count = $stmt_count->get_result();
        $total_registros = 0;
        if ($row_count = $result_count->fetch_assoc()) {
            $total_registros = intval($row_count['total']);
        }
        $stmt_count->close();
        
        // Ahora obtener los registros paginados
        $query .= " GROUP BY o.id_oficina, o.nombre, o.edificio, o.piso, o.ubicacion_fisica, o.id_direccion, o.id_departamento, o.id_seccion, d.nombre, dep.nombre, s.nombre
            ORDER BY o.nombre ASC
            LIMIT ? OFFSET ?";
        
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
        
        if (!empty($params)) {
            $stmt->bind_param($types, ...$params);
        }
        
        $stmt->execute();
        $result = $stmt->get_result();
        $espacios = [];
        
        while ($row = $result->fetch_assoc()) {
            // Buscar asignación de usuario para este espacio
            $usuario_asignado = 'Sin asignar';
            
            // Prioridad: oficina > sección > departamento > dirección
            $query_asignacion = "
                SELECT u.nombres, u.apellidos, u.cargo
                FROM usuario_asignacion ua
                JOIN usuarios u ON ua.id_usuario = u.id_usuario
                WHERE ua.activo = 1 AND (
                    (ua.id_oficina = ?) OR
                    (ua.id_seccion = ? AND ? IS NOT NULL) OR
                    (ua.id_departamento = ? AND ? IS NOT NULL AND ? IS NULL) OR
                    (ua.id_direccion = ? AND ? IS NOT NULL AND ? IS NULL AND ? IS NULL)
                )
                ORDER BY 
                    CASE 
                        WHEN ua.id_oficina IS NOT NULL THEN 1
                        WHEN ua.id_seccion IS NOT NULL THEN 2
                        WHEN ua.id_departamento IS NOT NULL THEN 3
                        WHEN ua.id_direccion IS NOT NULL THEN 4
                    END
                LIMIT 1
            ";
            
            $stmt_asignacion = $conn->prepare($query_asignacion);
            if ($stmt_asignacion) {
                $id_oficina = $row['id_oficina'];
                $id_seccion = $row['id_seccion'];
                $id_departamento = $row['id_departamento'];
                $id_direccion = $row['id_direccion'];
                
                $stmt_asignacion->bind_param('iiiiiiiiii', 
                    $id_oficina,
                    $id_seccion, $id_seccion,
                    $id_departamento, $id_departamento, $id_seccion,
                    $id_direccion, $id_direccion, $id_departamento, $id_seccion
                );
                
                $stmt_asignacion->execute();
                $result_asignacion = $stmt_asignacion->get_result();
                
                if ($row_asignacion = $result_asignacion->fetch_assoc()) {
                    $usuario_asignado = trim($row_asignacion['nombres'] . ' ' . $row_asignacion['apellidos']);
                    if (!empty($row_asignacion['cargo'])) {
                        $usuario_asignado .= ' (' . $row_asignacion['cargo'] . ')';
                    }
                }
                
                $stmt_asignacion->close();
            }
            
            $espacios[] = [
                'id_oficina' => $row['id_oficina'],
                'nombre' => $row['nombre'],
                'edificio' => $row['edificio'] ?? 'N/A',
                'piso' => $row['piso'] ?? 'N/A',
                'ubicacion_fisica' => $row['ubicacion_fisica'] ?? 'N/A',
                'direccion' => $row['nombre_direccion'] ?? 'N/A',
                'departamento' => $row['nombre_departamento'] ?? 'N/A',
                'seccion' => $row['nombre_seccion'] ?? 'N/A',
                'total_inventario' => intval($row['total_inventario']),
                'usuario_asignado' => $usuario_asignado
            ];
        }
        
        $stmt->close();
        
        $total_paginas = ceil($total_registros / $limite);
        
        return response()->json([
            'success' => true,
            'data' => $espacios,
            'paginacion' => [
                'pagina_actual' => $pagina,
                'limite' => $limite,
                'total_registros' => $total_registros,
                'total_paginas' => $total_paginas,
                'tiene_anterior' => $pagina > 1,
                'tiene_siguiente' => $pagina < $total_paginas
            ]
        ]);
    }

    /**
     * Obtener un espacio específico
     * 
     * @param \mysqli $conn
     * @param array $data
     * @return JsonResponse
     */
    private function obtenerEspacio(\mysqli $conn, array $data): JsonResponse
    {
        if (empty($data['id_oficina'])) {
            return response()->json([
                'success' => false,
                'message' => 'ID de oficina no especificado'
            ], 400);
        }
        
        $id_oficina = intval($data['id_oficina']);
        $query = "
            SELECT 
                o.id_oficina,
                o.nombre,
                o.edificio,
                o.piso,
                o.ubicacion_fisica,
                o.id_direccion,
                o.id_departamento,
                o.id_seccion,
                d.nombre AS nombre_direccion,
                dep.nombre AS nombre_departamento,
                s.nombre AS nombre_seccion,
                COUNT(DISTINCT i.id_inventario) AS total_inventario
            FROM oficinas o
            LEFT JOIN direcciones d ON o.id_direccion = d.id_direccion
            LEFT JOIN departamentos dep ON o.id_departamento = dep.id_departamento
            LEFT JOIN secciones s ON o.id_seccion = s.id_seccion
            LEFT JOIN inventario i ON o.id_oficina = i.id_oficina AND i.activo = 1
            WHERE o.id_oficina = ?
            GROUP BY o.id_oficina, o.nombre, o.edificio, o.piso, o.ubicacion_fisica, o.id_direccion, o.id_departamento, o.id_seccion, d.nombre, dep.nombre, s.nombre
        ";
        
        $stmt = $conn->prepare($query);
        if (!$stmt) {
            return response()->json([
                'success' => false,
                'message' => 'Error al preparar consulta: ' . $conn->error
            ], 500);
        }
        
        $stmt->bind_param('i', $id_oficina);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($row = $result->fetch_assoc()) {
            // Buscar asignación de usuario para este espacio
            $usuario_asignado = 'Sin asignar';
            
            // Prioridad: oficina > sección > departamento > dirección
            $id_seccion = $row['id_seccion'] ?? null;
            $id_departamento = $row['id_departamento'] ?? null;
            $id_direccion = $row['id_direccion'] ?? null;
            
            // Construir la consulta dinámicamente según qué IDs tenemos
            $query_asignacion = "
                SELECT u.nombres, u.apellidos, u.cargo
                FROM usuario_asignacion ua
                JOIN usuarios u ON ua.id_usuario = u.id_usuario
                WHERE ua.activo = 1
                AND (
                    (ua.id_oficina = ? AND ua.id_oficina IS NOT NULL)";
            
            $params = [$id_oficina];
            $types = 'i';
            
            if ($id_seccion !== null) {
                $query_asignacion .= " OR (ua.id_seccion = ? AND ua.id_seccion IS NOT NULL AND ua.id_oficina IS NULL)";
                $params[] = $id_seccion;
                $types .= 'i';
            }
            
            if ($id_departamento !== null) {
                $query_asignacion .= " OR (ua.id_departamento = ? AND ua.id_departamento IS NOT NULL AND ua.id_seccion IS NULL AND ua.id_oficina IS NULL)";
                $params[] = $id_departamento;
                $types .= 'i';
            }
            
            if ($id_direccion !== null) {
                $query_asignacion .= " OR (ua.id_direccion = ? AND ua.id_direccion IS NOT NULL AND ua.id_departamento IS NULL AND ua.id_seccion IS NULL AND ua.id_oficina IS NULL)";
                $params[] = $id_direccion;
                $types .= 'i';
            }
            
            $query_asignacion .= "
                )
                ORDER BY 
                    CASE 
                        WHEN ua.id_oficina IS NOT NULL THEN 1
                        WHEN ua.id_seccion IS NOT NULL THEN 2
                        WHEN ua.id_departamento IS NOT NULL THEN 3
                        WHEN ua.id_direccion IS NOT NULL THEN 4
                    END
                LIMIT 1
            ";
            
            $stmt_asignacion = $conn->prepare($query_asignacion);
            if ($stmt_asignacion) {
                $stmt_asignacion->bind_param($types, ...$params);
                $stmt_asignacion->execute();
                $result_asignacion = $stmt_asignacion->get_result();
                
                if ($usuario = $result_asignacion->fetch_assoc()) {
                    $usuario_asignado = trim($usuario['nombres'] . ' ' . $usuario['apellidos']);
                    if (!empty($usuario['cargo'])) {
                        $usuario_asignado .= ' (' . $usuario['cargo'] . ')';
                    }
                }
                
                $stmt_asignacion->close();
            }
            
            $row['usuario_asignado'] = $usuario_asignado;
            $row['total_inventario'] = intval($row['total_inventario']);
            
            // Obtener id_usuario_asignacion si existe (buscar en todos los niveles)
            // Usar la misma lógica que para obtener el nombre del usuario asignado
            $query_usuario_asignacion = "
                SELECT ua.id_usuario
                FROM usuario_asignacion ua
                WHERE ua.activo = 1
                AND (
                    (ua.id_oficina = ? AND ua.id_oficina IS NOT NULL)";
            
            $params_usuario = [$id_oficina];
            $types_usuario = 'i';
            
            if ($id_seccion !== null) {
                $query_usuario_asignacion .= " OR (ua.id_seccion = ? AND ua.id_seccion IS NOT NULL AND ua.id_oficina IS NULL)";
                $params_usuario[] = $id_seccion;
                $types_usuario .= 'i';
            }
            
            if ($id_departamento !== null) {
                $query_usuario_asignacion .= " OR (ua.id_departamento = ? AND ua.id_departamento IS NOT NULL AND ua.id_seccion IS NULL AND ua.id_oficina IS NULL)";
                $params_usuario[] = $id_departamento;
                $types_usuario .= 'i';
            }
            
            if ($id_direccion !== null) {
                $query_usuario_asignacion .= " OR (ua.id_direccion = ? AND ua.id_direccion IS NOT NULL AND ua.id_departamento IS NULL AND ua.id_seccion IS NULL AND ua.id_oficina IS NULL)";
                $params_usuario[] = $id_direccion;
                $types_usuario .= 'i';
            }
            
            $query_usuario_asignacion .= "
                )
                ORDER BY 
                    CASE 
                        WHEN ua.id_oficina IS NOT NULL THEN 1
                        WHEN ua.id_seccion IS NOT NULL THEN 2
                        WHEN ua.id_departamento IS NOT NULL THEN 3
                        WHEN ua.id_direccion IS NOT NULL THEN 4
                    END
                LIMIT 1
            ";
            
            $stmt_usuario = $conn->prepare($query_usuario_asignacion);
            if ($stmt_usuario) {
                $stmt_usuario->bind_param($types_usuario, ...$params_usuario);
                $stmt_usuario->execute();
                $result_usuario = $stmt_usuario->get_result();
                if ($usuario_row = $result_usuario->fetch_assoc()) {
                    $row['id_usuario_asignacion'] = $usuario_row['id_usuario'];
                }
                $stmt_usuario->close();
            }
            
            // Obtener items del inventario (todos, no solo activos)
            $query_items = "
                SELECT 
                    i.id_inventario,
                    i.codigo_patrimonial,
                    i.descripcion,
                    i.marca,
                    i.modelo,
                    i.serie,
                    i.activo,
                    i.estado,
                    i.fecha_ingreso,
                    tb.nombre AS tipo_bien
                FROM inventario i
                LEFT JOIN tipos_bien tb ON i.id_tipo_bien = tb.id_tipo_bien
                WHERE i.id_oficina = ?
                ORDER BY i.codigo_patrimonial ASC
            ";
            
            $stmt_items = $conn->prepare($query_items);
            $items = [];
            
            if ($stmt_items) {
                $stmt_items->bind_param('i', $id_oficina);
                $stmt_items->execute();
                $result_items = $stmt_items->get_result();
                
                while ($item = $result_items->fetch_assoc()) {
                    $items[] = $item;
                }
                
                $stmt_items->close();
            }
            
            $row['items'] = $items;
            
            $stmt->close();
            return response()->json([
                'success' => true,
                'data' => $row
            ]);
        } else {
            $stmt->close();
            return response()->json([
                'success' => false,
                'message' => 'Espacio no encontrado'
            ], 404);
        }
    }

    /**
     * Eliminar un espacio
     * 
     * @param \mysqli $conn
     * @param array $data
     * @return JsonResponse
     */
    private function eliminarEspacio(\mysqli $conn, array $data): JsonResponse
    {
        if (empty($data['id_oficina'])) {
            return response()->json([
                'success' => false,
                'message' => 'ID de oficina no especificado'
            ], 400);
        }
        
        $id_oficina = intval($data['id_oficina']);
        
        // Primero obtener los datos de la oficina para saber qué actualizar en inventario
        $stmt_info = $conn->prepare("SELECT id_seccion, id_departamento, id_direccion FROM oficinas WHERE id_oficina = ?");
        $stmt_info->bind_param('i', $id_oficina);
        $stmt_info->execute();
        $result_info = $stmt_info->get_result();
        $oficina_info = $result_info->fetch_assoc();
        $stmt_info->close();
        
        if (!$oficina_info) {
            return response()->json([
                'success' => false,
                'message' => 'Espacio no encontrado'
            ], 404);
        }
        
        // Iniciar transacción
        $conn->begin_transaction();
        
        try {
            // Obtener los IDs de la oficina para actualizar los items
            $id_seccion = $oficina_info['id_seccion'];
            $id_departamento = $oficina_info['id_departamento'];
            $id_direccion = $oficina_info['id_direccion'];
            
            // PRIMERO: Actualizar movimientos_inventario para quitar referencias a esta oficina
            // Actualizar destino_oficina a NULL donde apunte a esta oficina
            $stmt_update_movimientos_destino = $conn->prepare("
                UPDATE movimientos_inventario 
                SET destino_oficina = NULL
                WHERE destino_oficina = ?
            ");
            
            if ($stmt_update_movimientos_destino) {
                $stmt_update_movimientos_destino->bind_param('i', $id_oficina);
                $stmt_update_movimientos_destino->execute();
                $stmt_update_movimientos_destino->close();
            }
            
            // Actualizar origen_oficina a NULL donde apunte a esta oficina
            $stmt_update_movimientos_origen = $conn->prepare("
                UPDATE movimientos_inventario 
                SET origen_oficina = NULL
                WHERE origen_oficina = ?
            ");
            
            if ($stmt_update_movimientos_origen) {
                $stmt_update_movimientos_origen->bind_param('i', $id_oficina);
                $stmt_update_movimientos_origen->execute();
                $stmt_update_movimientos_origen->close();
            }
            
            // SEGUNDO: Actualizar items de inventario: poner id_oficina a NULL
            // Actualizar TODOS los items (activos e inactivos) que tengan id_oficina igual a esta oficina
            // Si el item tenía la misma sección/departamento que la oficina, también ponerlos a NULL
            $stmt_update_inventario = $conn->prepare("
                UPDATE inventario 
                SET id_oficina = NULL,
                    id_seccion = CASE WHEN id_seccion = ? THEN NULL ELSE id_seccion END,
                    id_departamento = CASE WHEN id_departamento = ? THEN NULL ELSE id_departamento END
                WHERE id_oficina = ?
            ");
            
            if ($stmt_update_inventario) {
                $stmt_update_inventario->bind_param('iii', $id_seccion, $id_departamento, $id_oficina);
                if (!$stmt_update_inventario->execute()) {
                    throw new Exception('Error al actualizar items de inventario: ' . $stmt_update_inventario->error);
                }
                $stmt_update_inventario->close();
            }
            
            // TERCERO: Actualizar asignaciones de usuario para quitar la referencia a esta oficina
            // Poner id_oficina a NULL en todas las asignaciones (activas e inactivas) que referencian este espacio
            $stmt_update_asignaciones_oficina = $conn->prepare("
                UPDATE usuario_asignacion 
                SET id_oficina = NULL
                WHERE id_oficina = ?
            ");
            
            if ($stmt_update_asignaciones_oficina) {
                $stmt_update_asignaciones_oficina->bind_param('i', $id_oficina);
                if (!$stmt_update_asignaciones_oficina->execute()) {
                    throw new Exception('Error al actualizar asignaciones de usuario: ' . $stmt_update_asignaciones_oficina->error);
                }
                $stmt_update_asignaciones_oficina->close();
            }
            
            // CUARTO: Actualizar incidencias para quitar la referencia a esta oficina
            // Poner id_oficina a NULL en todas las incidencias que referencian este espacio
            $stmt_update_incidencias = $conn->prepare("
                UPDATE incidencias 
                SET id_oficina = NULL
                WHERE id_oficina = ?
            ");
            
            if ($stmt_update_incidencias) {
                $stmt_update_incidencias->bind_param('i', $id_oficina);
                if (!$stmt_update_incidencias->execute()) {
                    throw new Exception('Error al actualizar incidencias: ' . $stmt_update_incidencias->error);
                }
                $stmt_update_incidencias->close();
            }
            
            // QUINTO: Eliminar el espacio
            $stmt_delete = $conn->prepare("DELETE FROM oficinas WHERE id_oficina = ?");
            $stmt_delete->bind_param('i', $id_oficina);
            
            if (!$stmt_delete->execute()) {
                throw new Exception('Error al eliminar espacio: ' . $stmt_delete->error);
            }
            
            $stmt_delete->close();
            $conn->commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Oficina o Sección eliminada correctamente. Los items de inventario y las incidencias asociadas han sido desasignadas (no eliminadas).'
            ]);
        } catch (Exception $e) {
            $conn->rollback();
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }

    /**
     * Dar de baja un item de inventario
     * 
     * @param \mysqli $conn
     * @param array $data
     * @return JsonResponse
     */
    private function darBajaItem(\mysqli $conn, array $data): JsonResponse
    {
        if (empty($data['id_inventario']) || empty($data['id_usuario_responsable'])) {
            return response()->json([
                'success' => false,
                'message' => 'Datos incompletos'
            ], 400);
        }
        
        $id_inventario = intval($data['id_inventario']);
        $id_oficina = !empty($data['id_oficina']) ? intval($data['id_oficina']) : null;
        $motivo = trim($data['motivo'] ?? '');
        $id_usuario_responsable = intval($data['id_usuario_responsable']);
        
        // Obtener datos actuales del item
        $stmt_item = $conn->prepare("
            SELECT id_direccion, id_departamento, id_seccion, id_oficina 
            FROM inventario 
            WHERE id_inventario = ? AND activo = 1
        ");
        $stmt_item->bind_param('i', $id_inventario);
        $stmt_item->execute();
        $result_item = $stmt_item->get_result();
        $item_actual = $result_item->fetch_assoc();
        $stmt_item->close();
        
        if (!$item_actual) {
            return response()->json([
                'success' => false,
                'message' => 'Item no encontrado o ya está dado de baja'
            ], 404);
        }
        
        // Iniciar transacción
        $conn->begin_transaction();
        
        try {
            // Registrar movimiento
            $query_movimiento = "
                INSERT INTO movimientos_inventario (
                    id_inventario,
                    origen_direccion, origen_departamento, origen_seccion, origen_oficina,
                    destino_direccion, destino_departamento, destino_seccion, destino_oficina,
                    tipo_movimiento, motivo, fecha_movimiento, id_usuario_responsable
                ) VALUES (?, ?, ?, ?, ?, NULL, NULL, NULL, NULL, 'BAJA', ?, NOW(), ?)
            ";
            
            $stmt_movimiento = $conn->prepare($query_movimiento);
            if (!$stmt_movimiento) {
                throw new Exception('Error al preparar consulta de movimiento: ' . $conn->error);
            }
            
            $stmt_movimiento->bind_param('iiiissi',
                $id_inventario,
                $item_actual['id_direccion'],
                $item_actual['id_departamento'],
                $item_actual['id_seccion'],
                $item_actual['id_oficina'],
                $motivo,
                $id_usuario_responsable
            );
            
            if (!$stmt_movimiento->execute()) {
                throw new Exception('Error al registrar movimiento: ' . $stmt_movimiento->error);
            }
            $stmt_movimiento->close();
            
            // Dar de baja el item (activo = 0)
            $stmt_baja = $conn->prepare("UPDATE inventario SET activo = 0 WHERE id_inventario = ?");
            if (!$stmt_baja) {
                throw new Exception('Error al preparar consulta de baja: ' . $conn->error);
            }
            
            $stmt_baja->bind_param('i', $id_inventario);
            if (!$stmt_baja->execute()) {
                throw new Exception('Error al dar de baja el item: ' . $stmt_baja->error);
            }
            $stmt_baja->close();
            
            $conn->commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Item dado de baja correctamente'
            ]);
        } catch (Exception $e) {
            $conn->rollback();
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }

    /**
     * Mover un item de inventario
     * 
     * @param \mysqli $conn
     * @param array $data
     * @return JsonResponse
     */
    private function moverItem(\mysqli $conn, array $data): JsonResponse
    {
        if (empty($data['id_inventario']) || empty($data['id_usuario_responsable'])) {
            return response()->json([
                'success' => false,
                'message' => 'Datos incompletos'
            ], 400);
        }
        
        $id_inventario = intval($data['id_inventario']);
        $id_oficina_actual = !empty($data['id_oficina_actual']) ? intval($data['id_oficina_actual']) : null;
        $destino_direccion = !empty($data['destino_direccion']) ? intval($data['destino_direccion']) : null;
        $destino_departamento = !empty($data['destino_departamento']) ? intval($data['destino_departamento']) : null;
        $destino_seccion = !empty($data['destino_seccion']) ? intval($data['destino_seccion']) : null;
        $destino_oficina = !empty($data['destino_oficina']) ? intval($data['destino_oficina']) : null;
        $motivo = trim($data['motivo'] ?? '');
        $id_usuario_responsable = intval($data['id_usuario_responsable']);
        
        if (!$destino_direccion && !$destino_departamento && !$destino_seccion && !$destino_oficina) {
            return response()->json([
                'success' => false,
                'message' => 'Debe especificar al menos un destino'
            ], 400);
        }
        
        // Obtener datos actuales del item
        $stmt_item = $conn->prepare("
            SELECT id_direccion, id_departamento, id_seccion, id_oficina 
            FROM inventario 
            WHERE id_inventario = ? AND activo = 1
        ");
        $stmt_item->bind_param('i', $id_inventario);
        $stmt_item->execute();
        $result_item = $stmt_item->get_result();
        $item_actual = $result_item->fetch_assoc();
        $stmt_item->close();
        
        if (!$item_actual) {
            return response()->json([
                'success' => false,
                'message' => 'Item no encontrado'
            ], 404);
        }
        
        // Iniciar transacción
        $conn->begin_transaction();
        
        try {
            // Preparar valores de origen (usar isset y verificar que no sea 0 o null)
            $origen_direccion = (isset($item_actual['id_direccion']) && $item_actual['id_direccion'] !== null && $item_actual['id_direccion'] !== '') ? intval($item_actual['id_direccion']) : null;
            $origen_departamento = (isset($item_actual['id_departamento']) && $item_actual['id_departamento'] !== null && $item_actual['id_departamento'] !== '') ? intval($item_actual['id_departamento']) : null;
            $origen_seccion = (isset($item_actual['id_seccion']) && $item_actual['id_seccion'] !== null && $item_actual['id_seccion'] !== '') ? intval($item_actual['id_seccion']) : null;
            $origen_oficina = (isset($item_actual['id_oficina']) && $item_actual['id_oficina'] !== null && $item_actual['id_oficina'] !== '') ? intval($item_actual['id_oficina']) : null;
            
            // Construir la consulta dinámicamente para manejar NULLs correctamente
            // Orden: id_inventario, origen_direccion, origen_departamento, origen_seccion, origen_oficina,
            //        destino_direccion, destino_departamento, destino_seccion, destino_oficina,
            //        tipo_movimiento, motivo, fecha_movimiento, id_usuario_responsable
            $campos = ['id_inventario'];
            $valores = ['?'];
            $params = [$id_inventario];
            $types = 'i';
            
            // Agregar campos de origen (pueden ser NULL) - ORDEN CORRECTO
            if ($origen_direccion !== null) {
                $campos[] = 'origen_direccion';
                $valores[] = '?';
                $params[] = $origen_direccion;
                $types .= 'i';
            } else {
                $campos[] = 'origen_direccion';
                $valores[] = 'NULL';
            }
            
            if ($origen_departamento !== null) {
                $campos[] = 'origen_departamento';
                $valores[] = '?';
                $params[] = $origen_departamento;
                $types .= 'i';
            } else {
                $campos[] = 'origen_departamento';
                $valores[] = 'NULL';
            }
            
            if ($origen_seccion !== null) {
                $campos[] = 'origen_seccion';
                $valores[] = '?';
                $params[] = $origen_seccion;
                $types .= 'i';
            } else {
                $campos[] = 'origen_seccion';
                $valores[] = 'NULL';
            }
            
            if ($origen_oficina !== null) {
                $campos[] = 'origen_oficina';
                $valores[] = '?';
                $params[] = $origen_oficina;
                $types .= 'i';
            } else {
                $campos[] = 'origen_oficina';
                $valores[] = 'NULL';
            }
            
            // Agregar campos de destino (pueden ser NULL) - ORDEN CORRECTO
            if ($destino_direccion !== null) {
                $campos[] = 'destino_direccion';
                $valores[] = '?';
                $params[] = $destino_direccion;
                $types .= 'i';
            } else {
                $campos[] = 'destino_direccion';
                $valores[] = 'NULL';
            }
            
            if ($destino_departamento !== null) {
                $campos[] = 'destino_departamento';
                $valores[] = '?';
                $params[] = $destino_departamento;
                $types .= 'i';
            } else {
                $campos[] = 'destino_departamento';
                $valores[] = 'NULL';
            }
            
            if ($destino_seccion !== null) {
                $campos[] = 'destino_seccion';
                $valores[] = '?';
                $params[] = $destino_seccion;
                $types .= 'i';
            } else {
                $campos[] = 'destino_seccion';
                $valores[] = 'NULL';
            }
            
            if ($destino_oficina !== null) {
                $campos[] = 'destino_oficina';
                $valores[] = '?';
                $params[] = $destino_oficina;
                $types .= 'i';
            } else {
                $campos[] = 'destino_oficina';
                $valores[] = 'NULL';
            }
            
            // Agregar campos finales
            $campos[] = 'tipo_movimiento';
            $valores[] = "'TRASLADO'";
            
            $campos[] = 'motivo';
            $valores[] = '?';
            $params[] = $motivo;
            $types .= 's';
            
            $campos[] = 'fecha_movimiento';
            $valores[] = 'NOW()';
            
            $campos[] = 'id_usuario_responsable';
            $valores[] = '?';
            $params[] = $id_usuario_responsable;
            $types .= 'i';
            
            // Construir la consulta final
            $query_movimiento = "INSERT INTO movimientos_inventario (" . implode(', ', $campos) . ") VALUES (" . implode(', ', $valores) . ")";
            
            $stmt_movimiento = $conn->prepare($query_movimiento);
            if (!$stmt_movimiento) {
                throw new Exception('Error al preparar consulta de movimiento: ' . $conn->error . ' - Query: ' . $query_movimiento);
            }
            
            // Bind parameters solo para los valores no NULL
            if (!empty($params)) {
                $stmt_movimiento->bind_param($types, ...$params);
            }
            
            if (!$stmt_movimiento->execute()) {
                throw new Exception('Error al registrar movimiento: ' . $stmt_movimiento->error);
            }
            $stmt_movimiento->close();
            
            // Actualizar item con nuevo destino
            $updateFields = [];
            $updateParams = [];
            $updateTypes = '';
            
            if ($destino_direccion !== null) {
                $updateFields[] = 'id_direccion = ?';
                $updateParams[] = $destino_direccion;
                $updateTypes .= 'i';
            } else {
                $updateFields[] = 'id_direccion = NULL';
            }
            
            if ($destino_departamento !== null) {
                $updateFields[] = 'id_departamento = ?';
                $updateParams[] = $destino_departamento;
                $updateTypes .= 'i';
            } else {
                $updateFields[] = 'id_departamento = NULL';
            }
            
            if ($destino_seccion !== null) {
                $updateFields[] = 'id_seccion = ?';
                $updateParams[] = $destino_seccion;
                $updateTypes .= 'i';
            } else {
                $updateFields[] = 'id_seccion = NULL';
            }
            
            if ($destino_oficina !== null) {
                $updateFields[] = 'id_oficina = ?';
                $updateParams[] = $destino_oficina;
                $updateTypes .= 'i';
            } else {
                $updateFields[] = 'id_oficina = NULL';
            }
            
            $updateParams[] = $id_inventario;
            $updateTypes .= 'i';
            
            $query_update = "UPDATE inventario SET " . implode(', ', $updateFields) . " WHERE id_inventario = ?";
            
            $stmt_update = $conn->prepare($query_update);
            if (!$stmt_update) {
                throw new Exception('Error al preparar consulta de actualización: ' . $conn->error);
            }
            
            $stmt_update->bind_param($updateTypes, ...$updateParams);
            if (!$stmt_update->execute()) {
                throw new Exception('Error al actualizar el item: ' . $stmt_update->error);
            }
            $stmt_update->close();
            
            $conn->commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Item movido correctamente'
            ]);
        } catch (Exception $e) {
            $conn->rollback();
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }

    /**
     * Obtener oficinas para el modal de mover
     * 
     * @param \mysqli $conn
     * @param array $data
     * @return JsonResponse
     */
    private function obtenerOficinas(\mysqli $conn, array $data): JsonResponse
    {
        $id_seccion = !empty($data['id_seccion']) ? intval($data['id_seccion']) : null;
        $id_departamento = !empty($data['id_departamento']) ? intval($data['id_departamento']) : null;
        
        $query = "SELECT id_oficina, nombre FROM oficinas WHERE 1=1";
        $params = [];
        $types = '';
        
        if ($id_seccion !== null) {
            $query .= " AND id_seccion = ?";
            $params[] = $id_seccion;
            $types .= 'i';
        }
        
        if ($id_departamento !== null) {
            $query .= " AND id_departamento = ?";
            $params[] = $id_departamento;
            $types .= 'i';
        }
        
        $query .= " ORDER BY nombre ASC";
        
        $stmt = $conn->prepare($query);
        if (!$stmt) {
            return response()->json([
                'success' => false,
                'message' => 'Error al preparar consulta: ' . $conn->error
            ], 500);
        }
        
        if (!empty($params)) {
            $stmt->bind_param($types, ...$params);
        }
        
        $stmt->execute();
        $result = $stmt->get_result();
        $oficinas = [];
        
        while ($row = $result->fetch_assoc()) {
            $oficinas[] = $row;
        }
        
        $stmt->close();
        
        return response()->json([
            'success' => true,
            'data' => $oficinas
        ]);
    }

    /**
     * Obtener un item de inventario
     * 
     * @param \mysqli $conn
     * @param array $data
     * @return JsonResponse
     */
    private function obtenerItemInventario(\mysqli $conn, array $data): JsonResponse
    {
        try {
            if (empty($data['id_inventario'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'ID de inventario no especificado'
                ], 400);
            }
            
            $id_inventario = intval($data['id_inventario']);
            $query = "
                SELECT 
                    i.*,
                    o.id_oficina,
                    o.id_direccion AS oficina_id_direccion,
                    o.id_departamento AS oficina_id_departamento,
                    o.id_seccion AS oficina_id_seccion,
                    tb.nombre AS tipo_bien
                FROM inventario i
                LEFT JOIN oficinas o ON i.id_oficina = o.id_oficina
                LEFT JOIN tipos_bien tb ON i.id_tipo_bien = tb.id_tipo_bien
                WHERE i.id_inventario = ?
            ";
            
            $stmt = $conn->prepare($query);
            if (!$stmt) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error al preparar consulta: ' . $conn->error
                ], 500);
            }
            
            $stmt->bind_param('i', $id_inventario);
            
            if (!$stmt->execute()) {
                $error = $stmt->error;
                $stmt->close();
                return response()->json([
                    'success' => false,
                    'message' => 'Error al ejecutar consulta: ' . $error
                ], 500);
            }
            
            $result = $stmt->get_result();
            
            if ($row = $result->fetch_assoc()) {
            // Construir ubicación
            $ubicacion = 'Sin asignar';
            $id_oficina_actual = $row['id_oficina'];
            $id_seccion_actual = $row['id_seccion'] ?? $row['oficina_id_seccion'] ?? null;
            $id_departamento_actual = $row['id_departamento'] ?? $row['oficina_id_departamento'] ?? null;
            $id_direccion_actual = $row['id_direccion'] ?? $row['oficina_id_direccion'] ?? null;

            // Obtener nombres de ubicación
            if ($id_oficina_actual) {
                $query_ubicacion = "SELECT o.nombre, s.nombre AS nombre_seccion, d.nombre AS nombre_departamento, dir.nombre AS nombre_direccion
                    FROM oficinas o
                    LEFT JOIN secciones s ON o.id_seccion = s.id_seccion
                    LEFT JOIN departamentos d ON o.id_departamento = d.id_departamento
                    LEFT JOIN direcciones dir ON o.id_direccion = dir.id_direccion
                    WHERE o.id_oficina = ?";
                $stmt_ubicacion = $conn->prepare($query_ubicacion);
                if ($stmt_ubicacion) {
                    $stmt_ubicacion->bind_param('i', $id_oficina_actual);
                    $stmt_ubicacion->execute();
                    $result_ubicacion = $stmt_ubicacion->get_result();
                    if ($ubicacion_row = $result_ubicacion->fetch_assoc()) {
                        $ubicacion = $ubicacion_row['nombre'];
                        if (!empty($ubicacion_row['nombre_seccion'])) {
                            $ubicacion = $ubicacion_row['nombre_seccion'] . ' - ' . $ubicacion;
                        }
                        if (!empty($ubicacion_row['nombre_departamento'])) {
                            $ubicacion = $ubicacion_row['nombre_departamento'] . ' - ' . $ubicacion;
                        }
                        if (!empty($ubicacion_row['nombre_direccion'])) {
                            $ubicacion = $ubicacion_row['nombre_direccion'] . ' - ' . $ubicacion;
                        }
                    }
                    $stmt_ubicacion->close();
                }
            }

            // Buscar usuario asignado
            $usuario_asignado = 'Sin asignar';
            if ($id_oficina_actual || $id_seccion_actual || $id_departamento_actual || $id_direccion_actual) {
                // Construir condiciones dinámicamente
                $conditions = [];
                $params = [];
                $types = '';

                if ($id_oficina_actual) {
                    $conditions[] = "(ua.id_oficina = ? AND ua.id_oficina IS NOT NULL)";
                    $params[] = $id_oficina_actual;
                    $types .= 'i';
                }

                if ($id_seccion_actual) {
                    $conditions[] = "(ua.id_seccion = ? AND ua.id_seccion IS NOT NULL AND ua.id_oficina IS NULL)";
                    $params[] = $id_seccion_actual;
                    $types .= 'i';
                }

                if ($id_departamento_actual) {
                    $conditions[] = "(ua.id_departamento = ? AND ua.id_departamento IS NOT NULL AND ua.id_seccion IS NULL AND ua.id_oficina IS NULL)";
                    $params[] = $id_departamento_actual;
                    $types .= 'i';
                }

                if ($id_direccion_actual) {
                    $conditions[] = "(ua.id_direccion = ? AND ua.id_direccion IS NOT NULL AND ua.id_departamento IS NULL AND ua.id_seccion IS NULL AND ua.id_oficina IS NULL)";
                    $params[] = $id_direccion_actual;
                    $types .= 'i';
                }

                if (!empty($conditions) && !empty($params)) {
                    $query_asignacion = "
                        SELECT ua.id_usuario, u.nombres, u.apellidos, u.cargo
                        FROM usuario_asignacion ua
                        JOIN usuarios u ON ua.id_usuario = u.id_usuario
                        WHERE ua.activo = 1
                        AND (" . implode(' OR ', $conditions) . ")
                        ORDER BY
                            CASE
                                WHEN ua.id_oficina IS NOT NULL THEN 1
                                WHEN ua.id_seccion IS NOT NULL THEN 2
                                WHEN ua.id_departamento IS NOT NULL THEN 3
                                WHEN ua.id_direccion IS NOT NULL THEN 4
                            END
                        LIMIT 1
                    ";

                    $stmt_asignacion = $conn->prepare($query_asignacion);
                    if ($stmt_asignacion) {
                        if ($stmt_asignacion->bind_param($types, ...$params)) {
                            if ($stmt_asignacion->execute()) {
                                $result_asignacion = $stmt_asignacion->get_result();

                                if ($usuario = $result_asignacion->fetch_assoc()) {
                                    $usuario_asignado = trim($usuario['nombres'] . ' ' . $usuario['apellidos']);
                                    if (!empty($usuario['cargo'])) {
                                        $usuario_asignado .= ' (' . $usuario['cargo'] . ')';
                                    }
                                }
                            }
                        }
                        $stmt_asignacion->close();
                    }
                }
            }

                $row['ubicacion'] = $ubicacion;
                $row['usuario_asignado'] = $usuario_asignado;

                $stmt->close();
                return response()->json([
                    'success' => true,
                    'data' => $row
                ]);
            } else {
                $stmt->close();
                return response()->json([
                    'success' => false,
                    'message' => 'Item no encontrado'
                ], 404);
            }
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener item de inventario: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar un espacio
     * 
     * @param \mysqli $conn
     * @param array $data
     * @return JsonResponse
     */
    private function actualizarEspacio(\mysqli $conn, array $data): JsonResponse
    {
        if (empty($data['id_oficina'])) {
            return response()->json([
                'success' => false,
                'message' => 'ID de oficina no especificado'
            ], 400);
        }
        
        $id_oficina = intval($data['id_oficina']);
        $nombre = trim($data['nombre'] ?? '');
        $edificio = !empty($data['edificio']) ? trim($data['edificio']) : null;
        $piso = !empty($data['piso']) ? trim($data['piso']) : null;
        $ubicacion_fisica = !empty($data['ubicacion_fisica']) ? trim($data['ubicacion_fisica']) : null;
        $id_direccion = !empty($data['id_direccion']) ? intval($data['id_direccion']) : null;
        $id_departamento = !empty($data['id_departamento']) ? intval($data['id_departamento']) : null;
        $id_seccion = !empty($data['id_seccion']) ? intval($data['id_seccion']) : null;
        $id_usuario_asignacion = !empty($data['id_usuario_asignacion']) ? intval($data['id_usuario_asignacion']) : null;
        
        if (empty($nombre)) {
            return response()->json([
                'success' => false,
                'message' => 'El nombre es obligatorio'
            ], 400);
        }
        
        // Iniciar transacción
        $conn->begin_transaction();
        
        try {
            // Construir query de actualización dinámicamente
            $updateFields = ['nombre = ?'];
            $params = [$nombre];
            $types = 's';
            
            if ($edificio !== null) {
                $updateFields[] = 'edificio = ?';
                $params[] = $edificio;
                $types .= 's';
            } else {
                $updateFields[] = 'edificio = NULL';
            }
            
            if ($piso !== null) {
                $updateFields[] = 'piso = ?';
                $params[] = $piso;
                $types .= 's';
            } else {
                $updateFields[] = 'piso = NULL';
            }
            
            if ($ubicacion_fisica !== null) {
                $updateFields[] = 'ubicacion_fisica = ?';
                $params[] = $ubicacion_fisica;
                $types .= 's';
            } else {
                $updateFields[] = 'ubicacion_fisica = NULL';
            }
            
            if ($id_direccion !== null) {
                $updateFields[] = 'id_direccion = ?';
                $params[] = $id_direccion;
                $types .= 'i';
            } else {
                $updateFields[] = 'id_direccion = NULL';
            }
            
            if ($id_departamento !== null) {
                $updateFields[] = 'id_departamento = ?';
                $params[] = $id_departamento;
                $types .= 'i';
            } else {
                $updateFields[] = 'id_departamento = NULL';
            }
            
            if ($id_seccion !== null) {
                $updateFields[] = 'id_seccion = ?';
                $params[] = $id_seccion;
                $types .= 'i';
            } else {
                $updateFields[] = 'id_seccion = NULL';
            }
            
            $params[] = $id_oficina;
            $types .= 'i';
            
            $query = "UPDATE oficinas SET " . implode(', ', $updateFields) . " WHERE id_oficina = ?";
            
            $stmt = $conn->prepare($query);
            if (!$stmt) {
                throw new Exception('Error al preparar consulta: ' . $conn->error);
            }
            
            $stmt->bind_param($types, ...$params);
            
            if (!$stmt->execute()) {
                throw new Exception('Error al actualizar el espacio: ' . $stmt->error);
            }
            
            $stmt->close();
            
            // Manejar items a quitar (poner id_oficina = NULL)
            if (!empty($data['items_quitar']) && is_array($data['items_quitar'])) {
                $ids_quitar = array_map('intval', $data['items_quitar']);
                $placeholders = implode(',', array_fill(0, count($ids_quitar), '?'));
                $query_quitar = "UPDATE inventario SET id_oficina = NULL WHERE id_inventario IN ($placeholders) AND activo = 1";
                $stmt_quitar = $conn->prepare($query_quitar);
                if ($stmt_quitar) {
                    $stmt_quitar->bind_param(str_repeat('i', count($ids_quitar)), ...$ids_quitar);
                    $stmt_quitar->execute();
                    $stmt_quitar->close();
                }
            }
            
            // Manejar items nuevos
            if (!empty($data['items_agregar']) && is_array($data['items_agregar'])) {
                // Obtener id_usuario_responsable
                $id_usuario_responsable = !empty($data['id_usuario_responsable']) ? intval($data['id_usuario_responsable']) : null;
                
                $stmt_insert = $conn->prepare("
                    INSERT INTO inventario (
                        codigo_patrimonial, descripcion, marca, modelo, serie, 
                        id_tipo_bien, estado, fecha_ingreso, 
                        id_direccion, id_departamento, id_seccion, id_oficina
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                
                $stmt_movimiento = $conn->prepare("
                    INSERT INTO movimientos_inventario (
                        id_inventario, tipo_movimiento, motivo, fecha_movimiento,
                        id_usuario_responsable, destino_direccion, destino_departamento,
                        destino_seccion, destino_oficina
                    ) VALUES (?, 'ALTA', ?, NOW(), ?, ?, ?, ?, ?)
                ");
                
                foreach ($data['items_agregar'] as $item) {
                    if (empty($item['codigo_patrimonial'])) {
                        continue;
                    }
                    
                    // Manejar nuevo tipo de bien si existe
                    $id_tipo_bien = null;
                    if (!empty($item['nuevo_tipo_bien'])) {
                        // Crear nuevo tipo de bien
                        $nombre_tipo_bien = trim($item['nuevo_tipo_bien']);
                        
                        // Verificar si ya existe un tipo de bien con el mismo nombre
                        $stmt_check_tipo = $conn->prepare("SELECT id_tipo_bien FROM tipos_bien WHERE nombre = ? LIMIT 1");
                        $stmt_check_tipo->bind_param('s', $nombre_tipo_bien);
                        $stmt_check_tipo->execute();
                        $result_check_tipo = $stmt_check_tipo->get_result();
                        
                        if ($result_check_tipo->num_rows > 0) {
                            // Ya existe, usar ese ID
                            $row_tipo = $result_check_tipo->fetch_assoc();
                            $id_tipo_bien = $row_tipo['id_tipo_bien'];
                        } else {
                            // No existe, crear nuevo
                            $stmt_insert_tipo = $conn->prepare("INSERT INTO tipos_bien (nombre) VALUES (?)");
                            $stmt_insert_tipo->bind_param('s', $nombre_tipo_bien);
                            if (!$stmt_insert_tipo->execute()) {
                                $stmt_check_tipo->close();
                                throw new Exception('Error al crear tipo de bien: ' . $stmt_insert_tipo->error);
                            }
                            $id_tipo_bien = $conn->insert_id;
                            $stmt_insert_tipo->close();
                        }
                        $stmt_check_tipo->close();
                    } else if (!empty($item['id_tipo_bien'])) {
                        $id_tipo_bien = intval($item['id_tipo_bien']);
                    }
                    
                    if (empty($id_tipo_bien)) {
                        continue; // Saltar items sin tipo de bien
                    }
                    
                    $codigo_patrimonial = trim($item['codigo_patrimonial']);
                    $descripcion = !empty($item['descripcion']) ? trim($item['descripcion']) : null;
                    $marca = !empty($item['marca']) ? trim($item['marca']) : null;
                    $modelo = !empty($item['modelo']) ? trim($item['modelo']) : null;
                    $serie = !empty($item['serie']) ? trim($item['serie']) : null;
                    $estado = !empty($item['estado']) ? trim($item['estado']) : null;
                    $fecha_ingreso = !empty($item['fecha_ingreso']) ? $item['fecha_ingreso'] : null;
                    $motivo = !empty($item['motivo']) ? trim($item['motivo']) : 'Alta de nuevo item de inventario';
                    
                    $stmt_insert->bind_param('sssssisssiii',
                        $codigo_patrimonial,
                        $descripcion,
                        $marca,
                        $modelo,
                        $serie,
                        $id_tipo_bien,
                        $estado,
                        $fecha_ingreso,
                        $id_direccion,
                        $id_departamento,
                        $id_seccion,
                        $id_oficina
                    );
                    
                    if (!$stmt_insert->execute()) {
                        throw new Exception('Error al insertar item: ' . $stmt_insert->error);
                    }
                    
                    // Obtener el ID del item recién insertado
                    $id_inventario_nuevo = $conn->insert_id;
                    
                    // Registrar movimiento si hay usuario responsable
                    if ($id_usuario_responsable && $id_inventario_nuevo) {
                        $stmt_movimiento->bind_param('isiiiii',
                            $id_inventario_nuevo,
                            $motivo,
                            $id_usuario_responsable,
                            $id_direccion,
                            $id_departamento,
                            $id_seccion,
                            $id_oficina
                        );
                        
                        if (!$stmt_movimiento->execute()) {
                            throw new Exception('Error al registrar movimiento: ' . $stmt_movimiento->error);
                        }
                    }
                }
                
                $stmt_insert->close();
                if ($stmt_movimiento) {
                    $stmt_movimiento->close();
                }
            }
            
            // Actualizar asignación de usuario
            if ($id_usuario_asignacion !== null && $id_usuario_asignacion > 0) {
                // Primero desactivar todas las asignaciones anteriores de esta oficina
                $stmt_desactivar = $conn->prepare("
                    UPDATE usuario_asignacion 
                    SET activo = 0 
                    WHERE id_oficina = ? AND activo = 1
                ");
                $stmt_desactivar->bind_param('i', $id_oficina);
                $stmt_desactivar->execute();
                $stmt_desactivar->close();
                
                // Verificar si ya existe una asignación (activa o inactiva) para este usuario y oficina
                $stmt_check = $conn->prepare("
                    SELECT id_asignacion, activo FROM usuario_asignacion 
                    WHERE id_usuario = ? AND id_oficina = ?
                    LIMIT 1
                ");
                $stmt_check->bind_param('ii', $id_usuario_asignacion, $id_oficina);
                $stmt_check->execute();
                $result_check = $stmt_check->get_result();
                
                if ($asignacion_existente = $result_check->fetch_assoc()) {
                    // Si existe, reactivarla y actualizar la fecha
                    $fecha_asignacion = date('Y-m-d');
                    $stmt_reactivar = $conn->prepare("
                        UPDATE usuario_asignacion 
                        SET activo = 1, fecha_asignacion = ?
                        WHERE id_asignacion = ?
                    ");
                    $stmt_reactivar->bind_param('si', $fecha_asignacion, $asignacion_existente['id_asignacion']);
                    $stmt_reactivar->execute();
                    $stmt_reactivar->close();
                } else {
                    // Si no existe, crear nueva asignación
                    $fecha_asignacion = date('Y-m-d');
                    $stmt_asignacion = $conn->prepare("
                        INSERT INTO usuario_asignacion (
                            id_usuario, id_oficina, fecha_asignacion, activo
                        ) VALUES (?, ?, ?, 1)
                    ");
                    $stmt_asignacion->bind_param('iis', $id_usuario_asignacion, $id_oficina, $fecha_asignacion);
                    $stmt_asignacion->execute();
                    $stmt_asignacion->close();
                }
                
                $stmt_check->close();
            } else {
                // Si no se asigna usuario (null o 0), desactivar todas las asignaciones de esta oficina
                $stmt_desactivar = $conn->prepare("
                    UPDATE usuario_asignacion 
                    SET activo = 0 
                    WHERE id_oficina = ? AND activo = 1
                ");
                $stmt_desactivar->bind_param('i', $id_oficina);
                $stmt_desactivar->execute();
                $stmt_desactivar->close();
            }
            
            $conn->commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Espacio actualizado correctamente'
            ]);
        } catch (Exception $e) {
            $conn->rollback();
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }

    /**
     * Listar todos los items de inventario
     * 
     * @param \mysqli $conn
     * @param array $data
     * @return JsonResponse
     */
    private function listarItemsInventario(\mysqli $conn, array $data = []): JsonResponse
    {
        try {
            $filtros = $data['filtros'] ?? [];
            $pagina = isset($data['pagina']) ? max(1, intval($data['pagina'])) : 1;
            $limite = isset($data['limite']) ? max(1, intval($data['limite'])) : 10;
            $offset = ($pagina - 1) * $limite;
            
            // Construir condiciones WHERE
            $where_conditions = [];
            $params = [];
            $types = '';
            
            // Filtro por código patrimonial
            if (!empty($filtros['codigo_patrimonial'])) {
                $where_conditions[] = "i.codigo_patrimonial LIKE ?";
                $params[] = '%' . $filtros['codigo_patrimonial'] . '%';
                $types .= 's';
            }
            
            // Filtro por estado
            if (isset($filtros['estado']) && $filtros['estado'] !== '' && $filtros['estado'] !== null) {
                $where_conditions[] = "i.activo = ?";
                $params[] = intval($filtros['estado']);
                $types .= 'i';
            }
            
            // Filtro por dirección
            if (!empty($filtros['id_direccion'])) {
                $where_conditions[] = "i.id_direccion = ?";
                $params[] = intval($filtros['id_direccion']);
                $types .= 'i';
            }
            
            // Filtro por departamento
            if (!empty($filtros['id_departamento'])) {
                $where_conditions[] = "i.id_departamento = ?";
                $params[] = intval($filtros['id_departamento']);
                $types .= 'i';
            }
            
            // Filtro por sección
            if (!empty($filtros['id_seccion'])) {
                $where_conditions[] = "i.id_seccion = ?";
                $params[] = intval($filtros['id_seccion']);
                $types .= 'i';
            }
            
            // Filtro por nombre de oficina
            if (!empty($filtros['nombre_oficina'])) {
                $where_conditions[] = "o.nombre LIKE ?";
                $params[] = '%' . $filtros['nombre_oficina'] . '%';
                $types .= 's';
            }
            
            // Filtro por usuario asignado (requiere JOIN adicional)
            $join_usuario = '';
            if (!empty($filtros['id_usuario'])) {
                $join_usuario = "
                    LEFT JOIN usuario_asignacion ua ON (
                        (i.id_oficina IS NOT NULL AND ua.id_oficina = i.id_oficina AND ua.id_oficina IS NOT NULL) OR
                        (i.id_seccion IS NOT NULL AND ua.id_seccion = i.id_seccion AND ua.id_seccion IS NOT NULL AND ua.id_oficina IS NULL) OR
                        (i.id_departamento IS NOT NULL AND ua.id_departamento = i.id_departamento AND ua.id_departamento IS NOT NULL AND ua.id_seccion IS NULL AND ua.id_oficina IS NULL) OR
                        (i.id_direccion IS NOT NULL AND ua.id_direccion = i.id_direccion AND ua.id_direccion IS NOT NULL AND ua.id_departamento IS NULL AND ua.id_seccion IS NULL AND ua.id_oficina IS NULL)
                    ) AND ua.activo = 1
                ";
                $where_conditions[] = "ua.id_usuario = ?";
                $params[] = intval($filtros['id_usuario']);
                $types .= 'i';
            }
            
            // Construir WHERE clause
            $where_clause = '';
            if (!empty($where_conditions)) {
                $where_clause = ' WHERE ' . implode(' AND ', $where_conditions);
            }
            
            // Primero contar el total de registros
            $query_count = "
                SELECT COUNT(DISTINCT i.id_inventario) as total
                FROM inventario i
                LEFT JOIN oficinas o ON i.id_oficina = o.id_oficina
                LEFT JOIN secciones s ON i.id_seccion = s.id_seccion
                LEFT JOIN departamentos d ON i.id_departamento = d.id_departamento
                LEFT JOIN direcciones dir ON i.id_direccion = dir.id_direccion
                " . $join_usuario . "
                " . $where_clause . "
            ";
            
            $stmt_count = $conn->prepare($query_count);
            if (!$stmt_count) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error al preparar consulta de conteo: ' . $conn->error
                ], 500);
            }
            
            if (!empty($params)) {
                $stmt_count->bind_param($types, ...$params);
            }
            
            $stmt_count->execute();
            $result_count = $stmt_count->get_result();
            $total_registros = 0;
            if ($row_count = $result_count->fetch_assoc()) {
                $total_registros = intval($row_count['total']);
            }
            $stmt_count->close();
            
            // Calcular información de paginación
            $total_paginas = ceil($total_registros / $limite);
            $tiene_anterior = $pagina > 1;
            $tiene_siguiente = $pagina < $total_paginas;
            
            $query = "
                SELECT DISTINCT
                    i.id_inventario,
                    i.codigo_patrimonial,
                    i.marca,
                    i.modelo,
                    i.serie,
                    i.descripcion,
                    i.activo,
                    i.id_oficina,
                    i.id_seccion,
                    i.id_departamento,
                    i.id_direccion,
                    o.nombre AS nombre_oficina,
                    s.nombre AS nombre_seccion,
                    d.nombre AS nombre_departamento,
                    dir.nombre AS nombre_direccion
                FROM inventario i
                LEFT JOIN oficinas o ON i.id_oficina = o.id_oficina
                LEFT JOIN secciones s ON i.id_seccion = s.id_seccion
                LEFT JOIN departamentos d ON i.id_departamento = d.id_departamento
                LEFT JOIN direcciones dir ON i.id_direccion = dir.id_direccion
                " . $join_usuario . "
                " . $where_clause . "
                ORDER BY i.codigo_patrimonial ASC
                LIMIT ? OFFSET ?
            ";

            $stmt = $conn->prepare($query);
            if (!$stmt) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error al preparar consulta: ' . $conn->error
                ], 500);
            }

            // Agregar parámetros de paginación
            $params[] = $limite;
            $params[] = $offset;
            $types .= 'ii';
            
            if (!empty($params)) {
                $stmt->bind_param($types, ...$params);
            }
            
            if (!$stmt->execute()) {
                $error = $stmt->error;
                $stmt->close();
                return response()->json([
                    'success' => false,
                    'message' => 'Error al ejecutar consulta: ' . $error
                ], 500);
            }
            
            $result = $stmt->get_result();
            $items = [];

            while ($row = $result->fetch_assoc()) {
            // Construir ubicación
            $ubicacion = 'Sin asignar';
            if (!empty($row['nombre_oficina'])) {
                $ubicacion = $row['nombre_oficina'];
                if (!empty($row['nombre_seccion'])) {
                    $ubicacion = $row['nombre_seccion'] . ' - ' . $ubicacion;
                }
                if (!empty($row['nombre_departamento'])) {
                    $ubicacion = $row['nombre_departamento'] . ' - ' . $ubicacion;
                }
                if (!empty($row['nombre_direccion'])) {
                    $ubicacion = $row['nombre_direccion'] . ' - ' . $ubicacion;
                }
            } elseif (!empty($row['nombre_seccion'])) {
                $ubicacion = $row['nombre_seccion'];
                if (!empty($row['nombre_departamento'])) {
                    $ubicacion = $row['nombre_departamento'] . ' - ' . $ubicacion;
                }
                if (!empty($row['nombre_direccion'])) {
                    $ubicacion = $row['nombre_direccion'] . ' - ' . $ubicacion;
                }
            } elseif (!empty($row['nombre_departamento'])) {
                $ubicacion = $row['nombre_departamento'];
                if (!empty($row['nombre_direccion'])) {
                    $ubicacion = $row['nombre_direccion'] . ' - ' . $ubicacion;
                }
            } elseif (!empty($row['nombre_direccion'])) {
                $ubicacion = $row['nombre_direccion'];
            }

            // Buscar usuario asignado
            $usuario_asignado = 'Sin asignar';
            $id_oficina_actual = !empty($row['id_oficina']) ? intval($row['id_oficina']) : null;
            $id_seccion_actual = !empty($row['id_seccion']) ? intval($row['id_seccion']) : null;
            $id_departamento_actual = !empty($row['id_departamento']) ? intval($row['id_departamento']) : null;
            $id_direccion_actual = !empty($row['id_direccion']) ? intval($row['id_direccion']) : null;

            // Construir condiciones dinámicamente basadas en qué IDs no son NULL
            $conditions = [];
            $params_asignacion = [];
            $types_asignacion = '';

            // Prioridad: oficina > sección > departamento > dirección
            if ($id_oficina_actual !== null) {
                $conditions[] = "(ua.id_oficina = ? AND ua.id_oficina IS NOT NULL)";
                $params_asignacion[] = $id_oficina_actual;
                $types_asignacion .= 'i';
            }

            if ($id_seccion_actual !== null) {
                $conditions[] = "(ua.id_seccion = ? AND ua.id_seccion IS NOT NULL AND ua.id_oficina IS NULL)";
                $params_asignacion[] = $id_seccion_actual;
                $types_asignacion .= 'i';
            }

            if ($id_departamento_actual !== null) {
                $conditions[] = "(ua.id_departamento = ? AND ua.id_departamento IS NOT NULL AND ua.id_seccion IS NULL AND ua.id_oficina IS NULL)";
                $params_asignacion[] = $id_departamento_actual;
                $types_asignacion .= 'i';
            }

            if ($id_direccion_actual !== null) {
                $conditions[] = "(ua.id_direccion = ? AND ua.id_direccion IS NOT NULL AND ua.id_departamento IS NULL AND ua.id_seccion IS NULL AND ua.id_oficina IS NULL)";
                $params_asignacion[] = $id_direccion_actual;
                $types_asignacion .= 'i';
            }

            if (!empty($conditions) && !empty($params_asignacion)) {
                $query_asignacion = "
                    SELECT ua.id_usuario, u.nombres, u.apellidos, u.cargo
                    FROM usuario_asignacion ua
                    JOIN usuarios u ON ua.id_usuario = u.id_usuario
                    WHERE ua.activo = 1
                    AND (" . implode(' OR ', $conditions) . ")
                    ORDER BY
                        CASE
                            WHEN ua.id_oficina IS NOT NULL THEN 1
                            WHEN ua.id_seccion IS NOT NULL THEN 2
                            WHEN ua.id_departamento IS NOT NULL THEN 3
                            WHEN ua.id_direccion IS NOT NULL THEN 4
                        END
                    LIMIT 1
                ";

                $stmt_asignacion = $conn->prepare($query_asignacion);
                if ($stmt_asignacion) {
                    if ($stmt_asignacion->bind_param($types_asignacion, ...$params_asignacion)) {
                        if ($stmt_asignacion->execute()) {
                            $result_asignacion = $stmt_asignacion->get_result();

                            if ($usuario = $result_asignacion->fetch_assoc()) {
                                $usuario_asignado = trim($usuario['nombres'] . ' ' . $usuario['apellidos']);
                                if (!empty($usuario['cargo'])) {
                                    $usuario_asignado .= ' (' . $usuario['cargo'] . ')';
                                }
                            }
                        }
                    }
                    $stmt_asignacion->close();
                }
            }

                $items[] = [
                    'id_inventario' => intval($row['id_inventario']),
                    'codigo_patrimonial' => $row['codigo_patrimonial'],
                    'marca' => $row['marca'] ?? 'N/A',
                    'modelo' => $row['modelo'] ?? 'N/A',
                    'serie' => $row['serie'] ?? 'N/A',
                    'descripcion' => $row['descripcion'] ?? 'N/A',
                    'ubicacion' => $ubicacion,
                    'usuario_asignado' => $usuario_asignado,
                    'activo' => intval($row['activo']) === 1 ? 'Activo' : 'De Baja'
                ];
            }

            $stmt->close();

            return response()->json([
                'success' => true,
                'data' => $items,
                'paginacion' => [
                    'pagina_actual' => $pagina,
                    'limite' => $limite,
                    'total_registros' => $total_registros,
                    'total_paginas' => $total_paginas,
                    'tiene_anterior' => $tiene_anterior,
                    'tiene_siguiente' => $tiene_siguiente
                ]
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al listar items de inventario: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar un item de inventario
     * 
     * @param \mysqli $conn
     * @param array $data
     * @return JsonResponse
     */
    private function eliminarItemInventario(\mysqli $conn, array $data): JsonResponse
    {
        if (empty($data['id_inventario'])) {
            return response()->json([
                'success' => false,
                'message' => 'ID de inventario no proporcionado'
            ], 400);
        }

        $id_inventario = intval($data['id_inventario']);
        $id_usuario_responsable = !empty($data['id_usuario_responsable']) ? intval($data['id_usuario_responsable']) : null;
        $motivo = trim($data['motivo'] ?? 'Eliminación de item');

        try {
            // Obtener datos actuales del item antes de eliminarlo
            $stmt_item = $conn->prepare("
                SELECT id_direccion, id_departamento, id_seccion, id_oficina 
                FROM inventario 
                WHERE id_inventario = ?
            ");
            if (!$stmt_item) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error al preparar consulta: ' . $conn->error
                ], 500);
            }
            
            $stmt_item->bind_param('i', $id_inventario);
            $stmt_item->execute();
            $result_item = $stmt_item->get_result();
            $item_actual = $result_item->fetch_assoc();
            $stmt_item->close();
            
            if (!$item_actual) {
                return response()->json([
                    'success' => false,
                    'message' => 'Item de inventario no encontrado'
                ], 404);
            }

            // Iniciar transacción para eliminar el item y sus movimientos relacionados
            $conn->begin_transaction();

            try {
                // Primero: Registrar movimiento en el historial antes de eliminar
                if ($id_usuario_responsable) {
                    $query_movimiento = "
                        INSERT INTO movimientos_inventario (
                            id_inventario,
                            origen_direccion, origen_departamento, origen_seccion, origen_oficina,
                            destino_direccion, destino_departamento, destino_seccion, destino_oficina,
                            tipo_movimiento, motivo, fecha_movimiento, id_usuario_responsable
                        ) VALUES (?, ?, ?, ?, ?, NULL, NULL, NULL, NULL, 'BAJA', ?, NOW(), ?)
                    ";
                    
                    $stmt_movimiento = $conn->prepare($query_movimiento);
                    if (!$stmt_movimiento) {
                        throw new Exception('Error al preparar consulta de movimiento: ' . $conn->error);
                    }
                    
                    $stmt_movimiento->bind_param('iiiissi',
                        $id_inventario,
                        $item_actual['id_direccion'],
                        $item_actual['id_departamento'],
                        $item_actual['id_seccion'],
                        $item_actual['id_oficina'],
                        $motivo,
                        $id_usuario_responsable
                    );
                    
                    if (!$stmt_movimiento->execute()) {
                        $error_mov = $stmt_movimiento->error;
                        $stmt_movimiento->close();
                        throw new Exception('Error al registrar movimiento: ' . $error_mov);
                    }
                    $stmt_movimiento->close();
                }
                
                // Segundo: Actualizar las incidencias para quitar la referencia a este item
                // Poner id_inventario a NULL en todas las incidencias que referencian este item
                $stmt_update_incidencias = $conn->prepare("UPDATE incidencias SET id_inventario = NULL WHERE id_inventario = ?");
                if ($stmt_update_incidencias) {
                    $stmt_update_incidencias->bind_param('i', $id_inventario);
                    if (!$stmt_update_incidencias->execute()) {
                        $error_incidencias = $stmt_update_incidencias->error;
                        $stmt_update_incidencias->close();
                        throw new Exception('Error al actualizar incidencias: ' . $error_incidencias);
                    }
                    $stmt_update_incidencias->close();
                }
                
                // Tercero: NO eliminar movimientos_inventario - mantener el historial completo
                // Los movimientos son el historial de cambios y deben permanecer en la base de datos
                
                // Cuarto: hacer soft delete del item (marcar como inactivo y desasignarlo)
                // Poner activo = 0 y desasignar todas las ubicaciones para que no aparezca en la visualización
                $stmt_update = $conn->prepare("
                    UPDATE inventario 
                    SET activo = 0, 
                        id_oficina = NULL, 
                        id_seccion = NULL, 
                        id_departamento = NULL, 
                        id_direccion = NULL 
                    WHERE id_inventario = ?
                ");
                if (!$stmt_update) {
                    throw new Exception('Error al preparar consulta de actualización: ' . $conn->error);
                }
                $stmt_update->bind_param('i', $id_inventario);
                
                if (!$stmt_update->execute()) {
                    $error = $stmt_update->error;
                    $stmt_update->close();
                    throw new Exception('Error al actualizar el item: ' . $error);
                }
                
                // Verificar que se actualizó al menos una fila
                if ($stmt_update->affected_rows === 0) {
                    $stmt_update->close();
                    throw new Exception('No se pudo actualizar el item');
                }
                
                $stmt_update->close();

                // Confirmar la transacción
                $conn->commit();

                return response()->json([
                    'success' => true,
                    'message' => 'Item de inventario eliminado correctamente. El historial de cambios se ha preservado.'
                ]);
            } catch (\Exception $e) {
                // Revertir la transacción en caso de error
                $conn->rollback();
                return response()->json([
                    'success' => false,
                    'message' => 'Error al eliminar el item: ' . $e->getMessage()
                ], 500);
            }
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar item de inventario: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar asignación de un item de inventario
     * 
     * @param \mysqli $conn
     * @param array $data
     * @return JsonResponse
     */
    private function eliminarAsignacionItem(\mysqli $conn, array $data): JsonResponse
    {
        if (empty($data['id_inventario'])) {
            return response()->json([
                'success' => false,
                'message' => 'ID de inventario no proporcionado'
            ], 400);
        }

        $id_inventario = intval($data['id_inventario']);
        $origen_oficina = !empty($data['origen_oficina']) ? intval($data['origen_oficina']) : null;
        $origen_seccion = !empty($data['origen_seccion']) ? intval($data['origen_seccion']) : null;
        $origen_departamento = !empty($data['origen_departamento']) ? intval($data['origen_departamento']) : null;
        $origen_direccion = !empty($data['origen_direccion']) ? intval($data['origen_direccion']) : null;
        $motivo = !empty($data['motivo']) ? trim($data['motivo']) : 'Eliminación de asignación';
        $id_usuario_responsable = !empty($data['id_usuario_responsable']) ? intval($data['id_usuario_responsable']) : null;

        try {
            $conn->begin_transaction();

            // Verificar que el item existe
            $stmt_check = $conn->prepare("SELECT id_inventario FROM inventario WHERE id_inventario = ?");
            if (!$stmt_check) {
                throw new Exception('Error al preparar consulta: ' . $conn->error);
            }

            $stmt_check->bind_param('i', $id_inventario);
            $stmt_check->execute();
            $result_check = $stmt_check->get_result();

            if ($result_check->num_rows === 0) {
                $stmt_check->close();
                $conn->rollback();
                return response()->json([
                    'success' => false,
                    'message' => 'Item de inventario no encontrado'
                ], 404);
            }

            $stmt_check->close();

            // Eliminar asignación (poner todos los campos de ubicación en NULL)
            $stmt_update = $conn->prepare("UPDATE inventario SET id_oficina = NULL, id_seccion = NULL, id_departamento = NULL, id_direccion = NULL WHERE id_inventario = ?");
            if (!$stmt_update) {
                throw new Exception('Error al preparar consulta de actualización: ' . $conn->error);
            }

            $stmt_update->bind_param('i', $id_inventario);
            
            if (!$stmt_update->execute()) {
                $error = $stmt_update->error;
                $stmt_update->close();
                throw new Exception('Error al eliminar asignación: ' . $error);
            }

            $stmt_update->close();

            // Registrar movimiento en movimientos_inventario
            if ($id_usuario_responsable) {
                // Construir la consulta dinámicamente para manejar NULLs
                $campos = ['id_inventario', 'tipo_movimiento', 'motivo', 'fecha_movimiento', 'id_usuario_responsable'];
                $valores = ['?', "'DESASIGNACION'", '?', 'NOW()', '?']; // Usar DESASIGNACION cuando se quita la asignación
                $params = [$id_inventario, $motivo, $id_usuario_responsable];
                $types = 'isi';
                
                // Agregar campos de origen (pueden ser NULL)
                if ($origen_oficina !== null) {
                    $campos[] = 'origen_oficina';
                    $valores[] = '?';
                    $params[] = $origen_oficina;
                    $types .= 'i';
                } else {
                    $campos[] = 'origen_oficina';
                    $valores[] = 'NULL';
                }
                
                if ($origen_seccion !== null) {
                    $campos[] = 'origen_seccion';
                    $valores[] = '?';
                    $params[] = $origen_seccion;
                    $types .= 'i';
                } else {
                    $campos[] = 'origen_seccion';
                    $valores[] = 'NULL';
                }
                
                if ($origen_departamento !== null) {
                    $campos[] = 'origen_departamento';
                    $valores[] = '?';
                    $params[] = $origen_departamento;
                    $types .= 'i';
                } else {
                    $campos[] = 'origen_departamento';
                    $valores[] = 'NULL';
                }
                
                if ($origen_direccion !== null) {
                    $campos[] = 'origen_direccion';
                    $valores[] = '?';
                    $params[] = $origen_direccion;
                    $types .= 'i';
                } else {
                    $campos[] = 'origen_direccion';
                    $valores[] = 'NULL';
                }
                
                // Agregar campos de destino como NULL
                $campos[] = 'destino_oficina';
                $valores[] = 'NULL';
                $campos[] = 'destino_seccion';
                $valores[] = 'NULL';
                $campos[] = 'destino_departamento';
                $valores[] = 'NULL';
                $campos[] = 'destino_direccion';
                $valores[] = 'NULL';
                
                $query_movimiento = "INSERT INTO movimientos_inventario (" . implode(', ', $campos) . ") VALUES (" . implode(', ', $valores) . ")";
                
                $stmt_movimiento = $conn->prepare($query_movimiento);
                if ($stmt_movimiento) {
                    if (!empty($params)) {
                        $stmt_movimiento->bind_param($types, ...$params);
                    }
                    $stmt_movimiento->execute();
                    $stmt_movimiento->close();
                }
            }

            $conn->commit();

            return response()->json([
                'success' => true,
                'message' => 'Asignación eliminada correctamente'
            ]);
        } catch (Exception $e) {
            $conn->rollback();
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar asignación: ' . $e->getMessage()
            ], 500);
        }
    }
}

