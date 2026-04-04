import base64
from google import genai
from google.genai import types
import os
from dotenv import load_dotenv

load_dotenv()

# We deleted the global API_KEY and client from here!

def analyze_plant_image(base64_image, api_key):
    """Specific specialist function for crop disease diagnosis"""
    
    # 1. Build the fresh client using the key handed to us by brain.py!
    client = genai.Client(api_key=api_key)
    
    try:
        # 2. Decode the image
        header, encoded = base64_image.split(",", 1)
        mime_type = header.split(":")[1].split(";")[0]

        image_part = types.Part.from_bytes(
            data=base64.b64decode(encoded), mime_type=mime_type
        )

        # 3. The Specialist Prompt
        prompt = """
        You are a Plant Pathologist. Analyze this crop image:
        1. Identify the plant and any visible disease, pest, or deficiency.
        2. Give a confidence level (e.g., 85% certain).
        3. Provide 1 immediate action for the farmer.
        Keep the total response under 3 sentences.
        """

        response = client.models.generate_content(
            model="gemini-2.5-flash", contents=[image_part, prompt]
        )

        return response.text
    except Exception as e:
        print(f"Vision Error: {e}")
        return "I encountered an error while scanning the image."