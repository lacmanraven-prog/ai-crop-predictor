<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once 'backend/db.php';

if (!isset($_SESSION['user_id'])) {
    header("Location: ../logout.php");
    exit();
}

$user_id = $_SESSION['user_id'];

try {
    $stmt = $pdo->prepare("SELECT full_name, profile_image FROM users WHERE id = :id");
    $stmt->execute(['id' => $user_id]);
    $user = $stmt->fetch();

    $root = "../";
    $pfpPath = !empty($user['profile_image']) ? $root . $user['profile_image'] : $root . "assets/images/default-profile.jpg";
    $fullName = !empty($user['full_name']) ? $user['full_name'] : "Farmer";
} catch (PDOException $e) {
    $fullName = "User";
    $pfpPath = "../assets/images/default-profile.jpg";
}
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CropyAi | AI Chatbot</title>

    <link rel="stylesheet" href="../assets/fontawesome/css/all.min.css">
    <link href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet">
    <link rel="stylesheet" href="../AI-Crop-Chatbot/style.css">
    <style>
        /* ============================================ */
        /*  FULL SCREEN OLED LOADER OVERLAY             */
        /* ============================================ */

        #loaderOverlay1 {
            position: fixed;
            inset: 0;
            z-index: 9999;
            background: #000;
            display: flex;
            justify-content: center;
            align-items: center;
            transition: opacity 0.5s ease;
        }

        #loaderOverlay1.hidden {
            opacity: 0;
            pointer-events: none;
        }

        .loader-content1 {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 28px;
        }

        .loader-brand1 {
            color: #fff;
            font-size: 20px;
            font-weight: 700;
            letter-spacing: 4px;
            opacity: 0.85;
        }

        .loader-bar-wrapper1 {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
            width: 220px;
        }

        .loader-bar-track1 {
            width: 100%;
            height: 4px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 99px;
            overflow: hidden;
        }

        .loader-bar-fill1 {
            height: 100%;
            width: 0%;
            border-radius: 99px;
            background: linear-gradient(90deg, #4285f4, #1a73e8);
            box-shadow: 0 0 10px rgba(66, 133, 244, 0.8);
            transition: width 0.05s linear;
        }

        .loader-percent1 {
            color: #4285f4;
            font-size: 13px;
            font-weight: 600;
            letter-spacing: 1px;
        }

        /* ============================================ */
        /*  CROPYAI BLUE GOOEY LOADER ANIMATION         */
        /* ============================================ */

        .loader1 {
            --color-one: #4285f4;
            --color-two: #1a73e8;
            --color-three: rgba(66, 133, 244, 0.5);
            --color-four: rgba(26, 115, 232, 0.5);
            --color-five: rgba(66, 133, 244, 0.25);

            --time-animation: 2s;
            --size: 1;
            position: relative;
            border-radius: 50%;
            transform: scale(var(--size));

            box-shadow:
                0 0 25px 0 var(--color-three),
                0 20px 50px 0 var(--color-four);
        }

        .loader1::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            width: 100px;
            height: 100px;
            border-radius: 50%;
            border-top: solid 1px var(--color-one);
            border-bottom: solid 1px var(--color-two);
            background: linear-gradient(180deg, var(--color-five), var(--color-four));
            box-shadow:
                inset 0 10px 10px 0 var(--color-three),
                inset 0 -10px 10px 0 var(--color-four);
        }

        /* ✅ FIXED: was .loader .box — now scoped to .loader1 .box1 */
        .loader1 .box1 {
            width: 100px;
            height: 100px;
            background: linear-gradient(180deg,
                    var(--color-one) 30%,
                    var(--color-two) 70%);
            mask: url(#clipping1);
            -webkit-mask: url(#clipping1);
        }

        .loader1 svg {
            position: absolute;
        }

        .loader1 svg #clipping1 {
            filter: contrast(15);
            animation: roundness1 calc(var(--time-animation) / 2) linear infinite;
        }

        .loader1 svg #clipping1 polygon {
            filter: blur(7px);
        }

        .loader1 svg #clipping1 polygon:nth-child(1) {
            transform-origin: 75% 25%;
            transform: rotate(90deg);
        }

        .loader1 svg #clipping1 polygon:nth-child(2) {
            transform-origin: 50% 50%;
            animation: rotation1 var(--time-animation) linear infinite reverse;
        }

        .loader1 svg #clipping1 polygon:nth-child(3) {
            transform-origin: 50% 60%;
            animation: rotation1 var(--time-animation) linear infinite;
            animation-delay: calc(var(--time-animation) / -3);
        }

        .loader1 svg #clipping1 polygon:nth-child(4) {
            transform-origin: 40% 40%;
            animation: rotation1 var(--time-animation) linear infinite reverse;
        }

        .loader1 svg #clipping1 polygon:nth-child(5) {
            transform-origin: 40% 40%;
            animation: rotation1 var(--time-animation) linear infinite reverse;
            animation-delay: calc(var(--time-animation) / -2);
        }

        .loader1 svg #clipping1 polygon:nth-child(6) {
            transform-origin: 60% 40%;
            animation: rotation1 var(--time-animation) linear infinite;
        }

        .loader1 svg #clipping1 polygon:nth-child(7) {
            transform-origin: 60% 40%;
            animation: rotation1 var(--time-animation) linear infinite;
            animation-delay: calc(var(--time-animation) / -1.5);
        }

        /* ✅ FIXED: renamed keyframes to rotation1 and roundness1 */
        @keyframes rotation1 {
            0% {
                transform: rotate(0deg);
            }
            100% {
                transform: rotate(360deg);
            }
        }

        @keyframes roundness1 {
            0%,
            100% {
                filter: contrast(15);
            }
            20%,
            40% {
                filter: contrast(3);
            }
            60% {
                filter: contrast(15);
            }
        }
    </style>
</head>

<body>

    <!-- FULL SCREEN LOADER OVERLAY -->
    <div id="loaderOverlay1">
        <div class="loader-content1">

            <div class="loader1">
                <svg width="200" height="200" viewBox="0 0 100 100">
                    <defs>
                        <mask id="clipping1">
                            <polygon points="0,0 100,0 100,100 0,100" fill="black"></polygon>
                            <polygon points="25,25 75,25 50,75" fill="white"></polygon>
                            <polygon points="50,25 75,75 25,75" fill="white"></polygon>
                            <polygon points="35,35 65,35 50,65" fill="white"></polygon>
                            <polygon points="35,35 65,35 50,65" fill="white"></polygon>
                            <polygon points="35,35 65,35 50,65" fill="white"></polygon>
                            <polygon points="35,35 65,35 50,65" fill="white"></polygon>
                        </mask>
                    </defs>
                </svg>
                <!-- ✅ FIXED: was class="box" — now class="box1" -->
                <div class="box1"></div>
            </div>

            <p class="loader-brand1">CropyAi</p>

            <div class="loader-bar-wrapper1">
                <div class="loader-bar-track1">
                    <div class="loader-bar-fill1" id="loaderBarFill1"></div>
                </div>
                <span class="loader-percent1" id="loaderPercent1">0%</span>
            </div>

        </div>
    </div>


    <!-- ===================== SIDEBAR ===================== -->
    <div class="sidebar" id="sidebar">
        <div class="logo-details">
            <i class="bx bx-menu" id="sidebarBtn"></i>
        </div>

        <ul class="nav-list">
            <li>
                <a href="dashboard.php">
                    <i class="fa-solid fa-house-chimney"></i>
                    <span class="links_name">Dashboard</span>
                </a>
                <span class="tooltip">Dashboard</span>
            </li>
            <li class="active">
                <a href="index.php">
                    <i class="fa-solid fa-leaf"></i>
                    <span class="links_name">AI Chatbot</span>
                </a>
                <span class="tooltip">AI Chatbot</span>
            </li>
            <li>
                <a href="scan-page.php">
                    <i class="fa-solid fa-qrcode"></i>
                    <span class="links_name">AI Disease Scan</span>
                </a>
                <span class="tooltip">Scan Rice</span>
            </li>
            <li>
                <a href="ledger.php">
                    <i class="fa-solid fa-book-open"></i>
                    <span class="links_name">Farm Ledger</span>
                </a>
                <span class="tooltip">Farm Ledger (OCR)</span>
            </li>
            <li>
                <a href="analytics.php">
                    <i class="fa-solid fa-chart-line"></i>
                    <span class="links_name">Yield Predictor</span>
                </a>
                <span class="tooltip">Analytics</span>
            </li>
        </ul>

        <ul class="bottom-content">
            <li>
                <a href="history.php">
                    <i class="fa-solid fa-clock-rotate-left"></i>
                    <span class="links_name">History</span>
                </a>
                <span class="tooltip">History</span>
            </li>
        </ul>
    </div>

    <!-- MOBILE FLOATING BURGER -->
    <button class="mobile-fab" id="mobileFab" aria-label="Open menu">
        <i class="bx bx-menu"></i>
    </button>

    <!-- MOBILE SIDEBAR OVERLAY -->
    <div class="sidebar-overlay" id="sidebarOverlay"></div>

    <!-- ===================== MAIN CONTENT AREA ===================== -->
    <div class="main-content" id="mainContent">

        <!-- HEADER -->
        <header class="main-header">
            <span class="header-title">CropyAi</span>

            <div class="profile-section">
                <div class="profile-section">
                    <div class="profile-container">
                        <div class="profile-pfp-circle" id="profileBtn">
                            <img src="<?= htmlspecialchars($pfpPath) ?>" alt="Profile Image" class="pfp-img">
                        </div>

                        <div class="profile-menu hidden" id="profileMenu">
                            <div class="profile-header">
                                <span class="user-label">Logged in as</span>
                                <span class="user-name-tag"><?= htmlspecialchars($fullName) ?></span>
                            </div>

                            <div class="menu-divider"></div>

                            <a href="profile.php" class="profile-item">
                                <i class="fa-solid fa-user-circle"></i> My Profile
                            </a>

                            <div class="menu-divider"></div>

                            <a href="../logout.php" class="profile-item logout-red">
                                <i class="fa-solid fa-sign-out-alt"></i> Sign Out
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </header>

        <!-- CHAT BOX -->
        <div id="chatBox">
            <div class="greeting-wrapper">
                <div class="heat-loader-wrapper">
                    <div class="loader" style="animation: none; filter: hue-rotate(180deg);">
                        <svg width="100" height="100" viewBox="0 0 100 100" style="position:absolute;">
                            <defs>
                                <mask id="clipping-fast">
                                    <polygon points="0,0 100,0 100,100 0,100" fill="black"></polygon>
                                    <polygon points="25,25 75,25 50,75" fill="white"></polygon>
                                    <polygon points="50,25 75,75 25,75" fill="white"></polygon>
                                    <polygon points="35,35 65,35 50,65" fill="white"></polygon>
                                    <polygon points="35,35 65,35 50,65" fill="white"></polygon>
                                    <polygon points="35,35 65,35 50,65" fill="white"></polygon>
                                    <polygon points="35,35 65,35 50,65" fill="white"></polygon>
                                </mask>
                            </defs>
                        </svg>
                        <div class="box" style="mask: url(#clipping-fast); -webkit-mask: url(#clipping-fast);"></div>
                    </div>
                </div>
                <div class="greeting-text">CropyAi</div>
            </div>
        </div>

        <!-- INPUT AREA -->
        <div class="input-wrapper">
            <div class="input-card">
                <div id="imagePreviewContainer" class="hidden" style="padding: 10px; position: relative;">
                    <img id="imagePreview" src="" style="max-width: 100px; border-radius: 10px; border: 1px solid #444746;">
                    <button id="removeImageBtn" style="position: absolute; top: 0; left: 100px; background: #ff4d4d; border: none; color: white; border-radius: 50%; width: 20px; height: 20px; cursor: pointer; font-size: 12px;">&times;</button>
                </div>
                <textarea id="userInput" placeholder="Ask CropyAi..."></textarea>
                <input type="file" id="imageInput" accept="image/*" style="display: none;">

                <div class="button-row">
                    <div style="position: relative;">
                        <div id="toolsMenu" class="tools-menu hidden">
                            <button class="menu-item"><i class="fa-solid fa-image"></i> Upload Image</button>
                        </div>

                        <button id="toolsBtn" class="tools-btn">
                            <i class="fa-solid fa-screwdriver-wrench"></i> Tools
                        </button>
                    </div>

                    <button id="sendBtn">
                        <i id="sendIcon" class="fa-solid fa-microphone"></i>
                    </button>
                </div>
            </div>
        </div>

    </div><!-- end .main-content -->

    <script type="module" src="../AI-Crop-Chatbot/assets/js/api.js"></script>
    <script type="module" src="../AI-Crop-Chatbot/assets/js/ui.js"></script>
    <!-- ✅ FIXED: points to loader1.js not loader.js -->
    <script src="loader1.js"></script>

    <script>
        document.addEventListener('DOMContentLoaded', () => {

            /* ===================== SIDEBAR & MOBILE NAVIGATION ===================== */
            const sidebar = document.getElementById('sidebar');
            const sidebarBtn = document.getElementById('sidebarBtn');
            const mobileFab = document.getElementById('mobileFab');
            const overlay = document.getElementById('sidebarOverlay');

            function toggleSidebar() {
                sidebar.classList.toggle('open');
                overlay.classList.toggle('active');
            }

            if (sidebarBtn) sidebarBtn.addEventListener('click', toggleSidebar);
            if (mobileFab) mobileFab.addEventListener('click', toggleSidebar);

            if (overlay) {
                overlay.addEventListener('click', () => {
                    sidebar.classList.remove('open');
                    overlay.classList.remove('active');
                });
            }

            /* ===================== PROFILE DROPDOWN ===================== */
            const profileBtn = document.getElementById('profileBtn');
            const profileMenu = document.getElementById('profileMenu');

            if (profileBtn) {
                profileBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    profileMenu.classList.toggle('hidden');
                });
            }

            document.addEventListener('click', () => {
                if (profileMenu) profileMenu.classList.add('hidden');
            });

            /* ===================== ONLINE/OFFLINE STATUS ===================== */
            function updateOnlineStatus() {
                const status = navigator.onLine ? '🌐 Online Mode' : '🔌 Offline Mode';
                console.log(`CropyAi Status: ${status}`);
            }

            window.addEventListener('online', updateOnlineStatus);
            window.addEventListener('offline', updateOnlineStatus);
            updateOnlineStatus();

            /* ===================== DATA INTEGRATION (AUTO-FILL) ===================== */
            const urlParams = new URLSearchParams(window.location.search);
            const userInput = document.getElementById('userInput');
            const sendBtn = document.getElementById('sendBtn');

            const diseaseName = urlParams.get('disease');
            const savedImage = sessionStorage.getItem('lastScanImage');

            if (diseaseName && savedImage) {
                const previewImg = document.getElementById('imagePreview');
                const previewContainer = document.getElementById('imagePreviewContainer');

                if (previewImg && previewContainer) {
                    previewImg.src = savedImage;
                    previewContainer.classList.remove('hidden');
                }

                if (userInput) {
                    userInput.value = `I found ${diseaseName} in my palay. What is the organic treatment plan for this in Tupi?`;
                    userInput.focus();
                }
            }

            const area = urlParams.get('area');
            const sacks = urlParams.get('sacks');
            const profit = urlParams.get('profit');

            if (area && sacks && userInput) {
                userInput.value = `I just used the Yield Predictor. For my ${area} hectare farm, it says I'll get ${sacks} sacks and an estimated net profit of ₱${profit}. Is this a good result for Tupi soil?`;
                userInput.focus();
                userInput.style.height = userInput.scrollHeight + "px";
            }

        });
    </script>

</body>

</html>