// assets/js/api.js

export async function sendToPython(message, base64Image = null) {
  try {
    // We send the message directly to your Python Flask server running on port 5000
    const response = await fetch("./backend/process_chat.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: message,
        image: base64Image,
      }),
    });

    if (!response.ok) {
      throw new Error("Server disconnected");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Fetch error:", error);
    throw error; // This triggers the red error bubble in your UI
  }
}
