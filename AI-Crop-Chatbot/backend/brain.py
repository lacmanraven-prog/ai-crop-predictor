import csv
import os
import base64
from dotenv import load_dotenv
from google import genai
from google.genai import types
import vision  # This imports your specialist vision.py file
import server

# 1. Load the secret variables
load_dotenv()
API_KEYS = [
    os.getenv("GEMINI_API_KEY_1"),
    os.getenv("GEMINI_API_KEY_2"),
    os.getenv("GEMINI_API_KEY_3"),
]
# Clean out any empty ones if you only have 1 or 2 keys set up in your .env
API_KEYS = [key for key in API_KEYS if key]

# 2. THE TRACKER (Global variable to remember where we are)
current_key_index = 0

# (Notice we removed the global 'client' from here!)


def read_weather_data():
    """Opens the CSV and reads the current data"""
    # Note: path is ../data because brain.py is inside the backend folder
    file_path = "../data/weather_data.csv"

    if not os.path.exists(file_path):
        return "No weather data available right now."

    try:
        with open(file_path, mode="r") as file:
            reader = csv.reader(file)
            data_list = list(reader)
            return str(data_list)
    except Exception as e:
        return f"Error reading data: {e}"


def get_ai_response(user_input, base64_image=None):
    """Combines the CSV data, Vision analysis, and user question"""

    # Grab the global tracker so we know which key to use
    global current_key_index

    # 1. Grab the local weather context (Only need to do this once)
    weather_context = read_weather_data()

    # 2. THE ROTATION ENGINE
    # We loop through all keys to find one that works for BOTH Vision and Chat
    for attempt in range(len(API_KEYS)):
        current_key = API_KEYS[current_key_index]

        try:
            # 📸 3. VISION SCAN (Now inside the loop!)
            analysis_results = ""
            if base64_image:
                print(
                    f"🔍 Calling Vision Specialist with Key {current_key_index + 1}..."
                )
                # Pass the current key to the vision specialist
                analysis_results = vision.analyze_plant_image(base64_image, current_key)

            # 📝 4. CREATE THE MASTER PROMPT
            # This must be inside the loop so it can use the analysis_results
            prompt = f"""
            You are CropyAi, an expert agricultural Decision Support Chatbot for farmers in Tupi, South Cotabato.
            
            WEATHER CONTEXT: {weather_context}
            VISION SCAN RESULTS: {analysis_results}
            
            USER QUESTION: "{user_input}"
            
            INSTRUCTIONS:
            1. If the farmer uploaded a photo, explain the Vision Scan Results simply.
            2. Connect the plant's health to the Tupi weather (e.g., humidity/rain).
            3. Keep your answer under 3 sentences for mobile display.
            """

            print(f"📡 Using API Key {current_key_index + 1} for Chat Generation...")

            # Build the client and generate the final answer
            client = genai.Client(api_key=current_key)
            response = client.models.generate_content(
                model="gemini-2.0-flash", contents=prompt
            )

            return response.text

        except Exception as e:
            error_details = str(e)
            print(f"❌ Gemini Error on Key {current_key_index + 1}: {error_details}")

            # If the key is exhausted, rotate and CONTINUE the loop
            if (
                "RESOURCE_EXHAUSTED" in error_details
                or "Quota exceeded" in error_details
                or "429" in error_details
            ):
                print(f"⚠️ Key {current_key_index + 1} is at limit! Swapping mags...")
                current_key_index = (current_key_index + 1) % len(API_KEYS)
                continue

            # If it's a different error, return it so the UI Snitch can show it
            return f"System Error: {error_details}"

    # If the loop finishes and every single key failed
    return "all ai keys are at limit wait for a moment"
