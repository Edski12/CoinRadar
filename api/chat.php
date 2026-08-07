<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

if (!current_user()) {
    http_response_code(401);
    echo json_encode(['error' => 'Please sign in to use the AI companion.']);
    exit;
}

if (!hash_equals($_SESSION['csrf_token'] ?? '', $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '')) {
    http_response_code(403);
    echo json_encode(['error' => 'Invalid request token.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input) || !is_string($input['message'] ?? null) || trim($input['message']) === '') {
    http_response_code(400);
    echo json_encode(['error' => 'A message is required.']);
    exit;
}

// Holdings are intentionally read here, from the logged-in user's database rows.
// The browser is never allowed to choose the portfolio passed to the AI service.
$statement = db()->prepare('SELECT symbol, amount FROM watchlist_items WHERE user_id = ? ORDER BY symbol');
$statement->execute([current_user()['id']]);
$payload = [
    'message' => trim($input['message']),
    'pageContext' => is_array($input['pageContext'] ?? null) ? $input['pageContext'] : [],
    'holdings' => $statement->fetchAll(),
];

$aiUrl = rtrim(getenv('COINRADAR_AI_URL') ?: 'http://127.0.0.1:3000', '/') . '/chat';
// Local Ollama can take longer than a typical web API, especially on its first request.
$aiTimeout = max(60, (int) (getenv('COINRADAR_AI_TIMEOUT_SECONDS') ?: 120));
$curl = curl_init($aiUrl);
curl_setopt_array($curl, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CONNECTTIMEOUT => 5,
    CURLOPT_TIMEOUT => $aiTimeout,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_POSTFIELDS => json_encode($payload, JSON_THROW_ON_ERROR),
]);
$result = curl_exec($curl);
$status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
$error = curl_error($curl);
curl_close($curl);

if ($result === false) {
    http_response_code(502);
    echo json_encode(['error' => 'AI service is unavailable: ' . $error]);
    exit;
}

http_response_code($status ?: 502);
echo $result;
