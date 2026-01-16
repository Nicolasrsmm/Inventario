<?php

namespace App\Http\Controllers;

use App\Services\DatabaseService;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class MovimientosController extends Controller
{
    /**
     * Manejar las acciones de movimientos de inventario
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
                case 'listar_movimientos':
                    return $this->listarMovimientos($conn, $data);
                    
                case 'listar_mis_movimientos':
                    return $this->listarMisMovimientos($conn, $data);
                    
                case 'listar_movimientos_informatica':
                    return $this->listarMovimientosInformatica($conn, $data);
                    
                case 'listar_historial_informatica':
                    return $this->listarHistorialInformatica($conn, $data);
                    
                case 'listar_todos_movimientos':
                    return $this->listarTodosMovimientos($conn, $data);
                    
                case 'obtener_usuarios_responsables':
                    return $this->obtenerUsuariosResponsables($conn, $data);
                    
                case 'obtener_usuarios_responsables_informatica':
                    return $this->obtenerUsuariosResponsablesInformatica($conn);
                    
                case 'marcar_revisado':
                    return $this->marcarRevisado($conn, $data);
                    
                case 'deshacer_movimiento':
                    return $this->deshacerMovimiento($conn, $data);
                    
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
        }
    }

    /**
     * Listar movimientos de inventario pendientes de revisión
     * Solo muestra movimientos donde id_usuario_responsable != usuario actual y revisado = 0
     * 
     * @param \mysqli $conn
     * @param array $data
     * @return JsonResponse
     */
    private function listarMovimientos(\mysqli $conn, array $data): JsonResponse
    {
        if (empty($data['id_usuario'])) {
            return response()->json([
                'success' => false,
                'message' => 'ID de usuario no especificado'
            ], 400);
        }

        $id_usuario = intval($data['id_usuario']);
        
        $query = "
            SELECT 
                m.id_movimiento,
                m.id_inventario,
                m.tipo_movimiento,
                m.motivo,
                m.fecha_movimiento,
                m.id_usuario_responsable,
                m.revisado,
                -- Origen
                m.origen_direccion,
                m.origen_departamento,
                m.origen_seccion,
                m.origen_oficina,
                dir_origen.nombre AS origen_direccion_nombre,
                dep_origen.nombre AS origen_departamento_nombre,
                sec_origen.nombre AS origen_seccion_nombre,
                of_origen.nombre AS origen_oficina_nombre,
                -- Destino
                m.destino_direccion,
                m.destino_departamento,
                m.destino_seccion,
                m.destino_oficina,
                dir_destino.nombre AS destino_direccion_nombre,
                dep_destino.nombre AS destino_departamento_nombre,
                sec_destino.nombre AS destino_seccion_nombre,
                of_destino.nombre AS destino_oficina_nombre,
                -- Item de inventario
                i.codigo_patrimonial,
                i.marca,
                i.modelo,
                i.serie,
                i.descripcion,
                -- Usuario responsable
                u.nombres AS usuario_responsable_nombres,
                u.apellidos AS usuario_responsable_apellidos,
                u.cargo AS usuario_responsable_cargo
            FROM movimientos_inventario m
            INNER JOIN inventario i ON m.id_inventario = i.id_inventario
            INNER JOIN usuarios u ON m.id_usuario_responsable = u.id_usuario
            LEFT JOIN direcciones dir_origen ON m.origen_direccion = dir_origen.id_direccion
            LEFT JOIN departamentos dep_origen ON m.origen_departamento = dep_origen.id_departamento
            LEFT JOIN secciones sec_origen ON m.origen_seccion = sec_origen.id_seccion
            LEFT JOIN oficinas of_origen ON m.origen_oficina = of_origen.id_oficina
            LEFT JOIN direcciones dir_destino ON m.destino_direccion = dir_destino.id_direccion
            LEFT JOIN departamentos dep_destino ON m.destino_departamento = dep_destino.id_departamento
            LEFT JOIN secciones sec_destino ON m.destino_seccion = sec_destino.id_seccion
            LEFT JOIN oficinas of_destino ON m.destino_oficina = of_destino.id_oficina
            WHERE m.id_usuario_responsable != ?
            AND (m.revisado = 0 OR m.revisado IS NULL)
            ORDER BY m.fecha_movimiento DESC
        ";

        $stmt = $conn->prepare($query);
        if (!$stmt) {
            return response()->json([
                'success' => false,
                'message' => 'Error al preparar consulta: ' . $conn->error
            ], 500);
        }

        $stmt->bind_param('i', $id_usuario);
        $stmt->execute();
        $result = $stmt->get_result();

        $movimientos = [];
        while ($row = $result->fetch_assoc()) {
            // Construir ubicación origen
            $origen = 'Sin origen';
            if (!empty($row['origen_oficina_nombre'])) {
                $origen = $row['origen_oficina_nombre'];
                if (!empty($row['origen_seccion_nombre'])) {
                    $origen = $row['origen_seccion_nombre'] . ' - ' . $origen;
                }
                if (!empty($row['origen_departamento_nombre'])) {
                    $origen = $row['origen_departamento_nombre'] . ' - ' . $origen;
                }
                if (!empty($row['origen_direccion_nombre'])) {
                    $origen = $row['origen_direccion_nombre'] . ' - ' . $origen;
                }
            } elseif (!empty($row['origen_seccion_nombre'])) {
                $origen = $row['origen_seccion_nombre'];
                if (!empty($row['origen_departamento_nombre'])) {
                    $origen = $row['origen_departamento_nombre'] . ' - ' . $origen;
                }
                if (!empty($row['origen_direccion_nombre'])) {
                    $origen = $row['origen_direccion_nombre'] . ' - ' . $origen;
                }
            } elseif (!empty($row['origen_departamento_nombre'])) {
                $origen = $row['origen_departamento_nombre'];
                if (!empty($row['origen_direccion_nombre'])) {
                    $origen = $row['origen_direccion_nombre'] . ' - ' . $origen;
                }
            } elseif (!empty($row['origen_direccion_nombre'])) {
                $origen = $row['origen_direccion_nombre'];
            }

            // Construir ubicación destino
            $destino = 'Sin destino';
            if (!empty($row['destino_oficina_nombre'])) {
                $destino = $row['destino_oficina_nombre'];
                if (!empty($row['destino_seccion_nombre'])) {
                    $destino = $row['destino_seccion_nombre'] . ' - ' . $destino;
                }
                if (!empty($row['destino_departamento_nombre'])) {
                    $destino = $row['destino_departamento_nombre'] . ' - ' . $destino;
                }
                if (!empty($row['destino_direccion_nombre'])) {
                    $destino = $row['destino_direccion_nombre'] . ' - ' . $destino;
                }
            } elseif (!empty($row['destino_seccion_nombre'])) {
                $destino = $row['destino_seccion_nombre'];
                if (!empty($row['destino_departamento_nombre'])) {
                    $destino = $row['destino_departamento_nombre'] . ' - ' . $destino;
                }
                if (!empty($row['destino_direccion_nombre'])) {
                    $destino = $row['destino_direccion_nombre'] . ' - ' . $destino;
                }
            } elseif (!empty($row['destino_departamento_nombre'])) {
                $destino = $row['destino_departamento_nombre'];
                if (!empty($row['destino_direccion_nombre'])) {
                    $destino = $row['destino_direccion_nombre'] . ' - ' . $destino;
                }
            } elseif (!empty($row['destino_direccion_nombre'])) {
                $destino = $row['destino_direccion_nombre'];
            }

            // Usuario responsable
            $usuario_responsable = trim($row['usuario_responsable_nombres'] . ' ' . $row['usuario_responsable_apellidos']);
            if (!empty($row['usuario_responsable_cargo'])) {
                $usuario_responsable .= ' (' . $row['usuario_responsable_cargo'] . ')';
            }

            $movimientos[] = [
                'id_movimiento' => $row['id_movimiento'],
                'id_inventario' => $row['id_inventario'],
                'codigo_patrimonial' => $row['codigo_patrimonial'] ?? 'N/A',
                'marca' => $row['marca'] ?? 'N/A',
                'modelo' => $row['modelo'] ?? 'N/A',
                'serie' => $row['serie'] ?? 'N/A',
                'descripcion' => $row['descripcion'] ?? 'N/A',
                'tipo_movimiento' => $row['tipo_movimiento'],
                'motivo' => $row['motivo'] ?? '',
                'fecha_movimiento' => $row['fecha_movimiento'],
                'origen' => $origen,
                'destino' => $destino,
                'usuario_responsable' => $usuario_responsable,
                'revisado' => $row['revisado'] ?? 0
            ];
        }

        $stmt->close();

        return response()->json([
            'success' => true,
            'data' => $movimientos
        ]);
    }

    /**
     * Listar movimientos realizados por el usuario actual
     * Solo muestra movimientos donde id_usuario_responsable = usuario actual
     * 
     * @param \mysqli $conn
     * @param array $data
     * @return JsonResponse
     */
    private function listarMisMovimientos(\mysqli $conn, array $data): JsonResponse
    {
        if (empty($data['id_usuario'])) {
            return response()->json([
                'success' => false,
                'message' => 'ID de usuario no especificado'
            ], 400);
        }

        $id_usuario = intval($data['id_usuario']);
        
        $query = "
            SELECT 
                m.id_movimiento,
                m.id_inventario,
                m.tipo_movimiento,
                m.motivo,
                m.fecha_movimiento,
                m.id_usuario_responsable,
                m.revisado,
                -- Origen
                m.origen_direccion,
                m.origen_departamento,
                m.origen_seccion,
                m.origen_oficina,
                dir_origen.nombre AS origen_direccion_nombre,
                dep_origen.nombre AS origen_departamento_nombre,
                sec_origen.nombre AS origen_seccion_nombre,
                of_origen.nombre AS origen_oficina_nombre,
                -- Destino
                m.destino_direccion,
                m.destino_departamento,
                m.destino_seccion,
                m.destino_oficina,
                dir_destino.nombre AS destino_direccion_nombre,
                dep_destino.nombre AS destino_departamento_nombre,
                sec_destino.nombre AS destino_seccion_nombre,
                of_destino.nombre AS destino_oficina_nombre,
                -- Item de inventario
                i.codigo_patrimonial,
                i.marca,
                i.modelo,
                i.serie,
                i.descripcion,
                -- Usuario responsable
                u.nombres AS usuario_responsable_nombres,
                u.apellidos AS usuario_responsable_apellidos,
                u.cargo AS usuario_responsable_cargo
            FROM movimientos_inventario m
            INNER JOIN inventario i ON m.id_inventario = i.id_inventario
            INNER JOIN usuarios u ON m.id_usuario_responsable = u.id_usuario
            LEFT JOIN direcciones dir_origen ON m.origen_direccion = dir_origen.id_direccion
            LEFT JOIN departamentos dep_origen ON m.origen_departamento = dep_origen.id_departamento
            LEFT JOIN secciones sec_origen ON m.origen_seccion = sec_origen.id_seccion
            LEFT JOIN oficinas of_origen ON m.origen_oficina = of_origen.id_oficina
            LEFT JOIN direcciones dir_destino ON m.destino_direccion = dir_destino.id_direccion
            LEFT JOIN departamentos dep_destino ON m.destino_departamento = dep_destino.id_departamento
            LEFT JOIN secciones sec_destino ON m.destino_seccion = sec_destino.id_seccion
            LEFT JOIN oficinas of_destino ON m.destino_oficina = of_destino.id_oficina
            WHERE m.id_usuario_responsable = ? 
            AND (m.revisado = 0 OR m.revisado IS NULL)
            ORDER BY m.fecha_movimiento DESC
        ";

        $stmt = $conn->prepare($query);
        if (!$stmt) {
            return response()->json([
                'success' => false,
                'message' => 'Error al preparar consulta: ' . $conn->error
            ], 500);
        }

        $stmt->bind_param('i', $id_usuario);
        $stmt->execute();
        $result = $stmt->get_result();

        $movimientos = [];
        while ($row = $result->fetch_assoc()) {
            // Construir texto de origen
            $origen_parts = [];
            if (!empty($row['origen_direccion_nombre'])) {
                $origen_parts[] = $row['origen_direccion_nombre'];
            }
            if (!empty($row['origen_departamento_nombre'])) {
                $origen_parts[] = $row['origen_departamento_nombre'];
            }
            if (!empty($row['origen_seccion_nombre'])) {
                $origen_parts[] = $row['origen_seccion_nombre'];
            }
            if (!empty($row['origen_oficina_nombre'])) {
                $origen_parts[] = $row['origen_oficina_nombre'];
            }
            $origen = !empty($origen_parts) ? implode(' > ', $origen_parts) : 'Sin asignar';

            // Construir texto de destino
            $destino_parts = [];
            if (!empty($row['destino_direccion_nombre'])) {
                $destino_parts[] = $row['destino_direccion_nombre'];
            }
            if (!empty($row['destino_departamento_nombre'])) {
                $destino_parts[] = $row['destino_departamento_nombre'];
            }
            if (!empty($row['destino_seccion_nombre'])) {
                $destino_parts[] = $row['destino_seccion_nombre'];
            }
            if (!empty($row['destino_oficina_nombre'])) {
                $destino_parts[] = $row['destino_oficina_nombre'];
            }
            $destino = !empty($destino_parts) ? implode(' > ', $destino_parts) : 'Sin asignar';

            // Construir nombre completo del usuario responsable
            $usuario_responsable = trim(($row['usuario_responsable_nombres'] ?? '') . ' ' . ($row['usuario_responsable_apellidos'] ?? ''));
            if (!empty($row['usuario_responsable_cargo'])) {
                $usuario_responsable .= ' (' . $row['usuario_responsable_cargo'] . ')';
            }

            $movimientos[] = [
                'id_movimiento' => $row['id_movimiento'],
                'id_inventario' => $row['id_inventario'],
                'tipo_movimiento' => $row['tipo_movimiento'],
                'motivo' => $row['motivo'],
                'fecha_movimiento' => $row['fecha_movimiento'],
                'id_usuario_responsable' => $row['id_usuario_responsable'],
                'revisado' => $row['revisado'],
                'codigo_patrimonial' => $row['codigo_patrimonial'],
                'marca' => $row['marca'],
                'modelo' => $row['modelo'],
                'serie' => $row['serie'],
                'descripcion' => $row['descripcion'],
                'origen' => $origen,
                'destino' => $destino,
                'usuario_responsable' => $usuario_responsable
            ];
        }

        $stmt->close();

        return response()->json([
            'success' => true,
            'data' => $movimientos
        ]);
    }

    /**
     * Listar movimientos realizados por personal de informática
     * Muestra todos los movimientos donde el usuario responsable tiene rol de informática
     * 
     * @param \mysqli $conn
     * @param array $data
     * @return JsonResponse
     */
    private function listarMovimientosInformatica(\mysqli $conn, array $data): JsonResponse
    {
        $query = "
            SELECT 
                m.id_movimiento,
                m.id_inventario,
                m.tipo_movimiento,
                m.motivo,
                m.fecha_movimiento,
                m.id_usuario_responsable,
                m.revisado,
                -- Origen
                m.origen_direccion,
                m.origen_departamento,
                m.origen_seccion,
                m.origen_oficina,
                dir_origen.nombre AS origen_direccion_nombre,
                dep_origen.nombre AS origen_departamento_nombre,
                sec_origen.nombre AS origen_seccion_nombre,
                of_origen.nombre AS origen_oficina_nombre,
                -- Destino
                m.destino_direccion,
                m.destino_departamento,
                m.destino_seccion,
                m.destino_oficina,
                dir_destino.nombre AS destino_direccion_nombre,
                dep_destino.nombre AS destino_departamento_nombre,
                sec_destino.nombre AS destino_seccion_nombre,
                of_destino.nombre AS destino_oficina_nombre,
                -- Item de inventario
                i.codigo_patrimonial,
                i.marca,
                i.modelo,
                i.serie,
                i.descripcion,
                -- Usuario responsable
                u.nombres AS usuario_responsable_nombres,
                u.apellidos AS usuario_responsable_apellidos,
                u.cargo AS usuario_responsable_cargo
            FROM movimientos_inventario m
            INNER JOIN inventario i ON m.id_inventario = i.id_inventario
            INNER JOIN usuarios u ON m.id_usuario_responsable = u.id_usuario
            INNER JOIN usuario_roles ur ON u.id_usuario = ur.id_usuario
            INNER JOIN roles r ON ur.id_rol = r.id_rol
            LEFT JOIN direcciones dir_origen ON m.origen_direccion = dir_origen.id_direccion
            LEFT JOIN departamentos dep_origen ON m.origen_departamento = dep_origen.id_departamento
            LEFT JOIN secciones sec_origen ON m.origen_seccion = sec_origen.id_seccion
            LEFT JOIN oficinas of_origen ON m.origen_oficina = of_origen.id_oficina
            LEFT JOIN direcciones dir_destino ON m.destino_direccion = dir_destino.id_direccion
            LEFT JOIN departamentos dep_destino ON m.destino_departamento = dep_destino.id_departamento
            LEFT JOIN secciones sec_destino ON m.destino_seccion = sec_destino.id_seccion
            LEFT JOIN oficinas of_destino ON m.destino_oficina = of_destino.id_oficina
            WHERE LOWER(r.nombre) IN ('informática', 'informatica')
            AND ur.activo = 1
            AND r.activo = 1
            AND (m.revisado = 0 OR m.revisado IS NULL)
            ORDER BY m.fecha_movimiento DESC
        ";

        $stmt = $conn->prepare($query);
        if (!$stmt) {
            return response()->json([
                'success' => false,
                'message' => 'Error al preparar consulta: ' . $conn->error
            ], 500);
        }

        $stmt->execute();
        $result = $stmt->get_result();

        $movimientos = [];
        while ($row = $result->fetch_assoc()) {
            // Construir texto de origen
            $origen_parts = [];
            if (!empty($row['origen_direccion_nombre'])) {
                $origen_parts[] = $row['origen_direccion_nombre'];
            }
            if (!empty($row['origen_departamento_nombre'])) {
                $origen_parts[] = $row['origen_departamento_nombre'];
            }
            if (!empty($row['origen_seccion_nombre'])) {
                $origen_parts[] = $row['origen_seccion_nombre'];
            }
            if (!empty($row['origen_oficina_nombre'])) {
                $origen_parts[] = $row['origen_oficina_nombre'];
            }
            $origen = !empty($origen_parts) ? implode(' > ', $origen_parts) : 'Sin asignar';

            // Construir texto de destino
            $destino_parts = [];
            if (!empty($row['destino_direccion_nombre'])) {
                $destino_parts[] = $row['destino_direccion_nombre'];
            }
            if (!empty($row['destino_departamento_nombre'])) {
                $destino_parts[] = $row['destino_departamento_nombre'];
            }
            if (!empty($row['destino_seccion_nombre'])) {
                $destino_parts[] = $row['destino_seccion_nombre'];
            }
            if (!empty($row['destino_oficina_nombre'])) {
                $destino_parts[] = $row['destino_oficina_nombre'];
            }
            $destino = !empty($destino_parts) ? implode(' > ', $destino_parts) : 'Sin asignar';

            // Usuario responsable
            $usuario_responsable = trim($row['usuario_responsable_nombres'] . ' ' . $row['usuario_responsable_apellidos']);
            if (!empty($row['usuario_responsable_cargo'])) {
                $usuario_responsable .= ' (' . $row['usuario_responsable_cargo'] . ')';
            }

            $movimientos[] = [
                'id_movimiento' => $row['id_movimiento'],
                'id_inventario' => $row['id_inventario'],
                'codigo_patrimonial' => $row['codigo_patrimonial'] ?? 'N/A',
                'marca' => $row['marca'] ?? 'N/A',
                'modelo' => $row['modelo'] ?? 'N/A',
                'serie' => $row['serie'] ?? 'N/A',
                'descripcion' => $row['descripcion'] ?? 'N/A',
                'tipo_movimiento' => $row['tipo_movimiento'],
                'motivo' => $row['motivo'] ?? '',
                'fecha_movimiento' => $row['fecha_movimiento'],
                'origen' => $origen,
                'destino' => $destino,
                'usuario_responsable' => $usuario_responsable,
                'revisado' => $row['revisado'] ?? 0
            ];
        }

        $stmt->close();

        return response()->json([
            'success' => true,
            'data' => $movimientos
        ]);
    }

    /**
     * Listar historial completo de movimientos de personal de informática
     * Con paginación y filtros, similar a listarTodosMovimientos pero solo para informática
     * 
     * @param \mysqli $conn
     * @param array $data
     * @return JsonResponse
     */
    private function listarHistorialInformatica(\mysqli $conn, array $data): JsonResponse
    {
        // Parámetros de paginación
        $pagina = isset($data['pagina']) ? intval($data['pagina']) : 1;
        $limite = isset($data['limite']) ? intval($data['limite']) : 10;
        
        if ($pagina < 1) $pagina = 1;
        if ($limite < 1) $limite = 10;
        
        $offset = ($pagina - 1) * $limite;
        
        // Obtener filtros
        $filtros = isset($data['filtros']) ? $data['filtros'] : [];
        $codigo_patrimonial = isset($filtros['codigo_patrimonial']) ? trim($filtros['codigo_patrimonial']) : '';
        $tipo_movimiento = isset($filtros['tipo_movimiento']) ? trim($filtros['tipo_movimiento']) : '';
        $id_usuario = isset($filtros['id_usuario']) ? intval($filtros['id_usuario']) : 0;
        $fecha = isset($filtros['fecha']) ? trim($filtros['fecha']) : '';
        
        // Construir condiciones WHERE (siempre filtrar por rol de informática)
        $where_conditions = [
            "LOWER(r.nombre) IN ('informática', 'informatica')",
            "ur.activo = 1",
            "r.activo = 1"
        ];
        $params = [];
        $param_types = '';
        
        if (!empty($codigo_patrimonial)) {
            $where_conditions[] = "i.codigo_patrimonial LIKE ?";
            $params[] = '%' . $codigo_patrimonial . '%';
            $param_types .= 's';
        }
        
        if (!empty($tipo_movimiento)) {
            $where_conditions[] = "m.tipo_movimiento = ?";
            $params[] = $tipo_movimiento;
            $param_types .= 's';
        }
        
        if ($id_usuario > 0) {
            $where_conditions[] = "m.id_usuario_responsable = ?";
            $params[] = $id_usuario;
            $param_types .= 'i';
        }
        
        if (!empty($fecha)) {
            $where_conditions[] = "DATE(m.fecha_movimiento) = ?";
            $params[] = $fecha;
            $param_types .= 's';
        }
        
        $where_clause = ' WHERE ' . implode(' AND ', $where_conditions);
        
        // Query para contar total de registros
        $query_count = "
            SELECT COUNT(*) as total
            FROM movimientos_inventario m
            INNER JOIN inventario i ON m.id_inventario = i.id_inventario
            INNER JOIN usuarios u ON m.id_usuario_responsable = u.id_usuario
            INNER JOIN usuario_roles ur ON u.id_usuario = ur.id_usuario
            INNER JOIN roles r ON ur.id_rol = r.id_rol
            " . $where_clause . "
        ";
        
        $stmt_count = $conn->prepare($query_count);
        if ($stmt_count) {
            if (!empty($params)) {
                $stmt_count->bind_param($param_types, ...$params);
            }
            $stmt_count->execute();
            $result_count = $stmt_count->get_result();
        } else {
            $result_count = $conn->query($query_count);
        }
        
        $total_registros = 0;
        if ($result_count) {
            $row_count = $result_count->fetch_assoc();
            $total_registros = intval($row_count['total']);
            if ($stmt_count) {
                $stmt_count->close();
            }
        }
        
        // Calcular paginación
        $total_paginas = ceil($total_registros / $limite);
        $tiene_anterior = $pagina > 1;
        $tiene_siguiente = $pagina < $total_paginas;
        
        // Agregar parámetros para LIMIT y OFFSET
        $params_limit = $params;
        $param_types_limit = $param_types;
        $params_limit[] = $limite;
        $param_types_limit .= 'i';
        $params_limit[] = $offset;
        $param_types_limit .= 'i';
        
        $query = "
            SELECT 
                m.id_movimiento,
                m.id_inventario,
                m.tipo_movimiento,
                m.motivo,
                m.fecha_movimiento,
                m.id_usuario_responsable,
                m.revisado,
                -- Origen
                m.origen_direccion,
                m.origen_departamento,
                m.origen_seccion,
                m.origen_oficina,
                dir_origen.nombre AS origen_direccion_nombre,
                dep_origen.nombre AS origen_departamento_nombre,
                sec_origen.nombre AS origen_seccion_nombre,
                of_origen.nombre AS origen_oficina_nombre,
                -- Destino
                m.destino_direccion,
                m.destino_departamento,
                m.destino_seccion,
                m.destino_oficina,
                dir_destino.nombre AS destino_direccion_nombre,
                dep_destino.nombre AS destino_departamento_nombre,
                sec_destino.nombre AS destino_seccion_nombre,
                of_destino.nombre AS destino_oficina_nombre,
                -- Item de inventario
                i.codigo_patrimonial,
                i.marca,
                i.modelo,
                i.serie,
                i.descripcion,
                -- Usuario responsable
                u.nombres AS usuario_responsable_nombres,
                u.apellidos AS usuario_responsable_apellidos,
                u.cargo AS usuario_responsable_cargo
            FROM movimientos_inventario m
            INNER JOIN inventario i ON m.id_inventario = i.id_inventario
            INNER JOIN usuarios u ON m.id_usuario_responsable = u.id_usuario
            INNER JOIN usuario_roles ur ON u.id_usuario = ur.id_usuario
            INNER JOIN roles r ON ur.id_rol = r.id_rol
            LEFT JOIN direcciones dir_origen ON m.origen_direccion = dir_origen.id_direccion
            LEFT JOIN departamentos dep_origen ON m.origen_departamento = dep_origen.id_departamento
            LEFT JOIN secciones sec_origen ON m.origen_seccion = sec_origen.id_seccion
            LEFT JOIN oficinas of_origen ON m.origen_oficina = of_origen.id_oficina
            LEFT JOIN direcciones dir_destino ON m.destino_direccion = dir_destino.id_direccion
            LEFT JOIN departamentos dep_destino ON m.destino_departamento = dep_destino.id_departamento
            LEFT JOIN secciones sec_destino ON m.destino_seccion = sec_destino.id_seccion
            LEFT JOIN oficinas of_destino ON m.destino_oficina = of_destino.id_oficina
            " . $where_clause . "
            ORDER BY m.fecha_movimiento DESC
            LIMIT ? OFFSET ?
        ";

        $stmt = $conn->prepare($query);
        if (!$stmt) {
            return response()->json([
                'success' => false,
                'message' => 'Error al preparar consulta: ' . $conn->error
            ], 500);
        }
        
        if (!empty($params_limit)) {
            $stmt->bind_param($param_types_limit, ...$params_limit);
        }

        $stmt->execute();
        $result = $stmt->get_result();

        $movimientos = [];
        while ($row = $result->fetch_assoc()) {
            // Construir ubicación origen
            $origen = 'Sin origen';
            if (!empty($row['origen_oficina_nombre'])) {
                $origen = $row['origen_oficina_nombre'];
                if (!empty($row['origen_seccion_nombre'])) {
                    $origen = $row['origen_seccion_nombre'] . ' - ' . $origen;
                }
                if (!empty($row['origen_departamento_nombre'])) {
                    $origen = $row['origen_departamento_nombre'] . ' - ' . $origen;
                }
                if (!empty($row['origen_direccion_nombre'])) {
                    $origen = $row['origen_direccion_nombre'] . ' - ' . $origen;
                }
            } elseif (!empty($row['origen_seccion_nombre'])) {
                $origen = $row['origen_seccion_nombre'];
                if (!empty($row['origen_departamento_nombre'])) {
                    $origen = $row['origen_departamento_nombre'] . ' - ' . $origen;
                }
                if (!empty($row['origen_direccion_nombre'])) {
                    $origen = $row['origen_direccion_nombre'] . ' - ' . $origen;
                }
            } elseif (!empty($row['origen_departamento_nombre'])) {
                $origen = $row['origen_departamento_nombre'];
                if (!empty($row['origen_direccion_nombre'])) {
                    $origen = $row['origen_direccion_nombre'] . ' - ' . $origen;
                }
            } elseif (!empty($row['origen_direccion_nombre'])) {
                $origen = $row['origen_direccion_nombre'];
            }

            // Construir ubicación destino
            $destino = 'Sin destino';
            if (!empty($row['destino_oficina_nombre'])) {
                $destino = $row['destino_oficina_nombre'];
                if (!empty($row['destino_seccion_nombre'])) {
                    $destino = $row['destino_seccion_nombre'] . ' - ' . $destino;
                }
                if (!empty($row['destino_departamento_nombre'])) {
                    $destino = $row['destino_departamento_nombre'] . ' - ' . $destino;
                }
                if (!empty($row['destino_direccion_nombre'])) {
                    $destino = $row['destino_direccion_nombre'] . ' - ' . $destino;
                }
            } elseif (!empty($row['destino_seccion_nombre'])) {
                $destino = $row['destino_seccion_nombre'];
                if (!empty($row['destino_departamento_nombre'])) {
                    $destino = $row['destino_departamento_nombre'] . ' - ' . $destino;
                }
                if (!empty($row['destino_direccion_nombre'])) {
                    $destino = $row['destino_direccion_nombre'] . ' - ' . $destino;
                }
            } elseif (!empty($row['destino_departamento_nombre'])) {
                $destino = $row['destino_departamento_nombre'];
                if (!empty($row['destino_direccion_nombre'])) {
                    $destino = $row['destino_direccion_nombre'] . ' - ' . $destino;
                }
            } elseif (!empty($row['destino_direccion_nombre'])) {
                $destino = $row['destino_direccion_nombre'];
            }

            // Usuario responsable
            $usuario_responsable = trim($row['usuario_responsable_nombres'] . ' ' . $row['usuario_responsable_apellidos']);
            if (!empty($row['usuario_responsable_cargo'])) {
                $usuario_responsable .= ' (' . $row['usuario_responsable_cargo'] . ')';
            }

            $movimientos[] = [
                'id_movimiento' => $row['id_movimiento'],
                'id_inventario' => $row['id_inventario'],
                'codigo_patrimonial' => $row['codigo_patrimonial'] ?? 'N/A',
                'marca' => $row['marca'] ?? 'N/A',
                'modelo' => $row['modelo'] ?? 'N/A',
                'serie' => $row['serie'] ?? 'N/A',
                'descripcion' => $row['descripcion'] ?? 'N/A',
                'tipo_movimiento' => $row['tipo_movimiento'],
                'motivo' => $row['motivo'] ?? '',
                'fecha_movimiento' => $row['fecha_movimiento'],
                'origen' => $origen,
                'destino' => $destino,
                'usuario_responsable' => $usuario_responsable,
                'revisado' => $row['revisado'] ?? 0
            ];
        }

        $stmt->close();

        return response()->json([
            'success' => true,
            'data' => $movimientos,
            'paginacion' => [
                'pagina_actual' => $pagina,
                'total_paginas' => $total_paginas,
                'total_registros' => $total_registros,
                'tiene_anterior' => $tiene_anterior,
                'tiene_siguiente' => $tiene_siguiente
            ]
        ]);
    }

    /**
     * Listar todos los movimientos de inventario (sin filtros)
     * 
     * @param \mysqli $conn
     * @param array $data
     * @return JsonResponse
     */
    private function listarTodosMovimientos(\mysqli $conn, array $data): JsonResponse
    {
        // Parámetros de paginación
        $pagina = isset($data['pagina']) ? intval($data['pagina']) : 1;
        $limite = isset($data['limite']) ? intval($data['limite']) : 10;
        
        if ($pagina < 1) $pagina = 1;
        if ($limite < 1) $limite = 10;
        
        $offset = ($pagina - 1) * $limite;
        
        // Obtener filtros
        $filtros = isset($data['filtros']) ? $data['filtros'] : [];
        $codigo_patrimonial = isset($filtros['codigo_patrimonial']) ? trim($filtros['codigo_patrimonial']) : '';
        $tipo_movimiento = isset($filtros['tipo_movimiento']) ? trim($filtros['tipo_movimiento']) : '';
        $id_usuario = isset($filtros['id_usuario']) ? intval($filtros['id_usuario']) : 0;
        $fecha = isset($filtros['fecha']) ? trim($filtros['fecha']) : '';
        
        // Construir condiciones WHERE
        $where_conditions = [];
        $params = [];
        $param_types = '';
        
        if (!empty($codigo_patrimonial)) {
            $where_conditions[] = "i.codigo_patrimonial LIKE ?";
            $params[] = '%' . $codigo_patrimonial . '%';
            $param_types .= 's';
        }
        
        if (!empty($tipo_movimiento)) {
            $where_conditions[] = "m.tipo_movimiento = ?";
            $params[] = $tipo_movimiento;
            $param_types .= 's';
        }
        
        if ($id_usuario > 0) {
            $where_conditions[] = "m.id_usuario_responsable = ?";
            $params[] = $id_usuario;
            $param_types .= 'i';
        }
        
        if (!empty($fecha)) {
            $where_conditions[] = "DATE(m.fecha_movimiento) = ?";
            $params[] = $fecha;
            $param_types .= 's';
        }
        
        $where_clause = '';
        if (!empty($where_conditions)) {
            $where_clause = ' WHERE ' . implode(' AND ', $where_conditions);
        }
        
        // Query para contar total de registros
        $query_count = "
            SELECT COUNT(*) as total
            FROM movimientos_inventario m
            INNER JOIN inventario i ON m.id_inventario = i.id_inventario
            INNER JOIN usuarios u ON m.id_usuario_responsable = u.id_usuario
            " . $where_clause . "
        ";
        
        $stmt_count = $conn->prepare($query_count);
        if ($stmt_count) {
            if (!empty($params)) {
                $stmt_count->bind_param($param_types, ...$params);
            }
            $stmt_count->execute();
            $result_count = $stmt_count->get_result();
        } else {
            $result_count = $conn->query($query_count);
        }
        
        $total_registros = 0;
        if ($result_count) {
            $row_count = $result_count->fetch_assoc();
            $total_registros = intval($row_count['total']);
            if ($stmt_count) {
                $stmt_count->close();
            }
        }
        
        // Calcular paginación
        $total_paginas = ceil($total_registros / $limite);
        $tiene_anterior = $pagina > 1;
        $tiene_siguiente = $pagina < $total_paginas;
        
        $query = "
            SELECT 
                m.id_movimiento,
                m.id_inventario,
                m.tipo_movimiento,
                m.motivo,
                m.fecha_movimiento,
                m.id_usuario_responsable,
                m.revisado,
                -- Origen
                m.origen_direccion,
                m.origen_departamento,
                m.origen_seccion,
                m.origen_oficina,
                dir_origen.nombre AS origen_direccion_nombre,
                dep_origen.nombre AS origen_departamento_nombre,
                sec_origen.nombre AS origen_seccion_nombre,
                of_origen.nombre AS origen_oficina_nombre,
                -- Destino
                m.destino_direccion,
                m.destino_departamento,
                m.destino_seccion,
                m.destino_oficina,
                dir_destino.nombre AS destino_direccion_nombre,
                dep_destino.nombre AS destino_departamento_nombre,
                sec_destino.nombre AS destino_seccion_nombre,
                of_destino.nombre AS destino_oficina_nombre,
                -- Item de inventario
                i.codigo_patrimonial,
                i.marca,
                i.modelo,
                i.serie,
                i.descripcion,
                -- Usuario responsable
                u.nombres AS usuario_responsable_nombres,
                u.apellidos AS usuario_responsable_apellidos,
                u.cargo AS usuario_responsable_cargo
            FROM movimientos_inventario m
            INNER JOIN inventario i ON m.id_inventario = i.id_inventario
            INNER JOIN usuarios u ON m.id_usuario_responsable = u.id_usuario
            LEFT JOIN direcciones dir_origen ON m.origen_direccion = dir_origen.id_direccion
            LEFT JOIN departamentos dep_origen ON m.origen_departamento = dep_origen.id_departamento
            LEFT JOIN secciones sec_origen ON m.origen_seccion = sec_origen.id_seccion
            LEFT JOIN oficinas of_origen ON m.origen_oficina = of_origen.id_oficina
            LEFT JOIN direcciones dir_destino ON m.destino_direccion = dir_destino.id_direccion
            LEFT JOIN departamentos dep_destino ON m.destino_departamento = dep_destino.id_departamento
            LEFT JOIN secciones sec_destino ON m.destino_seccion = sec_destino.id_seccion
            LEFT JOIN oficinas of_destino ON m.destino_oficina = of_destino.id_oficina
            " . $where_clause . "
            ORDER BY m.fecha_movimiento DESC
            LIMIT ? OFFSET ?
        ";

        $stmt = $conn->prepare($query);
        if (!$stmt) {
            return response()->json([
                'success' => false,
                'message' => 'Error al preparar consulta: ' . $conn->error
            ], 500);
        }
        
        // Agregar límite y offset a los parámetros
        $params[] = $limite;
        $params[] = $offset;
        $param_types .= 'ii';
        
        // Siempre hay al menos límite y offset
        $stmt->bind_param($param_types, ...$params);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if (!$result) {
            $stmt->close();
            return response()->json([
                'success' => false,
                'message' => 'Error al ejecutar consulta: ' . $conn->error
            ], 500);
        }

        $movimientos = [];
        while ($row = $result->fetch_assoc()) {
            // Construir ubicación origen
            $origen = 'Sin origen';
            if (!empty($row['origen_oficina_nombre'])) {
                $origen = $row['origen_oficina_nombre'];
                if (!empty($row['origen_seccion_nombre'])) {
                    $origen = $row['origen_seccion_nombre'] . ' - ' . $origen;
                }
                if (!empty($row['origen_departamento_nombre'])) {
                    $origen = $row['origen_departamento_nombre'] . ' - ' . $origen;
                }
                if (!empty($row['origen_direccion_nombre'])) {
                    $origen = $row['origen_direccion_nombre'] . ' - ' . $origen;
                }
            } elseif (!empty($row['origen_seccion_nombre'])) {
                $origen = $row['origen_seccion_nombre'];
                if (!empty($row['origen_departamento_nombre'])) {
                    $origen = $row['origen_departamento_nombre'] . ' - ' . $origen;
                }
                if (!empty($row['origen_direccion_nombre'])) {
                    $origen = $row['origen_direccion_nombre'] . ' - ' . $origen;
                }
            } elseif (!empty($row['origen_departamento_nombre'])) {
                $origen = $row['origen_departamento_nombre'];
                if (!empty($row['origen_direccion_nombre'])) {
                    $origen = $row['origen_direccion_nombre'] . ' - ' . $origen;
                }
            } elseif (!empty($row['origen_direccion_nombre'])) {
                $origen = $row['origen_direccion_nombre'];
            }

            // Construir ubicación destino
            $destino = 'Sin destino';
            if (!empty($row['destino_oficina_nombre'])) {
                $destino = $row['destino_oficina_nombre'];
                if (!empty($row['destino_seccion_nombre'])) {
                    $destino = $row['destino_seccion_nombre'] . ' - ' . $destino;
                }
                if (!empty($row['destino_departamento_nombre'])) {
                    $destino = $row['destino_departamento_nombre'] . ' - ' . $destino;
                }
                if (!empty($row['destino_direccion_nombre'])) {
                    $destino = $row['destino_direccion_nombre'] . ' - ' . $destino;
                }
            } elseif (!empty($row['destino_seccion_nombre'])) {
                $destino = $row['destino_seccion_nombre'];
                if (!empty($row['destino_departamento_nombre'])) {
                    $destino = $row['destino_departamento_nombre'] . ' - ' . $destino;
                }
                if (!empty($row['destino_direccion_nombre'])) {
                    $destino = $row['destino_direccion_nombre'] . ' - ' . $destino;
                }
            } elseif (!empty($row['destino_departamento_nombre'])) {
                $destino = $row['destino_departamento_nombre'];
                if (!empty($row['destino_direccion_nombre'])) {
                    $destino = $row['destino_direccion_nombre'] . ' - ' . $destino;
                }
            } elseif (!empty($row['destino_direccion_nombre'])) {
                $destino = $row['destino_direccion_nombre'];
            }

            // Usuario responsable
            $usuario_responsable = trim($row['usuario_responsable_nombres'] . ' ' . $row['usuario_responsable_apellidos']);
            if (!empty($row['usuario_responsable_cargo'])) {
                $usuario_responsable .= ' (' . $row['usuario_responsable_cargo'] . ')';
            }

            $movimientos[] = [
                'id_movimiento' => $row['id_movimiento'],
                'id_inventario' => $row['id_inventario'],
                'codigo_patrimonial' => $row['codigo_patrimonial'] ?? 'N/A',
                'marca' => $row['marca'] ?? 'N/A',
                'modelo' => $row['modelo'] ?? 'N/A',
                'serie' => $row['serie'] ?? 'N/A',
                'descripcion' => $row['descripcion'] ?? 'N/A',
                'tipo_movimiento' => $row['tipo_movimiento'],
                'motivo' => $row['motivo'] ?? '',
                'fecha_movimiento' => $row['fecha_movimiento'],
                'origen' => $origen,
                'destino' => $destino,
                'usuario_responsable' => $usuario_responsable,
                'revisado' => $row['revisado'] ?? 0
            ];
        }

        $stmt->close();

        return response()->json([
            'success' => true,
            'data' => $movimientos,
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
     * Obtener usuarios que tienen movimientos registrados (id_usuario_responsable)
     * 
     * @param \mysqli $conn
     * @return JsonResponse
     */
    private function obtenerUsuariosResponsables(\mysqli $conn): JsonResponse
    {
        $query = "
            SELECT DISTINCT
                u.id_usuario,
                u.nombres,
                u.apellidos,
                u.cargo
            FROM movimientos_inventario m
            INNER JOIN usuarios u ON m.id_usuario_responsable = u.id_usuario
            ORDER BY u.nombres, u.apellidos
        ";

        $result = $conn->query($query);
        
        if (!$result) {
            return response()->json([
                'success' => false,
                'message' => 'Error al ejecutar consulta: ' . $conn->error
            ], 500);
        }

        $usuarios = [];
        while ($row = $result->fetch_assoc()) {
            $usuarios[] = [
                'id_usuario' => $row['id_usuario'],
                'nombres' => $row['nombres'],
                'apellidos' => $row['apellidos'],
                'cargo' => $row['cargo'] ?? ''
            ];
        }

        return response()->json([
            'success' => true,
            'data' => $usuarios
        ]);
    }

    /**
     * Obtener usuarios responsables que tienen movimientos y son de informática
     * 
     * @param \mysqli $conn
     * @return JsonResponse
     */
    private function obtenerUsuariosResponsablesInformatica(\mysqli $conn): JsonResponse
    {
        $query = "
            SELECT DISTINCT
                u.id_usuario,
                u.nombres,
                u.apellidos,
                u.cargo
            FROM movimientos_inventario m
            INNER JOIN usuarios u ON m.id_usuario_responsable = u.id_usuario
            INNER JOIN usuario_roles ur ON u.id_usuario = ur.id_usuario
            INNER JOIN roles r ON ur.id_rol = r.id_rol
            WHERE LOWER(r.nombre) IN ('informática', 'informatica')
            AND ur.activo = 1
            AND r.activo = 1
            ORDER BY u.nombres, u.apellidos
        ";

        $result = $conn->query($query);
        
        if (!$result) {
            return response()->json([
                'success' => false,
                'message' => 'Error al ejecutar consulta: ' . $conn->error
            ], 500);
        }

        $usuarios = [];
        while ($row = $result->fetch_assoc()) {
            $usuarios[] = [
                'id_usuario' => $row['id_usuario'],
                'nombres' => $row['nombres'],
                'apellidos' => $row['apellidos'],
                'cargo' => $row['cargo'] ?? ''
            ];
        }

        return response()->json([
            'success' => true,
            'data' => $usuarios
        ]);
    }

    /**
     * Marcar un movimiento como revisado
     * 
     * @param \mysqli $conn
     * @param array $data
     * @return JsonResponse
     */
    private function marcarRevisado(\mysqli $conn, array $data): JsonResponse
    {
        if (empty($data['id_movimiento'])) {
            return response()->json([
                'success' => false,
                'message' => 'ID de movimiento no especificado'
            ], 400);
        }

        $id_movimiento = intval($data['id_movimiento']);

        $query = "UPDATE movimientos_inventario SET revisado = 1 WHERE id_movimiento = ?";
        $stmt = $conn->prepare($query);
        
        if (!$stmt) {
            return response()->json([
                'success' => false,
                'message' => 'Error al preparar consulta: ' . $conn->error
            ], 500);
        }

        $stmt->bind_param('i', $id_movimiento);
        
        if (!$stmt->execute()) {
            $stmt->close();
            return response()->json([
                'success' => false,
                'message' => 'Error al marcar como revisado: ' . $stmt->error
            ], 500);
        }

        $stmt->close();

        return response()->json([
            'success' => true,
            'message' => 'Movimiento marcado como revisado correctamente'
        ]);
    }

    /**
     * Deshacer un movimiento de inventario
     * Revierte el item a su estado original sin registrar un nuevo movimiento
     * 
     * @param \mysqli $conn
     * @param array $data
     * @return JsonResponse
     */
    private function deshacerMovimiento(\mysqli $conn, array $data): JsonResponse
    {
        if (empty($data['id_movimiento']) || empty($data['id_usuario_responsable'])) {
            return response()->json([
                'success' => false,
                'message' => 'Datos incompletos'
            ], 400);
        }

        $id_movimiento = intval($data['id_movimiento']);
        $id_usuario_responsable = intval($data['id_usuario_responsable']);

        // Obtener datos completos del movimiento
        $query_movimiento = "
            SELECT 
                m.id_movimiento,
                m.id_inventario,
                m.tipo_movimiento,
                m.motivo,
                -- Origen
                m.origen_direccion,
                m.origen_departamento,
                m.origen_seccion,
                m.origen_oficina,
                -- Destino
                m.destino_direccion,
                m.destino_departamento,
                m.destino_seccion,
                m.destino_oficina
            FROM movimientos_inventario m
            WHERE m.id_movimiento = ?
        ";

        $stmt_mov = $conn->prepare($query_movimiento);
        if (!$stmt_mov) {
            return response()->json([
                'success' => false,
                'message' => 'Error al preparar consulta: ' . $conn->error
            ], 500);
        }

        $stmt_mov->bind_param('i', $id_movimiento);
        $stmt_mov->execute();
        $result_mov = $stmt_mov->get_result();
        $movimiento = $result_mov->fetch_assoc();
        $stmt_mov->close();

        if (!$movimiento) {
            return response()->json([
                'success' => false,
                'message' => 'Movimiento no encontrado'
            ], 404);
        }

        // Iniciar transacción
        $conn->begin_transaction();

        try {
            $tipo_movimiento = $movimiento['tipo_movimiento'];
            $id_inventario = $movimiento['id_inventario'];

            // Manejar según el tipo de movimiento
            if ($tipo_movimiento === 'ALTA') {
                // ALTA: El origen es NULL, solo tiene destino
                // Deshacer ALTA = Eliminar el item completamente
                
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
                    // Si el item ya no existe, solo eliminar el movimiento
                    $stmt_delete_mov = $conn->prepare("DELETE FROM movimientos_inventario WHERE id_movimiento = ?");
                    if ($stmt_delete_mov) {
                        $stmt_delete_mov->bind_param('i', $id_movimiento);
                        $stmt_delete_mov->execute();
                        $stmt_delete_mov->close();
                    }
                    throw new Exception('El item ya no existe, pero el movimiento ha sido eliminado');
                }
                $stmt_check->close();
                
                // Primero eliminar todos los movimientos relacionados con este item
                // (para evitar problemas de clave foránea)
                $stmt_delete_movs = $conn->prepare("DELETE FROM movimientos_inventario WHERE id_inventario = ?");
                if (!$stmt_delete_movs) {
                    throw new Exception('Error al preparar consulta de eliminación de movimientos: ' . $conn->error);
                }
                $stmt_delete_movs->bind_param('i', $id_inventario);
                if (!$stmt_delete_movs->execute()) {
                    $error_movs = $stmt_delete_movs->error;
                    $stmt_delete_movs->close();
                    throw new Exception('Error al eliminar los movimientos relacionados: ' . $error_movs);
                }
                $stmt_delete_movs->close();
                
                // Ahora eliminar el item
                $stmt_delete = $conn->prepare("DELETE FROM inventario WHERE id_inventario = ?");
                if (!$stmt_delete) {
                    throw new Exception('Error al preparar consulta de eliminación: ' . $conn->error);
                }
                $stmt_delete->bind_param('i', $id_inventario);
                if (!$stmt_delete->execute()) {
                    $error_delete = $stmt_delete->error;
                    $stmt_delete->close();
                    throw new Exception('Error al eliminar el item: ' . $error_delete);
                }
                
                // Verificar que se eliminó al menos una fila
                if ($stmt_delete->affected_rows === 0) {
                    $stmt_delete->close();
                    throw new Exception('No se pudo eliminar el item');
                }
                
                $stmt_delete->close();

            } elseif ($tipo_movimiento === 'BAJA') {
                // BAJA: El destino es NULL, solo tiene origen
                // Deshacer BAJA = Reactivar el item y restaurar su ubicación original
                
                // Verificar que el item existe (puede estar inactivo)
                $stmt_check = $conn->prepare("SELECT id_inventario FROM inventario WHERE id_inventario = ?");
                if (!$stmt_check) {
                    throw new Exception('Error al preparar consulta: ' . $conn->error);
                }
                $stmt_check->bind_param('i', $id_inventario);
                $stmt_check->execute();
                $result_check = $stmt_check->get_result();
                if ($result_check->num_rows === 0) {
                    $stmt_check->close();
                    throw new Exception('El item no existe');
                }
                $stmt_check->close();
                
                $origen_direccion = !empty($movimiento['origen_direccion']) ? intval($movimiento['origen_direccion']) : null;
                $origen_departamento = !empty($movimiento['origen_departamento']) ? intval($movimiento['origen_departamento']) : null;
                $origen_seccion = !empty($movimiento['origen_seccion']) ? intval($movimiento['origen_seccion']) : null;
                $origen_oficina = !empty($movimiento['origen_oficina']) ? intval($movimiento['origen_oficina']) : null;

                // Construir UPDATE para reactivar y restaurar ubicación
                $updateFields = ['activo = 1'];
                $updateParams = [];
                $updateTypes = '';

                if ($origen_direccion !== null) {
                    $updateFields[] = 'id_direccion = ?';
                    $updateParams[] = $origen_direccion;
                    $updateTypes .= 'i';
                } else {
                    $updateFields[] = 'id_direccion = NULL';
                }

                if ($origen_departamento !== null) {
                    $updateFields[] = 'id_departamento = ?';
                    $updateParams[] = $origen_departamento;
                    $updateTypes .= 'i';
                } else {
                    $updateFields[] = 'id_departamento = NULL';
                }

                if ($origen_seccion !== null) {
                    $updateFields[] = 'id_seccion = ?';
                    $updateParams[] = $origen_seccion;
                    $updateTypes .= 'i';
                } else {
                    $updateFields[] = 'id_seccion = NULL';
                }

                if ($origen_oficina !== null) {
                    $updateFields[] = 'id_oficina = ?';
                    $updateParams[] = $origen_oficina;
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
                    throw new Exception('Error al reactivar el item: ' . $stmt_update->error);
                }
                
                // Verificar que se actualizó al menos una fila
                if ($stmt_update->affected_rows === 0) {
                    $stmt_update->close();
                    throw new Exception('No se pudo actualizar el item');
                }
                
                $stmt_update->close();

                // Eliminar el movimiento de BAJA
                $stmt_delete_mov = $conn->prepare("DELETE FROM movimientos_inventario WHERE id_movimiento = ?");
                if (!$stmt_delete_mov) {
                    throw new Exception('Error al preparar consulta: ' . $conn->error);
                }
                $stmt_delete_mov->bind_param('i', $id_movimiento);
                if (!$stmt_delete_mov->execute()) {
                    throw new Exception('Error al eliminar el movimiento: ' . $stmt_delete_mov->error);
                }
                $stmt_delete_mov->close();

            } else {
                // TRASLADO o REASIGNACION: Revertir ubicación
                // El destino del deshacer será el origen original
                
                // Verificar que el item existe y está activo
                $stmt_check = $conn->prepare("SELECT id_inventario FROM inventario WHERE id_inventario = ? AND activo = 1");
                if (!$stmt_check) {
                    throw new Exception('Error al preparar consulta: ' . $conn->error);
                }
                $stmt_check->bind_param('i', $id_inventario);
                $stmt_check->execute();
                $result_check = $stmt_check->get_result();
                if ($result_check->num_rows === 0) {
                    $stmt_check->close();
                    throw new Exception('El item no existe o está inactivo');
                }
                $stmt_check->close();
                
                $destino_deshacer_direccion = !empty($movimiento['origen_direccion']) ? intval($movimiento['origen_direccion']) : null;
                $destino_deshacer_departamento = !empty($movimiento['origen_departamento']) ? intval($movimiento['origen_departamento']) : null;
                $destino_deshacer_seccion = !empty($movimiento['origen_seccion']) ? intval($movimiento['origen_seccion']) : null;
                $destino_deshacer_oficina = !empty($movimiento['origen_oficina']) ? intval($movimiento['origen_oficina']) : null;

                // Actualizar item con ubicación original
                $updateFields = [];
                $updateParams = [];
                $updateTypes = '';

                if ($destino_deshacer_direccion !== null) {
                    $updateFields[] = 'id_direccion = ?';
                    $updateParams[] = $destino_deshacer_direccion;
                    $updateTypes .= 'i';
                } else {
                    $updateFields[] = 'id_direccion = NULL';
                }

                if ($destino_deshacer_departamento !== null) {
                    $updateFields[] = 'id_departamento = ?';
                    $updateParams[] = $destino_deshacer_departamento;
                    $updateTypes .= 'i';
                } else {
                    $updateFields[] = 'id_departamento = NULL';
                }

                if ($destino_deshacer_seccion !== null) {
                    $updateFields[] = 'id_seccion = ?';
                    $updateParams[] = $destino_deshacer_seccion;
                    $updateTypes .= 'i';
                } else {
                    $updateFields[] = 'id_seccion = NULL';
                }

                if ($destino_deshacer_oficina !== null) {
                    $updateFields[] = 'id_oficina = ?';
                    $updateParams[] = $destino_deshacer_oficina;
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
                
                // Verificar que se actualizó al menos una fila
                if ($stmt_update->affected_rows === 0) {
                    $stmt_update->close();
                    throw new Exception('No se pudo actualizar el item');
                }
                
                $stmt_update->close();

                // Eliminar el movimiento
                $stmt_delete_mov = $conn->prepare("DELETE FROM movimientos_inventario WHERE id_movimiento = ?");
                if (!$stmt_delete_mov) {
                    throw new Exception('Error al preparar consulta: ' . $conn->error);
                }
                $stmt_delete_mov->bind_param('i', $id_movimiento);
                if (!$stmt_delete_mov->execute()) {
                    throw new Exception('Error al eliminar el movimiento: ' . $stmt_delete_mov->error);
                }
                $stmt_delete_mov->close();
            }

            $conn->commit();

            $mensaje = '';
            if ($tipo_movimiento === 'ALTA') {
                $mensaje = 'Alta deshecha correctamente. El item ha sido eliminado.';
            } elseif ($tipo_movimiento === 'BAJA') {
                $mensaje = 'Baja deshecha correctamente. El item ha sido reactivado y restaurado a su ubicación original.';
            } else {
                $mensaje = 'Movimiento deshecho correctamente. El item ha vuelto a su ubicación original.';
            }

            return response()->json([
                'success' => true,
                'message' => $mensaje
            ]);
        } catch (Exception $e) {
            $conn->rollback();
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }
}

