<?php require_once __DIR__ . '/../config/auth.php';
require_login(); ?>
<script>window.COINRADAR_USER = <?= json_encode(current_user()) ?>; window.COINRADAR_CSRF = <?= json_encode(csrf_token()) ?>;</script>
<!doctype html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Coin Radar - Watchlist</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet"
        integrity="sha384-sRIl4kxILFvY47J16cr9ZwB07vP4J8+LH7qKQnuqkuIAvNWLzeN8tE5YBujZqJLB" crossorigin="anonymous">
    <link rel="stylesheet" href="../assets/css/style.css?v=20260902-2">
    <script src="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"></script>
</head>

<body>
    <div data-cr-nav></div>

    <div class="container-fluid">
        <div class="row min-vh-100">
            <div data-cr-sidebar class="col-lg-2 d-none d-lg-block p-0"></div>

            <main class="col-12 col-lg-10 p-3 p-lg-4">
                <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                    <div>
                        <h1 class="h2 mb-1">Watchlist</h1>
                        <p class="text-muted mb-0">Track the coins you hold and their live value.</p>
                    </div>
                    <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addCoinModal">
                        + Add Coin
                    </button>
                </div>

                <div class="row mb-4">
                    <div class="col-12 col-sm-6 col-md-4">
                        <div class="card p-3">
                            <div class="text-muted small">Total Portfolio Value</div>
                            <div class="h4 mb-0" id="totalValue">$0.00</div>
                        </div>
                    </div>
                </div>

                <div class="table-responsive">
                    <table class="table table-hover align-middle">
                        <thead>
                            <tr>
                                <th>Symbol</th>
                                <th>Holdings</th>
                                <th class="d-none d-md-table-cell">Price</th>
                                <th>Value</th>
                                <th class="d-none d-md-table-cell">24h Change</th>
                                <th class="d-none d-md-table-cell">24h Chart</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody id="watchlistTableBody">
                            <tr>
                                <td colspan="7" class="text-center text-muted">Your watchlist is empty. Click "+ Add
                                    Coin" to get started.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    </div>

    <div class="modal fade" id="addCoinModal" tabindex="-1" aria-labelledby="addCoinModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title h5" id="addCoinModalLabel">Add Coin to Watchlist</h2>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div id="coinSelectStep">
                        <input type="text" id="modalCoinSearch" class="form-control mb-3"
                            placeholder="Search coins (e.g. BTC, ETH)..." autocomplete="off">
                        <div id="modalCoinList" class="list-group modal-coin-list">
                            <div class="text-center text-muted py-3">Loading available coins...</div>
                        </div>
                    </div>

                    <div id="amountStep" class="d-none">
                        <button type="button" class="btn btn-link p-0 mb-3" id="backToSearchBtn">&larr; Back to
                            search</button>
                        <strong id="selectedCoinLabel" class="h5 d-block mb-3"></strong>
                        <label for="coinAmountInput" class="form-label">How much do you hold?</label>
                        <input type="number" id="coinAmountInput" class="form-control" placeholder="0.00" min="0"
                            step="any">
                        <div class="form-text">Enter the quantity of coins you own, not a dollar value.</div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-primary d-none" id="confirmAddCoinBtn">Add to
                        Watchlist</button>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js"
        integrity="sha384-FKyoEForCGlyvwx9Hj09JcYn3nv7wiPVlz7YYwJrWVcXK/BmnVDxM+D2scQbITxI"
        crossorigin="anonymous"></script>
    <script type="module" src="../assets/js/shared/bootstrap.js?v=20260902-1"></script>
    <script type="module" src="../assets/js/pages/watchlist.js"></script>
</body>

</html>
