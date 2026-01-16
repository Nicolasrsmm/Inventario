-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 16-01-2026 a las 15:08:00
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `inventarios`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `credenciales`
--

CREATE TABLE `credenciales` (
  `id_credencial` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `nombre_usuario` varchar(50) NOT NULL,
  `correo_electronico` varchar(100) NOT NULL,
  `contrasena_hash` varchar(255) NOT NULL,
  `fecha_creacion` datetime DEFAULT current_timestamp(),
  `fecha_expiracion` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `credenciales`
--

INSERT INTO `credenciales` (`id_credencial`, `id_usuario`, `nombre_usuario`, `correo_electronico`, `contrasena_hash`, `fecha_creacion`, `fecha_expiracion`) VALUES
(1, 1, 'inventario', 'inventario@municipio.cl', '$2y$10$YGQ9yyh7T0RkyPEQojbbou6UtT8SeYVtTjKWS9yBNC1AzBfBJuIyy', '2025-12-16 19:56:19', NULL),
(2, 2, 'municipal', 'usuario@municipio.cl', '$argon2id$v=19$m=65536,t=4,p=1$UWRUSkFkY0NRQi5MWk9nNA$mXMvBmbx4FJhqhJup5COc+l27uk5sLiC686KiKKHJck', '2025-12-16 19:56:19', NULL),
(3, 3, 'informatica', 'informatica@municipio.cl', '$argon2id$v=19$m=65536,t=4,p=1$RmJ0cmcxOElSdnZPMldoeg$GMWiARiuKr4cXXwxTyVpbOV+XETB4kE+LQZ0N0j/61Y', '2025-12-16 19:56:19', NULL),
(4, 4, 'electrico', 'electricidad@municipio.cl', '$2y$10$.jb.CTGsXJBnP6hgO3XyU.mh/661RMBrSAruXxhMNjgjP9Ab5uJKq', '2025-12-16 19:56:19', NULL),
(5, 5, 'tecnico', 'tecnico@municipio.cl', '$argon2id$v=19$m=65536,t=4,p=1$SlBTMng3eW5qYkRFUU5taQ$96V+T00paekgO5CNPRJmJIZ6NXO2aoEFUvHQtj38SdM', '2025-12-16 19:56:19', NULL),
(6, 6, 'admin', 'admin@municipio.cl', '$argon2id$v=19$m=65536,t=4,p=1$akNvdHp2eDNXd1FNei80Ug$+bYgV92bq4ArpVEuuI9b7pYpwX+BhrhpCAaoqA2dwnY', '2025-12-16 19:56:19', NULL),
(12, 12, 'nicolas', 'nicolas.gota@gmail.com', '$2y$10$kVPXMXaV5pWKlTWLBNqQ9O8lHcQ0mxw2H3nkHYOIAysUTnEGV8cmm', '2026-01-09 09:08:53', NULL),
(13, 13, 'rcihard', 'richard@gmail.com', '$2y$10$q5s1ue2SkFriWrggCBz.NO8Hzs2lSV9CPd/qO3bOh3blpmiqXO1uq', '2026-01-16 11:05:57', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `departamentos`
--

CREATE TABLE `departamentos` (
  `id_departamento` int(11) NOT NULL,
  `id_direccion` int(11) DEFAULT NULL,
  `nombre` varchar(100) NOT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `edificio` varchar(100) DEFAULT NULL,
  `piso` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `departamentos`
--

INSERT INTO `departamentos` (`id_departamento`, `id_direccion`, `nombre`, `activo`, `edificio`, `piso`) VALUES
(1, 1, 'Adquisiciones', 1, 'Edificio Central', 2),
(2, 1, 'Contabilidad', 1, 'Edificio Central', 2),
(3, 1, 'Operaciones', 1, 'Edificio Central', 2),
(4, 2, 'Soporte Técnico', 1, 'Edificio Central', 3),
(5, 2, 'Desarrollo de Software', 1, 'Edificio Central', 3),
(6, 2, 'Infraestructura', 1, 'Edificio Central', 3),
(7, 3, 'Reclutamiento y Selección', 1, 'Edificio Anexo', 1),
(8, 3, 'Capacitación', 1, 'Edificio Anexo', 1),
(9, NULL, 'departamento inventario', 1, 'sdfsdf', NULL),
(10, NULL, 'Omil', 1, 'Edificio Central', 1),
(11, NULL, 'secpla', 1, 'Central', 2);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `direcciones`
--

CREATE TABLE `direcciones` (
  `id_direccion` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `edificio` varchar(100) DEFAULT NULL,
  `piso` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `direcciones`
--

INSERT INTO `direcciones` (`id_direccion`, `nombre`, `descripcion`, `edificio`, `piso`) VALUES
(1, 'Administración y Finanzas', 'Gestión administrativa, financiera y contable', 'Edificio Central', 2),
(2, 'Tecnologías de la Información', 'Soporte, desarrollo y gestión de sistemas', 'Edificio Central', 3),
(3, 'Recursos Humanos', 'Gestión de personal y bienestar laboral', 'Edificio Anexo', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `incidencias`
--

CREATE TABLE `incidencias` (
  `id_incidencia` int(11) NOT NULL,
  `id_usuario_reporta` int(11) NOT NULL,
  `id_inventario` int(11) DEFAULT NULL,
  `id_tipo` int(11) NOT NULL,
  `descripcion_reporte` text NOT NULL,
  `fecha_reporte` datetime NOT NULL,
  `id_direccion` int(11) DEFAULT NULL,
  `id_departamento` int(11) DEFAULT NULL,
  `id_seccion` int(11) DEFAULT NULL,
  `id_oficina` int(11) DEFAULT NULL,
  `estado` varchar(50) DEFAULT 'Reportada',
  `id_usuario_tecnico` int(11) DEFAULT NULL,
  `descripcion_solucion` text DEFAULT NULL,
  `fecha_solucion` datetime DEFAULT NULL,
  `resultado` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `incidencias`
--

INSERT INTO `incidencias` (`id_incidencia`, `id_usuario_reporta`, `id_inventario`, `id_tipo`, `descripcion_reporte`, `fecha_reporte`, `id_direccion`, `id_departamento`, `id_seccion`, `id_oficina`, `estado`, `id_usuario_tecnico`, `descripcion_solucion`, `fecha_solucion`, `resultado`) VALUES
(36, 2, 87, 1, 'Problemas De encendido', '2026-01-16 11:02:36', NULL, 11, NULL, 83, 'Resuelta', 3, 'se soluciono conectando el computador', '2026-01-16 11:03:11', 'solucionado');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `inventario`
--

CREATE TABLE `inventario` (
  `id_inventario` int(11) NOT NULL,
  `codigo_patrimonial` varchar(50) NOT NULL,
  `descripcion` varchar(200) DEFAULT NULL,
  `marca` varchar(100) DEFAULT NULL,
  `modelo` varchar(100) DEFAULT NULL,
  `serie` varchar(100) DEFAULT NULL,
  `id_tipo_bien` int(11) NOT NULL,
  `estado` varchar(50) DEFAULT NULL,
  `fecha_ingreso` date DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `id_direccion` int(11) DEFAULT NULL,
  `id_departamento` int(11) DEFAULT NULL,
  `id_seccion` int(11) DEFAULT NULL,
  `id_oficina` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `inventario`
--

INSERT INTO `inventario` (`id_inventario`, `codigo_patrimonial`, `descripcion`, `marca`, `modelo`, `serie`, `id_tipo_bien`, `estado`, `fecha_ingreso`, `activo`, `id_direccion`, `id_departamento`, `id_seccion`, `id_oficina`) VALUES
(77, '11', 'Camara negra', 'hp', 'ph 350', '11145hp', 1, 'Bueno', '2026-01-12', 1, NULL, 11, NULL, 83),
(79, '13', 'escaner epson negro', 'epson', 'epson 530', '5467-hty', 3, 'Bueno', '2026-01-12', 1, NULL, 10, NULL, 76),
(80, '14', 'pantalla de computador hp', 'hp', 'hp 12', '123er-fg', 14, 'Bueno', '2026-01-12', 1, NULL, 10, NULL, 76),
(87, '1212', 'computador color negro', 'hp', 'hp 540', '45g6785g', 2, 'Bueno', '2026-01-16', 1, NULL, 11, NULL, 83);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `movimientos_inventario`
--

CREATE TABLE `movimientos_inventario` (
  `id_movimiento` int(11) NOT NULL,
  `id_inventario` int(11) NOT NULL,
  `origen_direccion` int(11) DEFAULT NULL,
  `origen_departamento` int(11) DEFAULT NULL,
  `origen_seccion` int(11) DEFAULT NULL,
  `origen_oficina` int(11) DEFAULT NULL,
  `destino_direccion` int(11) DEFAULT NULL,
  `destino_departamento` int(11) DEFAULT NULL,
  `destino_seccion` int(11) DEFAULT NULL,
  `destino_oficina` int(11) DEFAULT NULL,
  `tipo_movimiento` varchar(50) NOT NULL,
  `motivo` text DEFAULT NULL,
  `fecha_movimiento` datetime NOT NULL,
  `id_usuario_responsable` int(11) NOT NULL,
  `id_inventario_nuevo` int(11) DEFAULT NULL,
  `revisado` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `movimientos_inventario`
--

INSERT INTO `movimientos_inventario` (`id_movimiento`, `id_inventario`, `origen_direccion`, `origen_departamento`, `origen_seccion`, `origen_oficina`, `destino_direccion`, `destino_departamento`, `destino_seccion`, `destino_oficina`, `tipo_movimiento`, `motivo`, `fecha_movimiento`, `id_usuario_responsable`, `id_inventario_nuevo`, `revisado`) VALUES
(126, 77, 1, NULL, NULL, NULL, NULL, NULL, NULL, 76, 'TRASLADO', '', '2026-01-16 10:45:11', 1, NULL, 0),
(127, 87, NULL, 11, NULL, 83, NULL, NULL, NULL, 76, 'TRASLADO', 'nuevo movimiento', '2026-01-16 11:01:30', 1, NULL, 0),
(128, 87, NULL, NULL, NULL, 76, NULL, 11, NULL, 83, 'TRASLADO', 'regreso', '2026-01-16 11:01:46', 1, NULL, 0),
(130, 77, NULL, NULL, NULL, 76, NULL, 11, NULL, 83, 'TRASLADO', 'movimiento camara oficina 2', '2026-01-16 11:04:23', 3, NULL, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `oficinas`
--

CREATE TABLE `oficinas` (
  `id_oficina` int(11) NOT NULL,
  `id_seccion` int(11) DEFAULT NULL,
  `nombre` varchar(100) NOT NULL,
  `ubicacion_fisica` varchar(150) DEFAULT NULL,
  `edificio` varchar(100) DEFAULT NULL,
  `piso` int(11) DEFAULT NULL,
  `id_direccion` int(11) DEFAULT NULL,
  `id_departamento` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `oficinas`
--

INSERT INTO `oficinas` (`id_oficina`, `id_seccion`, `nombre`, `ubicacion_fisica`, `edificio`, `piso`, `id_direccion`, `id_departamento`) VALUES
(76, NULL, 'Oficina 1', 'Norte', 'Edificio Central', 1, NULL, NULL),
(83, NULL, 'Oficina 2', 'Norte', 'Central', 2, NULL, 11);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `registro_acciones`
--

CREATE TABLE `registro_acciones` (
  `id` int(11) NOT NULL,
  `id_usuario` int(11) DEFAULT NULL,
  `accion` varchar(200) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `tabla_afectada` varchar(100) DEFAULT NULL,
  `id_registro_afectado` int(11) DEFAULT NULL,
  `fecha` timestamp NOT NULL DEFAULT current_timestamp(),
  `ip` varchar(45) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `registro_acciones`
--

INSERT INTO `registro_acciones` (`id`, `id_usuario`, `accion`, `descripcion`, `tabla_afectada`, `id_registro_afectado`, `fecha`, `ip`, `user_agent`, `metadata`) VALUES
(207, 1, 'LOGIN', 'Usuario inició sesión', 'sesiones', 191, '2025-12-19 22:20:26', '::1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1', NULL),
(208, 1, 'LOGOUT', 'Usuario cerró sesión', 'sesiones', 191, '2025-12-19 22:20:34', '::1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1', NULL),
(209, 1, 'LOGIN', 'Usuario inició sesión', 'sesiones', 192, '2025-12-19 22:23:49', '::1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1', NULL),
(210, 1, 'LOGOUT', 'Usuario cerró sesión', 'sesiones', 192, '2025-12-19 22:23:52', '::1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1', NULL),
(211, 1, 'LOGIN', 'Usuario inició sesión', 'sesiones', 193, '2025-12-19 22:24:10', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(212, 1, 'LOGIN', 'Usuario inició sesión', 'sesiones', 194, '2025-12-19 22:41:32', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(213, 1, 'LOGOUT', 'Usuario cerró sesión', 'sesiones', 193, '2025-12-19 23:33:35', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(214, 1, 'LOGIN', 'Usuario inició sesión', 'sesiones', 195, '2025-12-19 23:33:44', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(215, 1, 'LOGIN', 'Usuario inició sesión', 'sesiones', 196, '2025-12-20 20:02:53', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(216, 1, 'LOGIN', 'Usuario inició sesión', 'sesiones', 197, '2025-12-20 22:46:46', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(217, 1, 'LOGIN', 'Usuario inició sesión', 'sesiones', 198, '2025-12-20 22:48:21', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(218, 1, 'LOGIN', 'Usuario inició sesión', 'sesiones', 199, '2025-12-21 18:09:02', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(219, 1, 'LOGIN', 'Usuario inició sesión', 'sesiones', 200, '2025-12-21 20:50:59', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(220, 1, 'LOGIN', 'Usuario inició sesión', 'sesiones', 201, '2025-12-21 22:01:14', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(221, 1, 'LOGIN', 'Usuario inició sesión', 'sesiones', 202, '2025-12-21 22:18:58', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(222, 1, 'LOGIN', 'Usuario inició sesión', 'sesiones', 203, '2025-12-22 12:03:12', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(223, 3, 'LOGIN', 'Usuario inició sesión', 'sesiones', 204, '2025-12-22 12:03:21', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(224, 2, 'LOGIN', 'Usuario inició sesión', 'sesiones', 205, '2025-12-22 19:36:59', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(225, 2, 'LOGIN', 'Usuario inició sesión', 'sesiones', 206, '2025-12-23 11:53:06', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(226, 1, 'LOGIN', 'Usuario inició sesión', 'sesiones', 207, '2025-12-23 12:22:47', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(227, 3, 'LOGIN', 'Usuario inició sesión', 'sesiones', 208, '2025-12-23 12:50:44', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(228, 4, 'LOGIN', 'Usuario inició sesión', 'sesiones', 209, '2025-12-23 14:06:16', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(229, 5, 'LOGIN', 'Usuario inició sesión', 'sesiones', 210, '2025-12-23 16:53:41', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(230, 1, 'LOGIN', 'Usuario inició sesión', 'sesiones', 211, '2025-12-23 19:53:41', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(231, 1, 'LOGIN', 'Usuario inició sesión', 'sesiones', 212, '2025-12-23 20:14:33', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(232, 1, 'LOGOUT', 'Usuario cerró sesión', 'sesiones', 212, '2025-12-23 20:14:36', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(233, 1, 'LOGIN', 'Usuario inició sesión', 'sesiones', 213, '2025-12-23 20:19:39', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(234, 1, 'LOGOUT', 'Usuario cerró sesión', 'sesiones', 213, '2025-12-23 20:19:42', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(235, 1, 'LOGIN', 'Usuario inició sesión', 'sesiones', 214, '2025-12-23 20:19:58', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(236, 1, 'LOGOUT', 'Usuario cerró sesión', 'sesiones', 211, '2025-12-23 20:25:36', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(237, 4, 'LOGIN', 'Usuario inició sesión', 'sesiones', 215, '2025-12-23 20:25:46', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(238, 4, 'LOGOUT', 'Usuario cerró sesión', 'sesiones', 215, '2025-12-23 20:26:15', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(239, 4, 'LOGIN', 'Usuario inició sesión', 'sesiones', 216, '2025-12-23 20:26:24', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(240, 4, 'LOGOUT', 'Usuario cerró sesión', 'sesiones', 216, '2025-12-23 20:26:27', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(241, 3, 'LOGIN', 'Usuario inició sesión', 'sesiones', 217, '2025-12-23 20:31:40', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(242, 1, 'LOGIN', 'Usuario inició sesión', 'sesiones', 218, '2025-12-23 22:00:20', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(243, 3, 'LOGIN', 'Usuario inició sesión', 'sesiones', 219, '2025-12-23 22:00:34', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(244, 4, 'LOGIN', 'Usuario inició sesión', 'sesiones', 220, '2025-12-23 22:00:46', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(245, 2, 'LOGIN', 'Usuario inició sesión', 'sesiones', 221, '2025-12-23 22:07:58', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(246, 5, 'LOGIN', 'Usuario inició sesión', 'sesiones', 222, '2025-12-23 22:13:54', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(247, 6, 'LOGIN', 'Usuario inició sesión', 'sesiones', 223, '2025-12-23 22:16:54', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(248, NULL, 'LOGIN', 'Usuario inició sesión', 'sesiones', 224, '2025-12-23 22:25:44', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(249, NULL, 'LOGOUT', 'Usuario cerró sesión', 'sesiones', 224, '2025-12-23 22:25:57', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(250, NULL, 'LOGIN', 'Usuario inició sesión', 'sesiones', 225, '2025-12-23 22:36:35', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(251, 6, 'LOGIN', 'Usuario inició sesión', 'sesiones', 226, '2025-12-23 22:45:32', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(252, 6, 'LOGIN', 'Usuario inició sesión', 'sesiones', 227, '2025-12-24 19:12:35', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(253, 4, 'LOGIN', 'Usuario inició sesión', 'sesiones', 228, '2025-12-24 19:15:58', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(254, 6, 'LOGIN', 'Usuario inició sesión', 'sesiones', 229, '2025-12-24 19:45:39', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(255, 6, 'LOGIN', 'Usuario inició sesión', 'sesiones', 230, '2025-12-26 12:12:18', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(256, 4, 'LOGIN', 'Usuario inició sesión', 'sesiones', 231, '2025-12-26 12:20:21', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(257, 3, 'LOGIN', 'Usuario inició sesión', 'sesiones', 232, '2025-12-26 12:26:23', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(258, 1, 'LOGIN', 'Usuario inició sesión', 'sesiones', 233, '2025-12-26 12:31:24', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(259, 2, 'LOGIN', 'Usuario inició sesión', 'sesiones', 234, '2025-12-26 12:49:13', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(260, 5, 'LOGIN', 'Usuario inició sesión', 'sesiones', 235, '2025-12-26 12:52:22', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(261, 1, 'LOGIN', 'Usuario inició sesión', 'sesiones', 236, '2026-01-08 23:27:39', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(262, 6, 'LOGIN', 'Usuario inició sesión', 'sesiones', 237, '2026-01-08 23:29:20', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(263, 1, 'LOGIN', 'Usuario inició sesión', 'sesiones', 238, '2026-01-09 11:38:31', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(264, 6, 'LOGIN', 'Usuario inició sesión', 'sesiones', 239, '2026-01-09 11:38:46', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(265, 3, 'LOGIN', 'Usuario inició sesión', 'sesiones', 240, '2026-01-09 11:38:55', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(266, 4, 'LOGIN', 'Usuario inició sesión', 'sesiones', 241, '2026-01-09 11:39:03', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(267, 2, 'LOGIN', 'Usuario inició sesión', 'sesiones', 242, '2026-01-09 11:39:21', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(268, 5, 'LOGIN', 'Usuario inició sesión', 'sesiones', 243, '2026-01-09 11:40:19', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(269, 1, 'LOGIN', 'Usuario inició sesión', 'sesiones', 244, '2026-01-09 20:41:11', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(270, 6, 'LOGIN', 'Usuario inició sesión', 'sesiones', 245, '2026-01-09 20:41:18', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(271, 3, 'LOGIN', 'Usuario inició sesión', 'sesiones', 246, '2026-01-09 20:41:26', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(272, 5, 'LOGIN', 'Usuario inició sesión', 'sesiones', 247, '2026-01-09 20:41:33', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(273, 2, 'LOGIN', 'Usuario inició sesión', 'sesiones', 248, '2026-01-09 20:41:42', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(274, 4, 'LOGIN', 'Usuario inició sesión', 'sesiones', 249, '2026-01-09 20:41:56', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(275, 1, 'LOGOUT', 'Usuario cerró sesión', 'sesiones', 244, '2026-01-09 22:14:30', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(276, 1, 'LOGIN', 'Usuario inició sesión', 'sesiones', 250, '2026-01-09 22:14:38', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(277, 1, 'LOGIN', 'Usuario inició sesión', 'sesiones', 251, '2026-01-12 15:34:53', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(278, 6, 'LOGIN', 'Usuario inició sesión', 'sesiones', 252, '2026-01-12 15:35:05', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(279, 3, 'LOGIN', 'Usuario inició sesión', 'sesiones', 253, '2026-01-12 15:35:16', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(280, 5, 'LOGIN', 'Usuario inició sesión', 'sesiones', 254, '2026-01-12 15:35:39', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(281, 2, 'LOGIN', 'Usuario inició sesión', 'sesiones', 255, '2026-01-12 15:35:52', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(282, 1, 'LOGIN', 'Usuario inició sesión', 'sesiones', 256, '2026-01-12 16:05:36', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(283, 6, 'LOGIN', 'Usuario inició sesión', 'sesiones', 257, '2026-01-12 16:05:43', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(284, 3, 'LOGIN', 'Usuario inició sesión', 'sesiones', 258, '2026-01-12 16:05:51', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(285, 2, 'LOGIN', 'Usuario inició sesión', 'sesiones', 259, '2026-01-12 16:05:59', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(286, 5, 'LOGIN', 'Usuario inició sesión', 'sesiones', 260, '2026-01-12 16:06:06', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(287, 6, 'LOGIN', 'Usuario inició sesión', 'sesiones', 261, '2026-01-12 16:28:26', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(288, 6, 'LOGIN', 'Usuario inició sesión', 'sesiones', 262, '2026-01-12 16:47:29', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(289, 1, 'LOGIN', 'Usuario inició sesión', 'sesiones', 263, '2026-01-12 21:58:10', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(290, 6, 'LOGIN', 'Usuario inició sesión', 'sesiones', 264, '2026-01-12 21:58:20', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(291, 2, 'LOGIN', 'Usuario inició sesión', 'sesiones', 265, '2026-01-12 21:58:27', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(292, 3, 'LOGIN', 'Usuario inició sesión', 'sesiones', 266, '2026-01-12 21:58:39', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(293, 5, 'LOGIN', 'Usuario inició sesión', 'sesiones', 267, '2026-01-12 21:58:46', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(294, 4, 'LOGIN', 'Usuario inició sesión', 'sesiones', 268, '2026-01-12 21:59:00', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(295, 2, 'LOGIN', 'Usuario inició sesión', 'sesiones', 269, '2026-01-12 23:31:20', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(296, 1, 'LOGIN', 'Usuario inició sesión', 'sesiones', 270, '2026-01-13 12:22:13', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(297, 3, 'LOGIN', 'Usuario inició sesión', 'sesiones', 271, '2026-01-13 18:12:04', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(298, 6, 'LOGIN', 'Usuario inició sesión', 'sesiones', 272, '2026-01-13 18:14:43', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(299, 2, 'LOGIN', 'Usuario inició sesión', 'sesiones', 273, '2026-01-13 18:14:54', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(300, 5, 'LOGIN', 'Usuario inició sesión', 'sesiones', 274, '2026-01-13 18:15:04', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(301, 4, 'LOGIN', 'Usuario inició sesión', 'sesiones', 275, '2026-01-13 18:15:16', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', NULL),
(302, 1, 'LOGIN', 'Usuario inició sesión', 'sesiones', 276, '2026-01-16 13:43:41', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', NULL),
(303, 6, 'LOGIN', 'Usuario inició sesión', 'sesiones', 277, '2026-01-16 13:58:23', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', NULL),
(304, 2, 'LOGIN', 'Usuario inició sesión', 'sesiones', 278, '2026-01-16 13:58:35', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', NULL),
(305, 3, 'LOGIN', 'Usuario inició sesión', 'sesiones', 279, '2026-01-16 13:58:45', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', NULL),
(306, 5, 'LOGIN', 'Usuario inició sesión', 'sesiones', 280, '2026-01-16 13:58:52', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', NULL),
(307, 1, 'LOGOUT', 'Usuario cerró sesión', 'sesiones', 276, '2026-01-16 13:58:55', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', NULL),
(308, 1, 'LOGIN', 'Usuario inició sesión', 'sesiones', 281, '2026-01-16 13:59:31', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `roles`
--

CREATE TABLE `roles` (
  `id_rol` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `roles`
--

INSERT INTO `roles` (`id_rol`, `nombre`, `descripcion`, `activo`) VALUES
(1, 'Inventario', 'Personal encargado de la gestión y control del inventario municipal', 1),
(2, 'Usuario Municipal', 'Funcionario municipal que utiliza el sistema y reporta incidencias', 1),
(3, 'Informática', 'Personal del área de informática encargado de soporte tecnológico', 1),
(4, 'Electricidad', 'Personal técnico del área eléctrica', 1),
(5, 'Técnico General', 'Personal técnico para incidencias generales y apoyo operativo', 1),
(6, 'Administrador', 'Administrador del sistema con acceso total y gestión de usuarios', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `secciones`
--

CREATE TABLE `secciones` (
  `id_seccion` int(11) NOT NULL,
  `id_departamento` int(11) DEFAULT NULL,
  `nombre` varchar(100) NOT NULL,
  `edificio` varchar(100) DEFAULT NULL,
  `piso` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `secciones`
--

INSERT INTO `secciones` (`id_seccion`, `id_departamento`, `nombre`, `edificio`, `piso`) VALUES
(1, 1, 'Compras Nacionales', 'Edificio Central', 2),
(2, 1, 'Compras Internacionales', 'Edificio Central', 2),
(3, 1, 'Gestión de Proveedores', 'Edificio Central', 2),
(4, 2, 'Contabilidad General', 'Edificio Central', 2),
(5, 2, 'Cuentas por Pagar', 'Edificio Central', 2),
(6, 2, 'Cuentas por Cobrar', 'Edificio Central', 2),
(7, 2, 'Tesorería', 'Edificio Central', 2),
(8, 3, 'Control de Gestión', 'Edificio Central', 2),
(9, 3, 'Planificación Operativa', 'Edificio Central', 2),
(10, 3, 'Reportes Operacionales', 'Edificio Central', 2),
(11, 4, 'Mesa de Ayuda', 'Edificio Central', 3),
(12, 4, 'Soporte Nivel 1', 'Edificio Central', 3),
(13, 4, 'Soporte Nivel 2', 'Edificio Central', 3),
(14, 5, 'Desarrollo Backend', 'Edificio Central', 3),
(15, 5, 'Desarrollo Frontend', 'Edificio Central', 3),
(16, 5, 'QA y Testing', 'Edificio Central', 3),
(17, 6, 'Redes', 'Edificio Central', 3),
(18, 6, 'Servidores', 'Edificio Central', 3),
(19, 6, 'Seguridad Informática', 'Edificio Central', 3),
(20, 7, 'Publicación de Vacantes', 'Edificio Anexo', 1),
(21, 7, 'Entrevistas', 'Edificio Anexo', 1),
(22, 7, 'Onboarding', 'Edificio Anexo', 1),
(23, 8, 'Formación Interna', 'Edificio Anexo', 1),
(24, 8, 'Formación Externa', 'Edificio Anexo', 1),
(25, 8, 'Evaluación de Desempeño', 'Edificio Anexo', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sesiones`
--

CREATE TABLE `sesiones` (
  `id` int(11) NOT NULL,
  `id_usuario` int(11) DEFAULT NULL,
  `token` varchar(255) NOT NULL,
  `inicio` timestamp NOT NULL DEFAULT current_timestamp(),
  `ultimo_acceso` timestamp NULL DEFAULT NULL,
  `expiracion` timestamp NULL DEFAULT NULL,
  `ip` varchar(45) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `sesiones`
--

INSERT INTO `sesiones` (`id`, `id_usuario`, `token`, `inicio`, `ultimo_acceso`, `expiracion`, `ip`, `user_agent`, `activo`) VALUES
(238, 1, '3eab44ae9a2f56bf0d13ce900ffbd4af98c6c37f617b920e9f71aec0162ab35c', '2026-01-09 11:38:31', '2026-01-09 11:38:31', '2026-01-10 14:38:31', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', 1),
(239, 6, '76359a5f53d4f191403ebdf4923edee42a17e5cd300548df2090402e63c86d1e', '2026-01-09 11:38:46', '2026-01-09 11:38:46', '2026-01-10 14:38:46', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', 1),
(240, 3, '428b7d9f60749e4341cac94e6cafd98eae2b687a027aef5c3edab3d32f711c27', '2026-01-09 11:38:55', '2026-01-09 11:38:55', '2026-01-10 14:38:55', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', 1),
(241, 4, '2ce74ee55007bb468ae28f3e7d48aba03d8d1ac17cb789d6b6539f8aadd38ac3', '2026-01-09 11:39:03', '2026-01-09 11:39:03', '2026-01-10 14:39:03', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', 1),
(242, 2, '8e73a84c611ce1ae321c10946776719c13a37d2524a9c64732dce7dc0440ddec', '2026-01-09 11:39:21', '2026-01-09 11:39:21', '2026-01-10 14:39:21', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', 1),
(243, 5, '1105002f30cefd2779aa38cb97bb27d3b77385e7aa55ab632cc9d9b6d31511b4', '2026-01-09 11:40:19', '2026-01-09 11:40:19', '2026-01-10 14:40:19', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', 1),
(244, 1, '267e7c181985830ddce08960f7355a87215fd1f40b3a60e276cbd94300162d77', '2026-01-09 20:41:11', '2026-01-09 22:14:30', '2026-01-10 23:41:11', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', 0),
(245, 6, 'eba154e7756312a2dd742246ef55f8cee35d84443915c845e1545436b60f3125', '2026-01-09 20:41:18', '2026-01-09 20:41:18', '2026-01-10 23:41:18', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', 1),
(246, 3, '19b4e52c141d6c21f1e288e2bf08a4825f95b4a3755a72dc6429d5e96c2122e2', '2026-01-09 20:41:26', '2026-01-09 20:41:26', '2026-01-10 23:41:26', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', 1),
(247, 5, '6e9a78214cd2e725bec1861b6a23543c0e5d3b29d8c31944b2e7599fb08fdc71', '2026-01-09 20:41:33', '2026-01-09 20:41:33', '2026-01-10 23:41:33', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', 1),
(248, 2, 'd05e1c4fe0d2e083e4d38b01363a64cb0a379d2e712754fab2977310aea36ff0', '2026-01-09 20:41:42', '2026-01-09 20:41:42', '2026-01-10 23:41:42', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', 1),
(249, 4, 'd22cc3e98adb5d7802ea4b833099b488841a92c21b00c4ad16ba57dfb4c8b0e9', '2026-01-09 20:41:56', '2026-01-09 20:41:56', '2026-01-10 23:41:56', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', 1),
(250, 1, 'aa5434504324b312fa9a4782c4897a076c123d2c75993101538ef21b572afb39', '2026-01-09 22:14:38', '2026-01-09 22:14:38', '2026-01-11 01:14:38', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', 1),
(251, 1, 'c94a5d09994d29617e587d15917b478028fa3e71860a73554388d3a3236535e3', '2026-01-12 15:34:53', '2026-01-12 15:34:53', '2026-01-13 18:34:53', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', 1),
(252, 6, '9e9edda869a61b6e30b8dbcbd5925944c3768c07181038b4ebdea389bfd48130', '2026-01-12 15:35:05', '2026-01-12 15:35:05', '2026-01-13 18:35:05', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', 1),
(253, 3, 'eeae653f54506d3491b224ff4d27e863bef4e8e1d23c0d29d9bba81a92124685', '2026-01-12 15:35:16', '2026-01-12 15:35:16', '2026-01-13 18:35:16', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', 1),
(254, 5, 'ebc50da0056a511c35eefede14280a43f73e1c8938b758a7e215e5ac590f798f', '2026-01-12 15:35:39', '2026-01-12 15:35:39', '2026-01-13 18:35:39', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', 1),
(255, 2, 'be86f2497f37b11de32f2a802b822a59b89d5e89b34705681a767f7494999f6f', '2026-01-12 15:35:52', '2026-01-12 15:35:52', '2026-01-13 18:35:52', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', 1),
(256, 1, '01d5ed8817f4c8279509851184d96149a8dfa4e102620e6e5abd244ec57dba7c', '2026-01-12 16:05:36', '2026-01-12 16:05:36', '2026-01-13 19:05:36', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', 1),
(257, 6, '9d4bde8278709eff0867abd31e1eaf56ea474942aeb1bad5bfe9f2f3d19bd92f', '2026-01-12 16:05:43', '2026-01-12 16:05:43', '2026-01-13 19:05:43', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', 1),
(258, 3, '9db72e55ce17b8d21c846bc67e357169621ace34db328a23e09fdd0398cdf7c6', '2026-01-12 16:05:51', '2026-01-12 16:05:51', '2026-01-13 19:05:51', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', 1),
(259, 2, '99f0ed4b7ec800352046f8aebd5d7a0da5863be978cb18c7c9392c30b81268b4', '2026-01-12 16:05:59', '2026-01-12 16:05:59', '2026-01-13 19:05:59', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', 1),
(260, 5, '004b86501c9a52216701cc0e347cd4c79b5dfe1fa8ac4a955651c9cc60fda488', '2026-01-12 16:06:06', '2026-01-12 16:06:06', '2026-01-13 19:06:06', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', 1),
(261, 6, '341b503c62880dabb317b1ced5c3f5300ef7399b96218d327d57d9d720be1d6b', '2026-01-12 16:28:26', '2026-01-12 16:28:26', '2026-01-13 19:28:26', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', 1),
(262, 6, 'ed9f8ad472a14533873fcfe3d8cf2a4363c9bc766a380e22bc4a92c7947967e9', '2026-01-12 16:47:29', '2026-01-12 16:47:29', '2026-01-13 19:47:29', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', 1),
(263, 1, 'ec55796acbce3232afabed1f617ff569c0f15e8284b6c1a45501dd40fd1039b9', '2026-01-12 21:58:10', '2026-01-12 21:58:10', '2026-01-14 00:58:10', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', 1),
(264, 6, '77dc6b4663142bbd12ba7ed9e2bfc74346e56a6c3f32a2e644644dc43feacb97', '2026-01-12 21:58:19', '2026-01-12 21:58:19', '2026-01-14 00:58:19', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', 1),
(265, 2, '722f756d968a1803f47492a84d5cad5a899325d8c73893f55449fa1154a917d8', '2026-01-12 21:58:27', '2026-01-12 21:58:27', '2026-01-14 00:58:27', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', 1),
(266, 3, '309133def7ccc5840d34ccc1b8ad1e504869be44054b970b1cccc9b4e21a9841', '2026-01-12 21:58:39', '2026-01-12 21:58:39', '2026-01-14 00:58:39', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', 1),
(267, 5, '75e8fc68795ed8765225540470debc09b4b8fff45d34272d90258014e656a23b', '2026-01-12 21:58:46', '2026-01-12 21:58:46', '2026-01-14 00:58:46', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', 1),
(268, 4, 'eb5717fe37381ac0eea690e1a7becba62822f0f1ebd8880aa79d9c79a4f81edb', '2026-01-12 21:59:00', '2026-01-12 21:59:00', '2026-01-14 00:59:00', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', 1),
(269, 2, 'aea4ff104677ff5a1cee7879b83e8f113453951acd15ee73594fb8813f651dde', '2026-01-12 23:31:20', '2026-01-12 23:31:20', '2026-01-14 02:31:20', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', 1),
(270, 1, 'a55936d95f6b297e8198b7cd05a8c3ce904eda1124ce258ee1034264ffc3f5a5', '2026-01-13 12:22:13', '2026-01-13 12:22:13', '2026-01-14 15:22:13', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', 1),
(271, 3, '2f3de1c69176746349ad781d3bf7a9e84274324b01c931b027a41d350ee8256f', '2026-01-13 18:12:04', '2026-01-13 18:12:04', '2026-01-14 21:12:04', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', 1),
(272, 6, '7d6bd5405e6c153ce3ea9b8193df1561679747af1c63c93a043012a1d5555557', '2026-01-13 18:14:43', '2026-01-13 18:14:43', '2026-01-14 21:14:43', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', 1),
(273, 2, '935ae5e8329cc539d7c4aaf679c489cf341631213b646b1c9328588577192626', '2026-01-13 18:14:54', '2026-01-13 18:14:54', '2026-01-14 21:14:54', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', 1),
(274, 5, '36f4a25682f471f7a1c63194453f3bc56337b9fb75f4e7372541b1f2cbb8ddfe', '2026-01-13 18:15:04', '2026-01-13 18:15:04', '2026-01-14 21:15:04', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', 1),
(275, 4, '65efd7c533c77640448fcd41e1e60f2c6ce5e68db950bdf1e8b9a74c4f17e057', '2026-01-13 18:15:16', '2026-01-13 18:15:16', '2026-01-14 21:15:16', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', 1),
(276, 1, 'c2d4163deea6f79fac7d3c2bddc2f14618059249843bc85a3176c18f66dd19cb', '2026-01-16 13:43:41', '2026-01-16 13:58:55', '2026-01-17 16:43:41', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', 0),
(277, 6, 'ab6d9a4829bb1671218ec70a3c0d0eb1e9239ee3bc4ea4b178d1e7f44c498349', '2026-01-16 13:58:23', '2026-01-16 13:58:23', '2026-01-17 16:58:23', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', 1),
(278, 2, '5bc25f0d256b92165e3bd9fdec4e4f3941ecf1f9765139678711d50fa6eec742', '2026-01-16 13:58:35', '2026-01-16 13:58:35', '2026-01-17 16:58:35', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', 1),
(279, 3, 'ee784c1fc6d7458301fe4db7e955f1fccb193664cb85d46d935ee6cfec3bc6ca', '2026-01-16 13:58:45', '2026-01-16 13:58:45', '2026-01-17 16:58:45', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', 1),
(280, 5, '07279cfea7c14928c549c50ae1c0d00cd67d4f83b285801136657ba926c45065', '2026-01-16 13:58:52', '2026-01-16 13:58:52', '2026-01-17 16:58:52', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', 1),
(281, 1, 'c38bda3d256eff88cdc0b79778363bae7ec875c61e077a63a1ac8cc54a614a86', '2026-01-16 13:59:31', '2026-01-16 13:59:31', '2026-01-17 16:59:31', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tipos_bien`
--

CREATE TABLE `tipos_bien` (
  `id_tipo_bien` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `tipos_bien`
--

INSERT INTO `tipos_bien` (`id_tipo_bien`, `nombre`) VALUES
(1, 'Cámara'),
(2, 'Computador'),
(3, 'Escáner'),
(4, 'Estantería'),
(5, 'Impresora'),
(6, 'Mesa de Centro'),
(7, 'Notebook'),
(8, 'Proyector'),
(9, 'Silla'),
(10, 'Tablet'),
(11, 'Teléfono'),
(12, 'Televisor'),
(14, 'pantalla');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tipos_incidencia`
--

CREATE TABLE `tipos_incidencia` (
  `id_tipo` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `tipos_incidencia`
--

INSERT INTO `tipos_incidencia` (`id_tipo`, `nombre`) VALUES
(1, 'Informática'),
(2, 'Electricidad'),
(3, 'Técnico General'),
(4, 'Administrador');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id_usuario` int(11) NOT NULL,
  `rut` varchar(12) NOT NULL,
  `nombres` varchar(150) NOT NULL,
  `apellidos` varchar(150) NOT NULL,
  `correo` varchar(200) NOT NULL,
  `cargo` varchar(150) DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id_usuario`, `rut`, `nombres`, `apellidos`, `correo`, `cargo`, `activo`) VALUES
(1, '11.111.111-1', 'Juans', 'Inventario', 'inventario@municipio.cl', 'Encargado de Inventario', 1),
(2, '22.222.222-2', 'Marías', 'Municipal', 'usuario@municipio.cl', 'Funcionario Municipal', 1),
(3, '33.333.333-3', 'Carlos', 'Informatica', 'informatica@municipio.cl', 'Soporte Informático', 1),
(4, '44.444.444-4', 'Pedro', 'Electricidad', 'electricidad@municipio.cl', 'Técnico Electricista', 1),
(5, '55.555.555-5', 'Luiss', 'Tecnico', 'tecnico@municipio.cl', 'Técnico General', 1),
(6, '66.666.666-6', 'Admins', 'Sistema', 'admin@municipio.cl', 'Administrador del Sistema', 1),
(12, '19509823-9', 'nicolas', 'san martin', 'nicolas.gota@gmail.com', 'informatico', 1),
(13, '12977767-2', 'richard', 'barrera', 'richard@gmail.com', 'informatico', 0);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuario_asignacion`
--

CREATE TABLE `usuario_asignacion` (
  `id_asignacion` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `id_direccion` int(11) DEFAULT NULL,
  `id_departamento` int(11) DEFAULT NULL,
  `id_seccion` int(11) DEFAULT NULL,
  `id_oficina` int(11) DEFAULT NULL,
  `fecha_asignacion` date NOT NULL,
  `activo` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuario_asignacion`
--

INSERT INTO `usuario_asignacion` (`id_asignacion`, `id_usuario`, `id_direccion`, `id_departamento`, `id_seccion`, `id_oficina`, `fecha_asignacion`, `activo`) VALUES
(42, 3, NULL, NULL, NULL, 76, '2026-01-16', 1),
(43, 2, NULL, 11, NULL, NULL, '2026-01-16', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuario_roles`
--

CREATE TABLE `usuario_roles` (
  `id` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `id_rol` int(11) NOT NULL,
  `activo` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuario_roles`
--

INSERT INTO `usuario_roles` (`id`, `id_usuario`, `id_rol`, `activo`) VALUES
(1, 1, 1, 1),
(2, 2, 2, 1),
(3, 3, 3, 1),
(4, 4, 4, 1),
(5, 5, 5, 1),
(6, 6, 6, 1),
(12, 12, 3, 1),
(13, 13, 3, 1);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `credenciales`
--
ALTER TABLE `credenciales`
  ADD PRIMARY KEY (`id_credencial`),
  ADD KEY `id_usuario` (`id_usuario`);

--
-- Indices de la tabla `departamentos`
--
ALTER TABLE `departamentos`
  ADD PRIMARY KEY (`id_departamento`),
  ADD KEY `id_direccion` (`id_direccion`);

--
-- Indices de la tabla `direcciones`
--
ALTER TABLE `direcciones`
  ADD PRIMARY KEY (`id_direccion`);

--
-- Indices de la tabla `incidencias`
--
ALTER TABLE `incidencias`
  ADD PRIMARY KEY (`id_incidencia`),
  ADD KEY `id_usuario_reporta` (`id_usuario_reporta`),
  ADD KEY `id_usuario_tecnico` (`id_usuario_tecnico`),
  ADD KEY `id_inventario` (`id_inventario`),
  ADD KEY `id_tipo` (`id_tipo`),
  ADD KEY `id_direccion` (`id_direccion`),
  ADD KEY `id_departamento` (`id_departamento`),
  ADD KEY `id_seccion` (`id_seccion`),
  ADD KEY `id_oficina` (`id_oficina`);

--
-- Indices de la tabla `inventario`
--
ALTER TABLE `inventario`
  ADD PRIMARY KEY (`id_inventario`),
  ADD UNIQUE KEY `codigo_patrimonial` (`codigo_patrimonial`),
  ADD KEY `id_tipo_bien` (`id_tipo_bien`),
  ADD KEY `id_direccion` (`id_direccion`),
  ADD KEY `id_departamento` (`id_departamento`),
  ADD KEY `id_seccion` (`id_seccion`),
  ADD KEY `id_oficina` (`id_oficina`);

--
-- Indices de la tabla `movimientos_inventario`
--
ALTER TABLE `movimientos_inventario`
  ADD PRIMARY KEY (`id_movimiento`),
  ADD KEY `id_inventario` (`id_inventario`),
  ADD KEY `id_inventario_nuevo` (`id_inventario_nuevo`),
  ADD KEY `id_usuario_responsable` (`id_usuario_responsable`),
  ADD KEY `origen_direccion` (`origen_direccion`),
  ADD KEY `origen_departamento` (`origen_departamento`),
  ADD KEY `origen_seccion` (`origen_seccion`),
  ADD KEY `origen_oficina` (`origen_oficina`),
  ADD KEY `destino_direccion` (`destino_direccion`),
  ADD KEY `destino_departamento` (`destino_departamento`),
  ADD KEY `destino_seccion` (`destino_seccion`),
  ADD KEY `destino_oficina` (`destino_oficina`);

--
-- Indices de la tabla `oficinas`
--
ALTER TABLE `oficinas`
  ADD PRIMARY KEY (`id_oficina`),
  ADD KEY `id_seccion` (`id_seccion`),
  ADD KEY `fk_oficina_direccion` (`id_direccion`),
  ADD KEY `fk_oficina_departamento` (`id_departamento`);

--
-- Indices de la tabla `registro_acciones`
--
ALTER TABLE `registro_acciones`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_usuario` (`id_usuario`);

--
-- Indices de la tabla `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id_rol`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `secciones`
--
ALTER TABLE `secciones`
  ADD PRIMARY KEY (`id_seccion`),
  ADD KEY `id_departamento` (`id_departamento`);

--
-- Indices de la tabla `sesiones`
--
ALTER TABLE `sesiones`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_usuario` (`id_usuario`);

--
-- Indices de la tabla `tipos_bien`
--
ALTER TABLE `tipos_bien`
  ADD PRIMARY KEY (`id_tipo_bien`);

--
-- Indices de la tabla `tipos_incidencia`
--
ALTER TABLE `tipos_incidencia`
  ADD PRIMARY KEY (`id_tipo`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id_usuario`),
  ADD UNIQUE KEY `rut` (`rut`);

--
-- Indices de la tabla `usuario_asignacion`
--
ALTER TABLE `usuario_asignacion`
  ADD PRIMARY KEY (`id_asignacion`),
  ADD KEY `id_usuario` (`id_usuario`),
  ADD KEY `id_direccion` (`id_direccion`),
  ADD KEY `id_departamento` (`id_departamento`),
  ADD KEY `id_seccion` (`id_seccion`),
  ADD KEY `id_oficina` (`id_oficina`);

--
-- Indices de la tabla `usuario_roles`
--
ALTER TABLE `usuario_roles`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_usuario` (`id_usuario`),
  ADD KEY `id_rol` (`id_rol`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `credenciales`
--
ALTER TABLE `credenciales`
  MODIFY `id_credencial` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT de la tabla `departamentos`
--
ALTER TABLE `departamentos`
  MODIFY `id_departamento` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=44;

--
-- AUTO_INCREMENT de la tabla `direcciones`
--
ALTER TABLE `direcciones`
  MODIFY `id_direccion` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT de la tabla `incidencias`
--
ALTER TABLE `incidencias`
  MODIFY `id_incidencia` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT de la tabla `inventario`
--
ALTER TABLE `inventario`
  MODIFY `id_inventario` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=88;

--
-- AUTO_INCREMENT de la tabla `movimientos_inventario`
--
ALTER TABLE `movimientos_inventario`
  MODIFY `id_movimiento` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=131;

--
-- AUTO_INCREMENT de la tabla `oficinas`
--
ALTER TABLE `oficinas`
  MODIFY `id_oficina` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=84;

--
-- AUTO_INCREMENT de la tabla `registro_acciones`
--
ALTER TABLE `registro_acciones`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=309;

--
-- AUTO_INCREMENT de la tabla `roles`
--
ALTER TABLE `roles`
  MODIFY `id_rol` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `secciones`
--
ALTER TABLE `secciones`
  MODIFY `id_seccion` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT de la tabla `sesiones`
--
ALTER TABLE `sesiones`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=282;

--
-- AUTO_INCREMENT de la tabla `tipos_bien`
--
ALTER TABLE `tipos_bien`
  MODIFY `id_tipo_bien` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT de la tabla `tipos_incidencia`
--
ALTER TABLE `tipos_incidencia`
  MODIFY `id_tipo` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id_usuario` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT de la tabla `usuario_asignacion`
--
ALTER TABLE `usuario_asignacion`
  MODIFY `id_asignacion` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=44;

--
-- AUTO_INCREMENT de la tabla `usuario_roles`
--
ALTER TABLE `usuario_roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `credenciales`
--
ALTER TABLE `credenciales`
  ADD CONSTRAINT `credenciales_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`);

--
-- Filtros para la tabla `departamentos`
--
ALTER TABLE `departamentos`
  ADD CONSTRAINT `departamentos_ibfk_1` FOREIGN KEY (`id_direccion`) REFERENCES `direcciones` (`id_direccion`);

--
-- Filtros para la tabla `incidencias`
--
ALTER TABLE `incidencias`
  ADD CONSTRAINT `incidencias_ibfk_1` FOREIGN KEY (`id_usuario_reporta`) REFERENCES `usuarios` (`id_usuario`),
  ADD CONSTRAINT `incidencias_ibfk_2` FOREIGN KEY (`id_usuario_tecnico`) REFERENCES `usuarios` (`id_usuario`),
  ADD CONSTRAINT `incidencias_ibfk_3` FOREIGN KEY (`id_inventario`) REFERENCES `inventario` (`id_inventario`),
  ADD CONSTRAINT `incidencias_ibfk_4` FOREIGN KEY (`id_tipo`) REFERENCES `tipos_incidencia` (`id_tipo`),
  ADD CONSTRAINT `incidencias_ibfk_5` FOREIGN KEY (`id_direccion`) REFERENCES `direcciones` (`id_direccion`),
  ADD CONSTRAINT `incidencias_ibfk_6` FOREIGN KEY (`id_departamento`) REFERENCES `departamentos` (`id_departamento`),
  ADD CONSTRAINT `incidencias_ibfk_7` FOREIGN KEY (`id_seccion`) REFERENCES `secciones` (`id_seccion`),
  ADD CONSTRAINT `incidencias_ibfk_8` FOREIGN KEY (`id_oficina`) REFERENCES `oficinas` (`id_oficina`);

--
-- Filtros para la tabla `inventario`
--
ALTER TABLE `inventario`
  ADD CONSTRAINT `inventario_ibfk_1` FOREIGN KEY (`id_tipo_bien`) REFERENCES `tipos_bien` (`id_tipo_bien`),
  ADD CONSTRAINT `inventario_ibfk_2` FOREIGN KEY (`id_direccion`) REFERENCES `direcciones` (`id_direccion`),
  ADD CONSTRAINT `inventario_ibfk_3` FOREIGN KEY (`id_departamento`) REFERENCES `departamentos` (`id_departamento`),
  ADD CONSTRAINT `inventario_ibfk_4` FOREIGN KEY (`id_seccion`) REFERENCES `secciones` (`id_seccion`),
  ADD CONSTRAINT `inventario_ibfk_5` FOREIGN KEY (`id_oficina`) REFERENCES `oficinas` (`id_oficina`);

--
-- Filtros para la tabla `movimientos_inventario`
--
ALTER TABLE `movimientos_inventario`
  ADD CONSTRAINT `movimientos_inventario_ibfk_1` FOREIGN KEY (`id_inventario`) REFERENCES `inventario` (`id_inventario`),
  ADD CONSTRAINT `movimientos_inventario_ibfk_10` FOREIGN KEY (`destino_seccion`) REFERENCES `secciones` (`id_seccion`),
  ADD CONSTRAINT `movimientos_inventario_ibfk_11` FOREIGN KEY (`destino_oficina`) REFERENCES `oficinas` (`id_oficina`),
  ADD CONSTRAINT `movimientos_inventario_ibfk_2` FOREIGN KEY (`id_inventario_nuevo`) REFERENCES `inventario` (`id_inventario`),
  ADD CONSTRAINT `movimientos_inventario_ibfk_3` FOREIGN KEY (`id_usuario_responsable`) REFERENCES `usuarios` (`id_usuario`),
  ADD CONSTRAINT `movimientos_inventario_ibfk_4` FOREIGN KEY (`origen_direccion`) REFERENCES `direcciones` (`id_direccion`),
  ADD CONSTRAINT `movimientos_inventario_ibfk_5` FOREIGN KEY (`origen_departamento`) REFERENCES `departamentos` (`id_departamento`),
  ADD CONSTRAINT `movimientos_inventario_ibfk_6` FOREIGN KEY (`origen_seccion`) REFERENCES `secciones` (`id_seccion`),
  ADD CONSTRAINT `movimientos_inventario_ibfk_7` FOREIGN KEY (`origen_oficina`) REFERENCES `oficinas` (`id_oficina`),
  ADD CONSTRAINT `movimientos_inventario_ibfk_8` FOREIGN KEY (`destino_direccion`) REFERENCES `direcciones` (`id_direccion`),
  ADD CONSTRAINT `movimientos_inventario_ibfk_9` FOREIGN KEY (`destino_departamento`) REFERENCES `departamentos` (`id_departamento`);

--
-- Filtros para la tabla `oficinas`
--
ALTER TABLE `oficinas`
  ADD CONSTRAINT `fk_oficina_departamento` FOREIGN KEY (`id_departamento`) REFERENCES `departamentos` (`id_departamento`),
  ADD CONSTRAINT `fk_oficina_direccion` FOREIGN KEY (`id_direccion`) REFERENCES `direcciones` (`id_direccion`),
  ADD CONSTRAINT `oficinas_ibfk_1` FOREIGN KEY (`id_seccion`) REFERENCES `secciones` (`id_seccion`);

--
-- Filtros para la tabla `registro_acciones`
--
ALTER TABLE `registro_acciones`
  ADD CONSTRAINT `registro_acciones_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Filtros para la tabla `secciones`
--
ALTER TABLE `secciones`
  ADD CONSTRAINT `secciones_ibfk_1` FOREIGN KEY (`id_departamento`) REFERENCES `departamentos` (`id_departamento`);

--
-- Filtros para la tabla `sesiones`
--
ALTER TABLE `sesiones`
  ADD CONSTRAINT `sesiones_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`);

--
-- Filtros para la tabla `usuario_asignacion`
--
ALTER TABLE `usuario_asignacion`
  ADD CONSTRAINT `usuario_asignacion_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`),
  ADD CONSTRAINT `usuario_asignacion_ibfk_2` FOREIGN KEY (`id_direccion`) REFERENCES `direcciones` (`id_direccion`),
  ADD CONSTRAINT `usuario_asignacion_ibfk_3` FOREIGN KEY (`id_departamento`) REFERENCES `departamentos` (`id_departamento`),
  ADD CONSTRAINT `usuario_asignacion_ibfk_4` FOREIGN KEY (`id_seccion`) REFERENCES `secciones` (`id_seccion`),
  ADD CONSTRAINT `usuario_asignacion_ibfk_5` FOREIGN KEY (`id_oficina`) REFERENCES `oficinas` (`id_oficina`);

--
-- Filtros para la tabla `usuario_roles`
--
ALTER TABLE `usuario_roles`
  ADD CONSTRAINT `usuario_roles_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`),
  ADD CONSTRAINT `usuario_roles_ibfk_2` FOREIGN KEY (`id_rol`) REFERENCES `roles` (`id_rol`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
