<?php
/**
 * API para guardar los datos de campeonatos
 */

// Headers para permitir peticiones AJAX
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

// Verificar que sea una petición POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

// Obtener los datos enviados
$data = json_decode(file_get_contents('php://input'), true);

// Verificar que los datos sean válidos
if ($data === null) {
    http_response_code(400); // Bad Request
    echo json_encode(['error' => 'Datos JSON inválidos']);
    exit;
}

// Ruta al archivo JSON
$file_path = '../data/campeonatos_data.json';

// Guardar los datos en el archivo
$result = file_put_contents($file_path, json_encode($data, JSON_PRETTY_PRINT));

if ($result === false) {
    http_response_code(500); // Internal Server Error
    echo json_encode(['error' => 'Error al guardar los datos']);
    exit;
}

// Responder con éxito
http_response_code(200);
echo json_encode(['success' => true]); 