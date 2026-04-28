from flask import Flask, request, jsonify
from flask_cors import CORS
import brain  

app = Flask(__name__)
CORS(app) 

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    
    user_message = data.get('message') 
    image_data = data.get('image') 
    
    ai_reply = brain.get_ai_response(user_message, image_data)
    
    return jsonify({"reply": ai_reply})

if __name__ == '__main__':
    print("🤖 CropyAi Server is Awake on port 5000...")
    app.run(port=5000, debug=True)