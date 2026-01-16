<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\SessionController;
use App\Http\Controllers\EspaciosController;
use App\Http\Controllers\RegistroEspaciosController;
use App\Http\Controllers\MovimientosController;
use App\Http\Controllers\ReportesController;
use App\Http\Controllers\UsuarioController;

// Ruta principal - Login
Route::get('/', function () {
    return view('welcome');
});

// Ruta de login (POST)  
Route::post('/login', [LoginController::class, 'login']);

// Ruta para administrador
Route::get('/administrador', function (Request $request) {
    // El token se verificará desde sessionStorage mediante JavaScript
    // No requerimos token en la URL para mayor seguridad
    return view('administrador');
});

// Ruta API para sesiones (compatible con sesion.php)
Route::match(['get', 'post'], '/config/sesion.php', [SessionController::class, 'handle']);

// Rutas API para gestión de espacios (compatible con Gestionespacios.php)
Route::post('/config/Gestionespacios.php', [EspaciosController::class, 'handle']);

// Rutas API para registro de espacios (compatible con Registroespacios.php)
Route::post('/config/Registroespacios.php', [RegistroEspaciosController::class, 'handle']);

// Rutas API para movimientos de inventario (compatible con Movimientos.php)
Route::post('/config/Movimientos.php', [MovimientosController::class, 'handle']);

// Rutas API para reportes e incidencias (compatible con Reportes.php)
Route::post('/config/Reportes.php', [ReportesController::class, 'handle']);

// Rutas API para usuario (perfil, contraseña) (compatible con Usuario.php)
Route::post('/config/Usuario.php', [UsuarioController::class, 'handle']);

// Ruta para inventario
Route::get('/inventario', function (Request $request) {
    // El token se verificará desde sessionStorage mediante JavaScript
    return view('inventario');
});

// Ruta para informática
Route::get('/informatica', function (Request $request) {
    // El token se verificará desde sessionStorage mediante JavaScript
    return view('informatica');
});

// Ruta para usuario municipal
Route::get('/municipal', function (Request $request) {
    // El token se verificará desde sessionStorage mediante JavaScript
    return view('municipal');
});

// Ruta para electricidad
Route::get('/electricidad', function (Request $request) {
    // El token se verificará desde sessionStorage mediante JavaScript
    return view('electricidad');
});

// Ruta para técnico general
Route::get('/tecgeneral', function (Request $request) {
    // El token se verificará desde sessionStorage mediante JavaScript
    return view('tecgeneral');
});
