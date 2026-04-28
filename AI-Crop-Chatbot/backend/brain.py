import csv
import os
import requests
from datetime import datetime
from dotenv import load_dotenv
from google import genai
from google.genai import types
import vision  # Specialist rice vision file

# 1. Initialize environment and keys
load_dotenv()
API_KEYS = [
    os.getenv("GEMINI_API_KEY_1"),
    os.getenv("GEMINI_API_KEY_2"),
    os.getenv("GEMINI_API_KEY_3"),
]
API_KEYS = [key for key in API_KEYS if key]
current_key_index = 0


def is_online():
    """Quick check for cloud connectivity"""
    try:
        requests.get("https://www.google.com", timeout=3)
        return True
    except:
        return False


def get_local_response(prompt):
    """OFFLINE MODE: Gentle Rice logic via LM Studio (Gemma)"""
    url = "http://localhost:1234/v1/chat/completions"
    now = datetime.now()
    today = now.strftime("%B %d, %Y")
    current_time = now.strftime("%I:%M %p")

    payload = {
        "model": "gemma",
        "messages": [
            {
                "role": "system",
                "content": f"Today is {today}. Current time: {current_time}. You are CropyAi, a gentle, respectful Rice Agronomist for Tupi. Speak with warmth. Focus only on rice (palay). Keep it under 3 sentences.",
            },
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.7,
    }

    try:
        response = requests.post(url, json=payload, timeout=30)
        data = response.json()
        return data["choices"][0]["message"]["content"]
    except Exception:
        return "I'm so sorry, I'm having a little trouble connecting to my local brain. Please make sure LM Studio is running!"


def read_weather_data():
    """Reads localized weather context from weather_data.csv"""
    file_path = "../data/weather_data.csv"

    if not os.path.exists(file_path):
        return "No weather records found for Tupi."

    try:
        with open(file_path, mode="r") as file:
            reader = csv.reader(file)
            data_list = list(reader)
            return str(data_list[-5:])
    except Exception:
        return "I'm having a little trouble reading our weather records."


def get_ai_response(user_input, base64_image=None):
    """The Logic Tier with Keyword Normalization & Offline Guards"""
    global current_key_index
    weather_context = read_weather_data()
    now = datetime.now()
    today_date = now.strftime("%B %d, %Y")
    current_time = now.strftime("%I:%M %p")
    day_of_week = now.strftime("%A")

    # --- OFFLINE LOGIC ---
    if not is_online():
        # 1. Guard for actual image uploads
        if base64_image:
            return "I'm so sorry, but I need an internet connection to scan your images properly. Please connect to the internet so I can see your palay!"

        # 2. KEYWORD NORMALIZATION: Catching "Check my image" requests when no image was sent
        query = user_input.lower()
        image_keywords = [
            "check",
            "see",
            "tingnan",
            "patingin",
            "scan",
            "image",
            "larawan",
            "photo",
        ]

        if any(word in query for word in image_keywords):
            return "I would love to check that for you, but I can't see any images while we are offline. Please connect to the internet and upload a photo so I can give you the best advice for your rice."

        print("🔌 Offline! Engaging Gentle Local Engine...")
        local_prompt = f"TODAY: {today_date} {current_time}\nWEATHER: {weather_context}\nFARMER SAYS: {user_input}"
        return get_local_response(local_prompt)

    # --- ONLINE LOGIC (Gemini Cloud) ---
    for attempt in range(len(API_KEYS)):
        current_key = API_KEYS[current_key_index]
        try:
            analysis_results = ""
            if base64_image:
                print(f"🔍 Checking rice health with Key {current_key_index + 1}...")
                analysis_results = vision.analyze_plant_image(base64_image, current_key)

            # --- UPGRADED BLOCK ---
            # We catch "STRICT" or "TASK:" (which your PHP scanner sends) and force the pure CSV output.
            if "STRICT" in user_input.upper() or "TASK:" in user_input.upper():
                prompt = f"""
                [STRICT SCANNER MODE]
                WEATHER: {weather_context}
                ANALYSIS: {analysis_results}
                TASK: {user_input}
                
                CRITICAL RULES:
                1. Read the analysis and output EXACTLY ONE LINE separated by commas.
                2. Format MUST BE: Status, Confidence, Advice
                3. Status MUST BE exactly "Healthy Palay" or "Unhealthy Palay".
                4. Confidence MUST BE a single number from 0 to 100.
                5. NO markdown formatting, NO greetings, NO extra text.
                
                EXAMPLE OUTPUT:
                Unhealthy Palay, 85, Apply fungicide and isolate the plant.
                """
            else:
                prompt = f"""
                [STRICT SYSTEM CONTEXT]
                TODAY'S DATE: {day_of_week}, {today_date}
                CURRENT TIME: {current_time}
                LOCATION: Tupi, South Cotabato
                
                YOU ARE: CropyAi, a gentle, smart, and respectful Rice Agronomist for Tupi farmers.
                
                DATA FOR ANALYSIS:
                - WEATHER TRENDS: {weather_context}
                - RICE VISION SCAN: {analysis_results}
                - FARMER SAYS: "{user_input}"
                
                RESPONSE PROTOCOL:
                1. GREETING FILTER: If the user just says "Hi" or a simple greeting, give a short, warm reply (1-2 sentences). Mention the Tupi weather and ask how you can help. 
                
                2. DYNAMIC DEPTH: 
                - SIMPLE QUESTIONS: Keep it quick.
                - COMPLEX/TECHNICAL QUESTIONS: Provide a detailed breakdown using clear spacing.

                3. EXPERT LOGIC:
                - Mention the Day/Time/Weather only once per session.
                - Use WEATHER TRENDS to predict disease windows (e.g., humidity spikes = Rice Blast risk).
                - Link plant health to yield impact (sacks/ha).

                4. STRICT FORMATTING RULES (NO MARKDOWN):
                - DO NOT use asterisks (**) or underscores (__) for bolding or italics.
                - For emphasis, use CAPITAL LETTERS for key terms (e.g., RICE BLAST).
                - Use simple dashes (-) for bullet points.
                - Use double line breaks between sections to keep the layout "foggy" and clean on your glass-card.
                - Mirror the user's language (English/Tagalog/Hiligaynon) perfectly.
                x"""

            print(f"📡 Using API Key {current_key_index + 1} for Chat...")
            client = genai.Client(api_key=current_key)
            response = client.models.generate_content(
                model="gemini-2.5-flash-lite", contents=prompt
            )
            return response.text

        except Exception as e:
            if any(x in str(e) for x in ["429", "Quota"]):
                print(f"⚠️ Key {current_key_index + 1} is resting. Swapping mags...")
                current_key_index = (current_key_index + 1) % len(API_KEYS)
                continue
            return f"I'm sorry, I've run into a little system error: {str(e)}"

    return "All my cloud connections are currently busy. Please try our local engine for now!"
