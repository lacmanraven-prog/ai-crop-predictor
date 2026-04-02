<?php
// =====================================================================
// CHAT HANDLER - Bridges the Web Dashboard to the Ollama AI
// =====================================================================

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    
    // 1. Grab the crop type and the question sent from the web page
    $crop = isset($_POST['crop']) ? $_POST['crop'] : 'corn';
    $question = isset($_POST['question']) ? $_POST['question'] : '';

    if (!empty($question)) {
        
        // 2. Tell PHP exactly where the offline Python sandbox is
        $python_exe = realpath("../.venv/Scripts/python.exe");
        $script_path = realpath("../backend/chatbot_logic.py");
        
        // 3. Build the terminal command safely with quotes
        // We use escapeshellarg to prevent weird characters from breaking the terminal
        $safe_crop = escapeshellarg($crop);
        $safe_question = escapeshellarg($question);
        
        $command = "\"$python_exe\" \"$script_path\" $safe_crop $safe_question";
        
        // 4. Run the AI and capture what it says
        $output = shell_exec($command);
        
        // 5. Send the text back to the webpage
        echo htmlspecialchars($output);
        
    } else {
        echo "Please ask a question, dawg.";
    }
} else {
    echo "Invalid request.";
}
?>