<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';

header('Content-Type: application/json');

function ensure_chat_messages_table(): void
{
    // CoinRadar has no migration runner yet, so existing installations create
    // this table automatically the first time chat history is used.
    db()->exec(<<<'SQL'
        CREATE TABLE IF NOT EXISTS chat_messages (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            user_id BIGINT UNSIGNED NOT NULL,
            role ENUM('user', 'assistant') NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            KEY chat_user_created (user_id, created_at, id),
            CONSTRAINT fk_chat_message_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB
    SQL);
}

function recent_chat_messages(int $userId, int $limit = 40): array
{
    $limit = max(1, min($limit, 100));
    $statement = db()->prepare(
        'SELECT id, role, content, created_at
         FROM (
             SELECT id, role, content, created_at
             FROM chat_messages
             WHERE user_id = ?
             ORDER BY id DESC
             LIMIT ' . $limit . '
         ) AS recent_messages
         ORDER BY id ASC'
    );
    $statement->execute([$userId]);
    return $statement->fetchAll();
}

$user = current_user();
if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'Please sign in to use the AI companion.']);
    exit;
}

ensure_chat_messages_table();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode(['messages' => recent_chat_messages((int) $user['id'])]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
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

// Holdings and history come from the authenticated user's database records.
// The browser cannot select another user's portfolio or conversation context.
$statement = db()->prepare('SELECT symbol, amount FROM watchlist_items WHERE user_id = ? ORDER BY symbol');
$statement->execute([$user['id']]);
$message = trim($input['message']);
$history = recent_chat_messages((int) $user['id'], 20);

$insertMessage = db()->prepare('INSERT INTO chat_messages (user_id, role, content) VALUES (?, ?, ?)');
$insertMessage->execute([$user['id'], 'user', $message]);

$payload = [
    'message' => $message,
    'pageContext' => is_array($input['pageContext'] ?? null) ? $input['pageContext'] : [],
    'holdings' => $statement->fetchAll(),
    'history' => array_map(
        static fn(array $item): array => [
            'role' => $item['role'],
            'content' => $item['content'],
        ],
        $history
    ),
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

if ($status >= 200 && $status < 300) {
    $decodedResult = json_decode($result, true);
    $reply = is_array($decodedResult) ? $decodedResult['reply'] ?? null : null;
    if (is_string($reply) && trim($reply) !== '') {
        $insertMessage->execute([$user['id'], 'assistant', trim($reply)]);
    }
}

http_response_code($status ?: 502);
echo $result;
