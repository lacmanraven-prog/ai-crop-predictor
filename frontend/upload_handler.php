<?php
// =====================================================================
// UPLOAD HANDLER - Bridges the Web Dashboard to the Python AI
// =====================================================================

if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_FILES['log_image'])) {
    
    // 1. Grab the uploaded file
    $file = $_FILES['log_image'];
    
    // 2. Set the destination path (saving it into our uploads folder)
    $upload_dir = '../uploads/';
    $target_file = $upload_dir . basename($file['name']);
    
    // 3. Move the file from the temporary web server memory to our folder
    if (move_uploaded_file($file['tmp_name'], $target_file)) {
        
        // 4. Tell PHP to run our Python offline sandbox
        $python_exe = realpath("../.venv/Scripts/python.exe");
        $script_path = realpath("../backend/ocr_scanner.py");
        $image_path = realpath($target_file);
        
        // Build the terminal command with quotes so spaces in filenames don't break it
        $command = "\"$python_exe\" \"$script_path\" \"$image_path\"";
        $output = shell_exec($command);
        
        // 5. Display the results to the user
        echo "<!DOCTYPE html><html><head><title>Scan Result</title>";
        echo "<style>body{font-family:sans-serif; padding:20px; background:#f4f6f8;} .card{background:white; padding:20px; border-radius:10px; max-width:600px; margin:auto; box-shadow:0 4px 6px rgba(0,0,0,0.1);} .result{background:#e8f5e9; padding:15px; border-left:4px solid #2e7d32; font-family:monospace; white-space:pre-wrap;}</style>";
        echo "</head><body>";
        echo "<div class='card'>";
        echo "<h2>✅ Scan Complete</h2>";
        echo "<p><strong>Image Processed:</strong> " . basename($file['name']) . "</p>";
        echo "<h3>Extracted Text:</h3>";
        echo "<div class='result'>" . htmlspecialchars($output) . "</div>";
        echo "<br><a href='index.php' style='display:inline-block; padding:10px 15px; background:#2e7d32; color:white; text-decoration:none; border-radius:5px;'>Scan Another Log</a>";
        echo "</div></body></html>";

    } else {
        echo "Error uploading file, dawg.";
    }
} else {
    echo "No image was uploaded.";
}
?>