<?php require_once __DIR__ . '/../config/auth.php'; ?>
<script>window.COINRADAR_USER = <?= json_encode(current_user()) ?>; window.COINRADAR_CSRF = <?= json_encode(csrf_token()) ?>;</script>
<!doctype html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Coin Radar - Coin Detail</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="../assets/css/style.css">
</head>

<body>
    <div data-cr-nav></div>

    <div class="container-fluid">
        <div class="row min-vh-100">
            <div data-cr-sidebar class="col-lg-2 d-none d-lg-block p-0"></div>

            <div class="col-12 col-lg-10 p-3 p-lg-4">
                <div class="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
                    <div>
                        <h1 id="coinTitle" class="h2 mb-1">Coin</h1>
                        <p id="coinPrice" class="text-muted mb-0">Loading...</p>
                    </div>
                    <a href="#" id="backButton" class="btn btn-outline-dark">Back</a>
                </div>

                <div class="chart-container">
                    <div class="tools-sidebar">
                        <button class="tool-btn active" data-tool="cursor" title="Cursor"><i
                                class="fas fa-arrow-pointer"></i></button>
                        <button class="tool-btn" data-tool="straightLine" title="Trend Line"><i
                                class="fas fa-chart-line"></i></button>
                        <button class="tool-btn" data-tool="horizontalStraightLine" title="Horizontal"><i
                                class="fas fa-minus"></i></button>
                        <button class="tool-btn" data-tool="verticalStraightLine" title="Vertical"><i
                                class="fas fa-lines-leaning"></i></button>
                        <button class="tool-btn" data-tool="rectangle" title="Rectangle"><i
                                class="fas fa-square"></i></button>
                        <button class="tool-btn" data-tool="fibonacciLine" title="Fib Retracement"><i
                                class="fas fa-wave-square"></i></button>
                        <div class="tool-divider"></div>
                        <button class="tool-btn danger" data-tool="clear" title="Clear Drawings"><i
                                class="fas fa-trash"></i></button>
                    </div>
                    <div class="chart-box">
                        <div class="timeframe-selector">
                            <button class="timeframe-btn active" data-interval="1m">1m</button>
                            <button class="timeframe-btn" data-interval="3m">3m</button>
                            <button class="timeframe-btn" data-interval="5m">5m</button>
                            <button class="timeframe-btn" data-interval="15m">15m</button>
                            <button class="timeframe-btn" data-interval="1h">1h</button>
                            <button class="timeframe-btn" data-interval="4h">4h</button>
                            <button class="timeframe-btn" data-interval="1d">1d</button>
                        </div>
                        <div id="priceChart"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/klinecharts@9/dist/klinecharts.min.js"></script>
    <script type="module" src="../assets/js/shared/bootstrap.js"></script>
    <script type="module" src="../assets/js/pages/coinDetails.js"></script>
</body>

</html>
