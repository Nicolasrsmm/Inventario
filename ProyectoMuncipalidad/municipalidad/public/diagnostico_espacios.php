<?php
/**
 * Script de diagnóstico para verificar asignaciones de espacios
 * Este script muestra información sobre las asignaciones de usuarios y espacios
 */

header('Content-Type: application/json; charset=utf-8');

// Incluir autoloader de Laravel
require_once __DIR__ . '/../vendor/autoload.php';

use App\Services\DatabaseService;

try {
    $conn = DatabaseService::getConnection();
    
    // Obtener ID de usuario desde parámetro GET, POST o línea de comandos
    $id_usuario = null;
    if (isset($_GET['id_usuario'])) {
        $id_usuario = intval($_GET['id_usuario']);
    } elseif (isset($_POST['id_usuario'])) {
        $id_usuario = intval($_POST['id_usuario']);
    } elseif (php_sapi_name() === 'cli' && isset($argv)) {
        // Desde línea de comandos
        foreach ($argv as $arg) {
            if (strpos($arg, 'id_usuario=') === 0) {
                $id_usuario = intval(substr($arg, strpos($arg, '=') + 1));
                break;
            }
        }
        // Si no se encontró, usar el primer argumento numérico
        if ($id_usuario === null && isset($argv[1]) && is_numeric($argv[1])) {
            $id_usuario = intval($argv[1]);
        }
    }
    
    $resultado = [
        'success' => true,
        'id_usuario_buscado' => $id_usuario,
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
    // 1. Verificar todas las asignaciones del usuario (si se proporciona ID)
    if ($id_usuario) {
        $query_asignaciones = "
            SELECT 
                ua.id_asignacion,
                ua.id_usuario,
                ua.id_oficina,
                ua.id_seccion,
                ua.id_departamento,
                ua.id_direccion,
                ua.fecha_asignacion,
                ua.activo,
                u.nombres,
                u.apellidos,
                o.nombre AS nombre_oficina,
                s.nombre AS nombre_seccion,
                d.nombre AS nombre_departamento,
                dir.nombre AS nombre_direccion
            FROM usuario_asignacion ua
            LEFT JOIN usuarios u ON ua.id_usuario = u.id_usuario
            LEFT JOIN oficinas o ON ua.id_oficina = o.id_oficina
            LEFT JOIN secciones s ON ua.id_seccion = s.id_seccion
            LEFT JOIN departamentos d ON ua.id_departamento = d.id_departamento
            LEFT JOIN direcciones dir ON ua.id_direccion = dir.id_direccion
            WHERE ua.id_usuario = ?
            ORDER BY ua.activo DESC, ua.fecha_asignacion DESC
        ";
        
        $stmt = $conn->prepare($query_asignaciones);
        $stmt->bind_param('i', $id_usuario);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $asignaciones = [];
        while ($row = $result->fetch_assoc()) {
            $asignaciones[] = $row;
        }
        $stmt->close();
        
        $resultado['asignaciones_usuario'] = $asignaciones;
        $resultado['total_asignaciones'] = count($asignaciones);
        $resultado['asignaciones_activas'] = count(array_filter($asignaciones, function($a) { return $a['activo'] == 1; }));
        $resultado['asignaciones_directas'] = count(array_filter($asignaciones, function($a) { return $a['activo'] == 1 && !is_null($a['id_oficina']); }));
        $resultado['asignaciones_indirectas'] = count(array_filter($asignaciones, function($a) { return $a['activo'] == 1 && is_null($a['id_oficina']); }));
    }
    
    // 2. Ejecutar la consulta actual de listar_espacios para este usuario
    if ($id_usuario) {
        $query_espacios = "
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
            WHERE EXISTS (
                SELECT 1 FROM usuario_asignacion ua
                WHERE ua.activo = 1 
                AND ua.id_usuario = ?
                AND ua.id_oficina = o.id_oficina
                AND ua.id_oficina IS NOT NULL
            )
            GROUP BY o.id_oficina, o.nombre, o.edificio, o.piso, o.ubicacion_fisica, o.id_direccion, o.id_departamento, o.id_seccion, d.nombre, dep.nombre, s.nombre
            ORDER BY o.nombre ASC
        ";
        
        $stmt = $conn->prepare($query_espacios);
        $stmt->bind_param('i', $id_usuario);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $espacios = [];
        while ($row = $result->fetch_assoc()) {
            $espacios[] = $row;
        }
        $stmt->close();
        
        $resultado['espacios_encontrados'] = $espacios;
        $resultado['total_espacios'] = count($espacios);
    }
    
    // 3. Listar todos los usuarios con sus asignaciones (para referencia)
    $query_usuarios = "
        SELECT DISTINCT
            u.id_usuario,
            u.nombres,
            u.apellidos,
            u.cargo,
            COUNT(DISTINCT CASE WHEN ua.activo = 1 AND ua.id_oficina IS NOT NULL THEN ua.id_asignacion END) AS asignaciones_directas,
            COUNT(DISTINCT CASE WHEN ua.activo = 1 AND ua.id_oficina IS NULL THEN ua.id_asignacion END) AS asignaciones_indirectas
        FROM usuarios u
        LEFT JOIN usuario_asignacion ua ON u.id_usuario = ua.id_usuario
        GROUP BY u.id_usuario, u.nombres, u.apellidos, u.cargo
        ORDER BY u.nombres, u.apellidos
        LIMIT 20
    ";
    
    $result = $conn->query($query_usuarios);
    $usuarios = [];
    while ($row = $result->fetch_assoc()) {
        $usuarios[] = $row;
    }
    
    $resultado['usuarios_muestra'] = $usuarios;
    
    // 4. Verificar si hay espacios sin asignación directa pero con asignación indirecta
    if ($id_usuario) {
        $query_espacios_indirectos = "
            SELECT 
                o.id_oficina,
                o.nombre,
                o.id_direccion,
                o.id_departamento,
                o.id_seccion,
                d.nombre AS nombre_direccion,
                dep.nombre AS nombre_departamento,
                s.nombre AS nombre_seccion,
                CASE 
                    WHEN ua.id_seccion IS NOT NULL THEN 'Sección'
                    WHEN ua.id_departamento IS NOT NULL THEN 'Departamento'
                    WHEN ua.id_direccion IS NOT NULL THEN 'Dirección'
                END AS tipo_asignacion_indirecta
            FROM oficinas o
            LEFT JOIN direcciones d ON o.id_direccion = d.id_direccion
            LEFT JOIN departamentos dep ON o.id_departamento = dep.id_departamento
            LEFT JOIN secciones s ON o.id_seccion = s.id_seccion
            INNER JOIN usuario_asignacion ua ON (
                (ua.id_seccion = o.id_seccion AND o.id_seccion IS NOT NULL AND ua.id_seccion IS NOT NULL AND ua.id_oficina IS NULL) OR
                (ua.id_departamento = o.id_departamento AND o.id_departamento IS NOT NULL AND o.id_seccion IS NULL AND ua.id_departamento IS NOT NULL AND ua.id_seccion IS NULL AND ua.id_oficina IS NULL) OR
                (ua.id_direccion = o.id_direccion AND o.id_direccion IS NOT NULL AND o.id_departamento IS NULL AND o.id_seccion IS NULL AND ua.id_direccion IS NOT NULL AND ua.id_departamento IS NULL AND ua.id_seccion IS NULL AND ua.id_oficina IS NULL)
            )
            WHERE ua.activo = 1 
            AND ua.id_usuario = ?
            AND NOT EXISTS (
                SELECT 1 FROM usuario_asignacion ua2
                WHERE ua2.activo = 1 
                AND ua2.id_usuario = ?
                AND ua2.id_oficina = o.id_oficina
                AND ua2.id_oficina IS NOT NULL
            )
            GROUP BY o.id_oficina, o.nombre, o.id_direccion, o.id_departamento, o.id_seccion, d.nombre, dep.nombre, s.nombre, ua.id_seccion, ua.id_departamento, ua.id_direccion
        ";
        
        $stmt = $conn->prepare($query_espacios_indirectos);
        $stmt->bind_param('ii', $id_usuario, $id_usuario);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $espacios_indirectos = [];
        while ($row = $result->fetch_assoc()) {
            $espacios_indirectos[] = $row;
        }
        $stmt->close();
        
        $resultado['espacios_indirectos_disponibles'] = $espacios_indirectos;
        $resultado['total_espacios_indirectos'] = count($espacios_indirectos);
    }
    
    $conn->close();
    
    echo json_encode($resultado, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}
?>

