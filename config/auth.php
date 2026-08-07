<?php
declare(strict_types=1);
session_start();
function current_user(): ?array
{
    return $_SESSION['user'] ?? null;
}
function require_login(): void
{
    if (!current_user()) {
        header('Location: ' . (str_contains($_SERVER['PHP_SELF'], '/pages/') ? '../login.php' : 'login.php'));
        exit;
    }
}
function csrf_token(): string
{
    $_SESSION['csrf_token'] ??= bin2hex(random_bytes(32));
    return $_SESSION['csrf_token'];
}
