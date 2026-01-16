<?php

namespace App\Http\Controllers;

use App\Services\DatabaseService;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class RegistroEspaciosController extends Controller
{
    /**
     * Manejar las acciones de registro de espacios
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
                case 'obtener_direcciones':
                    return $this->obtenerDirecciones($conn);
                    
                case 'obtener_departamentos':
                    return $this->obtenerDepartamentos($conn, $data);
                    
                case 'obtener_secciones':
                    return $this->obtenerSecciones($conn, $data);
                    
                case 'obtener_tipos_bien':
                    return $this->obtenerTiposBien($conn);
                    
                case 'obtener_usuarios':
                    return $this->obtenerUsuarios($conn);
                    
                case 'registrar_espacio':
                    return $this->registrarEspacio($conn, $data);
                    
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
     * Obtener todas las direcciones
     * 
     * @param \mysqli $conn
     * @return JsonResponse
     */
    private function obtenerDirecciones(\mysqli $conn): JsonResponse
    {
        $stmt = $conn->prepare("SELECT id_direccion, nombre, descripcion, edificio, piso FROM direcciones ORDER BY nombre");
        if (!$stmt) {
            return response()->json([
                'success' => false,
                'message' => 'Error al preparar consulta: ' . $conn->error
            ], 500);
        }
        
        $stmt->execute();
        $result = $stmt->get_result();
        $direcciones = [];
        
        while ($row = $result->fetch_assoc()) {
            $direcciones[] = $row;
        }
        
        $stmt->close();
        
        return response()->json([
            'success' => true,
            'data' => $direcciones
        ]);
    }

    /**
     * Obtener departamentos por dirección
     * 
     * @param \mysqli $conn
     * @param array $data
     * @return JsonResponse
     */
    private function obtenerDepartamentos(\mysqli $conn, array $data): JsonResponse
    {
        // Si hay id_direccion, cargar solo departamentos de esa dirección
        // Si no hay id_direccion, cargar todos los departamentos sin dirección (id_direccion IS NULL)
        if (!empty($data['id_direccion']) && $data['id_direccion'] !== '' && $data['id_direccion'] !== '__crear_nuevo__') {
            $id_direccion = intval($data['id_direccion']);
            $stmt = $conn->prepare("SELECT id_departamento, nombre, edificio, piso FROM departamentos WHERE id_direccion = ? AND activo = 1 ORDER BY nombre");
            $stmt->bind_param('i', $id_direccion);
        } else {
            // Cargar todos los departamentos sin dirección
            $stmt = $conn->prepare("SELECT id_departamento, nombre, edificio, piso FROM departamentos WHERE id_direccion IS NULL AND activo = 1 ORDER BY nombre");
        }
        
        $stmt->execute();
        $result = $stmt->get_result();
        $departamentos = [];
        
        while ($row = $result->fetch_assoc()) {
            $departamentos[] = $row;
        }
        
        $stmt->close();
        
        return response()->json([
            'success' => true,
            'data' => $departamentos
        ]);
    }

    /**
     * Obtener secciones por departamento
     * 
     * @param \mysqli $conn
     * @param array $data
     * @return JsonResponse
     */
    private function obtenerSecciones(\mysqli $conn, array $data): JsonResponse
    {
        // Si hay id_departamento, cargar solo secciones de ese departamento
        // Si no hay id_departamento, cargar todas las secciones sin departamento (id_departamento IS NULL)
        if (!empty($data['id_departamento']) && $data['id_departamento'] !== '' && $data['id_departamento'] !== '__crear_nuevo__') {
            $id_departamento = intval($data['id_departamento']);
            $stmt = $conn->prepare("SELECT id_seccion, nombre, edificio, piso FROM secciones WHERE id_departamento = ? ORDER BY nombre");
            $stmt->bind_param('i', $id_departamento);
        } else {
            // Cargar todas las secciones sin departamento
            $stmt = $conn->prepare("SELECT id_seccion, nombre, edificio, piso FROM secciones WHERE id_departamento IS NULL ORDER BY nombre");
        }
        
        $stmt->execute();
        $result = $stmt->get_result();
        $secciones = [];
        
        while ($row = $result->fetch_assoc()) {
            $secciones[] = $row;
        }
        
        $stmt->close();
        
        return response()->json([
            'success' => true,
            'data' => $secciones
        ]);
    }

    /**
     * Obtener usuarios activos para asignación
     * 
     * @param \mysqli $conn
     * @return JsonResponse
     */
    private function obtenerUsuarios(\mysqli $conn): JsonResponse
    {
        $stmt = $conn->prepare("SELECT id_usuario, nombres, apellidos, cargo FROM usuarios WHERE activo = 1 ORDER BY nombres, apellidos");
        
        if (!$stmt) {
            return response()->json([
                'success' => false,
                'message' => 'Error al preparar consulta: ' . $conn->error
            ], 500);
        }
        
        $stmt->execute();
        $result = $stmt->get_result();
        $usuarios = [];
        
        while ($row = $result->fetch_assoc()) {
            $usuarios[] = $row;
        }
        
        $stmt->close();
        
        return response()->json([
            'success' => true,
            'data' => $usuarios
        ]);
    }

    /**
     * Obtener tipos de bien
     * 
     * @param \mysqli $conn
     * @return JsonResponse
     */
    private function obtenerTiposBien(\mysqli $conn): JsonResponse
    {
        $stmt = $conn->prepare("SELECT id_tipo_bien, nombre FROM tipos_bien ORDER BY nombre");
        $stmt->execute();
        $result = $stmt->get_result();
        $tipos = [];
        
        while ($row = $result->fetch_assoc()) {
            $tipos[] = $row;
        }
        
        $stmt->close();
        
        return response()->json([
            'success' => true,
            'data' => $tipos
        ]);
    }

    /**
     * Registrar un nuevo espacio con inventario
     * 
     * @param \mysqli $conn
     * @param array $data
     * @return JsonResponse
     */
    private function registrarEspacio(\mysqli $conn, array $data): JsonResponse
    {
        if (empty($data['oficina']) || empty($data['oficina']['nombre'])) {
            return response()->json([
                'success' => false,
                'message' => 'El nombre de la oficina es requerido'
            ], 400);
        }

        // Obtener IDs (pueden ser null si no se seleccionaron)
        // IMPORTANTE: intval('') devuelve 0, así que debemos validar explícitamente
        $id_direccion_val = !empty($data['oficina']['id_direccion']) && $data['oficina']['id_direccion'] !== '' && $data['oficina']['id_direccion'] !== '__crear_nuevo__' ? $data['oficina']['id_direccion'] : null;
        $id_departamento_val = !empty($data['oficina']['id_departamento']) && $data['oficina']['id_departamento'] !== '' && $data['oficina']['id_departamento'] !== '__crear_nuevo__' ? $data['oficina']['id_departamento'] : null;
        $id_seccion_val = !empty($data['oficina']['id_seccion']) && $data['oficina']['id_seccion'] !== '' && $data['oficina']['id_seccion'] !== '__crear_nuevo__' ? $data['oficina']['id_seccion'] : null;
        
        // Convertir a int solo si tienen valor válido, y validar que sean mayores a 0
        $id_direccion = ($id_direccion_val !== null && $id_direccion_val !== '') ? (($id = intval($id_direccion_val)) > 0 ? $id : null) : null;
        $id_departamento = ($id_departamento_val !== null && $id_departamento_val !== '') ? (($id = intval($id_departamento_val)) > 0 ? $id : null) : null;
        $id_seccion = ($id_seccion_val !== null && $id_seccion_val !== '') ? (($id = intval($id_seccion_val)) > 0 ? $id : null) : null;
        
        // IMPORTANTE: Si no se va a crear ninguna sección, id_seccion debe ser null
        // Esto evita problemas de foreign key cuando solo se crea un departamento o dirección
        $crear = $data['crear'] ?? [];
        
        // Si solo se está creando un departamento (sin sección), forzar id_seccion a null
        // Los departamentos NO tienen sección, así que id_seccion DEBE ser null
        if (!empty($crear['nuevo_departamento']) && empty($crear['nueva_seccion'])) {
            $id_seccion = null; // Departamentos no tienen sección
        }
        
        // Si no se va a crear ninguna sección, verificar que id_seccion sea válido o null
        if (empty($crear['nueva_seccion'])) {
            // Solo mantener id_seccion si se seleccionó una sección existente válida (mayor a 0)
            // Si no se crea ni se selecciona una sección válida, debe ser null
            if (empty($id_seccion) || $id_seccion <= 0) {
                $id_seccion = null;
            }
        }

        // Obtener edificio y piso de la oficina para asignarlos a las nuevas entidades
        $edificio = !empty($data['oficina']['edificio']) ? trim($data['oficina']['edificio']) : null;
        $piso = !empty($data['oficina']['piso']) ? trim($data['oficina']['piso']) : null;
        $piso_int = ($piso !== null && $piso !== '') ? intval($piso) : null;

        // Iniciar transacción
        $conn->begin_transaction();

        try {
            // Crear nuevas entidades si es necesario (en orden jerárquico)
            $crear = $data['crear'] ?? [];
            
            // Variables para rastrear qué entidades se crearon (para asignación)
            $direccion_creada = false;
            $departamento_creado_nuevo = false;
            $seccion_creada_nueva = false;
            
            // 1. Crear nueva dirección si es necesario
            if (!empty($crear['nueva_direccion'])) {
                $nombre_dir = trim($crear['nueva_direccion']);
                
                // Verificar si ya existe una dirección con el mismo nombre
                $stmt_check = $conn->prepare("SELECT id_direccion FROM direcciones WHERE nombre = ? LIMIT 1");
                $stmt_check->bind_param('s', $nombre_dir);
                $stmt_check->execute();
                $result_check = $stmt_check->get_result();
                
                if ($result_check->num_rows > 0) {
                    // Ya existe, usar ese ID
                    $row = $result_check->fetch_assoc();
                    $id_direccion = $row['id_direccion'];
                    $stmt_check->close();
                    $direccion_creada = false; // No se creó, ya existía
                } else {
                    // No existe, crear nueva
                    $stmt_check->close();
                    
                    if ($edificio !== null && $piso_int !== null) {
                        $stmt_dir = $conn->prepare("INSERT INTO direcciones (nombre, edificio, piso) VALUES (?, ?, ?)");
                        $stmt_dir->bind_param('ssi', $nombre_dir, $edificio, $piso_int);
                    } else if ($edificio !== null) {
                        $stmt_dir = $conn->prepare("INSERT INTO direcciones (nombre, edificio) VALUES (?, ?)");
                        $stmt_dir->bind_param('ss', $nombre_dir, $edificio);
                    } else if ($piso_int !== null) {
                        $stmt_dir = $conn->prepare("INSERT INTO direcciones (nombre, piso) VALUES (?, ?)");
                        $stmt_dir->bind_param('si', $nombre_dir, $piso_int);
                    } else {
                        $stmt_dir = $conn->prepare("INSERT INTO direcciones (nombre) VALUES (?)");
                        $stmt_dir->bind_param('s', $nombre_dir);
                    }
                    
                    if (!$stmt_dir->execute()) {
                        throw new Exception('Error al crear dirección: ' . $stmt_dir->error);
                    }
                    $id_direccion = $conn->insert_id;
                    $direccion_creada = true; // Se creó una nueva dirección
                    $stmt_dir->close();
                }
            }
            
            // 2. Crear nuevo departamento si el usuario lo especificó explícitamente
            if (!empty($crear['nuevo_departamento'])) {
                $nombre_dept = trim($crear['nuevo_departamento']);
                
                // Verificar si ya existe un departamento con el mismo nombre
                $stmt_check = $conn->prepare("SELECT id_departamento FROM departamentos WHERE nombre = ? AND activo = 1 LIMIT 1");
                $stmt_check->bind_param('s', $nombre_dept);
                $stmt_check->execute();
                $result_check = $stmt_check->get_result();
                
                if ($result_check->num_rows > 0) {
                    // Ya existe, usar ese ID
                    $row = $result_check->fetch_assoc();
                    $id_departamento = $row['id_departamento'];
                    $stmt_check->close();
                    $departamento_creado = true;
                    $departamento_creado_nuevo = false; // No se creó, ya existía
                    // Mantener id_direccion si se creó una dirección antes
                    // IMPORTANTE: No asignar id_seccion a la oficina (quedará NULL)
                    // Los departamentos NO tienen sección
                    $id_seccion = null;
                } else {
                    // No existe, crear nuevo
                    $stmt_check->close();
                    $departamento_creado = false;
                    
                    try {
                        // Obtener el último ID de departamento para insertar el siguiente
                        $stmt_max = $conn->prepare("SELECT COALESCE(MAX(id_departamento), 0) as max_id FROM departamentos");
                        $stmt_max->execute();
                        $result_max = $stmt_max->get_result();
                        $row_max = $result_max->fetch_assoc();
                        $next_id = intval($row_max['max_id']) + 1;
                        $stmt_max->close();
                        
                        // Si hay una dirección creada antes, asignarla al departamento
                        if ($id_direccion !== null && $id_direccion > 0) {
                            // Crear departamento CON dirección
                            if ($edificio !== null && $piso_int !== null) {
                                $stmt_dept = $conn->prepare("INSERT INTO departamentos (id_departamento, id_direccion, nombre, edificio, piso, activo) VALUES (?, ?, ?, ?, ?, 1)");
                                $stmt_dept->bind_param('iissi', $next_id, $id_direccion, $nombre_dept, $edificio, $piso_int);
                            } else if ($edificio !== null) {
                                $stmt_dept = $conn->prepare("INSERT INTO departamentos (id_departamento, id_direccion, nombre, edificio, activo) VALUES (?, ?, ?, ?, 1)");
                                $stmt_dept->bind_param('iiss', $next_id, $id_direccion, $nombre_dept, $edificio);
                            } else if ($piso_int !== null) {
                                $stmt_dept = $conn->prepare("INSERT INTO departamentos (id_departamento, id_direccion, nombre, piso, activo) VALUES (?, ?, ?, ?, 1)");
                                $stmt_dept->bind_param('iisi', $next_id, $id_direccion, $nombre_dept, $piso_int);
                            } else {
                                $stmt_dept = $conn->prepare("INSERT INTO departamentos (id_departamento, id_direccion, nombre, activo) VALUES (?, ?, ?, 1)");
                                $stmt_dept->bind_param('iis', $next_id, $id_direccion, $nombre_dept);
                            }
                        } else {
                            // Crear departamento SIN dirección
                            if ($edificio !== null && $piso_int !== null) {
                                $stmt_dept = $conn->prepare("INSERT INTO departamentos (id_departamento, nombre, edificio, piso, activo) VALUES (?, ?, ?, ?, 1)");
                                $stmt_dept->bind_param('issi', $next_id, $nombre_dept, $edificio, $piso_int);
                            } else if ($edificio !== null) {
                                $stmt_dept = $conn->prepare("INSERT INTO departamentos (id_departamento, nombre, edificio, activo) VALUES (?, ?, ?, 1)");
                                $stmt_dept->bind_param('iss', $next_id, $nombre_dept, $edificio);
                            } else if ($piso_int !== null) {
                                $stmt_dept = $conn->prepare("INSERT INTO departamentos (id_departamento, nombre, piso, activo) VALUES (?, ?, ?, 1)");
                                $stmt_dept->bind_param('isi', $next_id, $nombre_dept, $piso_int);
                            } else {
                                $stmt_dept = $conn->prepare("INSERT INTO departamentos (id_departamento, nombre, activo) VALUES (?, ?, 1)");
                                $stmt_dept->bind_param('is', $next_id, $nombre_dept);
                            }
                        }
                        
                        if ($stmt_dept->execute()) {
                            $id_departamento = $next_id;
                            $departamento_creado = true;
                            $departamento_creado_nuevo = true; // Se creó un nuevo departamento
                            // Mantener id_direccion si se creó una dirección antes (no establecer a null)
                            // IMPORTANTE: No asignar id_seccion a la oficina (quedará NULL)
                            // Los departamentos NO tienen sección
                            $id_seccion = null;
                        }
                        $stmt_dept->close();
                    } catch (Exception $e) {
                        // Si falla, la BD requiere id_direccion NOT NULL
                        // Crear una dirección temporal automáticamente solo para satisfacer la foreign key
                        // pero NO asignarla a la oficina (id_direccion quedará NULL en la oficina)
                        
                        // Crear dirección temporal
                        if ($edificio !== null && $piso_int !== null) {
                            $stmt_dir = $conn->prepare("INSERT INTO direcciones (nombre, edificio, piso) VALUES (?, ?, ?)");
                            $nombre_dir_temp = trim($crear['nuevo_departamento']) . ' - Dirección';
                            $stmt_dir->bind_param('ssi', $nombre_dir_temp, $edificio, $piso_int);
                        } else if ($edificio !== null) {
                            $stmt_dir = $conn->prepare("INSERT INTO direcciones (nombre, edificio) VALUES (?, ?)");
                            $nombre_dir_temp = trim($crear['nuevo_departamento']) . ' - Dirección';
                            $stmt_dir->bind_param('ss', $nombre_dir_temp, $edificio);
                        } else if ($piso_int !== null) {
                            $stmt_dir = $conn->prepare("INSERT INTO direcciones (nombre, piso) VALUES (?, ?)");
                            $nombre_dir_temp = trim($crear['nuevo_departamento']) . ' - Dirección';
                            $stmt_dir->bind_param('si', $nombre_dir_temp, $piso_int);
                        } else {
                            $stmt_dir = $conn->prepare("INSERT INTO direcciones (nombre) VALUES (?)");
                            $nombre_dir_temp = trim($crear['nuevo_departamento']) . ' - Dirección';
                            $stmt_dir->bind_param('s', $nombre_dir_temp);
                        }
                        
                        if (!$stmt_dir->execute()) {
                            throw new Exception('Error al crear dirección temporal: ' . $stmt_dir->error);
                        }
                        $id_direccion_temp = $conn->insert_id;
                        $stmt_dir->close();
                        
                        // Obtener el último ID de departamento para insertar el siguiente
                        $stmt_max = $conn->prepare("SELECT COALESCE(MAX(id_departamento), 0) as max_id FROM departamentos");
                        $stmt_max->execute();
                        $result_max = $stmt_max->get_result();
                        $row_max = $result_max->fetch_assoc();
                        $next_id = intval($row_max['max_id']) + 1;
                        $stmt_max->close();
                        
                        // Ahora crear el departamento con la dirección temporal
                        if ($edificio !== null && $piso_int !== null) {
                            $stmt_dept = $conn->prepare("INSERT INTO departamentos (id_departamento, id_direccion, nombre, edificio, piso, activo) VALUES (?, ?, ?, ?, ?, 1)");
                            $nombre_dept = trim($crear['nuevo_departamento']);
                            $stmt_dept->bind_param('iissi', $next_id, $id_direccion_temp, $nombre_dept, $edificio, $piso_int);
                        } else if ($edificio !== null) {
                            $stmt_dept = $conn->prepare("INSERT INTO departamentos (id_departamento, id_direccion, nombre, edificio, activo) VALUES (?, ?, ?, ?, 1)");
                            $nombre_dept = trim($crear['nuevo_departamento']);
                            $stmt_dept->bind_param('iiss', $next_id, $id_direccion_temp, $nombre_dept, $edificio);
                        } else if ($piso_int !== null) {
                            $stmt_dept = $conn->prepare("INSERT INTO departamentos (id_departamento, id_direccion, nombre, piso, activo) VALUES (?, ?, ?, ?, 1)");
                            $nombre_dept = trim($crear['nuevo_departamento']);
                            $stmt_dept->bind_param('iisi', $next_id, $id_direccion_temp, $nombre_dept, $piso_int);
                        } else {
                            $stmt_dept = $conn->prepare("INSERT INTO departamentos (id_departamento, id_direccion, nombre, activo) VALUES (?, ?, ?, 1)");
                            $nombre_dept = trim($crear['nuevo_departamento']);
                            $stmt_dept->bind_param('iis', $next_id, $id_direccion_temp, $nombre_dept);
                        }
                        
                        if (!$stmt_dept->execute()) {
                            throw new Exception('Error al crear departamento: ' . $stmt_dept->error);
                        }
                        $id_departamento = $next_id;
                        $departamento_creado = true;
                        // NO asignar id_direccion a la oficina (quedará NULL)
                        $id_direccion = null;
                        // IMPORTANTE: No asignar id_seccion a la oficina (quedará NULL)
                        // Los departamentos NO tienen sección
                        $id_seccion = null;
                        $stmt_dept->close();
                    }
                }
                
                if (!$departamento_creado) {
                    throw new Exception('No se pudo crear el departamento');
                }
                
                // IMPORTANTE: Si solo se está creando un departamento (sin sección), id_seccion debe ser null
                // Aplicar la misma lógica que secciones: cuando se crea solo un departamento, id_seccion = null
                // Los departamentos NO tienen sección, así que id_seccion DEBE ser null en la oficina
                $id_seccion = null; // Forzar null cuando se crea un departamento
            }
            
            // 3. Crear nueva sección si es necesario
            if (!empty($crear['nueva_seccion'])) {
                // Si no hay departamento, intentar crear la sección sin departamento
                // Si la BD requiere id_departamento NOT NULL, crear un departamento mínimo automáticamente
                if (empty($id_departamento) && empty($crear['nuevo_departamento'])) {
                    // Intentar crear sección sin departamento primero (si la BD lo permite)
                    $seccion_creada = false;
                    
                    try {
                        // Verificar si ya existe una sección con el mismo nombre (sin departamento)
                        $nombre_sec = trim($crear['nueva_seccion']);
                        $stmt_check = $conn->prepare("SELECT id_seccion FROM secciones WHERE nombre = ? AND id_departamento IS NULL LIMIT 1");
                        $stmt_check->bind_param('s', $nombre_sec);
                        $stmt_check->execute();
                        $result_check = $stmt_check->get_result();
                        
                        if ($result_check->num_rows > 0) {
                            // Ya existe, usar ese ID
                            $row = $result_check->fetch_assoc();
                            $id_seccion = $row['id_seccion'];
                            $stmt_check->close();
                            $seccion_creada = true;
                            $seccion_creada_nueva = false; // No se creó, ya existía
                            // No asignar id_departamento a la oficina (quedará NULL)
                            $id_departamento = null;
                        } else {
                            // No existe, crear nueva
                            $stmt_check->close();
                            
                            // Intentar crear sección con id_departamento = NULL
                            if ($edificio !== null && $piso_int !== null) {
                                $stmt_sec = $conn->prepare("INSERT INTO secciones (nombre, edificio, piso) VALUES (?, ?, ?)");
                                $stmt_sec->bind_param('ssi', $nombre_sec, $edificio, $piso_int);
                            } else if ($edificio !== null) {
                                $stmt_sec = $conn->prepare("INSERT INTO secciones (nombre, edificio) VALUES (?, ?)");
                                $stmt_sec->bind_param('ss', $nombre_sec, $edificio);
                            } else if ($piso_int !== null) {
                                $stmt_sec = $conn->prepare("INSERT INTO secciones (nombre, piso) VALUES (?, ?)");
                                $stmt_sec->bind_param('si', $nombre_sec, $piso_int);
                            } else {
                                $stmt_sec = $conn->prepare("INSERT INTO secciones (nombre) VALUES (?)");
                                $stmt_sec->bind_param('s', $nombre_sec);
                            }
                            
                            if ($stmt_sec->execute()) {
                                $id_seccion = $conn->insert_id;
                                $seccion_creada = true;
                                $seccion_creada_nueva = true; // Se creó una nueva sección
                                // No asignar id_departamento a la oficina (quedará NULL)
                                $id_departamento = null;
                            }
                            $stmt_sec->close();
                        }
                    } catch (Exception $e) {
                        // Si falla, la BD requiere id_departamento NOT NULL
                        // Crear un departamento mínimo automáticamente solo para satisfacer la foreign key
                        // pero NO asignarlo a la oficina (id_departamento quedará NULL en la oficina)
                        
                        // Intentar crear departamento sin dirección
                        try {
                            // Obtener el último ID de departamento para insertar el siguiente
                            $stmt_max = $conn->prepare("SELECT COALESCE(MAX(id_departamento), 0) as max_id FROM departamentos");
                            $stmt_max->execute();
                            $result_max = $stmt_max->get_result();
                            $row_max = $result_max->fetch_assoc();
                            $next_id = intval($row_max['max_id']) + 1;
                            $stmt_max->close();
                            
                            if ($edificio !== null && $piso_int !== null) {
                                $stmt_dept = $conn->prepare("INSERT INTO departamentos (id_departamento, nombre, edificio, piso, activo) VALUES (?, ?, ?, ?, 1)");
                                $nombre_dept_auto = trim($crear['nueva_seccion']) . ' - Departamento';
                                $stmt_dept->bind_param('issi', $next_id, $nombre_dept_auto, $edificio, $piso_int);
                            } else if ($edificio !== null) {
                                $stmt_dept = $conn->prepare("INSERT INTO departamentos (id_departamento, nombre, edificio, activo) VALUES (?, ?, ?, 1)");
                                $nombre_dept_auto = trim($crear['nueva_seccion']) . ' - Departamento';
                                $stmt_dept->bind_param('iss', $next_id, $nombre_dept_auto, $edificio);
                            } else if ($piso_int !== null) {
                                $stmt_dept = $conn->prepare("INSERT INTO departamentos (id_departamento, nombre, piso, activo) VALUES (?, ?, ?, 1)");
                                $nombre_dept_auto = trim($crear['nueva_seccion']) . ' - Departamento';
                                $stmt_dept->bind_param('isi', $next_id, $nombre_dept_auto, $piso_int);
                            } else {
                                $stmt_dept = $conn->prepare("INSERT INTO departamentos (id_departamento, nombre, activo) VALUES (?, ?, 1)");
                                $nombre_dept_auto = trim($crear['nueva_seccion']) . ' - Departamento';
                                $stmt_dept->bind_param('is', $next_id, $nombre_dept_auto);
                            }
                            
                            if ($stmt_dept->execute()) {
                                $id_departamento_temp = $next_id;
                                $stmt_dept->close();
                                
                                // Verificar si ya existe una sección con el mismo nombre y departamento temporal
                                $nombre_sec = trim($crear['nueva_seccion']);
                                $stmt_check = $conn->prepare("SELECT id_seccion FROM secciones WHERE nombre = ? AND id_departamento = ? LIMIT 1");
                                $stmt_check->bind_param('si', $nombre_sec, $id_departamento_temp);
                                $stmt_check->execute();
                                $result_check = $stmt_check->get_result();
                                
                                if ($result_check->num_rows > 0) {
                                    // Ya existe, usar ese ID
                                    $row = $result_check->fetch_assoc();
                                    $id_seccion = $row['id_seccion'];
                                    $stmt_check->close();
                                    $seccion_creada = true;
                                    // NO asignar id_departamento a la oficina (quedará NULL)
                                    $id_departamento = null;
                                } else {
                                    // No existe, crear nueva
                                    $stmt_check->close();
                                    
                                    // Ahora crear la sección con el departamento temporal
                                    if ($edificio !== null && $piso_int !== null) {
                                        $stmt_sec = $conn->prepare("INSERT INTO secciones (id_departamento, nombre, edificio, piso) VALUES (?, ?, ?, ?)");
                                        $stmt_sec->bind_param('issi', $id_departamento_temp, $nombre_sec, $edificio, $piso_int);
                                    } else if ($edificio !== null) {
                                        $stmt_sec = $conn->prepare("INSERT INTO secciones (id_departamento, nombre, edificio) VALUES (?, ?, ?)");
                                        $stmt_sec->bind_param('iss', $id_departamento_temp, $nombre_sec, $edificio);
                                    } else if ($piso_int !== null) {
                                        $stmt_sec = $conn->prepare("INSERT INTO secciones (id_departamento, nombre, piso) VALUES (?, ?, ?)");
                                        $stmt_sec->bind_param('isi', $id_departamento_temp, $nombre_sec, $piso_int);
                                    } else {
                                        $stmt_sec = $conn->prepare("INSERT INTO secciones (id_departamento, nombre) VALUES (?, ?)");
                                        $stmt_sec->bind_param('is', $id_departamento_temp, $nombre_sec);
                                    }
                                    
                                    if ($stmt_sec->execute()) {
                                        $id_seccion = $conn->insert_id;
                                        $seccion_creada = true;
                                        $seccion_creada_nueva = true; // Se creó una nueva sección
                                        // NO asignar id_departamento a la oficina (quedará NULL)
                                        $id_departamento = null;
                                    }
                                    $stmt_sec->close();
                                }
                            } else {
                                throw new Exception('Error al crear departamento temporal: ' . $stmt_dept->error);
                            }
                        } catch (Exception $e2) {
                            throw new Exception('Error al crear sección: ' . $e2->getMessage());
                        }
                    }
                    
                    if (!$seccion_creada) {
                        throw new Exception('No se pudo crear la sección');
                    }
                } else {
                    // Hay departamento, verificar si ya existe la sección antes de crear
                    $nombre_sec = trim($crear['nueva_seccion']);
                    
                    // Verificar si ya existe una sección con el mismo nombre y departamento
                    $stmt_check = $conn->prepare("SELECT id_seccion FROM secciones WHERE nombre = ? AND id_departamento = ? LIMIT 1");
                    $stmt_check->bind_param('si', $nombre_sec, $id_departamento);
                    $stmt_check->execute();
                    $result_check = $stmt_check->get_result();
                    
                    if ($result_check->num_rows > 0) {
                        // Ya existe, usar ese ID
                        $row = $result_check->fetch_assoc();
                        $id_seccion = $row['id_seccion'];
                        $stmt_check->close();
                        $seccion_creada_nueva = false; // No se creó, ya existía
                    } else {
                        // No existe, crear nueva
                        $stmt_check->close();
                        
                        if ($edificio !== null && $piso_int !== null) {
                            $stmt_sec = $conn->prepare("INSERT INTO secciones (id_departamento, nombre, edificio, piso) VALUES (?, ?, ?, ?)");
                            $stmt_sec->bind_param('issi', $id_departamento, $nombre_sec, $edificio, $piso_int);
                        } else if ($edificio !== null) {
                            $stmt_sec = $conn->prepare("INSERT INTO secciones (id_departamento, nombre, edificio) VALUES (?, ?, ?)");
                            $stmt_sec->bind_param('iss', $id_departamento, $nombre_sec, $edificio);
                        } else if ($piso_int !== null) {
                            $stmt_sec = $conn->prepare("INSERT INTO secciones (id_departamento, nombre, piso) VALUES (?, ?, ?)");
                            $stmt_sec->bind_param('isi', $id_departamento, $nombre_sec, $piso_int);
                        } else {
                            $stmt_sec = $conn->prepare("INSERT INTO secciones (id_departamento, nombre) VALUES (?, ?)");
                            $stmt_sec->bind_param('is', $id_departamento, $nombre_sec);
                        }
                        
                        if (!$stmt_sec->execute()) {
                            throw new Exception('Error al crear sección: ' . $stmt_sec->error);
                        }
                        $id_seccion = $conn->insert_id;
                        $seccion_creada_nueva = true; // Se creó una nueva sección
                        $stmt_sec->close();
                    }
                }
            }
            
            // Asegurar que id_seccion sea null si no se creó ninguna sección
            // Esto es importante para evitar errores de foreign key cuando solo se crea un departamento o dirección
            if (empty($crear['nueva_seccion'])) {
                // Si no se creó una sección, id_seccion debe ser null
                // Solo mantener id_seccion si se seleccionó una sección existente válida (mayor a 0)
                if ($id_seccion === null || $id_seccion <= 0) {
                    $id_seccion = null;
                }
            }
            
            // Validación final: asegurar que id_seccion sea null si no es válido
            // Esto es crítico para evitar errores de foreign key
            if ($id_seccion !== null && $id_seccion <= 0) {
                $id_seccion = null;
            }
            
            // Si solo se está creando un departamento (sin sección), forzar id_seccion a null
            if (!empty($crear['nuevo_departamento']) && empty($crear['nueva_seccion']) && empty($id_seccion)) {
                $id_seccion = null;
            }
            
            // Insertar oficina (edificio y piso ya fueron obtenidos arriba)
            $nombre_oficina = trim($data['oficina']['nombre']);
            $ubicacion_fisica = !empty($data['oficina']['ubicacion_fisica']) ? trim($data['oficina']['ubicacion_fisica']) : null;

            // Construir la consulta SQL dinámicamente para manejar NULLs correctamente
            $campos = ['nombre'];
            $valores = [];
            $tipos = '';
            $params = [];
            
            // Nombre (siempre presente)
            $valores[] = $nombre_oficina;
            $tipos .= 's';
            
            // Edificio
            if ($edificio !== null) {
                $campos[] = 'edificio';
                $valores[] = $edificio;
                $tipos .= 's';
            }
            
            // Piso
            if ($piso_int !== null) {
                $campos[] = 'piso';
                $valores[] = $piso_int;
                $tipos .= 'i';
            }
            
            // Ubicación física
            if ($ubicacion_fisica !== null) {
                $campos[] = 'ubicacion_fisica';
                $valores[] = $ubicacion_fisica;
                $tipos .= 's';
            }
            
            // ID Dirección (solo si existe y es válido, mayor a 0)
            if ($id_direccion !== null && $id_direccion > 0) {
                $campos[] = 'id_direccion';
                $valores[] = $id_direccion;
                $tipos .= 'i';
            }
            
            // ID Departamento (solo si existe y es válido, mayor a 0)
            if ($id_departamento !== null && $id_departamento > 0) {
                $campos[] = 'id_departamento';
                $valores[] = $id_departamento;
                $tipos .= 'i';
            }
            
            // ID Sección (solo si existe y es válido, mayor a 0)
            // CRÍTICO: Si solo se crea un departamento, id_seccion NO se incluye (será NULL en la BD)
            // Los departamentos NO tienen sección, así que id_seccion debe ser NULL en la oficina
            
            // Validación: NO incluir id_seccion si solo se crea un departamento
            $incluir_id_seccion = true;
            if (!empty($crear['nuevo_departamento']) && empty($crear['nueva_seccion'])) {
                // Si solo se crea departamento, NO incluir id_seccion
                $incluir_id_seccion = false;
            } else if ($id_seccion === null || $id_seccion <= 0 || !is_numeric($id_seccion)) {
                // Si id_seccion no es válido, NO incluir
                $incluir_id_seccion = false;
            }
            
            // Solo incluir id_seccion si es válido y no se está creando solo un departamento
            if ($incluir_id_seccion && $id_seccion !== null && $id_seccion > 0 && is_numeric($id_seccion)) {
                $campos[] = 'id_seccion';
                $valores[] = $id_seccion;
                $tipos .= 'i';
            }
            // Si id_seccion no se incluye, quedará NULL en la BD (que es lo correcto cuando solo se crea un departamento)
            
            // Construir la consulta SQL
            $placeholders = str_repeat('?, ', count($valores));
            $placeholders = rtrim($placeholders, ', ');
            $sql = "INSERT INTO oficinas (" . implode(', ', $campos) . ") VALUES (" . $placeholders . ")";
            
            // CRÍTICO: Verificación final antes de ejecutar la consulta
            // Si se está creando solo un departamento, asegurar que id_seccion NO esté en los campos
            // Los departamentos NO tienen sección, así que id_seccion debe ser NULL en la oficina
            // Esta es una validación de seguridad adicional para asegurar que id_seccion no se incluya
            if (!empty($crear['nuevo_departamento']) && empty($crear['nueva_seccion'])) {
                // Remover id_seccion de los campos si está presente (no debería estar, pero por seguridad)
                $campos_finales = [];
                $valores_finales = [];
                $tipos_finales = '';
                
                foreach ($campos as $idx => $campo) {
                    if ($campo !== 'id_seccion') {
                        $campos_finales[] = $campo;
                        if (isset($valores[$idx])) {
                            $valores_finales[] = $valores[$idx];
                            // Determinar el tipo según el campo
                            if ($campo === 'piso' || $campo === 'id_direccion' || $campo === 'id_departamento') {
                                $tipos_finales .= 'i';
                            } else {
                                $tipos_finales .= 's';
                            }
                        }
                    }
                }
                
                $campos = $campos_finales;
                $valores = $valores_finales;
                $tipos = $tipos_finales;
                
                // Reconstruir SQL sin id_seccion
                $placeholders = str_repeat('?, ', count($valores));
                $placeholders = rtrim($placeholders, ', ');
                $sql = "INSERT INTO oficinas (" . implode(', ', $campos) . ") VALUES (" . $placeholders . ")";
            }
            
            $stmt_oficina = $conn->prepare($sql);
            if (!$stmt_oficina) {
                throw new Exception('Error al preparar consulta: ' . $conn->error);
            }
            
            $stmt_oficina->bind_param($tipos, ...$valores);
            
            if (!$stmt_oficina->execute()) {
                throw new Exception('Error al insertar oficina: ' . $stmt_oficina->error);
            }

            $id_oficina = $conn->insert_id;
            $stmt_oficina->close();

            // Insertar items de inventario si existen
            if (!empty($data['inventario']) && is_array($data['inventario'])) {
                $stmt_inventario = $conn->prepare("
                    INSERT INTO inventario (
                        codigo_patrimonial, descripcion, marca, modelo, serie, 
                        id_tipo_bien, estado, fecha_ingreso, 
                        id_direccion, id_departamento, id_seccion, id_oficina
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");

                foreach ($data['inventario'] as $item) {
                    if (empty($item['codigo_patrimonial'])) {
                        continue; // Saltar items incompletos
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

                    $stmt_inventario->bind_param('sssssisssiii',
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

                    if (!$stmt_inventario->execute()) {
                        throw new Exception('Error al insertar inventario: ' . $stmt_inventario->error);
                    }
                }

                $stmt_inventario->close();
            }

            // Guardar asignación de usuario si se proporcionó
            $asignacion = $data['asignacion'] ?? [];
            if (!empty($asignacion['id_usuario']) && $asignacion['id_usuario'] > 0) {
                $id_usuario = intval($asignacion['id_usuario']);
                $fecha_asignacion = date('Y-m-d');
                
                // Determinar a qué nivel se asigna (oficina, sección, departamento o dirección)
                // Prioridad: entidades recién creadas > oficina > sección > departamento > dirección
                $id_oficina_asignacion = null;
                $id_seccion_asignacion = null;
                $id_departamento_asignacion = null;
                $id_direccion_asignacion = null;
                
                // Priorizar entidades recién creadas
                if ($seccion_creada_nueva && $id_seccion !== null && $id_seccion > 0) {
                    // Asignar a la sección recién creada
                    $id_seccion_asignacion = $id_seccion;
                } else if ($departamento_creado_nuevo && $id_departamento !== null && $id_departamento > 0) {
                    // Asignar al departamento recién creado
                    $id_departamento_asignacion = $id_departamento;
                } else if ($direccion_creada && $id_direccion !== null && $id_direccion > 0) {
                    // Asignar a la dirección recién creada
                    $id_direccion_asignacion = $id_direccion;
                } else if ($id_oficina !== null && $id_oficina > 0) {
                    // Asignar a oficina (si se creó una oficina)
                    $id_oficina_asignacion = $id_oficina;
                } else if ($id_seccion !== null && $id_seccion > 0) {
                    // Asignar a sección existente
                    $id_seccion_asignacion = $id_seccion;
                } else if ($id_departamento !== null && $id_departamento > 0) {
                    // Asignar a departamento existente
                    $id_departamento_asignacion = $id_departamento;
                } else if ($id_direccion !== null && $id_direccion > 0) {
                    // Asignar a dirección existente
                    $id_direccion_asignacion = $id_direccion;
                }
                
                // Construir la consulta SQL dinámicamente
                $campos_asignacion = ['id_usuario', 'fecha_asignacion', 'activo'];
                $valores_asignacion = [$id_usuario, $fecha_asignacion, 1];
                $tipos_asignacion = 'isi';
                
                if ($id_oficina_asignacion !== null) {
                    $campos_asignacion[] = 'id_oficina';
                    $valores_asignacion[] = $id_oficina_asignacion;
                    $tipos_asignacion .= 'i';
                }
                if ($id_seccion_asignacion !== null) {
                    $campos_asignacion[] = 'id_seccion';
                    $valores_asignacion[] = $id_seccion_asignacion;
                    $tipos_asignacion .= 'i';
                }
                if ($id_departamento_asignacion !== null) {
                    $campos_asignacion[] = 'id_departamento';
                    $valores_asignacion[] = $id_departamento_asignacion;
                    $tipos_asignacion .= 'i';
                }
                if ($id_direccion_asignacion !== null) {
                    $campos_asignacion[] = 'id_direccion';
                    $valores_asignacion[] = $id_direccion_asignacion;
                    $tipos_asignacion .= 'i';
                }
                
                $placeholders_asignacion = str_repeat('?, ', count($valores_asignacion));
                $placeholders_asignacion = rtrim($placeholders_asignacion, ', ');
                $sql_asignacion = "INSERT INTO usuario_asignacion (" . implode(', ', $campos_asignacion) . ") VALUES (" . $placeholders_asignacion . ")";
                
                $stmt_asignacion = $conn->prepare($sql_asignacion);
                if (!$stmt_asignacion) {
                    throw new Exception('Error al preparar consulta de asignación: ' . $conn->error);
                }
                
                $stmt_asignacion->bind_param($tipos_asignacion, ...$valores_asignacion);
                
                if (!$stmt_asignacion->execute()) {
                    throw new Exception('Error al insertar asignación: ' . $stmt_asignacion->error);
                }
                
                $stmt_asignacion->close();
            }

            // Confirmar transacción
            $conn->commit();
            
            $mensaje = 'Espacio registrado correctamente';
            if (!empty($data['inventario']) && count($data['inventario']) > 0) {
                $mensaje .= ' con ' . count($data['inventario']) . ' item(s) de inventario';
            }
            
            return response()->json([
                'success' => true, 
                'message' => $mensaje,
                'id_oficina' => $id_oficina
            ]);

        } catch (Exception $e) {
            // Revertir transacción en caso de error
            $conn->rollback();
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }
}

