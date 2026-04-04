//error handling, image sending, and the new heat loader animation! 
// This file is getting a bit long, but I wanted to keep all the UI logic in one place for now. We can always refactor later if needed.
// Note: Make sure to update the path if your file structure is different
//the loader animation is when you change the class to the index.php file to loader slow or loader fast everything goes slower or faster depending on the class you choose, you can also create a loader super-slow or loader super-fast by changing the time-animation variable in the css file.
//the fix is: in the ui.js file, change the line "let selectedImageBase64 = null;" to "selectedImageBase64 = null;" and it should work fine, this is because we want to keep the value of selectedImageBase64 across different function calls, if we declare it as let inside a function it will be reset to null every time the function is called.
//and the fix for the error handling is: in the api.js file, change the line "throw error;" to "throw new Error('Server disconnected');" this way we can catch the error in the ui.js file and display a user-friendly message instead of just saying "Fetch error: [object Object]".
//the fix for image sending is: in the ui.js file, change the line "const data = await sendToPython(text, imageToSend);" to "const data = await sendToPython(text, imageToSend ? imageToSend : null);" this way we can ensure that if there is no image selected, we are sending null to the backend instead of an empty string or undefined, which might cause issues in the backend processing.
//time to sleep, goodnight!

import { sendToPython } from "../js/api.js";

const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const sendIcon = document.getElementById("sendIcon");
const chatBox = document.getElementById("chatBox");

// FIX: Set this to null, not 'let'
let selectedImageBase64 = null;

const previewContainer = document.getElementById("imagePreviewContainer");
const previewImage = document.getElementById("imagePreview");
const removeImageBtn = document.getElementById("removeImageBtn");

// ==========================================
// 1. THE MICROPHONE ENGINE
// ==========================================
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
  const recognition = new SpeechRecognition();

  sendBtn.addEventListener("click", function () {
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
}

// ==========================================
// 2. THE ICON FLIPPER & INPUT LISTENERS
// ==========================================
function checkIcon() {
  // Check if there is either text OR an image
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
    sendMessage();
  }
});

// ==========================================
// 3. SEND MESSAGE UI LOGIC (UPDATED FOR IMAGES)
// ==========================================
async function sendMessage() {
  const text = userInput.value.trim();

  // Stop if both are empty
  if (!text && !selectedImageBase64) return;

  // 1. Add User Message to UI (Image + Text)
  let userMsgHTML = `<div class="message-wrapper user"><div class="message-bubble">`;
  if (selectedImageBase64) {
    userMsgHTML += `<img src="${selectedImageBase64}" style="max-width: 100%; border-radius: 10px; margin-bottom: 8px; display: block;">`;
  }
  if (text) userMsgHTML += `<span>${text}</span>`;
  userMsgHTML += `</div></div>`;

  chatBox.innerHTML += userMsgHTML;

  // 2. Capture data for sending, then CLEAR the UI immediately
  const imageToSend = selectedImageBase64;
  selectedImageBase64 = null;
  previewContainer.classList.add("hidden");
  userInput.value = "";
  checkIcon();
  scrollToBottom();

  // 3. Thinking state
  const heatLoaderHTML = `
  <div class="heat-loader-wrapper">
    <div class="loader">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <defs>
          <mask id="clipping">
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
      <div class="box"></div>
    </div>
  </div>`;

  chatBox.innerHTML += `
        <div id="loading" class="message-wrapper ai">
            ${heatLoaderHTML}
            <div class="message-bubble"><i>CropyAi is ...</i></div>
        </div>`;
  scrollToBottom();

  try {
    // 4. Send to Python (Text and Image)
    const data = await sendToPython(text, imageToSend);

    const loadingElem = document.getElementById("loading");
    if (loadingElem) loadingElem.remove();

    chatBox.innerHTML += `
            <div class="message-wrapper ai">
                <div class="ai-avatar"><i class="fa-solid fa-robot"></i></div>
                <div class="message-bubble">${data.reply}</div>
            </div>`;
    scrollToBottom();
  } catch (error) {
    const loadingElem = document.getElementById("loading");
    if (loadingElem) loadingElem.remove();

    chatBox.innerHTML += `
            <div class="message-wrapper ai">
                <div class="ai-avatar"><i class="fa-solid fa-robot"></i></div>
                <div class="message-bubble" style="color: #ff6b6b;">
                    Error: Check if server.py is running!
                </div>
            </div>`;
    scrollToBottom();
  }
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
        // Reuse your existing preview logic!
        selectedImageBase64 = event.target.result;
        previewImage.src = selectedImageBase64;
        previewContainer.classList.remove("hidden");
        checkIcon();
      };
      reader.readAsDataURL(file);
    }
  }
});

// 1. Grab the elements
const profileBtn = document.getElementById("profileBtn");
const profileMenu = document.getElementById("profileMenu");

// 2. Toggle the profile menu
profileBtn.addEventListener("click", function (e) {
  e.stopPropagation();
  profileMenu.classList.toggle("hidden");

  // Close the tools menu if it's open (so they don't overlap)
  toolsMenu.classList.add("hidden");
});

// 3. Update your existing document click listener
// (Find where you added the toolsMenu 'click' listener and add this line inside it)
document.addEventListener("click", function (e) {
  if (!profileMenu.contains(e.target)) {
    profileMenu.classList.add("hidden");
  }
});

const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");

// 1. Open Sidebar
menuBtn.addEventListener("click", function (e) {
  e.stopPropagation();
  sidebar.classList.add("active");
  sidebarOverlay.classList.remove("hidden");
});

// 2. Close Sidebar (Clicking overlay or any item)
sidebarOverlay.addEventListener("click", closeSidebar);

function closeSidebar() {
  sidebar.classList.remove("active");
  sidebarOverlay.classList.add("hidden");
}

// Optional: Close sidebar if a nav item is clicked
document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", closeSidebar);
});

// --- MAGIC SLIDER LOGIC ---
const indicator = document.getElementById("navIndicator");
const railItems = document.querySelectorAll(".rail-item");
const sideRail = document.querySelector(".side-rail");

// This function moves the blue pill to the Y-coordinate of whatever button you pass it
function moveIndicator(element) {
  if (element && indicator) {
    // Get how far down the button is
    const yPos = element.offsetTop;
    // Move the indicator to that exact spot
    indicator.style.transform = `translateY(${yPos}px)`;
  }
}

// 1. When the page loads, snap the indicator to the active button
const initialActive = document.querySelector(".rail-item.active");
moveIndicator(initialActive);

// 2. Make the indicator follow the mouse when hovering over buttons
railItems.forEach((item) => {
  item.addEventListener("mouseenter", (e) => {
    moveIndicator(e.target);
  });
});

// 3. If the mouse leaves the rail area entirely, slide back to the "real" active button
sideRail.addEventListener("mouseleave", () => {
  const currentActive = document.querySelector(".rail-item.active");
  moveIndicator(currentActive);
});

// Optional: Update the "real" active button when clicked
railItems.forEach((item) => {
  item.addEventListener("click", function () {
    // Remove active class from all
    railItems.forEach((btn) => btn.classList.remove("active"));
    // Add to the one you just clicked
    this.classList.add("active");
    moveIndicator(this);
  });
});
