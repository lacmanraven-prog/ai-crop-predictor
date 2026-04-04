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

    # 1. Grab the local weather context
    weather_context = read_weather_data()

    # 2. If there is an image, ask vision.py to scan it first
    analysis_results = ""
    if base64_image:
        print("🔍 Calling Vision Specialist...")
        analysis_results = vision.analyze_plant_image(base64_image)

    # 3. Create the master prompt
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

    # 4. THE ROTATION ENGINE
    for attempt in range(len(API_KEYS)):
        current_key = API_KEYS[current_key_index]
        
        # Build a fresh client using the CURRENT key in the rotation
        client = genai.Client(api_key=current_key)

        try:
            print(f"📡 Using API Key {current_key_index + 1}...")
            # Call the main model to summarize everything
            response = client.models.generate_content(
                model="gemini-2.5-flash", contents=prompt
            )
            return response.text
            
        except Exception as e:
            error_details = str(e)
            print(f"❌ Gemini Error on Key {current_key_index + 1}: {error_details}")

            # THE INTERCEPTOR: Check if the error is a Rate Limit or Quota issue
            if (
                "RESOURCE_EXHAUSTED" in error_details
                or "Quota exceeded" in error_details
                or "429" in error_details
            ):
                print(f"⚠️ Key {current_key_index + 1} is at limit! Swapping mags...")
                # Shift to the next key and loop back around if at the end
                current_key_index = (current_key_index + 1) % len(API_KEYS)
                continue # Jump back to the top of the 'for' loop and try again!

            # If it's a different kind of error (like no internet), don't swap, just fail
            return "System Error: Check the VS Code terminal for details."

    # If the loop finishes and ALL keys failed...
    return "all ai keys are at limit wait for a moment"