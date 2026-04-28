import os
import io
import base64
import PIL.Image
from google import genai
from google.genai import types


def analyze_plant_image(base64_image_string, api_key):
    """
    The Vision Specialist: Analyzes the image using the
    specific API key provided by the rotation engine.
    """

    # 1. Initialize the client using the key passed from brain.py
    client = genai.Client(api_key=api_key)

    # 2. Clean the base64 string (Strip the 'data:image/png;base64,' header if present)
    if "," in base64_image_string:
        base64_image_string = base64_image_string.split(",")[1]

    try:
        # 3. Convert base64 string into an actual Image object
        image_bytes = base64.b64decode(base64_image_string)
        img = PIL.Image.open(io.BytesIO(image_bytes))

        # 4. The Vision-Specific Prompt
        vision_prompt = """
        You are a specialized Agricultural Vision Expert for Tupi, South Cotabato.
        Identify the plant and any diseases, pests, or health issues visible.
        Provide a concise, technical diagnosis.
        """

        # 5. Generate the analysis
        # Using gemini-2.0-flash for maximum speed on image processing
        response = client.models.generate_content(
            model="gemini-2.5-flash-lite", contents=[vision_prompt, img]
        )

        return response.text

    except Exception as e:
        # CRITICAL: We raise the error back to brain.py.
        # This tells brain.py: "This key failed! Swap mags and try again!"
        raise e
