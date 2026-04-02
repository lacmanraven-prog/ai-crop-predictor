import streamlit as st
import cv2
import pytesseract
import numpy as np
from PIL import Image

# Point to Tesseract
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

st.set_page_config(page_title="Scan Logbook", page_icon="📝")

# Ensure memory exists
if "scanned_text" not in st.session_state:
    st.session_state.scanned_text = ""

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

st.title("📝 Scan Harvest Logbook")
st.markdown("Upload a photo of your physical notebook to digitize your harvest data.")

uploaded_file = st.file_uploader("Select Logbook Image", type=["jpg", "png", "jpeg"])

if uploaded_file is not None:
    st.image(uploaded_file, caption="Logbook Preview", use_container_width=True)
    
    if st.button("Extract Data", type="primary"):
        with st.spinner("Reading handwriting..."):
            st.session_state.scanned_text = scan_harvest_log(uploaded_file)
            
        if st.session_state.scanned_text:
            st.success("✅ Data saved to system memory!")
            st.text_area("Extracted Text:", st.session_state.scanned_text, height=150)
        else:
            st.warning("No text found in image.")