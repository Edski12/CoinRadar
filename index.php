<?php require_once __DIR__ . '/config/auth.php'; ?>
<script>window.COINRADAR_USER = <?= json_encode(current_user()) ?>; window.COINRADAR_CSRF = <?= json_encode(csrf_token()) ?>;</script>
<!doctype html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Coin Radar</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet"
        integrity="sha384-sRIl4kxILFvY47J16cr9ZwB07vP4J8+LH7qKQnuqkuIAvNWLzeN8tE5YBujZqJLB" crossorigin="anonymous">
    <link rel="stylesheet" href="assets/css/style.css">
</head>

<body>
    <div data-cr-nav></div>

    <div class="container-fluid">
        <div class="row min-vh-100">
            <div data-cr-sidebar class="col-lg-2 d-none d-lg-block p-0"></div>

            <main class="col-12 col-lg-10 p-3 p-lg-4">
                <div class="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
                    <div>
                        <h1 class="h2 mb-1">Market Pulse</h1>
                        <p class="text-muted mb-0">Live prices and major market headlines in one view.</p>
                    </div>
                </div>

                <div class="row g-4">
                    <section class="col-12 col-lg-7">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h2 class="h5 mb-0">Major Assets</h2>
                        </div>
                        <div id="marketPulseGrid" class="row g-3">
                            <div class="col-12 text-muted">Loading prices...</div>
                        </div>

                        <div class="row g-3 mt-1">
                            <div class="col-12 col-md-6">
                                <div class="card h-100">
                                    <div class="card-body">
                                        <div class="text-muted small mb-1">Fear & Greed</div>
                                        <div id="fearGreedValue" class="h4 mb-0">Loading...</div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-12 col-md-6">
                                <div class="card h-100">
                                    <div class="card-body">
                                        <div class="text-muted small mb-2">Trending</div>
                                        <div id="trendingTopics" class="d-flex flex-wrap gap-2">
                                            <span class="text-muted">Loading...</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section class="col-12 col-lg-5">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h2 class="h5 mb-0">Market News</h2>
                        </div>
                        <div id="marketNewsList" class="list-group">
                            <div class="list-group-item text-muted">Loading news...</div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js"
        integrity="sha384-FKyoEForCGlyvwx9Hj09JcYn3nv7wiPVlz7YYwJrWVcXK/BmnVDxM+D2scQbITxI"
        crossorigin="anonymous"></script>
    <script type="module" src="assets/js/shared/bootstrap.js?v=20260902-1"></script>
    <script type="module" src="assets/js/pages/home.js?v=20260902-1"></script>
</body>

</html>
