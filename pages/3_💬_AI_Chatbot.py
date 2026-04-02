import streamlit as st
from google import genai
import requests

st.set_page_config(page_title="AI Chatbot", page_icon="💬")

# Ensure memory exists
if "scanned_text" not in st.session_state:
    st.session_state.scanned_text = ""

client = genai.Client(api_key="AIzaSyCx5z66mZs5w7zCH12Dztc_isI0UTkZU08")

def get_live_weather():
    lat, lon = 6.2917, 124.9456
    url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,precipitation&timezone=Asia%2FManila"
    try:
        response = requests.get(url)
        data = response.json()
        return f"{data['current']['temperature_2m']}°C, {data['current']['precipitation']}mm rain expected."
    except:
        return "Weather unavailable."

def ask_gemini(question, crop, scanned_data):
    weather = get_live_weather()
    prompt = f"""
    You are an Expert Agricultural AI Assistant for Purok 2, Tupi.
    Crop: {crop}
    Live Weather: {weather}
    Farmer's Logbook Data (If any): {scanned_data}
    
    Answer the farmer's question practically and concisely in Tagalog/English using bullet points.
    Farmer asks: {question}
    """
    try:
        response = client.models.generate_content(model='gemini-2.5-flash', contents=prompt)
        return response.text
    except Exception as e:
        return f"API Error: {e}"

st.title("💬 Agricultural AI Chatbot")
st.markdown("Ask general questions about your crops or ask for advice based on your scanned logbook.")

if st.session_state.scanned_text != "":
    st.info("📂 **Data Loaded:** The AI remembers the logbook you scanned earlier.")

selected_crop = st.selectbox("What crop are we discussing?", ["Corn (Mais)", "Rice (Palay)"])
user_question = st.text_input("Type your question here:")

if st.button("Ask Expert", type="primary"):
    if not user_question:
        st.error("Please enter a question.")
    else:
        with st.spinner("Consulting agricultural data..."):
            answer = ask_gemini(user_question, selected_crop, st.session_state.scanned_text)
            st.success("🤖 **AI Expert Response:**")
            st.write(answer)