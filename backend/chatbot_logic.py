# =====================================================================
# AI CROP YIELD PREDICTOR - GEMINI + LIVE WEATHER HYBRID
# =====================================================================

from google import genai
import sys
import requests

# Force the background terminal to understand special characters
sys.stdout.reconfigure(encoding="utf-8")

# 1. SETUP GEMINI
# Put your actual Google API key below!
client = genai.Client(api_key="AIzaSyDuB1Zq4Qes4ixvN9VkWga75dD0DxTXo0Ypip install streamlit Pillow numpy")


# =====================================================================
# 2. THE WEATHER CATCHER (Using Open-Meteo - No API Key Needed!)
# =====================================================================
def get_live_weather():
    # Exact coordinates for Tupi, South Cotabato from your CSV
    lat = 6.2917
    lon = 124.9456

    # Ping the Open-Meteo server for the current temperature and rain
    url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,precipitation&timezone=Asia%2FManila"

    try:
        response = requests.get(url)
        data = response.json()

        temp = data["current"]["temperature_2m"]
        rain = data["current"]["precipitation"]

        return f"LIVE WEATHER DATA FOR TUPI: The current temperature is {temp}°C with {rain}mm of rain expected."
    except Exception as e:
        return "LIVE WEATHER UNAVAILABLE. Assume normal seasonal conditions."


# =====================================================================
# 3. THE CHATBOT BRAIN
# =====================================================================
def ask_agricultural_ai(user_question, crop_type):

    # Grab the live weather silently in the background
    live_weather_status = get_live_weather()

    system_instruction = f"""
    You are an Expert Agricultural AI Assistant for farmers in Purok 2, Palian, Tupi. 
    You help local farmers make decisions about their {crop_type} crops.
    You can speak perfectly in fluent Tagalog or English, depending on what the user asks.
    Be concise, practical, and format your advice using bullet points for readability on mobile.
    
    CRITICAL REAL-TIME CONTEXT: {live_weather_status}
    Always factor this live weather data into your advice!
    """

    full_prompt = f"{system_instruction}\n\nFarmer asks: {user_question}"

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash", contents=full_prompt
        )
        return response.text

    except Exception as e:
        return f"Error communicating with Gemini API: {str(e)}"


# =====================================================================
# EXECUTION BLOCK
# =====================================================================
if __name__ == "__main__":

    if len(sys.argv) > 1:
        test_crop = sys.argv[1]
        test_question = sys.argv[2]
    else:
        test_crop = "corn (mais)"
        test_question = "Ano ang magandang gawin sa aking mais base sa panahon ngayon?"

    # Get the answer from Gemini
    ai_answer = ask_agricultural_ai(test_question, test_crop)

    # Send ONLY the answer back to PHP
    print(ai_answer)
