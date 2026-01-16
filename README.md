# 🏛️ **Sistema de Gestión de Inventario Municipal** 🏛️

¡Bienvenido al Sistema de Gestión de Inventario Municipal! 🚀
Esta plataforma web permite administrar y gestionar el inventario de espacios físicos de forma eficiente en una municipalidad, integrando control de usuarios, gestión de espacios, movimientos de inventario y reportes 📋.
Está diseñada para municipalidades e instituciones públicas que necesitan una gestión centralizada y ordenada de su inventario y espacios 🔥

---

**Paso1:** Seleccionar el directorio donde se encuentran los videos.

<img width="1916" height="693" alt="inventario1" src="https://github.com/user-attachments/assets/33dbad13-9975-4474-8346-03c73039cb0f" />



**Paso2:** Seleccionar un video que se encuentre dentro del directorio.

<img width="1915" height="603" alt="inventario2" src="https://github.com/user-attachments/assets/7f0e8cc0-06e3-49ba-8f54-919d21a8de81" />



**Paso3:** Descaragr el video seleccionado.


<img width="1918" height="572" alt="inventario3 " src="https://github.com/user-attachments/assets/1bade91a-0231-4fd4-870e-81d30ad5aaa4" />






---

## 📜 **Descripción General**

Sistema de Gestión de Inventario Municipal es una aplicación web desarrollada con Laravel 12 y PHP 8.2+, orientada a la administración integral de inventarios y espacios físicos de una municipalidad.
Permite gestionar espacios, controlar movimientos de inventario, generar reportes, administrar usuarios según roles (administradores, técnicos, inventario, informática, electricidad, municipal) y mantener un registro detallado de todos los activos 📊.

---

## ✨ **Características Principales**

1.Autenticación y control de roles (Administrador, Inventario, Informática, Municipal, Electricidad, Técnico General)

2.Gestión completa de espacios físicos

3.Control de movimientos de inventario

4.Generación de reportes e incidencias

5.Registro y seguimiento de activos

6.Diagnóstico de espacios

7.Gestión de usuarios y perfiles

---

## 🛠️ **Requisitos del Sistema**

1.Antes de comenzar, asegúrate de contar con lo siguiente:
2.XAMPP 7.4 o superior
3.PHP 8.2 o superior
4.MySQL / MariaDB
5.Composer (gestor de dependencias de PHP)
6.Laravel Framework (se instala automáticamente con Composer)

---

# 📥 **Instalación**

## 🔧 **PASO 1: Instalar XAMPP**

1.Descargar e instalar XAMPP desde: https://www.apachefriends.org/
2.Asegúrate de que Apache y MySQL estén incluidos en la instalación
3.Instalar XAMPP en la ubicación por defecto (generalmente `C:\xampp`)

**Nota:** XAMPP incluye PHP, Apache y MySQL, por lo que no necesitas instalarlos por separado.

## 🔧 **PASO 2: Verificar Instalación de PHP**

1.Abre PowerShell o CMD y ejecuta:
   php -v
2.Deberías ver la versión de PHP instalada (debe ser 8.2 o superior)

**Si PHP no está en el PATH:**
- Usa la ruta completa: `C:\xampp\php\php.exe -v`
- O agrega `C:\xampp\php` al PATH del sistema

## 🔧 **PASO 3: Instalar Composer**

1.Descargar Composer desde: https://getcomposer.org/download/
2.Seguir las instrucciones del instalador
3.Durante la instalación, Composer detectará automáticamente tu instalación de PHP en XAMPP
4.Si no la detecta, apunta a: `C:\xampp\php\php.exe`

**Verificar instalación:**
1.Abre PowerShell o CMD y ejecuta:
   composer --version
2.Deberías ver la versión de Composer instalada

**Solución de problemas:**
- Si Composer no se encuentra, agrega la ruta de Composer al PATH del sistema
- O usa la ruta completa del ejecutable de Composer

## 🔧 **PASO 4: Instalar Laravel Framework**

**Nota importante:** Laravel NO necesita instalarse por separado. El framework se instalará automáticamente cuando ejecutes `composer install` en el proyecto, ya que está definido como dependencia en el archivo `composer.json`.

**El archivo `composer.json` del proyecto ya incluye:**
```json
"require": {
    "php": "^8.2",
    "laravel/framework": "^12.0",
    "laravel/tinker": "^2.10.1"
}
```

Esto significa que al ejecutar `composer install`, Laravel se instalará automáticamente.

## 📂 **PASO 5: Preparar el Proyecto**

1.Verifica que el proyecto esté en la carpeta de XAMPP:
C:\xampp\htdocs\ProyectoMuncipalidad\municipalidad

2.Asegúrate de tener la estructura correcta:
- app/ (controladores, modelos, servicios)
- public/ (archivos públicos, CSS, JS)
- resources/ (vistas Blade)
- routes/ (rutas de la aplicación)

## ▶️ **PASO 6: Instalar Dependencias del Proyecto**

1.Abre PowerShell o CMD como administrador

2.Navega al directorio del proyecto:
   cd C:\xampp\htdocs\ProyectoMuncipalidad\municipalidad

3.Ejecuta Composer para instalar todas las dependencias:
   composer install

**Nota:** Si PHP no está en el PATH, usa:
   C:\xampp\php\php.exe C:\ruta\a\composer.phar install

O si Composer está instalado globalmente:
   C:\xampp\php\php.exe composer install

**¿Qué se instala?**
- Laravel Framework 12.0
- Laravel Tinker
- Todas las dependencias de PHP necesarias
- Librerías adicionales del proyecto

**Tiempo estimado:** 5-15 minutos dependiendo de tu conexión a internet.

## ▶️ **PASO 7: Iniciar Servicios**

Desde el Panel de Control de XAMPP, inicia:

1.Apache

2.MySQL

Asegúrate de que ambos servicios estén en verde (corriendo).

## 🚀 **PASO 8: Acceder a la Aplicación**

1.Asegúrate de que Apache y MySQL estén ejecutándose en XAMPP (ambos en verde)

2.Abre el navegador web y accede a:
http://localhost/municipalidad/public/

3.Deberías ver la página de login del sistema

**¡Listo! El sistema está instalado y funcionando.**

---

## 🗄️ **Configuración de Base de Datos**

1.Ubica el archivo SQL de la base de datos:

    1.1 inventario.sql
  
2.Accede a phpMyAdmin:

    2.1 http://localhost/phpmyadmin
  
3.Crea una nueva base de datos:

    3.1 Nombre: inventario
    3.2 Intercalación: utf8mb4_general_ci (o utf8mb4_unicode_ci)

4.Importa la base de datos:

    4.1 Selecciona la base de datos inventario
  
5.Ve a la pestaña Importar

    5.1 Selecciona el archivo inventario.sql
  
Ejecuta la importación

###  🔁 ***Alternativamente, puedes importar desde consola:**
mysql -u root -p inventario < inventario.sql
📌 El archivo inventario.sql contiene la estructura completa con todas las tablas necesarias y los datos iniciales para el correcto funcionamiento del sistema.

### ⚙️ **Configuración de Base de Datos en el Código**

**⚠️ IMPORTANTE:** Debes verificar y configurar la conexión a la base de datos en el código.

**Archivo a modificar:**
- `app/Services/DatabaseService.php`

**Configuración:**
```php
private static array $config = [
    'host' => 'localhost',
    'user' => 'root',
    'password' => '',  // Cambiar si tu MySQL tiene contraseña
    'database' => 'inventario'  // Debe ser 'inventario' (sin 's')
];
```

**Pasos para configurar:**

1. **Abre el archivo:**
   - `C:\xampp\htdocs\ProyectoMuncipalidad\municipalidad\app\Services\DatabaseService.php`

2. **Verifica la configuración:**
   - Si tu instalación de XAMPP tiene contraseña para MySQL, actualiza el campo `'password'`
   - El nombre de la base de datos debe ser exactamente `'inventario'` (sin 's' al final)

3. **Guarda los cambios**

**Nota:** Si cambias la contraseña de MySQL en XAMPP después, debes actualizar este archivo.

---

##  🌐 **Acceso a la Aplicación**

### **URL Base:**
1.Abre el sistema desde tu navegador:
http://localhost/municipalidad/public/

### **Rutas Principales:**

- **Login**: http://localhost/municipalidad/public/
- **Administrador**: http://localhost/municipalidad/public/administrador
- **Inventario**: http://localhost/municipalidad/public/inventario
- **Informática**: http://localhost/municipalidad/public/informatica
- **Municipal**: http://localhost/municipalidad/public/municipal
- **Electricidad**: http://localhost/municipalidad/public/electricidad
- **Técnico General**: http://localhost/municipalidad/public/tecgeneral

### **Rutas API:**

- `/config/sesion.php` - Gestión de sesiones
- `/config/Gestionespacios.php` - Gestión de espacios
- `/config/Registroespacios.php` - Registro de espacios
- `/config/Movimientos.php` - Movimientos de inventario
- `/config/Reportes.php` - Reportes e incidencias
- `/config/Usuario.php` - Gestión de usuarios

---

##  👥 **Roles del Sistema**

### 👑 **Administrador**
1.Control total del sistema

2.Gestión de usuarios y configuraciones generales

3.Gestión completa de espacios y movimientos

4.Acceso a todos los reportes y estadísticas

5.Administración de inventario completo

### 📦 **Inventario**
1.Gestión de espacios y activos

2.Control de movimientos de inventario

3.Registro y seguimiento de activos

4.Generación de reportes de inventario

### 💻 **Informática**
1.Gestión de espacios asignados

2.Control de movimientos relacionados con informática

3.Seguimiento de activos de tecnología

4.Visualización de reportes del área

### 🏛️ **Municipal**
1.Gestión de espacios municipales

2.Control de movimientos del área municipal

3.Seguimiento de activos municipales

4.Visualización de reportes municipales

### ⚡ **Electricidad**
1.Gestión de espacios relacionados con electricidad

2.Control de movimientos del área eléctrica

3.Seguimiento de activos eléctricos

4.Visualización de reportes eléctricos

### 🔧 **Técnico General**
1.Gestión de espacios técnicos

2.Control de movimientos generales

3.Seguimiento de activos técnicos

4.Visualización de reportes técnicos

---

##  🔑 **Usuarios de Prueba**

**Nota:** Estos usuarios deben estar creados en la base de datos con sus respectivas contraseñas. Se crean automáticamente al importar el archivo `inventario.sql`.

###  👑 **Administrador**
    1. Usuario: admin
    2. Contraseña: admin123

### 📦 **Inventario**
    1. Usuario: inventario
    2. Contraseña: inventario123

### 💻 **Informática**
    1. Usuario: informatica
    2. Contraseña: informatica123

### 🏛️ **Municipal**
    1. Usuario: municipal
    2. Contraseña: municipal123

### ⚡ **Electricidad**
    1. Usuario: electrico
    2. Contraseña: electrico123

### 🔧 **Técnico General**
    1. Usuario: tecnico
    2. Contraseña: tecnico123

---

##  🗂️ ** Estructura del Proyecto **

```
ProyectoMuncipalidad/
├── municipalidad/
│   ├── app/                    Lógica de la aplicación
│   │   ├── Http/Controllers/   Controladores de la API
│   │   │   ├── Auth/          Controladores de autenticación
│   │   │   │   ├── LoginController.php
│   │   │   │   └── SessionController.php
│   │   │   ├── EspaciosController.php      Gestión de espacios
│   │   │   ├── RegistroEspaciosController.php  Registro de espacios
│   │   │   ├── MovimientosController.php   Movimientos de inventario
│   │   │   ├── ReportesController.php      Reportes e incidencias
│   │   │   └── UsuarioController.php       Gestión de usuarios
│   │   ├── Models/             Modelos de datos
│   │   │   └── User.php
│   │   └── Services/           Servicios
│   │       └── DatabaseService.php  Conexión a BD
│   │
│   ├── config/                 Archivos de configuración
│   │   ├── app.php
│   │   └── cache.php
│   │
│   ├── database/               Base de datos
│   │   ├── database.sqlite
│   │   ├── migrations/         Migraciones (si las hay)
│   │   └── seeders/            Seeders
│   │
│   ├── public/                 Archivos públicos
│   │   ├── css/                Hojas de estilo
│   │   │   ├── administrador.css
│   │   │   ├── electricidad.css
│   │   │   ├── informatica.css
│   │   │   ├── inventario.css
│   │   │   ├── municipal.css
│   │   │   └── tecgeneral.css
│   │   ├── js/                 Archivos JavaScript
│   │   │   ├── administrador.js
│   │   │   ├── electricidad.js
│   │   │   ├── informatica.js
│   │   │   ├── inventario.js
│   │   │   ├── municipal.js
│   │   │   └── tecgeneral.js
│   │   ├── images/             Imágenes del sistema
│   │   ├── diagnostico_espacios.php
│   │   └── index.php           Punto de entrada
│   │
│   ├── resources/              Recursos de la aplicación
│   │   ├── views/              Plantillas Blade
│   │   │   ├── welcome.blade.php       Login
│   │   │   ├── administrador.blade.php Panel administrador
│   │   │   ├── inventario.blade.php    Panel inventario
│   │   │   ├── informatica.blade.php   Panel informática
│   │   │   ├── municipal.blade.php     Panel municipal
│   │   │   ├── electricidad.blade.php  Panel electricidad
│   │   │   └── tecgeneral.blade.php    Panel técnico general
│   │   ├── css/
│   │   └── js/
│   │
│   ├── routes/                 Rutas de la aplicación
│   │   └── web.php             Rutas web
│   │
│   ├── storage/                Archivos de almacenamiento
│   │   ├── app/
│   │   ├── framework/          Cache, sesiones, vistas
│   │   └── logs/               Logs de Laravel
│   │
│   ├── vendor/                 Dependencias de Composer
│   │
│   ├── composer.json           Configuración de Composer
│   ├── package.json            Configuración de npm
│   ├── artisan                 CLI de Laravel
│   └── vite.config.js          Configuración de Vite
│
└── README_MUNICIPALIDAD.md     Este archivo
```

---

## 🔐 **Seguridad**

- **Autenticación**: Sistema de login con validación de usuarios
- **Sesiones**: Gestión de sesiones mediante tokens
- **Roles**: Control de acceso basado en roles de usuario
- **Validación**: Validación de datos en todas las operaciones
- **Base de Datos**: Consultas preparadas para prevenir inyección SQL

---

## 📱 **Funcionalidades por Rol**

### 👑 **Administrador**
- ✅ Gestión completa de espacios
- ✅ Control total de movimientos
- ✅ Gestión de usuarios
- ✅ Acceso a todos los reportes
- ✅ Administración de inventario
- ✅ Diagnóstico de espacios
- ✅ Configuración del sistema

### 📦 **Inventario**
- ✅ Gestión de espacios
- ✅ Control de movimientos de inventario
- ✅ Registro de activos
- ✅ Generación de reportes
- ✅ Seguimiento de inventario
- ❌ Gestión de usuarios
- ❌ Configuración del sistema

### 💻 **Informática**
- ✅ Gestión de espacios asignados
- ✅ Control de movimientos del área
- ✅ Seguimiento de activos tecnológicos
- ✅ Visualización de reportes
- ✅ Historial de movimientos
- ❌ Gestión de otros usuarios
- ❌ Configuración global

### 🏛️ **Municipal**
- ✅ Gestión de espacios municipales
- ✅ Control de movimientos municipales
- ✅ Seguimiento de activos municipales
- ✅ Visualización de reportes
- ❌ Gestión de usuarios
- ❌ Configuración del sistema

### ⚡ **Electricidad**
- ✅ Gestión de espacios eléctricos
- ✅ Control de movimientos del área eléctrica
- ✅ Seguimiento de activos eléctricos
- ✅ Visualización de reportes
- ❌ Gestión de usuarios
- ❌ Configuración del sistema

### 🔧 **Técnico General**
- ✅ Gestión de espacios técnicos
- ✅ Control de movimientos generales
- ✅ Seguimiento de activos técnicos
- ✅ Visualización de reportes
- ❌ Gestión de usuarios
- ❌ Configuración del sistema

**Leyenda:**
- ✅ Disponible
- ❌ No disponible

---

## 🚧 **Funcionalidades del Sistema**

- **Gestión de Espacios**: Registro, edición, eliminación y consulta de espacios físicos
- **Movimientos de Inventario**: Control de entradas, salidas y transferencias de activos
- **Reportes e Incidencias**: Generación de reportes y registro de incidencias
- **Diagnóstico de Espacios**: Análisis y diagnóstico de espacios físicos
- **Gestión de Usuarios**: Administración de usuarios y perfiles (solo administrador)
- **Seguimiento de Activos**: Historial completo de movimientos y cambios

---

## 📞 **Soporte**

Para problemas técnicos o consultas sobre la instalación:

1. Revisa los logs de Laravel: `storage/logs/laravel.log`
2. Revisa los logs de Apache en XAMPP
3. Revisa la consola del navegador (F12) para errores de JavaScript
4. Verifica la configuración de la base de datos en `app/Services/DatabaseService.php`

---

## 🛠️ **Tecnologías Utilizadas**

- **Backend**: Laravel 12, PHP 8.2+
- **Base de Datos**: MySQL/MariaDB
- **Frontend**: Blade Templates, JavaScript, CSS
- **Servidor**: Apache (XAMPP)
- **Gestor de Dependencias**: Composer
- **Build Tool**: Vite

---

## 📝 **Notas Importantes**

1. Asegúrate de que Apache y MySQL estén corriendo antes de acceder al sistema
2. El nombre de la base de datos debe ser exactamente `inventario` (sin 's' al final)
3. Verifica la configuración de la base de datos en `app/Services/DatabaseService.php`
4. Si cambias la contraseña de MySQL en XAMPP, actualiza el archivo `DatabaseService.php`
5. Los archivos JavaScript y CSS están en `public/js/` y `public/css/` respectivamente
6. Las imágenes del sistema están en `public/images/`
7. El sistema utiliza sesiones almacenadas en `sessionStorage` del navegador
8. Asegúrate de importar completamente el archivo `inventario.sql` antes de usar el sistema


