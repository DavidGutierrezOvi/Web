<?php
/**
 * API para guardar los datos de categorías
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if ($data === null) {
    http_response_code(400);
    echo json_encode([
        'error' => 'Datos JSON inválidos',
        'details' => json_last_error_msg()
    ]);
    exit;
}

if (!isset($data['categorias']) || !is_array($data['categorias'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Falta la lista de categorías']);
    exit;
}

$file_path = __DIR__ . '/../data/categorias.json';
$dir_path = dirname($file_path);

if (!is_dir($dir_path) && !mkdir($dir_path, 0755, true)) {
    http_response_code(500);
    echo json_encode(['error' => 'No se pudo crear el directorio data']);
    exit;
}

if (file_exists($file_path) && !is_writable($file_path)) {
    http_response_code(500);
    echo json_encode(['error' => 'El archivo no tiene permisos de escritura']);
    exit;
}

try {
    $json_data = json_encode(['categorias' => $data['categorias']], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    if ($json_data === false) {
        throw new Exception('Error al codificar JSON: ' . json_last_error_msg());
    }

    $result = file_put_contents($file_path, $json_data);
    if ($result === false) {
        throw new Exception('Error al escribir en el archivo');
    }

    http_response_code(200);
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Error al guardar los datos',
        'details' => $e->getMessage()
    ]);
}
