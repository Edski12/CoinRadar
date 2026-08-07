<?php
declare(strict_types=1);
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/google.php';
require_once __DIR__ . '/../config/auth.php';
if (!isset($_GET['state'], $_SESSION['google_oauth_state']) || !hash_equals($_SESSION['google_oauth_state'], (string) $_GET['state']) || empty($_GET['code'])) {
    http_response_code(400);
    exit('Invalid Google sign-in response.');
}
unset($_SESSION['google_oauth_state']);
$ch = curl_init('https://oauth2.googleapis.com/token');
curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_RETURNTRANSFER => true, CURLOPT_POSTFIELDS => http_build_query(['code' => $_GET['code'], 'client_id' => GOOGLE_CLIENT_ID, 'client_secret' => GOOGLE_CLIENT_SECRET, 'redirect_uri' => GOOGLE_REDIRECT_URI, 'grant_type' => 'authorization_code'])]);
$token = json_decode(curl_exec($ch) ?: '', true);
curl_close($ch);
if (empty($token['access_token'])) {
    $_SESSION['auth_error'] = 'Google sign-in could not be completed.';
    header('Location: ../login.php');
    exit;
}
$profile = json_decode(file_get_contents('https://openidconnect.googleapis.com/v1/userinfo', false, stream_context_create(['http' => ['header' => 'Authorization: Bearer ' . $token['access_token']]])) ?: '', true);
if (empty($profile['sub']) || empty($profile['email']) || empty($profile['email_verified'])) {
    $_SESSION['auth_error'] = 'Google did not return a verified email address.';
    header('Location: ../login.php');
    exit;
}
$pdo = db();
$find = $pdo->prepare('SELECT id, name, email FROM users WHERE google_id = ? OR email = ? LIMIT 1');
$find->execute([$profile['sub'], $profile['email']]);
$user = $find->fetch();
if ($user) {
    $pdo->prepare('UPDATE users SET google_id = ?, avatar_url = ? WHERE id = ?')->execute([$profile['sub'], $profile['picture'] ?? null, $user['id']]);
} else {
    $pdo->prepare('INSERT INTO users (name, email, google_id, avatar_url) VALUES (?, ?, ?, ?)')->execute([$profile['name'] ?? $profile['email'], $profile['email'], $profile['sub'], $profile['picture'] ?? null]);
    $user = ['id' => $pdo->lastInsertId(), 'name' => $profile['name'] ?? $profile['email'], 'email' => $profile['email']];
}
session_regenerate_id(true);
$_SESSION['user'] = ['id' => (int) $user['id'], 'name' => $user['name'], 'email' => $user['email']];
header('Location: ../index.php');
