# =====================================================================
# AI CROP YIELD PREDICTOR - OFFLINE OCR SCANNER
# This script cleans up a photo of a harvest log and reads the text.
# =====================================================================

import cv2
import pytesseract
import os

# =====================================================================
# 1. SETUP THE TESSERACT ENGINE
# Point Python directly to your Tesseract installation
# =====================================================================
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"


# =====================================================================
# 2. THE MAIN SCANNER FUNCTION
# =====================================================================
def scan_harvest_log(image_path):

    if not os.path.exists(image_path):
        return "Error: Image file not found, dawg!"

    try:
        raw_image = cv2.imread(image_path)
        gray_image = cv2.cvtColor(raw_image, cv2.COLOR_BGR2GRAY)
        _, clean_image = cv2.threshold(gray_image, 150, 255, cv2.THRESH_BINARY)

        extracted_text = pytesseract.image_to_string(clean_image)
        return extracted_text.strip()

    except Exception as e:
        return f"An error occurred during scanning: {str(e)}"


# =====================================================================
# 3. EXECUTION BLOCK
# This grabs the file path sent over by PHP
# =====================================================================
if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1:
        target_file = sys.argv[1]
    else:
        target_file = "../uploads/test_image.jpg"

    result = scan_harvest_log(target_file)
    print(result)
