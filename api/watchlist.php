<?php
declare(strict_types=1);
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';
header('Content-Type: application/json');
if (!current_user()) {
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required']);
    exit;
}
$userId = current_user()['id'];
$pdo = db();
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $s = $pdo->prepare('SELECT symbol, amount FROM watchlist_items WHERE user_id = ? ORDER BY symbol');
    $s->execute([$userId]);
    echo json_encode($s->fetchAll());
    exit;
}
$data = json_decode(file_get_contents('php://input'), true) ?: [];
if ($_SERVER['REQUEST_METHOD'] === 'POST' && preg_match('/^[A-Z0-9]{3,30}$/', $data['symbol'] ?? '') && is_numeric($data['amount'] ?? null) && $data['amount'] >= 0) {
    $s = $pdo->prepare('INSERT INTO watchlist_items (user_id, symbol, amount) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE amount = VALUES(amount)');
    $s->execute([$userId, $data['symbol'], $data['amount']]);
    echo json_encode(['ok' => true]);
    exit;
}
if ($_SERVER['REQUEST_METHOD'] === 'DELETE' && preg_match('/^[A-Z0-9]{3,30}$/', $data['symbol'] ?? '')) {
    $s = $pdo->prepare('DELETE FROM watchlist_items WHERE user_id = ? AND symbol = ?');
    $s->execute([$userId, $data['symbol']]);
    echo json_encode(['ok' => true]);
    exit;
}
http_response_code(400);
echo json_encode(['error' => 'Invalid request']);
