<?php require_once __DIR__ . '/../config/auth.php';
require_login(); ?>
<script>window.COINRADAR_USER = <?= json_encode(current_user()) ?>; window.COINRADAR_CSRF = <?= json_encode(csrf_token()) ?>;</script>
<!doctype html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Coin Radar - Settings</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet"
        integrity="sha384-sRIl4kxILFvY47J16cr9ZwB07vP4J8+LH7qKQnuqkuIAvNWLzeN8tE5YBujZqJLB" crossorigin="anonymous">
    <link rel="stylesheet" href="../assets/css/style.css">
</head>

<body>
    <div data-cr-nav></div>

    <div class="container-fluid">
        <div class="row min-vh-100">
            <div data-cr-sidebar class="col-lg-2 d-none d-lg-block p-0"></div>

            <div class="col-12 col-lg-10 p-3 p-lg-4">
                <h1 class="h2 mb-1">Settings</h1>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js"
        integrity="sha384-FKyoEForCGlyvwx9Hj09JcYn3nv7wiPVlz7YYwJrWVcXK/BmnVDxM+D2scQbITxI"
        crossorigin="anonymous"></script>
    <script type="module" src="../assets/js/shared/bootstrap.js"></script>
    <script type="module" src="../assets/js/pages/settings.js"></script>
</body>

</html>
