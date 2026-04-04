// assets/js/api.js

// assets/js/api.js

// 👇 Added the "signal" parameter here
export async function sendToPython(message, base64Image = null, signal = null) {
  try {
    const response = await fetch("http://127.0.0.1:5000/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: message,
        image: base64Image,
      }),
      signal: signal, // 👇 We pass the kill switch to the fetch request here!
    });

    if (!response.ok) {
      throw new Error("Server disconnected (" + response.status + ")");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Fetch error:", error);

    if (error.name === "AbortError") {
      throw error; // Let the UI know it was intentionally stopped!
    }

    if (
      error.message.includes("Failed to fetch") ||
      error.message.includes("NetworkError")
    ) {
      throw new Error(
        "Cannot connect! Please check your WiFi connection or make sure the CropyAi server is running.",
      );
    }
    throw error;
  }
}
