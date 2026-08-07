<?php
declare(strict_types=1);
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !hash_equals($_SESSION['csrf_token'] ?? '', $_POST['csrf_token'] ?? '')) {
    http_response_code(400);
    exit('Invalid request.');
}
$stmt = db()->prepare('SELECT id, name, email, password_hash FROM users WHERE email = ?');
$stmt->execute([strtolower(trim($_POST['email'] ?? ''))]);
$user = $stmt->fetch();
if (!$user || !$user['password_hash'] || !password_verify($_POST['password'] ?? '', $user['password_hash'])) {
    $_SESSION['auth_error'] = 'Email or password is incorrect.';
    header('Location: ../login.php');
    exit;
}
session_regenerate_id(true);
$_SESSION['user'] = ['id' => (int) $user['id'], 'name' => $user['name'], 'email' => $user['email']];
header('Location: ../index.php');
