<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';

header('Content-Type: application/json');
header('Cache-Control: no-store');

function drawing_error(int $status, string $message): never
{
    http_response_code($status);
    echo json_encode(['error' => $message]);
    exit;
}

$user = current_user();
if (!$user) {
    drawing_error(401, 'Sign in to save your drawings.');
}
// An old tab must not save its drawings into a different account after login changes.
if (($_SERVER['HTTP_X_DRAWING_USER'] ?? '') !== (string) $user['id']) {
    drawing_error(403, 'Your account changed. Reload the page before using drawings.');
}

$method = $_SERVER['REQUEST_METHOD'];
if (!in_array($method, ['GET', 'POST'], true)) {
    header('Allow: GET, POST');
    drawing_error(405, 'Method not allowed.');
}

$input = [];
if ($method === 'POST') {
    $token = $_SESSION['csrf_token'] ?? '';
    if ($token === '' || !hash_equals($token, $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '')) {
        drawing_error(403, 'Your session changed. Reload the page before saving.');
    }
    $body = file_get_contents('php://input', false, null, 0, 60001);
    if (strlen($body) > 60000) {
        drawing_error(413, 'Too many drawings to save.');
    }
    $decoded = json_decode($body);
    if (!is_object($decoded) || !is_array($decoded->drawings ?? null)) {
        drawing_error(400, 'Invalid drawing data.');
    }
    $input = json_decode($body, true);
}

$symbol = $method === 'GET' ? ($_GET['symbol'] ?? null) : ($input['symbol'] ?? null);
if (!is_string($symbol) || !preg_match('/^[A-Z0-9]{3,30}$/D', $symbol)) {
    drawing_error(400, 'Invalid coin symbol.');
}

$drawings = [];
if ($method === 'POST') {
    $submitted = $input['drawings'] ?? null;
    if (!is_array($submitted) || !array_is_list($submitted) || count($submitted) > 200) {
        drawing_error(400, 'A maximum of 200 drawings can be saved per coin.');
    }
    $pointCounts = ['straightLine' => 2, 'horizontalStraightLine' => 1,
        'verticalStraightLine' => 1, 'rectangle' => 2, 'fibonacciLine' => 2];
    $ids = [];
    foreach ($submitted as $drawing) {
        if (!is_array($drawing) || !is_string($drawing['id'] ?? null)
            || !preg_match('/^[A-Za-z0-9_-]{1,100}$/D', $drawing['id'])
            || isset($ids[$drawing['id']]) || !is_string($drawing['name'] ?? null)
            || !isset($pointCounts[$drawing['name']]) || !is_array($drawing['points'] ?? null)
            || !array_is_list($drawing['points'])
            || count($drawing['points']) !== $pointCounts[$drawing['name']]) {
            drawing_error(400, 'Invalid drawing.');
        }
        $ids[$drawing['id']] = true;
        $points = [];
        foreach ($drawing['points'] as $point) {
            if (!is_array($point)) {
                drawing_error(400, 'Invalid drawing point.');
            }
            foreach (['timestamp', 'value'] as $field) {
                if ((!is_int($point[$field] ?? null) && !is_float($point[$field] ?? null))
                    || !is_finite((float) $point[$field])) {
                    drawing_error(400, 'Invalid drawing point.');
                }
            }
            $points[] = ['timestamp' => $point['timestamp'], 'value' => $point['value']];
        }
        $drawings[] = ['id' => $drawing['id'], 'name' => $drawing['name'], 'points' => $points];
    }
}

try {
    $pdo = db();
    // Like chat history, create the table for existing installs without a migration runner.
    $pdo->exec(<<<'SQL'
        CREATE TABLE IF NOT EXISTS chart_drawings (
            user_id BIGINT UNSIGNED NOT NULL,
            symbol VARCHAR(30) NOT NULL,
            drawings_json MEDIUMTEXT NOT NULL,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, symbol),
            CONSTRAINT fk_chart_drawings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB
    SQL);

    if ($method === 'GET') {
        $statement = $pdo->prepare('SELECT drawings_json FROM chart_drawings WHERE user_id = ? AND symbol = ?');
        $statement->execute([$user['id'], $symbol]);
        $json = $statement->fetchColumn();
        echo json_encode(['drawings' => $json === false ? [] : json_decode($json, true, 512, JSON_THROW_ON_ERROR)]);
    } else {
        $statement = $pdo->prepare('INSERT INTO chart_drawings (user_id, symbol, drawings_json) VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE drawings_json = VALUES(drawings_json)');
        $statement->execute([$user['id'], $symbol, json_encode($drawings, JSON_THROW_ON_ERROR)]);
        echo json_encode(['ok' => true]);
    }
} catch (Throwable $error) {
    error_log('Drawing storage: ' . $error->getMessage());
    drawing_error(503, 'Drawing storage is unavailable. Please try again.');
}
