<?php
declare(strict_types=1);

require __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$allowedKeys = ['users', 'pets', 'appointments', 'medicalRecords', 'clinicReminders'];
$key = $_GET['key'] ?? '';

if (!in_array($key, $allowedKeys, true)) {
    http_response_code(400);
    echo json_encode(['error' => 'Unknown store key'], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $stmt = db()->prepare('SELECT value_json FROM app_store WHERE store_key = ?');
        $stmt->execute([$key]);
        $row = $stmt->fetch();
        echo json_encode(['key' => $key, 'value' => $row['value_json'] ?? null], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        $payload = json_decode(file_get_contents('php://input') ?: '{}', true);
        if (!is_array($payload) || !array_key_exists('value', $payload) || !is_string($payload['value'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Expected JSON body with string value'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $stmt = db()->prepare(
            'INSERT INTO app_store (store_key, value_json)
             VALUES (?, ?)
             ON DUPLICATE KEY UPDATE value_json = VALUES(value_json), updated_at = CURRENT_TIMESTAMP'
        );
        $stmt->execute([$key, $payload['value']]);
        echo json_encode(['ok' => true], JSON_UNESCAPED_UNICODE);
        exit;
    }

    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed'], JSON_UNESCAPED_UNICODE);
} catch (Throwable $error) {
    http_response_code(500);
    echo json_encode(['error' => $error->getMessage()], JSON_UNESCAPED_UNICODE);
}
