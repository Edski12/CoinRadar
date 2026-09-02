<?php require_once __DIR__ . '/../config/auth.php'; ?>
<script>window.COINRADAR_USER = <?= json_encode(current_user()) ?>; window.COINRADAR_CSRF = <?= json_encode(csrf_token()) ?>;</script>
<!doctype html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Coin Radar - Coins</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet"
        integrity="sha384-sRIl4kxILFvY47J16cr9ZwB07vP4J8+LH7qKQnuqkuIAvNWLzeN8tE5YBujZqJLB" crossorigin="anonymous">
    <link rel="stylesheet" href="../assets/css/style.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"></script>
</head>

<body>
    <div data-cr-nav></div>

    <div class="container-fluid">
        <div class="row min-vh-100">
            <div data-cr-sidebar class="col-lg-2 d-none d-lg-block p-0"></div>

            <main class="col-12 col-lg-10 p-3 p-lg-4">
                <h1 class="h2 mb-1">Crypto Coins</h1>
                <p class="text-muted">Live market data from Binance.</p>

                <div class="mb-3">
                    <input type="text" id="coinSearch" class="form-control" placeholder="Search coins..."
                        autocomplete="off">
                </div>

                <div class="table-responsive">
                    <table class="table table-hover align-middle">
                        <thead>
                            <tr>
                                <th>Symbol</th>
                                <th>Price</th>
                                <th class="d-none d-md-table-cell">24h Change</th>
                                <th class="d-none d-md-table-cell">24h Volume</th>
                                <th>24h Chart</th>
                            </tr>
                        </thead>
                        <tbody id="coinsTableBody">
                            <tr>
                                <td colspan="5" class="text-center text-muted">Loading...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js"
        integrity="sha384-FKyoEForCGlyvwx9Hj09JcYn3nv7wiPVlz7YYwJrWVcXK/BmnVDxM+D2scQbITxI"
        crossorigin="anonymous"></script>
    <script type="module" src="../assets/js/shared/bootstrap.js?v=20260902-1"></script>
    <script type="module" src="../assets/js/pages/coins.js"></script>
</body>

</html>
