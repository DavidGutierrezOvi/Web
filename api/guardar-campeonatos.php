<?php
/**
 * API para guardar los datos de campeonatos
 */

// Headers para permitir peticiones AJAX y CORS
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Manejar la solicitud OPTIONS para CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Verificar que sea una petición POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

// Obtener los datos enviados
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Verificar que los datos sean válidos
if ($data === null) {
    http_response_code(400); // Bad Request
    echo json_encode([
        'error' => 'Datos JSON inválidos',
        'details' => json_last_error_msg()
    ]);
    exit;
}

// Ruta al archivo JSON
$file_path = __DIR__ . '/../data/campeonatos_data.json';

// Verificar si el directorio data existe
$dir_path = dirname($file_path);
if (!is_dir($dir_path)) {
    if (!mkdir($dir_path, 0755, true)) {
        http_response_code(500);
        echo json_encode(['error' => 'No se pudo crear el directorio data']);
        exit;
    }
}

// Verificar permisos de escritura
if (file_exists($file_path) && !is_writable($file_path)) {
    http_response_code(500);
    echo json_encode(['error' => 'El archivo no tiene permisos de escritura']);
    exit;
}

// Intentar guardar los datos en el archivo
try {
    $json_data = json_encode($data, JSON_PRETTY_PRINT);
    if ($json_data === false) {
        throw new Exception('Error al codificar JSON: ' . json_last_error_msg());
    }
    
    $result = file_put_contents($file_path, $json_data);
    if ($result === false) {
        throw new Exception('Error al escribir en el archivo');
    }
    
    // Responder con éxito
    http_response_code(200);
    echo json_encode(['success' => true]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Error al guardar los datos',
        'details' => $e->getMessage()
    ]);
} 