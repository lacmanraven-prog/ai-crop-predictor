import streamlit as st
import cv2
import pytesseract
import numpy as np
from PIL import Image
from google import genai
import requests

# ==========================================
# 1. SETUP & CONFIGURATION
# ==========================================
# Point to Tesseract
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# Setup Gemini (PUT YOUR API KEY HERE!)
client = genai.Client(api_key="AIzaSyDuB1Zq4Qes4ixvN9VkWga75dD0DxTXo0Y")

# Configure the Streamlit webpage
st.set_page_config(page_title="AI Crop Predictor", page_icon="🌾", layout="centered")


# ==========================================
# 2. CORE FUNCTIONS
# ==========================================
def scan_harvest_log(image_file):
    """Reads text from an uploaded image using OpenCV and Tesseract"""
    try:
        # Convert the uploaded image to an OpenCV format
        image = Image.open(image_file)
        image_np = np.array(image)
        raw_image = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)

        # Clean it up for OCR
        gray_image = cv2.cvtColor(raw_image, cv2.COLOR_BGR2GRAY)
        _, clean_image = cv2.threshold(gray_image, 150, 255, cv2.THRESH_BINARY)

        # Extract text
        extracted_text = pytesseract.image_to_string(clean_image)
        return extracted_text.strip()
    except Exception as e:
        return f"Error scanning image: {e}"


def get_live_weather():
    """Fetches live weather for Tupi using Open-Meteo"""
    lat, lon = 6.2917, 124.9456
    url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,precipitation&timezone=Asia%2FManila"
    try:
        response = requests.get(url)
        data = response.json()
        temp = data["current"]["temperature_2m"]
        rain = data["current"]["precipitation"]
        return f"Current weather in Tupi: {temp}°C, {rain}mm rain expected."
    except:
        return "Weather data unavailable."


def ask_gemini(question, crop, scanned_data):
    """Sends everything to Google's Gemini AI"""
    weather = get_live_weather()

    prompt = f"""
    You are an Expert Agricultural AI Assistant for Purok 2, Tupi.
    Crop: {crop}
    Live Weather: {weather}
    Scanned Harvest Log Data: {scanned_data}
    
    Answer the farmer's question practically and concisely in Tagalog/English.
    Farmer asks: {question}
    """
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash", contents=prompt
        )
        return response.text
    except Exception as e:
        return f"API Error: {e}"


# ==========================================
# 3. THE USER INTERFACE (Streamlit)
# ==========================================
st.title("🌾 AI Crop Yield Predictor")
st.markdown("**Weather-Based Forecasting System | Purok 2, Palian**")
st.divider()

# --- PART A: THE OCR SCANNER ---
st.header("📷 1. Scan Harvest Log")
uploaded_file = st.file_uploader(
    "Upload or take a picture of your logbook", type=["jpg", "png", "jpeg"]
)

scanned_text = ""
if uploaded_file is not None:
    # Display the picture they uploaded
    st.image(uploaded_file, caption="Uploaded Log", use_container_width=True)

    with st.spinner("Scanning handwriting..."):
        scanned_text = scan_harvest_log(uploaded_file)

    if scanned_text:
        st.success("Scan Complete!")
        st.text_area("Extracted Text:", scanned_text, height=100)
    else:
        st.warning("No text found in image.")

st.divider()

# --- PART B: THE AI CHATBOT ---
st.header("📈 2. Yield Prediction & Chatbot")
selected_crop = st.selectbox("Select Crop Type", ["Corn (Mais)", "Rice (Palay)"])
user_question = st.text_input("Ask the AI a question:")

if st.button("Ask AI Expert", type="primary"):
    if not user_question:
        st.error("Please enter a question, dawg.")
    else:
        with st.spinner("Analyzing weather and farm data..."):
            # We pass the scanned text so Gemini knows what the logbook said!
            answer = ask_gemini(user_question, selected_crop, scanned_text)

            st.info("🤖 **AI Expert Response:**")
            st.write(answer)
