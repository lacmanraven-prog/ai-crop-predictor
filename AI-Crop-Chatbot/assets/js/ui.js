import { sendToPython } from "../js/api.js";

const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const sendIcon = document.getElementById("sendIcon");
const chatBox = document.getElementById("chatBox");

let selectedImageBase64 = null;
let greetingDismissed = false; // 👈 Track if greeting has already been dismissed

const previewContainer = document.getElementById("imagePreviewContainer");
const previewImage = document.getElementById("imagePreview");
const removeImageBtn = document.getElementById("removeImageBtn");

// ==========================================
// INJECT ANIMATION STYLES (self-contained)
// ==========================================
const animStyles = document.createElement("style");
animStyles.textContent = `
  /* --- GREETING FADE OUT --- */
  .greeting-wrapper {
    transition: opacity 0.6s ease, transform 0.6s ease;
  }
  .greeting-wrapper.dismiss {
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
    pointer-events: none;
  }

  /* --- AI ICON POP IN --- */
  @keyframes iconPopIn {
    0%   { transform: scale(0) translateY(8px); opacity: 0; }
    60%  { transform: scale(1.15) translateY(-2px); opacity: 1; }
    80%  { transform: scale(0.95) translateY(1px); }
    100% { transform: scale(1) translateY(0px); opacity: 1; }
  }

  .icon-pop-in {
    animation: iconPopIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }

  /* --- AI ICON SLOT (keeps the icon in place) --- */
  .icon-slot {
    flex-shrink: 0;
    position: relative;
    top: 0;
  }
`;
document.head.appendChild(animStyles);

// ==========================================
// GREETING DISMISS FUNCTION
// ==========================================
function dismissGreeting() {
  if (greetingDismissed) return; // Only run once
  greetingDismissed = true;

  const greetingWrapper = document.querySelector(".greeting-wrapper");
  if (!greetingWrapper) return;

  greetingWrapper.classList.add("dismiss");

  // Remove from DOM after animation so it doesn't block layout
  setTimeout(() => {
    greetingWrapper.remove();
  }, 650);
}

// ==========================================
// 1. THE SEND ENGINE & KILL SWITCH (MIC REMOVED)
// ==========================================
let abortController = null;
let isThinking = false;

// Simplified button listener: No more mic checks
sendBtn.addEventListener("click", function () {
  if (isThinking) {
    if (abortController) abortController.abort();
    return;
  }
  sendMessage();
});

// ==========================================
// 2. THE ICON LOCK & INPUT LISTENERS
// ==========================================
function checkIcon() {
  if (isThinking) return;

  // ICON LOCK: It will ALWAYS be the paper-plane now.
  // We removed the logic that switches it back to a microphone.
  sendIcon.className = "fa-solid fa-paper-plane";
}

function scrollToBottom() {
  window.scrollTo({
    top: document.body.scrollHeight,
    behavior: "auto",
  });
}

userInput.addEventListener("input", checkIcon);

userInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    if (!isThinking) sendMessage();
  }
});

// ==========================================
// 3. SEND MESSAGE UI LOGIC (WITH DATABASE SAVE)
// ==========================================
async function sendMessage() {
  const text = userInput.value.trim();
  if (!text && !selectedImageBase64) return;

  dismissGreeting();

  isThinking = true;
  userInput.disabled = true;
  sendIcon.className = "fa-solid fa-square fa-fade";
  sendIcon.style.color = "#ff6b6b";

  let userMsgHTML = `<div class="message-wrapper user"><div class="message-bubble">`;
  if (selectedImageBase64) {
    userMsgHTML += `<img src="${selectedImageBase64}" style="max-width: 100%; border-radius: 10px; margin-bottom: 8px; display: block;">`;
  }
  if (text) userMsgHTML += `<span>${text}</span>`;
  userMsgHTML += `</div></div>`;

  chatBox.insertAdjacentHTML("beforeend", userMsgHTML);
  scrollToBottom();

  // 👇 DATABASE SAVE HOOK #1: Save the User's Message
  try {
    await fetch("backend/chat_handler.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: "user",
        message: text,
        image_data: selectedImageBase64,
      }),
    });
  } catch (err) {
    console.error("DB Save Error (User):", err);
  }

  const imageToSend = selectedImageBase64;
  selectedImageBase64 = null;
  previewContainer.classList.add("hidden");
  userInput.value = "";

  const fastMaskId = "mask-fast-" + Date.now();
  const slowMaskId = "mask-slow-" + Date.now();

  const fastIconHTML = `
  <div class="heat-loader-wrapper icon-pop-in">
    <div class="loader fast"> 
      <svg width="100" height="100" viewBox="0 0 100 100" style="position:absolute;">
        <defs><mask id="${fastMaskId}">
          <polygon points="0,0 100,0 100,100 0,100" fill="black"></polygon>
          <polygon points="25,25 75,25 50,75" fill="white"></polygon>
          <polygon points="50,25 75,75 25,75" fill="white"></polygon>
          <polygon points="35,35 65,35 50,65" fill="white"></polygon>
          <polygon points="35,35 65,35 50,65" fill="white"></polygon>
          <polygon points="35,35 65,35 50,65" fill="white"></polygon>
          <polygon points="35,35 65,35 50,65" fill="white"></polygon>
        </mask></defs>
      </svg>
      <div class="box" style="mask: url(#${fastMaskId}); -webkit-mask: url(#${fastMaskId});"></div>
    </div>
  </div>`;

  const slowIconHTML = `
  <div class="heat-loader-wrapper icon-pop-in">
    <div class="loader"> 
      <svg width="100" height="100" viewBox="0 0 100 100" style="position:absolute;">
        <defs><mask id="${slowMaskId}">
          <polygon points="0,0 100,0 100,100 0,100" fill="black"></polygon>
          <polygon points="25,25 75,25 50,75" fill="white"></polygon>
          <polygon points="50,25 75,75 25,75" fill="white"></polygon>
          <polygon points="35,35 65,35 50,65" fill="white"></polygon>
          <polygon points="35,35 65,35 50,65" fill="white"></polygon>
          <polygon points="35,35 65,35 50,65" fill="white"></polygon>
          <polygon points="35,35 65,35 50,65" fill="white"></polygon>
        </mask></defs>
      </svg>
      <div class="box" style="mask: url(#${slowMaskId}); -webkit-mask: url(#${slowMaskId});"></div>
    </div>
  </div>`;

  const thinkingId = "ai-response-" + Date.now();

  chatBox.insertAdjacentHTML(
    "beforeend",
    `
    <div id="${thinkingId}" class="message-wrapper ai">
      <div class="icon-slot">${fastIconHTML}</div>
      <div class="message-bubble"><i>CropyAi is thinking...</i></div>
    </div>`,
  );
  scrollToBottom();

  abortController = new AbortController();

  try {
    const data = await sendToPython(text, imageToSend, abortController.signal);

    resetUIState();

    const aiRow = document.getElementById(thinkingId);
    if (aiRow) {
      aiRow.querySelector(".icon-slot").innerHTML = slowIconHTML;
      const bubble = aiRow.querySelector(".message-bubble");
      bubble.innerHTML = "";
      typeWriter(bubble, data.reply, 20);

      // 👇 DATABASE SAVE HOOK #2: Save the AI's Reply
      try {
        await fetch("backend/chat_handler.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sender: "ai",
            message: data.reply,
          }),
        });
      } catch (err) {
        console.error("DB Save Error (AI):", err);
      }
    }
  } catch (error) {
    console.error("Frontend Crash:", error);
    resetUIState();

    const aiRow = document.getElementById(thinkingId);
    if (aiRow) {
      aiRow.querySelector(".icon-slot").innerHTML = slowIconHTML;
      if (error.name === "AbortError") {
        aiRow.querySelector(".message-bubble").innerHTML =
          `<span style='color:#c4c7c5;'><i>You stopped this response.</i></span>`;
      } else {
        aiRow.querySelector(".message-bubble").innerHTML =
          `<span style='color:#ff6b6b;'>${error.message}</span>`;
      }
    }
  }
}

// ==========================================
// UNLOCK UI LOGIC
// ==========================================
function resetUIState() {
  isThinking = false;
  userInput.disabled = false;
  sendIcon.style.color = "";
  checkIcon();
  userInput.focus();
}
/* ========================================== */
/* 4. TOOLS & IMAGE LOGIC                     */
/* ========================================== */
const toolsBtn = document.getElementById("toolsBtn");
const toolsMenu = document.getElementById("toolsMenu");
const uploadBtn = document.querySelector(".menu-item");
const imageInput = document.getElementById("imageInput");

toolsBtn.addEventListener("click", function (e) {
  e.stopPropagation();
  toolsMenu.classList.toggle("hidden");
});

document.addEventListener("click", function (e) {
  if (!toolsMenu.contains(e.target)) {
    toolsMenu.classList.add("hidden");
  }
});

uploadBtn.addEventListener("click", function () {
  imageInput.click();
  toolsMenu.classList.add("hidden");
});

imageInput.addEventListener("change", function () {
  const file = this.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      selectedImageBase64 = e.target.result;
      previewImage.src = selectedImageBase64;
      previewContainer.classList.remove("hidden");
      checkIcon();
    };
    reader.readAsDataURL(file);
  }
});

removeImageBtn.addEventListener("click", function () {
  selectedImageBase64 = null;
  imageInput.value = "";
  previewContainer.classList.add("hidden");
  checkIcon();
});

/* ========================================== */
/* DRAG & DROP                                */
/* ========================================== */
const inputCard = document.querySelector(".input-card");

["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
  inputCard.addEventListener(
    eventName,
    (e) => {
      e.preventDefault();
      e.stopPropagation();
    },
    false,
  );
});

inputCard.addEventListener("dragover", () =>
  inputCard.classList.add("drag-over"),
);
inputCard.addEventListener("dragleave", () =>
  inputCard.classList.remove("drag-over"),
);

inputCard.addEventListener("drop", (e) => {
  inputCard.classList.remove("drag-over");
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    const file = files[0];
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = function (event) {
        selectedImageBase64 = event.target.result;
        previewImage.src = selectedImageBase64;
        previewContainer.classList.remove("hidden");
        checkIcon();
      };
      reader.readAsDataURL(file);
    }
  }
});

/* ========================================== */
/* 5. SCANNER BRIDGE (The "Auto-Upload" Fix)  */
/* ========================================== */
window.addEventListener("DOMContentLoaded", () => {
  // 1. Grab the Image from the Locker
  const scannedImage = sessionStorage.getItem("lastScanImage");

  // 2. Grab the Disease name from the URL
  const urlParams = new URLSearchParams(window.location.search);
  const diseaseName = urlParams.get("disease");

  // 3. THE "SPOOF" LOGIC: Make it act like a manual upload
  if (scannedImage || diseaseName) {
    console.log("📸 Scanner Hand-off detected. Processing auto-upload...");

    if (scannedImage) {
      // Push image into the engine's hand
      selectedImageBase64 = scannedImage;

      // Show the preview in the glass-card UI
      if (previewImage) previewImage.src = scannedImage;
      if (previewContainer) previewContainer.classList.remove("hidden");
    }

    if (diseaseName && userInput) {
      // Auto-fill the message
      userInput.value = `I found ${diseaseName} in my palay. What is the organic treatment plan for this in Tupi?`;

      // Toggle the microphone to the paper-plane icon
      if (typeof checkIcon === "function") checkIcon();
    }

    // 4. AUTO-SEND TRIGGER
    // We wait 1 second so you can see the "upload" pop in before it sends
    setTimeout(() => {
      if (typeof sendMessage === "function" && !isThinking) {
        console.log("🚀 Bridge: Auto-sending scanner data to CropyAi...");
        sendMessage();

        // Cleanup: Clear the image so it doesn't resend if they refresh
        sessionStorage.removeItem("lastScanImage");
      }
    }, 1000);
  }
});

// ==========================================
// TYPEWRITER ENGINE
// ==========================================
function typeWriter(element, text, speed = 15) {
  let i = 0;
  element.innerHTML = "";

  function type() {
    if (i < text.length) {
      element.innerHTML += text.charAt(i);
      scrollToBottom();
      i++;
      setTimeout(type, speed);
    }
  }
  type();
}

// ==========================================
// BRIDGE RECEIVER (Scanner Auto-Send)
// ==========================================
window.addEventListener("DOMContentLoaded", () => {
  const savedPrompt = localStorage.getItem("cropy_bridge_prompt");

  if (savedPrompt) {
    userInput.value = savedPrompt;
    localStorage.removeItem("cropy_bridge_prompt");
    checkIcon();

    setTimeout(() => {
      sendMessage();
    }, 500);
  }
});

// ==========================================
// 5. DATABASE MEMORY LOGIC (LOAD HISTORY)
// ==========================================
async function loadChatHistory() {
  try {
    const response = await fetch("backend/chat_handler.php");
    const result = await response.json();

    if (result.status === "success" && result.data.length > 0) {
      // If history exists, instantly kill the intro greeting
      dismissGreeting();

      result.data.forEach((log) => {
        let msgHTML = `<div class="message-wrapper ${log.sender}">`;

        if (log.sender === "ai") {
          // Generate a unique ID for each historical message so the masks don't conflict
          const uniqueId =
            "mask-history-" +
            Date.now() +
            "-" +
            Math.random().toString(36).substr(2, 9);

          // 👇 THE FIX: Using the Heat Wave Loader, but completely frozen
          const historyIconHTML = `
          <div class="icon-slot">
            <div class="heat-loader-wrapper">
              <div class="loader"> 
                <svg width="100" height="100" viewBox="0 0 100 100" style="position:absolute;">
                  <defs><mask id="${uniqueId}">
                    <polygon points="0,0 100,0 100,100 0,100" fill="black"></polygon>
                    
                    <polygon points="25,25 75,25 50,75" fill="white"></polygon>
                    <polygon points="50,25 75,75 25,75" fill="white"></polygon>
                    <polygon points="35,35 65,35 50,65" fill="white"></polygon>
                    <polygon points="35,35 65,35 50,65" fill="white"></polygon>
                    <polygon points="35,35 65,35 50,65" fill="white"></polygon>
                    <polygon points="35,35 65,35 50,65" fill="white"></polygon>
                  </mask></defs>
                </svg>
                <div class="box" style="mask: url(#${uniqueId}); -webkit-mask: url(#${uniqueId});"></div>
              </div>
            </div>
          </div>`;

          msgHTML += `${historyIconHTML}
          <div class="message-bubble">${log.message}</div>`;
        } else {
          msgHTML += `<div class="message-bubble">`;
          if (log.image_data) {
            msgHTML += `<img src="${log.image_data}" style="max-width: 100%; border-radius: 10px; margin-bottom: 8px; display: block;">`;
          }
          msgHTML += `<span>${log.message}</span></div>`;
        }

        msgHTML += `</div>`;
        chatBox.insertAdjacentHTML("beforeend", msgHTML);
      });

      scrollToBottom(true); // Instant scroll to bottom on load
    }
  } catch (error) {
    console.error("Failed to load memory banks:", error);
  }
}

// Fire the history loader the second the DOM is ready
window.addEventListener("DOMContentLoaded", loadChatHistory);
