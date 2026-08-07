<?php require_once __DIR__ . '/config/auth.php';
if (current_user()) {
    header('Location: index.php');
    exit;
}
$error = $_SESSION['auth_error'] ?? '';
unset($_SESSION['auth_error']); ?>
<!doctype html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Create account - Coin Radar</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="assets/css/style.css">
</head>

<body class="bg-light">
    <main class="container py-5" style="max-width:480px"><a class="text-decoration-none text-dark" href="index.php">
            <h1 class="h3 mb-4">Coin Radar</h1>
        </a>
        <section class="card shadow-sm">
            <div class="card-body p-4">
                <h2 class="h4">Create your account</h2><?php if ($error): ?>
                    <div class="alert alert-danger"><?= htmlspecialchars($error) ?></div><?php endif; ?><a
                    class="btn btn-outline-dark w-100 mb-3" href="auth/google.php">Sign up with Google</a>
                <div class="text-center text-muted small mb-3">or use your email</div>
                <form method="post" action="auth/register.php"><input type="hidden" name="csrf_token"
                        value="<?= csrf_token() ?>"><label class="form-label" for="name">Name</label><input
                        class="form-control mb-3" id="name" name="name" required autocomplete="name"><label
                        class="form-label" for="email">Email</label><input class="form-control mb-3" id="email"
                        type="email" name="email" required autocomplete="email"><label class="form-label"
                        for="password">Password</label><input class="form-control mb-4" id="password" type="password"
                        name="password" minlength="8" required autocomplete="new-password"><button
                        class="btn btn-primary w-100">Create account</button></form>
                <p class="text-center small mt-3 mb-0">Already registered? <a href="login.php">Sign in</a></p>
            </div>
        </section>
    </main>
</body>

</html>