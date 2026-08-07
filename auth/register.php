<?php
declare(strict_types=1);
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !hash_equals($_SESSION['csrf_token'] ?? '', $_POST['csrf_token'] ?? '')) {
    http_response_code(400);
    exit('Invalid request.');
}
$name = trim($_POST['name'] ?? '');
$email = filter_var(trim($_POST['email'] ?? ''), FILTER_VALIDATE_EMAIL);
$password = $_POST['password'] ?? '';
if (!$name || !$email || strlen($password) < 8) {
    $_SESSION['auth_error'] = 'Enter a name, a valid email, and a password of at least 8 characters.';
    header('Location: ../signup.php');
    exit;
}
try {
    $stmt = db()->prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)');
    $stmt->execute([$name, $email, password_hash($password, PASSWORD_DEFAULT)]);
    $_SESSION['user'] = ['id' => (int) db()->lastInsertId(), 'name' => $name, 'email' => $email];
    header('Location: ../index.php');
} catch (PDOException $e) {
    $_SESSION['auth_error'] = 'An account with that email already exists.';
    header('Location: ../signup.php');
}
