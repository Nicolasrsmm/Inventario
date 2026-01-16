<?php

namespace App\Services {
    use Exception;

    class DatabaseService
    {
        /**
         * Configuración de la base de datos
         */
        private static array $config = [
            'host' => 'localhost',
            'user' => 'root',
            'password' => '',
            'database' => 'inventarios'
        ];

        /**
         * Establecer la conexión a la base de datos
         * 
         * @return \mysqli
         * @throws Exception
         */
        public static function getConnection(): \mysqli
        {
            $host = self::$config['host'] ?? 'localhost';
            $user = self::$config['user'] ?? 'root';
            $password = self::$config['password'] ?? '';
            $database = self::$config['database'] ?? 'inventarios';

            $conn = new \mysqli($host, $user, $password, $database);

            if ($conn->connect_error) {
                throw new Exception('Error de conexión a la base de datos: ' . $conn->connect_error);
            }

            $conn->set_charset('utf8');

            // Configurar zona horaria para Chile
            $conn->query("SET time_zone = '-03:00'");
            $conn->query("SET NAMES utf8");

            return $conn;
        }

        /**
         * Función estática para mantener compatibilidad con código existente
         * que usa getDBConnection() directamente
         * 
         * @return \mysqli
         * @throws Exception
         */
        public static function getDBConnection(): \mysqli
        {
            return self::getConnection();
        }
    }
}

// Función global para mantener compatibilidad con código existente
// Se define en el namespace global explícitamente
namespace {
    if (!function_exists('getDBConnection')) {
        function getDBConnection(): \mysqli
        {
            return \App\Services\DatabaseService::getConnection();
        }
    }
}

