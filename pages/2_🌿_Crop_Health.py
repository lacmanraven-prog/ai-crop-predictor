import streamlit as st
from PIL import Image
from google import genai
import requests

st.set_page_config(page_title="Crop Health Scanner", page_icon="🌿")

# SETUP GEMINI
client = genai.Client(api_key="AIzaSyCx5z66mZs5w7zCH12Dztc_isI0UTkZU08")

def get_live_weather():
    lat, lon = 6.2917, 124.9456
    url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,precipitation&timezone=Asia%2FManila"
    try:
        response = requests.get(url)
        data = response.json()
        return f"{data['current']['temperature_2m']}°C, {data['current']['precipitation']}mm rain."
    except:
        return "Weather unavailable."

def analyze_crop_image(image):
    weather = get_live_weather()
    prompt = f"""
    You are an Expert Agricultural AI for Tupi. 
    Look closely at this image. 
    1. Identify if it is Corn (Mais) or Rice (Palay).
    2. Diagnose any visible health issues, stress, or diseases.
    3. Provide actionable advice based on the fact that the current weather is: {weather}
    Answer in simple Tagalog/English bullet points.
    """
    try:
        # Pass BOTH the prompt and the physical image to Gemini!
        response = client.models.generate_content(
            model='gemini-2.5-flash', 
            contents=[prompt, image]
        )
        return response.text
    except Exception as e:
        return f"Vision API Error: {e}"

st.title("🌿 AI Crop Health Scanner")
st.markdown("Upload a picture of a plant leaf or field. The AI will identify the crop and diagnose its health.")

uploaded_crop = st.file_uploader("Upload Crop Photo", type=["jpg", "png", "jpeg"])

if uploaded_crop is not None:
    # Open the image using PIL so Gemini can read it
    img = Image.open(uploaded_crop)
    st.image(img, caption="Crop to Analyze", use_container_width=True)
    
    if st.button("Run AI Diagnosis", type="primary"):
        with st.spinner("AI is inspecting the image and checking the weather..."):
            diagnosis = analyze_crop_image(img)
            
            st.success("🔬 **AI Diagnosis Complete:**")
            st.write(diagnosis)