<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CropyAi Predictor | Chatbot</title>

    <link rel="stylesheet" href="../assets/fontawesome/css/all.min.css">
    <link rel="stylesheet" href="../AI-Crop-Chatbot/style.css">
</head>

<body>
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
    <aside id="sidebar" class="sidebar">
        <div class="sidebar-header">
            <h3>CropyMenu</h3>
        </div>
        <nav class="sidebar-nav">
            <button class="nav-item active"><i class="fa-solid fa-plus"></i> New Chat</button>
            <button class="nav-item"><i class="fa-solid fa-clock-rotate-left"></i> History</button>
            <button class="nav-item"><i class="fa-solid fa-leaf"></i> Saved Crops</button>
        </nav>
    </aside>

    <div id="sidebarOverlay" class="sidebar-overlay hidden"></div>

    <header class="main-header" id="appHeader">
        <button id="menuBtn" class="menu-btn">
            <i class="fa-solid fa-bars"></i>
        </button>

        <div class="header-title">CropyAi Chatbot</div>

        <div class="profile-section">
            <div class="profile-container">
                <img src="https://ui-avatars.com/api/?name=Raven&background=4285f4&color=fff" id="profileBtn" class="profile-pfp" alt="Profile">

                <div id="profileMenu" class="profile-menu hidden">
                    <button class="profile-item">
                        <i class="fa-solid fa-user-gear"></i> Switch Account
                    </button>
                    <div class="menu-divider"></div>
                    <button class="profile-item sign-out">
                        <i class="fa-solid fa-right-from-bracket"></i> Sign Out
                    </button>
                </div>
            </div>
        </div>
    </header>
    <div class="side-rail">

        <div class="active-indicator" id="navIndicator"></div>

        <button class="rail-item active" title="Cropy Chat">
            <i class="fa-solid fa-robot"></i>
        </button>

        <button class="rail-item" id="railScannerBtn" title="Crop Scanner">
            <i class="fa-solid fa-camera-retro"></i>
        </button>
    </div>

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

    <script type="module" src="../AI-Crop-Chatbot/assets/js/api.js"></script>
    <script type="module" src="../AI-Crop-Chatbot/assets/js/ui.js"></script>

</body>

</html>