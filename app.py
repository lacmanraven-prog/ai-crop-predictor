import streamlit as st
import cv2
import pytesseract
import numpy as np
from PIL import Image
from google import genai
import requests
import os
from dotenv import load_dotenv

# ==========================================
# 1. SETUP & CONFIGURATION
# ==========================================
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# PUT YOUR API KEY HERE
client = genai.Client(api_key="AIzaSyCx5z66mZs5w7zCH12Dztc_isI0UTkZU08")

# Mobile-optimized layout
st.set_page_config(page_title="AI Crop Predictor", page_icon="🌾", layout="centered")

# Memory for the scanned logbook
if "scanned_text" not in st.session_state:
    st.session_state.scanned_text = ""


# ==========================================
# 2. CORE AI & DATA FUNCTIONS
# ==========================================
def scan_harvest_log(image_file):
    try:
        image = Image.open(image_file)
        image_np = np.array(image)
        raw_image = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)
        gray_image = cv2.cvtColor(raw_image, cv2.COLOR_BGR2GRAY)
        _, clean_image = cv2.threshold(gray_image, 150, 255, cv2.THRESH_BINARY)
        extracted_text = pytesseract.image_to_string(clean_image)
        return extracted_text.strip()
    except Exception as e:
        return f"Error scanning image: {e}"


def get_live_weather():
    lat, lon = 6.2917, 124.9456
    url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,precipitation&timezone=Asia%2FManila"
    try:
        response = requests.get(url)
        data = response.json()
        return f"{data['current']['temperature_2m']}°C, {data['current']['precipitation']}mm rain expected."
    except:
        return "Weather unavailable."


def analyze_crop_image(image):
    weather = get_live_weather()
    prompt = f"""
    You are a highly polite, respectful, and expert Agricultural AI Assistant.
    
    Look closely at this uploaded image:
    1. Identify if it is Corn (Mais) or Rice (Palay).
    2. Diagnose any visible health issues, stress, pests, or diseases.
    3. Provide actionable, supportive advice based on this current live weather: {weather}
    
    CRITICAL LANGUAGE RULE: Detect the language used in the image or provide the diagnosis in pure, polite English. However, if you sense the context is local to the Philippines, you may provide a polite Tagalog translation as well. Always be encouraging and respectful.
    """
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash", contents=[prompt, image]
        )
        return response.text
    except Exception as e:
        return f"Vision API Error: {e}"


def ask_gemini(question, crop, scanned_data):
    weather = get_live_weather()
    prompt = f"""
    You are a highly polite, respectful, and expert Agricultural AI Assistant.
    Crop Focus: {crop}
    Live Weather: {weather}
    Farmer's Logbook Data: {scanned_data}
    
    CRITICAL LANGUAGE RULE: 
    - If the farmer's question is in English, reply strictly in pure, formal English.
    - If the farmer's question is in Tagalog or Taglish, reply strictly in polite Tagalog (use "po" and "opo").
    
    Always maintain a supportive, encouraging, and professional tone. Keep advice practical and use bullet points.
    
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
# 3. MOBILE UI (TABS)
# ==========================================
st.title("🌾 AI Crop Predictor")
st.markdown("*Agricultural Intelligence Assistant*")

# THIS CREATES THE MOBILE-FRIENDLY HORIZONTAL NAVBAR
tab1, tab2, tab3 = st.tabs(["📝 Scan Log", "🌿 Crop Health", "💬 Chatbot"])
# --- TAB 1: LOGBOOK SCANNER ---
with tab1:
    st.subheader("Digitize Harvest Logs")
    st.markdown("Take a live photo or upload from your gallery.")

    # 1. The Live Camera
    camera_photo = st.camera_input("📸 Take a picture")

    # 2. The Fallback Upload
    uploaded_file = st.file_uploader(
        "📁 Or upload an existing photo", type=["jpg", "png", "jpeg"]
    )

    # 3. Figure out which one the user picked
    image_to_scan = camera_photo if camera_photo else uploaded_file

    if image_to_scan is not None:
        st.image(image_to_scan, caption="Logbook Preview", use_container_width=True)

        if st.button("Extract Data", type="primary", use_container_width=True):
            with st.spinner("Reading handwriting..."):
                st.session_state.scanned_text = scan_harvest_log(image_to_scan)

            if st.session_state.scanned_text:
                st.success("✅ Data saved to memory!")
                st.text_area(
                    "Extracted Text:", st.session_state.scanned_text, height=100
                )
            else:
                st.warning("No text found.")

# --- TAB 2: CROP HEALTH VISION ---
with tab2:
    st.subheader("AI Plant Doctor")
    st.markdown("Upload a photo of a sick crop for instant diagnosis.")

    uploaded_crop = st.file_uploader("Upload Crop Photo", type=["jpg", "png", "jpeg"])
    if uploaded_crop is not None:
        img = Image.open(uploaded_crop)
        st.image(img, caption="Crop to Analyze", use_container_width=True)
        if st.button("Run AI Diagnosis", type="primary", use_container_width=True):
            with st.spinner("Inspecting crop and checking weather..."):
                diagnosis = analyze_crop_image(img)
                st.success("🔬 AI Diagnosis Complete:")
                st.write(diagnosis)

# --- TAB 3: CHATBOT ---
with tab3:
    st.subheader("Agricultural AI Chatbot")

    if st.session_state.scanned_text != "":
        st.info("📂 The AI remembers your scanned logbook data.")

    selected_crop = st.selectbox("Select Crop", ["Corn (Mais)", "Rice (Palay)"])
    user_question = st.text_input("Ask a question:")

    if st.button("Ask Expert", type="primary", use_container_width=True):
        if not user_question:
            st.error("Please enter a question.")
        else:
            with st.spinner("Consulting AI..."):
                answer = ask_gemini(
                    user_question, selected_crop, st.session_state.scanned_text
                )
                st.success("🤖 AI Expert:")
                st.write(answer)
