import { sendToPython } from "../js/api.js";

const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const sendIcon = document.getElementById("sendIcon");
const chatBox = document.getElementById("chatBox");

let selectedImageBase64 = null;

const previewContainer = document.getElementById("imagePreviewContainer");
const previewImage = document.getElementById("imagePreview");
const removeImageBtn = document.getElementById("removeImageBtn");

// ==========================================
// 1. THE MICROPHONE ENGINE & KILL SWITCH
// ==========================================
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

// 👇 Global variables for the Stop Button
let abortController = null;
let isThinking = false;

if (SpeechRecognition) {
  const recognition = new SpeechRecognition();

  sendBtn.addEventListener("click", function () {
    // 🛑 If AI is thinking, this button becomes the KILL SWITCH
    if (isThinking) {
      if (abortController) {
        abortController.abort(); // FIRE THE KILL SWITCH!
      }
      return; // Stop the function
    }

    // Normal logic if NOT thinking
    if (sendIcon.className.includes("fa-microphone")) {
      userInput.placeholder = "Listening... Speak now!";
      recognition.start();
    } else {
      sendMessage();
    }
  });

  recognition.onresult = function (event) {
    const spokenText = event.results[0][0].transcript;
    userInput.value = spokenText;
    userInput.placeholder = "Ask CropyAi...";
    checkIcon();
  };

  recognition.onerror = function (event) {
    userInput.placeholder = "Ask CropyAi...";
    alert(
      "Microphone Error: " + event.error + ". Are you running on localhost?",
    );
  };
} else {
  // Fallback if browser doesn't support speech recognition
  sendBtn.addEventListener("click", function () {
    if (isThinking) {
      if (abortController) abortController.abort();
      return;
    }
    sendMessage();
  });
}

// ==========================================
// 2. THE ICON FLIPPER & INPUT LISTENERS
// ==========================================
function checkIcon() {
  if (isThinking) return; // Don't flip icons if we are in Stop Button mode

  if (userInput.value.trim() !== "" || selectedImageBase64 !== null) {
    sendIcon.className = "fa-solid fa-paper-plane";
  } else {
    sendIcon.className = "fa-solid fa-microphone";
  }
}

function scrollToBottom() {
  window.scrollTo({
    top: document.body.scrollHeight,
    behavior: "smooth",
  });
}

userInput.addEventListener("input", checkIcon);

userInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    // Don't allow enter key to spam if already thinking
    if (!isThinking) {
      sendMessage();
    }
  }
});

// ==========================================
// 3. SEND MESSAGE UI LOGIC (WITH STOP BUTTON)
// ==========================================
async function sendMessage() {
  const text = userInput.value.trim();

  if (!text && !selectedImageBase64) return;

  // 🛑 LOCKDOWN MODE: ON (But button stays active so we can click Stop!)
  isThinking = true;
  userInput.disabled = true; // Disable typing
  // Notice we do NOT disable sendBtn here anymore!

  // Turn the icon into a pulsing Stop Square
  sendIcon.className = "fa-solid fa-square fa-fade";
  sendIcon.style.color = "#ff6b6b"; // Red

  let userMsgHTML = `<div class="message-wrapper user"><div class="message-bubble">`;
  if (selectedImageBase64) {
    userMsgHTML += `<img src="${selectedImageBase64}" style="max-width: 100%; border-radius: 10px; margin-bottom: 8px; display: block;">`;
  }
  if (text) userMsgHTML += `<span>${text}</span>`;
  userMsgHTML += `</div></div>`;

  chatBox.insertAdjacentHTML("beforeend", userMsgHTML);

  const imageToSend = selectedImageBase64;
  selectedImageBase64 = null;
  previewContainer.classList.add("hidden");
  userInput.value = "";
  scrollToBottom();

  const fastMaskId = "mask-fast-" + Date.now();
  const slowMaskId = "mask-slow-" + Date.now();

  const fastIconHTML = `
  <div class="heat-loader-wrapper">
    <div class="loader fast"> 
      <svg width="100" height="100" viewBox="0 0 100 100" style="position:absolute;">
        <defs>
          <mask id="${fastMaskId}">
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
      <div class="box" style="mask: url(#${fastMaskId}); -webkit-mask: url(#${fastMaskId});"></div>
    </div>
  </div>`;

  const slowIconHTML = `
  <div class="heat-loader-wrapper">
    <div class="loader"> 
      <svg width="100" height="100" viewBox="0 0 100 100" style="position:absolute;">
        <defs>
          <mask id="${slowMaskId}">
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

  // 💥 NEW: Create the controller for this specific request
  abortController = new AbortController();

  try {
    // Pass the signal to api.js so the backend call can be canceled
    const data = await sendToPython(text, imageToSend, abortController.signal);

    // 🟢 SUCCESS: UNLOCK EVERYTHING
    resetUIState();

    const aiRow = document.getElementById(thinkingId);
    if (aiRow) {
      aiRow.querySelector(".icon-slot").innerHTML = slowIconHTML;
      const bubble = aiRow.querySelector(".message-bubble");
      bubble.innerHTML = "";
      typeWriter(bubble, data.reply, 20);
    }
  } catch (error) {
    console.error("Frontend Crash:", error);

    // 🟢 ERROR OR STOPPED: UNLOCK EVERYTHING
    resetUIState();

    const aiRow = document.getElementById(thinkingId);
    if (aiRow) {
      aiRow.querySelector(".icon-slot").innerHTML = slowIconHTML;

      // Check if it was manually stopped by the user!
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

// Helper function to easily reset everything when done or stopped
function resetUIState() {
  isThinking = false;
  userInput.disabled = false;
  sendIcon.style.color = ""; // Reset icon color back to normal
  checkIcon(); // Bring back paper plane or mic
  userInput.focus(); // Put cursor back in box
}

// ==========================================
// 4. TOOLS & IMAGE LOGIC
// ==========================================
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

// 1. Grab the card element
const inputCard = document.querySelector(".input-card");

// 2. Prevent the browser from opening the image file
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

// 3. Add the "Glow" when dragging over
inputCard.addEventListener("dragover", () => {
  inputCard.classList.add("drag-over");
});

inputCard.addEventListener("dragleave", () => {
  inputCard.classList.remove("drag-over");
});

// 4. CATCH THE DROP!
inputCard.addEventListener("drop", (e) => {
  inputCard.classList.remove("drag-over");

  const files = e.dataTransfer.files;
  if (files.length > 0) {
    const file = files[0];

    // Make sure it's an image
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

// ==========================================
// 5. SIDEBAR & MENU LOGIC
// ==========================================
const profileBtn = document.getElementById("profileBtn");
const profileMenu = document.getElementById("profileMenu");

profileBtn.addEventListener("click", function (e) {
  e.stopPropagation();
  profileMenu.classList.toggle("hidden");
  toolsMenu.classList.add("hidden");
});

document.addEventListener("click", function (e) {
  if (!profileMenu.contains(e.target)) {
    profileMenu.classList.add("hidden");
  }
});

const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");

menuBtn.addEventListener("click", function (e) {
  e.stopPropagation();
  sidebar.classList.add("active");
  sidebarOverlay.classList.remove("hidden");
});

sidebarOverlay.addEventListener("click", closeSidebar);

function closeSidebar() {
  sidebar.classList.remove("active");
  sidebarOverlay.classList.add("hidden");
}

document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", closeSidebar);
});

// --- MAGIC SLIDER LOGIC ---
const indicator = document.getElementById("navIndicator");
const railItems = document.querySelectorAll(".rail-item");
const sideRail = document.querySelector(".side-rail");

function moveIndicator(element) {
  if (element && indicator) {
    const yPos = element.offsetTop;
    indicator.style.transform = `translateY(${yPos}px)`;
  }
}

const initialActive = document.querySelector(".rail-item.active");
moveIndicator(initialActive);

railItems.forEach((item) => {
  item.addEventListener("mouseenter", (e) => {
    moveIndicator(e.target);
  });
});

sideRail.addEventListener("mouseleave", () => {
  const currentActive = document.querySelector(".rail-item.active");
  moveIndicator(currentActive);
});

railItems.forEach((item) => {
  item.addEventListener("click", function () {
    railItems.forEach((btn) => btn.classList.remove("active"));
    this.classList.add("active");
    moveIndicator(this);
  });
});

// ==========================================
// TYPEWRITER ENGINE (RESTORED)
// ==========================================
function typeWriter(element, text, speed = 15) {
  let i = 0;
  element.innerHTML = ""; // Ensure the box is empty first

  function type() {
    if (i < text.length) {
      element.innerHTML += text.charAt(i);
      scrollToBottom(); // Keeps the chat pinned to the bottom as it grows!
      i++;
      setTimeout(type, speed);
    }
  }
  type(); // Start the engine
}

// ==========================================
// THE BRIDGE RECEIVER (Auto-Send Logic)
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    // Check if the scanner left a message in memory
    const savedPrompt = localStorage.getItem('cropy_bridge_prompt');
    
    if (savedPrompt) {
        // 1. Put the message in the input box
        userInput.value = savedPrompt;
        
        // 2. Delete it from memory so it doesn't loop forever
        localStorage.removeItem('cropy_bridge_prompt'); 
        
        // 3. Update the icon
        checkIcon();
        
        // 4. Automatically click send!
        setTimeout(() => {
            sendMessage();
        }, 500); // 500ms delay looks more natural
    }
});