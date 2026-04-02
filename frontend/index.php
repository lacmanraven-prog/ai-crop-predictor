<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Crop Predictor | Purok 2</title>
    <style>
        /* Modern, offline-friendly CSS */
        :root {
            --primary: #2e7d32;
            /* Agricultural Green */
            --background: #f4f6f8;
            --card-bg: #ffffff;
            --text-main: #333333;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: var(--background);
            color: var(--text-main);
            margin: 0;
            padding: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
        }

        .header h1 {
            color: var(--primary);
            margin-bottom: 5px;
        }

        .dashboard-container {
            display: grid;
            grid-template-columns: 1fr;
            gap: 20px;
            width: 100%;
            max-width: 800px;
        }

        .card {
            background-color: var(--card-bg);
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }

        .card h2 {
            margin-top: 0;
            border-bottom: 2px solid #eee;
            padding-bottom: 10px;
        }

        /* Camera/File Upload Button Styling */
        .upload-btn-wrapper {
            position: relative;
            overflow: hidden;
            display: inline-block;
            width: 100%;
        }

        .btn {
            border: none;
            color: white;
            background-color: var(--primary);
            padding: 15px 20px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
            width: 100%;
            cursor: pointer;
            transition: background-color 0.3s;
        }

        .btn:hover {
            background-color: #1b5e20;
        }

        .upload-btn-wrapper input[type=file] {
            font-size: 100px;
            position: absolute;
            left: 0;
            top: 0;
            opacity: 0;
            cursor: pointer;
            height: 100%;
        }

        .status-box {
            margin-top: 15px;
            padding: 15px;
            background-color: #e8f5e9;
            border-left: 4px solid var(--primary);
            border-radius: 4px;
            font-family: monospace;
        }
    </style>
</head>

<body>

    <div class="header">
        <h1>AI Crop Yield Predictor</h1>
        <p>Weather-Based Forecasting System | Purok 2, Palian</p>
    </div>

    <div class="dashboard-container">

        <div class="card">
            <h2>📷 Scan Harvest Log (OCR)</h2>
            <p>Upload a photo of a physical notebook to automatically extract the harvest data.</p>

            <form action="upload_handler.php" method="POST" enctype="multipart/form-data">
                <div class="upload-btn-wrapper">
                    <button type="button" class="btn">Open Camera / Select Photo</button>
                    <input type="file" name="log_image" accept="image/*" capture="environment" onchange="this.form.submit()" />
                </div>
            </form>

            <div class="status-box">
                <strong>AI Scanner Status:</strong> Ready for image...
            </div>
        </div>

        <div class="card">
            <h2>📈 Yield Prediction & Chatbot</h2>
            <p>Ask the offline AI expert a question about your crops based on the weather.</p>

            <select id="cropType" style="width: 100%; padding: 10px; margin-bottom: 15px; border-radius: 5px; border: 1px solid #ccc;">
                <option value="corn">Corn (Mais)</option>
                <option value="rice">Rice (Palay)</option>
            </select>

            <input type="text" id="userQuestion" placeholder="e.g. Ano ang epekto ng sobrang init sa mais?" style="width: 95%; padding: 10px; margin-bottom: 15px; border-radius: 5px; border: 1px solid #ccc;">

            <button onclick="askAI()" class="btn" style="background-color: #1976d2;" id="askBtn">Ask AI Expert</button>

            <div id="aiResponse" class="status-box" style="display: none; margin-top: 20px; white-space: pre-wrap; background-color: #e3f2fd; border-left-color: #1976d2;">
            </div>
        </div>

        <script>
            function askAI() {
                let crop = document.getElementById('cropType').value;
                let question = document.getElementById('userQuestion').value;
                let responseBox = document.getElementById('aiResponse');
                let btn = document.getElementById('askBtn');

                if (question.trim() === "") {
                    alert("Please type a question first!");
                    return;
                }

                // Show loading state
                responseBox.style.display = "block";
                responseBox.innerHTML = "<strong>🤖 AI is thinking...</strong> (This takes a few seconds offline)";
                btn.innerText = "Thinking...";
                btn.disabled = true;

                // Send the data to our PHP handler
                let formData = new FormData();
                formData.append('crop', crop);
                formData.append('question', question);

                fetch('chat_handler.php', {
                        method: 'POST',
                        body: formData
                    })
                    .then(response => response.text())
                    .then(text => {
                        // Display the final answer
                        responseBox.innerHTML = "<strong>🤖 AI Expert:</strong><br><br>" + text;
                        btn.innerText = "Ask AI Expert";
                        btn.disabled = false;
                    })
                    .catch(error => {
                        responseBox.innerHTML = "<strong>Error:</strong> Could not reach the AI.";
                        btn.innerText = "Ask AI Expert";
                        btn.disabled = false;
                    });
            }
        </script>

    </div>

</body>

</html>