<?php
declare(strict_types=1);
require_once __DIR__ . '/../config/google.php';
require_once __DIR__ . '/../config/auth.php';
if (str_starts_with(GOOGLE_CLIENT_ID, 'YOUR_')) {
    $_SESSION['auth_error'] = 'Google sign-in has not been configured yet.';
    header('Location: ../login.php');
    exit;
}
$_SESSION['google_oauth_state'] = bin2hex(random_bytes(24));
$params = ['client_id' => GOOGLE_CLIENT_ID, 'redirect_uri' => GOOGLE_REDIRECT_URI, 'response_type' => 'code', 'scope' => 'openid email profile', 'state' => $_SESSION['google_oauth_state'], 'prompt' => 'select_account'];
header('Location: https://accounts.google.com/o/oauth2/v2/auth?' . http_build_query($params));
